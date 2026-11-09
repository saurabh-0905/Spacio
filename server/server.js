import "dotenv/config";
import "express-async-errors"; // lets us skip try/catch in every route
import express from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import dns from "dns";

import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import bookingRoutes from "./routes/bookings.js";
import paymentRoutes from "./routes/payments.js";
import reviewRoutes from "./routes/reviews.js";
import messageRoutes from "./routes/messages.js";
import supportRoutes from "./routes/support.js";
import Booking from "./models/Booking.js";
import Message from "./models/Message.js";

// Fixes the "querySrv ECONNREFUSED" error when connecting to MongoDB Atlas on some networks
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

// Render (and most hosts) put a proxy in front of the app. This makes req.ip the visitor's real address,
// which the support chat's "15 messages per minute" limit needs.
app.set("trust proxy", 1);

// CLIENT_URL is the address of the website that may call this server.
// It can hold one address, or several separated by commas. A "/" at the end is ignored.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Hosts use this to check that the server is alive
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/support", supportRoutes);

// Any error thrown inside a route ends up here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

// ---------- Socket.IO (live chat) ----------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins } });

// Only logged-in users can connect
io.use((socket, next) => {
  try {
    const payload = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    next();
  } catch (err) {
    next(new Error("Not authorized"));
  }
});

io.on("connection", (socket) => {
  // Each booking is one chat room. Only the owner and customer may join.
  socket.on("join", async (bookingId) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) return;
    const members = [booking.customer.toString(), booking.owner.toString()];
    if (members.includes(socket.userId)) socket.join(bookingId);
  });

  socket.on("send", async ({ bookingId, text }) => {
    if (!text || !socket.rooms.has(bookingId)) return;
    const message = await Message.create({ booking: bookingId, sender: socket.userId, text });
    await message.populate("sender", "name");
    io.to(bookingId).emit("message", message);
  });
});

// ---------- Start ----------
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log("Server running on port " + PORT));
  })
  .catch((err) => console.error("MongoDB connection failed:", err.message));
