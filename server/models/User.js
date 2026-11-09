import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  // People who sign in with Google have no password, so it is only required when there is no googleId
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
  },
  googleId: { type: String, unique: true, sparse: true },
  // Optional 10-digit Indian mobile number, edited on the profile page
  phone: { type: String, match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"] },
});

export default mongoose.model("User", userSchema);
