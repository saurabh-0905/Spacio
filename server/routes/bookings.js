import express from "express";
import auth from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Listing from "../models/Listing.js";
import Review from "../models/Review.js";
import { todayIST, nowMinutesIST, hourToMinutes } from "../utils/dates.js";

const router = express.Router();

// Is this booking in the way of a confirmed (approved) booking of the same space?
// "booking" needs: listing, unit, startDate, endDate and (for hours) startMinutes, endMinutes.
// excludeId lets us skip the booking we are checking right now.
async function isTaken(booking, excludeId) {
  // every confirmed booking on any of the same dates (an hourly booking uses one date)
  const sameDates = await Booking.find({
    _id: { $ne: excludeId },
    listing: booking.listing,
    status: "approved",
    startDate: { $lte: booking.endDate },
    endDate: { $gte: booking.startDate },
  });

  // Whole-day bookings need the days completely free.
  if (booking.unit !== "hour") return sameDates.length > 0;

  // Hourly bookings clash with a day booking, or with an hourly booking whose hours overlap.
  return sameDates.some(
    (other) =>
      other.unit !== "hour" ||
      (other.startMinutes < booking.endMinutes && other.endMinutes > booking.startMinutes)
  );
}

// POST /api/bookings  -> customer asks to book a space
//   per-day space:  { listingId, startDate, endDate }
//   per-hour space: { listingId, startDate (the one date), startTime: "14:00", endTime: "16:00" }
router.post("/", auth, async (req, res) => {
  const { listingId, startDate, endDate, startTime, endTime } = req.body;

  const listing = await Listing.findById(listingId);
  if (!listing) return res.status(404).json({ message: "Space not found" });
  if (listing.owner.toString() === req.userId) {
    return res.status(400).json({ message: "You cannot book your own space" });
  }

  const unit = listing.priceUnit === "hour" ? "hour" : "day";
  const start = new Date(startDate);
  const today = todayIST();

  if (isNaN(start)) {
    return res.status(400).json({ message: "Please choose a valid date" });
  }
  if (start < today) {
    return res.status(400).json({ message: "The date cannot be in the past" });
  }

  const booking = { listing: listingId, customer: req.userId, owner: listing.owner, unit, startDate: start };

  if (unit === "hour") {
    const startMinutes = hourToMinutes(startTime);
    const endMinutes = hourToMinutes(endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return res.status(400).json({ message: "Please choose a valid start and end time" });
    }
    if (+start === +today && startMinutes < nowMinutesIST()) {
      return res.status(400).json({ message: "That time has already passed. Please choose a later time." });
    }
    booking.endDate = start;
    booking.startMinutes = startMinutes;
    booking.endMinutes = endMinutes;
    booking.totalAmount = ((endMinutes - startMinutes) / 60) * listing.price;
  } else {
    const end = new Date(endDate);
    if (isNaN(end) || end < start) {
      return res.status(400).json({ message: "Please choose valid dates" });
    }
    const days = Math.round((end - start) / 86400000) + 1; // both days count
    booking.endDate = end;
    booking.totalAmount = days * listing.price;
  }

  if (await isTaken(booking)) {
    return res.status(400).json({
      message: unit === "hour" ? "That time is already booked" : "These dates are already booked",
    });
  }

  // instant booking skips the owner's approval
  booking.status = listing.instantBook ? "approved" : "pending";
  res.json(await Booking.create(booking));
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
    if (status === "approved" && (await isTaken(booking, booking._id))) {
      return res.status(400).json({ message: "This date or time is already booked by someone else" });
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
