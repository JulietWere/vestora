import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  console.log("AUTH HEADER:", req.headers.authorization);

  const token = req.headers.authorization?.split(" ")[1];

  console.log("TOKEN RECEIVED:", token);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    console.log("JWT SECRET:", process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED TOKEN:", decoded);

    req.user = decoded;

    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}