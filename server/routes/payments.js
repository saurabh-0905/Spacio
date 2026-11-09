import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import auth from "../middleware/auth.js";
import Booking from "../models/Booking.js";

const router = express.Router();

// POST /api/payments/create-order  { bookingId }
// Step 1: ask Razorpay for an order. The browser uses it to open the payment popup.
router.post("/create-order", auth, async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId);
  if (!booking || booking.customer.toString() !== req.userId) {
    return res.status(404).json({ message: "Booking not found" });
  }
  if (booking.status !== "approved") {
    return res.status(400).json({ message: "This booking is not ready for payment" });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  const order = await razorpay.orders.create({
    amount: booking.totalAmount * 100, // Razorpay wants paise
    currency: "INR",
    receipt: booking._id.toString(),
  });

  booking.razorpayOrderId = order.id;
  await booking.save();
  res.json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID });
});

// POST /api/payments/verify
// Step 2: after paying, check Razorpay's signature to be sure the payment is real.
router.post("/verify", auth, async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking || booking.customer.toString() !== req.userId) {
    return res.status(404).json({ message: "Booking not found" });
  }
  if (booking.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({ message: "Order does not match this booking" });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  booking.status = "paid";
  booking.razorpayPaymentId = razorpay_payment_id;
  await booking.save();
  res.json(booking);
});

export default router;
