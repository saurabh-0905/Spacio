import jwt from "jsonwebtoken";

// Put this before any route that needs a logged-in user.
// It reads the token and sets req.userId.
export default function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: "Please login first" });

  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
