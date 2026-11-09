import express from "express";
import auth from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";
import { cleanPhone, isValidPhone } from "../utils/phone.js";
import Listing from "../models/Listing.js";
import Booking from "../models/Booking.js";
import { upload, uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();


// GET /api/listings?category=&city=&maxPrice=&startDate=&endDate=&lat=&lng=
// Search spaces. Every filter is optional.
router.get("/", async (req, res) => {
  const { category, city, maxPrice, startDate, endDate, lat, lng } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (maxPrice) filter.pricePerDay = { $lte: Number(maxPrice) };

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
      status: { $in: ["approved", "paid"] },
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    }).distinct("listing");
    filter._id = { $nin: busyIds };
  }

  // the phone number is never sent in search results
  let query = Listing.find(filter).select("-contactPhone").populate("owner", "name");
  if (!lat) query = query.sort("-createdAt"); // "near me" is already sorted by distance
  res.json(await query);
});

// GET /api/listings/mine  -> spaces owned by the logged-in user
router.get("/mine", auth, async (req, res) => {
  res.json(await Listing.find({ owner: req.userId }).sort("-createdAt"));
});

// GET /api/listings/:id
router.get("/:id", optionalAuth, async (req, res) => {
  let query = Listing.findById(req.params.id).populate("owner", "name");
  if (!req.userId) query = query.select("-contactPhone"); // only logged-in visitors can see the phone number
  const listing = await query;
  if (!listing) return res.status(404).json({ message: "Space not found" });
  res.json(listing);
});

// POST /api/listings  (form data with up to 4 photos)
router.post("/", auth, upload.array("images", 4), async (req, res) => {
  const { title, description, category, address, city, pricePerDay, instantBook, lat, lng, contactPhone } = req.body;

  if (!title || !category || !pricePerDay) {
    return res.status(400).json({ message: "Title, category and price are required" });
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
    pricePerDay: Number(pricePerDay),
    instantBook: instantBook === "true",
    images,
    location: { type: "Point", coordinates: [Number(lng), Number(lat)] },
  });
  res.json(listing);
});

// DELETE /api/listings/:id  (only the owner)
router.delete("/:id", auth, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing || listing.owner.toString() !== req.userId) {
    return res.status(404).json({ message: "Space not found" });
  }
  await listing.deleteOne();
  res.json({ message: "Space deleted" });
});

export default router;
