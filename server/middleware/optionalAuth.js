import jwt from "jsonwebtoken";

// Like auth.js, but visitors who are not logged in are allowed too.
// If a valid token is sent we set req.userId, otherwise we just carry on without it.
export default function optionalAuth(req, res, next) {
  const token = (req.headers.authorization || "").split(" ")[1];
  if (token) {
    try {
      req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    } catch (err) {
      // an old or broken token simply counts as "not logged in"
    }
  }
  next();
}
