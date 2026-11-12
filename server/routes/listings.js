import express from "express";
import auth from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";
import { cleanPhone, isValidPhone } from "../utils/phone.js";
import { todayIST } from "../utils/dates.js";
import { isDemoEmail } from "../utils/demo.js";
import { deleteListingData } from "../utils/cleanup.js";
import Listing from "../models/Listing.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { upload, uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

const router = express.Router();
const CATEGORIES = Listing.schema.path("category").enumValues;

// What is already booked today, for every space that has a confirmed booking covering today:
// whole: a whole-day booking covers today.  slots: hourly bookings today, as { start, end } in minutes after midnight.
async function busyToday() {
  const today = todayIST();
  const bookings = await Booking.find({
    status: "approved",
    startDate: { $lte: today },
    endDate: { $gte: today },
  });

  const busy = new Map();
  for (const b of bookings) {
    const key = String(b.listing);
    const entry = busy.get(key) || { whole: false, slots: [] };
    if (b.unit === "hour") entry.slots.push({ start: b.startMinutes, end: b.endMinutes });
    else entry.whole = true;
    busy.set(key, entry);
  }
  return busy;
}

// What we send to the browser for one space: adds isDemo, unavailableToday and bookedSlotsToday,
// and never sends the owner's email address.
function present(listing, busy) {
  const { email, ...owner } = listing.owner || {};
  const today = busy.get(String(listing._id));
  return {
    ...listing,
    owner,
    isDemo: isDemoEmail(email),
    unavailableToday: Boolean(today?.whole),
    bookedSlotsToday: (today?.slots || []).sort((a, b) => a.start - b.start),
  };
}

// GET /api/listings?category=&city=&maxPrice=&startDate=&endDate=&lat=&lng=
// Search spaces. Every filter is optional.
router.get("/", async (req, res) => {
  const { category, city, maxPrice, priceUnit, startDate, endDate, lat, lng } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (maxPrice) filter.price = { $lte: Number(maxPrice) };
  if (priceUnit === "day" || priceUnit === "hour") filter.priceUnit = priceUnit; // compare prices of the same kind only

  if (city) {
    // escape special characters so the text is searched as plain text
    const safeCity = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.city = new RegExp(safeCity, "i");
  }

  // "Near me": spaces within 10 km
  if (lat && lng) {
    filter.location = {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: 10000,
      },
    };
  }

  // Only show spaces that are free for the chosen dates
  if (startDate && endDate) {
    const busyIds = await Booking.find({
      status: "approved",
      unit: { $ne: "hour" }, // an hourly booking only uses part of a day, so the space is still partly free
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    }).distinct("listing");
    filter._id = { $nin: busyIds };
  }

  // the phone number is never sent in search results
  let query = Listing.find(filter).select("-contactPhone").populate("owner", "name email").lean();
  if (!lat) query = query.sort("-createdAt"); // "near me" is already sorted by distance

  const [listings, busy] = await Promise.all([query, busyToday()]);
  res.json(listings.map((l) => present(l, busy)));
});

// GET /api/listings/mine  -> spaces owned by the logged-in user
router.get("/mine", auth, async (req, res) => {
  const me = await User.findById(req.userId).select("email");
  const [listings, busy] = await Promise.all([
    Listing.find({ owner: req.userId }).sort("-createdAt").lean(),
    busyToday(),
  ]);
  res.json(
    listings.map((l) => {
      const today = busy.get(String(l._id));
      return {
        ...l,
        isDemo: isDemoEmail(me?.email),
        unavailableToday: Boolean(today?.whole),
        bookedSlotsToday: today?.slots || [],
      };
    })
  );
});

// GET /api/listings/:id
router.get("/:id", optionalAuth, async (req, res) => {
  let query = Listing.findById(req.params.id).populate("owner", "name email");
  if (!req.userId) query = query.select("-contactPhone"); // only logged-in visitors can see the phone number
  const listing = await query.lean();
  if (!listing) return res.status(404).json({ message: "Space not found" });

  res.json(present(listing, await busyToday()));
});

// POST /api/listings  (form data with up to 4 photos)
router.post("/", auth, upload.array("images", 4), async (req, res) => {
  const { title, description, category, address, city, price, priceUnit, instantBook, lat, lng, contactPhone } = req.body;

  if (!title || !category || !price) {
    return res.status(400).json({ message: "Title, category and price are required" });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ message: "Please choose a category" });
  }
  if (!(Number(price) > 0)) {
    return res.status(400).json({ message: "Please enter a valid price" });
  }
  if (!["day", "hour"].includes(priceUnit)) {
    return res.status(400).json({ message: "Please choose per day or per hour" });
  }
  if (!lat || !lng) {
    return res.status(400).json({ message: "Please click on the map to set the location" });
  }

  const phone = cleanPhone(contactPhone);
  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: "Please enter a valid 10-digit mobile number" });
  }

  const images = [];
  for (const file of req.files) {
    images.push(await uploadToCloudinary(file));
  }

  const listing = await Listing.create({
    owner: req.userId,
    title,
    description,
    category,
    address,
    city,
    contactPhone: phone,
    price: Number(price),
    priceUnit,
    instantBook: instantBook === "true",
    images,
    location: { type: "Point", coordinates: [Number(lng), Number(lat)] },
  });
  res.json(listing);
});

// PUT /api/listings/:id  (only the owner)  -> edit a space. Same form data as creating one, plus:
//   imageOrder: a JSON list that says which photos to keep and in what order.
//     "https://..." keeps an existing photo, "new:0" is the first newly uploaded file, "new:1" the second, and so on.
//     If imageOrder is left out, the photos stay as they are.
router.put("/:id", auth, upload.array("images", 4), async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing || listing.owner.toString() !== req.userId) {
    return res.status(404).json({ message: "Space not found" });
  }

  const { title, description, category, address, city, price, priceUnit, instantBook, lat, lng, contactPhone, imageOrder } = req.body;

  if (!title || !category || !price) {
    return res.status(400).json({ message: "Title, category and price are required" });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ message: "Please choose a category" });
  }
  if (!(Number(price) > 0)) {
    return res.status(400).json({ message: "Please enter a valid price" });
  }
  if (!["day", "hour"].includes(priceUnit)) {
    return res.status(400).json({ message: "Please choose per day or per hour" });
  }
  const phone = cleanPhone(contactPhone);
  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: "Please enter a valid 10-digit mobile number" });
  }

  // Work out the final list of photos
  let finalImages = listing.images;
  let removedImages = [];
  if (imageOrder !== undefined) {
    let order;
    try {
      order = JSON.parse(imageOrder);
    } catch (err) {
      return res.status(400).json({ message: "The photo list is not valid" });
    }
    if (!Array.isArray(order) || order.length > 4) {
      return res.status(400).json({ message: "You can add up to 4 photos" });
    }

    const files = req.files || [];
    const uploaded = {}; // "new:0" -> its Cloudinary address
    finalImages = [];
    for (const token of order) {
      if (typeof token !== "string") continue;
      if (token.startsWith("new:")) {
        const file = files[Number(token.slice(4))];
        if (file) finalImages.push((uploaded[token] ||= await uploadToCloudinary(file)));
      } else if (listing.images.includes(token)) {
        finalImages.push(token); // only photos this space already has can be kept
      }
    }
    removedImages = listing.images.filter((url) => !finalImages.includes(url));
  }

  listing.title = title;
  listing.description = description;
  listing.category = category;
  listing.address = address;
  listing.city = city;
  listing.price = Number(price);
  listing.priceUnit = priceUnit;
  listing.instantBook = instantBook === "true";
  listing.contactPhone = phone;
  listing.images = finalImages;
  if (lat && lng) {
    listing.location = { type: "Point", coordinates: [Number(lng), Number(lat)] };
  }
  await listing.save();

  await Promise.all(removedImages.map(deleteFromCloudinary)); // free the storage of removed photos
  res.json(listing);
});

// DELETE /api/listings/:id  (only the owner)
// Also removes the space's bookings, chats, reviews and photos.
router.delete("/:id", auth, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing || listing.owner.toString() !== req.userId) {
    return res.status(404).json({ message: "Space not found" });
  }
  await deleteListingData(listing);
  res.json({ message: "Space deleted" });
});

export default router;
