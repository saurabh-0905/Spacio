import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import auth from "../middleware/auth.js";
import { cleanPhone, isValidPhone } from "../utils/phone.js";
import { isDemoEmail } from "../utils/demo.js";
import { deleteUserData } from "../utils/cleanup.js";
import User from "../models/User.js";

const router = express.Router();

// The user details we are happy to send to the browser (never the password)
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, phone: user.phone || "", hasPassword: Boolean(user.password) };
}

// Create a token and the user info we send back to the browser
function makeResponse(user) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { token, user: publicUser(user) };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please fill all fields" });
  }
  if (await User.findOne({ email })) {
    return res.status(400).json({ message: "This email is already registered" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });
  res.json(makeResponse(user));
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && !user.password) {
    return res.status(400).json({ message: "This account uses Google sign-in. Please click Continue with Google." });
  }
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Wrong email or password" });
  }
  res.json(makeResponse(user));
});

// POST /api/auth/google  { credential }
// The browser gets a signed "credential" from Google after the user picks their account.
// We check with Google that it is real, then log the user in (or create the account).
router.post("/google", async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ message: "Google sign-in is not set up yet." });
  }
  if (!req.body.credential) {
    return res.status(400).json({ message: "Google sign-in failed. Please try again." });
  }

  let google;
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID, // the token must be made for OUR app
    });
    google = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }

  if (!google.email || !google.email_verified) {
    return res.status(401).json({ message: "Your Google email is not verified." });
  }

  // Find the person by their Google id first (their email on Spacio may have been changed on the profile page)
  let user = await User.findOne({ googleId: google.sub });
  if (!user) user = await User.findOne({ email: google.email.toLowerCase() });
  if (!user) {
    user = await User.create({
      name: google.name || google.email.split("@")[0],
      email: google.email,
      googleId: google.sub,
    });
  } else if (!user.googleId) {
    // same email as an existing account: link it, so one person has one account
    user.googleId = google.sub;
    await user.save();
  }
  res.json(makeResponse(user));
});

// GET /api/auth/me  -> the logged-in user's profile
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "Account not found" });
  res.json(publicUser(user));
});

// PUT /api/auth/me  { name, email, phone } -> update the profile
router.put("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "Account not found" });

  const name = String(req.body.name || "").trim();
  if (name.length < 2) {
    return res.status(400).json({ message: "Please enter your name" });
  }

  const email = String(req.body.email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }
  if (email !== user.email && (await User.findOne({ email }))) {
    return res.status(400).json({ message: "This email is already used by another account" });
  }

  // The phone number is optional, but if it is typed it must be valid
  const phone = cleanPhone(req.body.phone);
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ message: "Please enter a valid 10-digit mobile number" });
  }

  user.name = name;
  user.email = email;
  user.phone = phone || undefined; // an empty box removes the number
  await user.save();
  res.json(publicUser(user));
});

// DELETE /api/auth/me  { confirm: "DELETE", password }  -> delete the account for good
// Removes the user's spaces (with their bookings, chats, reviews and photos), the bookings they made, and the account.
router.delete("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "Account not found" });

  // The demo account owns the sample listings that show how Spacio works, so it is kept
  if (isDemoEmail(user.email)) {
    return res.status(400).json({ message: "The demo account cannot be deleted." });
  }
  if (req.body.confirm !== "DELETE") {
    return res.status(400).json({ message: "Please type DELETE to confirm" });
  }
  // Accounts with a password must also type it. Google accounts have no password.
  if (user.password && !(await bcrypt.compare(String(req.body.password || ""), user.password))) {
    return res.status(400).json({ message: "Wrong password" });
  }

  await deleteUserData(user);
  res.json({ message: "Your account has been deleted" });
});

export default router;
