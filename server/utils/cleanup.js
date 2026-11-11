import Listing from "../models/Listing.js";
import Booking from "../models/Booking.js";
import Message from "../models/Message.js";
import Review from "../models/Review.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";

// Delete one space together with everything that belongs to it:
// its bookings, the chats and reviews of those bookings, and its photos.
export async function deleteListingData(listing) {
  const bookings = await Booking.find({ listing: listing._id }).select("_id");
  const bookingIds = bookings.map((b) => b._id);

  await Message.deleteMany({ booking: { $in: bookingIds } });
  await Review.deleteMany({ $or: [{ booking: { $in: bookingIds } }, { listing: listing._id }] });
  await Booking.deleteMany({ listing: listing._id });
  await Promise.all((listing.images || []).map(deleteFromCloudinary));
  await listing.deleteOne();
}

// Delete a whole account: their spaces (with everything inside them),
// the bookings they made, their chats and reviews, and finally the account itself.
export async function deleteUserData(user) {
  const listings = await Listing.find({ owner: user._id });
  for (const listing of listings) {
    await deleteListingData(listing);
  }

  const bookings = await Booking.find({ customer: user._id }).select("_id");
  const bookingIds = bookings.map((b) => b._id);
  await Message.deleteMany({ booking: { $in: bookingIds } });
  await Review.deleteMany({ $or: [{ booking: { $in: bookingIds } }, { reviewer: user._id }] });
  await Booking.deleteMany({ customer: user._id });

  await user.deleteOne();
}
