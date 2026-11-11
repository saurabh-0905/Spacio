import express from "express";
import auth from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Listing from "../models/Listing.js";
import Review from "../models/Review.js";
import { todayIST } from "../utils/dates.js";

const router = express.Router();

// Is any confirmed (approved) booking already using these dates for this listing?
// excludeId lets us skip the booking we are checking right now.
async function datesAreTaken(listingId, start, end, excludeId) {
  const clash = await Booking.findOne({
    _id: { $ne: excludeId },
    listing: listingId,
    status: "approved",
    startDate: { $lte: end },
    endDate: { $gte: start },
  });
  return clash !== null;
}

// POST /api/bookings  -> customer asks to book a space
router.post("/", auth, async (req, res) => {
  const { listingId, startDate, endDate } = req.body;

  const listing = await Listing.findById(listingId);
  if (!listing) return res.status(404).json({ message: "Space not found" });
  if (listing.owner.toString() === req.userId) {
    return res.status(400).json({ message: "You cannot book your own space" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = todayIST();

  if (isNaN(start) || isNaN(end) || end < start) {
    return res.status(400).json({ message: "Please choose valid dates" });
  }
  if (start < today) {
    return res.status(400).json({ message: "Start date cannot be in the past" });
  }
  if (await datesAreTaken(listingId, start, end)) {
    return res.status(400).json({ message: "These dates are already booked" });
  }

  const days = Math.round((end - start) / 86400000) + 1; // both days count
  const booking = await Booking.create({
    listing: listingId,
    customer: req.userId,
    owner: listing.owner,
    startDate: start,
    endDate: end,
    totalAmount: days * listing.pricePerDay,
    // instant booking skips the owner's approval
    status: listing.instantBook ? "approved" : "pending",
  });
  res.json(booking);
});

// GET /api/bookings/mine  -> bookings I made as a customer
router.get("/mine", auth, async (req, res) => {
  const bookings = await Booking.find({ customer: req.userId })
    .populate("listing", "title city images contactPhone")
    .sort("-createdAt")
    .lean();

  // mark which bookings already have a review
  const reviews = await Review.find({ booking: { $in: bookings.map((b) => b._id) } });
  const reviewedIds = reviews.map((r) => r.booking.toString());

  res.json(bookings.map((b) => ({ ...b, reviewed: reviewedIds.includes(b._id.toString()) })));
});

// GET /api/bookings/requests  -> bookings made on my spaces
router.get("/requests", auth, async (req, res) => {
  const bookings = await Booking.find({ owner: req.userId })
    .populate("listing", "title city")
    .populate("customer", "name")
    .sort("-createdAt");
  res.json(bookings);
});

// GET /api/bookings/:id  -> one booking (used by the chat page)
router.get("/:id", auth, async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("listing", "title")
    .populate("customer", "name")
    .populate("owner", "name");
  const isMember =
    booking &&
    (booking.customer._id.toString() === req.userId || booking.owner._id.toString() === req.userId);
  if (!isMember) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
});

// PUT /api/bookings/:id/status
// Owner can approve / reject a pending booking.
// Customer can cancel a pending or confirmed (approved) booking.
router.put("/:id/status", auth, async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  const isOwner = booking.owner.toString() === req.userId;
  const isCustomer = booking.customer.toString() === req.userId;

  if (isOwner && booking.status === "pending" && ["approved", "rejected"].includes(status)) {
    // Double-booking guard: two pending requests may overlap, but only one can be approved
    if (status === "approved" && (await datesAreTaken(booking.listing, booking.startDate, booking.endDate, booking._id))) {
      return res.status(400).json({ message: "These dates are already booked by someone else" });
    }
    booking.status = status;
  } else if (isCustomer && ["pending", "approved"].includes(booking.status) && status === "cancelled") {
    booking.status = "cancelled";
  } else {
    return res.status(400).json({ message: "You cannot do this" });
  }

  await booking.save();
  res.json(booking);
});

export default router;
