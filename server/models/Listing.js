import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ["storage", "parking", "workspace", "event"],
      required: true,
    },
    images: [String],
    address: String,
    city: String,
    // GeoJSON point: coordinates are [longitude, latitude]
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    // 10-digit Indian mobile number of the host. Only logged-in visitors can see it.
    contactPhone: { type: String, match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"] },
    pricePerDay: { type: Number, required: true },
    instantBook: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// This index lets MongoDB find "listings near me" quickly
listingSchema.index({ location: "2dsphere" });

export default mongoose.model("Listing", listingSchema);
