import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    // "day" bookings use startDate to endDate. "hour" bookings use one date (startDate = endDate)
    // plus startMinutes and endMinutes (minutes after midnight, for example 840 = 2:00 PM).
    unit: { type: String, enum: ["day", "hour"], default: "day" },
    startMinutes: Number,
    endMinutes: Number,
    // pending -> approved (shown as "Confirmed")   or rejected / cancelled
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
