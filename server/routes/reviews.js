import express from "express";
import auth from "../middleware/auth.js";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";

const router = express.Router();

// GET /api/reviews/listing/:listingId
router.get("/listing/:listingId", async (req, res) => {
  const reviews = await Review.find({ listing: req.params.listingId })
    .populate("reviewer", "name")
    .sort("-createdAt");
  res.json(reviews);
});

// POST /api/reviews  { bookingId, rating, comment }
// Only the customer of a confirmed (approved) booking can review, and only once.
router.post("/", auth, async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking || booking.customer.toString() !== req.userId) {
    return res.status(404).json({ message: "Booking not found" });
  }
  if (booking.status !== "approved") {
    return res.status(400).json({ message: "You can review only after your booking is confirmed" });
  }
  if (await Review.findOne({ booking: bookingId })) {
    return res.status(400).json({ message: "You already reviewed this booking" });
  }

  const review = await Review.create({
    listing: booking.listing,
    booking: bookingId,
    reviewer: req.userId,
    rating: Number(rating),
    comment,
  });
  res.json(review);
});

export default router;
