import express from "express";
import auth from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Message from "../models/Message.js";

const router = express.Router();

// GET /api/messages/:bookingId  -> old chat messages of a booking
// (new messages arrive live through Socket.IO, see server.js)
router.get("/:bookingId", auth, async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  const isMember =
    booking && [booking.customer.toString(), booking.owner.toString()].includes(req.userId);
  if (!isMember) return res.status(404).json({ message: "Booking not found" });

  const messages = await Message.find({ booking: booking._id }).populate("sender", "name").sort("createdAt");
  res.json(messages);
});

export default router;
