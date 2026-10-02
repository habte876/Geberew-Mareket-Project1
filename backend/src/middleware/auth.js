import "dotenv/config";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

function secret() {
  return process.env.JWT_SECRET || "change-me-in-production";
}

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, secret(), { expiresIn: "7d" });
}

export async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Login required." });
  try {
    const payload = jwt.verify(token, secret());
    const { rows } = await query(
      `SELECT id, full_name, email, phone, role, city, profile_pic, created_at
       FROM users WHERE id = $1`,
      [payload.id]
    );
    if (!rows[0]) return res.status(401).json({ error: "Account not found." });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

export function publicUser(user, { includePasswordHint = false } = {}) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    city: user.city,
    profilePic: user.profile_pic,
    createdAt: user.created_at,
    hasPassword: includePasswordHint ? true : undefined,
  };
}
