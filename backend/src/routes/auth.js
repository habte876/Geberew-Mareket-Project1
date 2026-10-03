import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { query } from "../db.js";
import { CITY_SLUGS, isEmail, isPhone, splitIdentifier } from "../constants.js";
import { authRequired, publicUser, signToken } from "../middleware/auth.js";

const router = Router();
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});

router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { fullName, identifier, password, confirmPassword, role, city } = req.body || {};
    if (!fullName?.trim()) return res.status(400).json({ error: "Full name is required." });
    if (password !== confirmPassword) return res.status(400).json({ error: "Passwords do not match." });
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    if (!["farmer", "merchant"].includes(role)) {
      return res.status(400).json({ error: "Choose farmer or merchant." });
    }
    if (!CITY_SLUGS.includes(city)) return res.status(400).json({ error: "Select a valid city." });

    const parsed = splitIdentifier(identifier);
    if (parsed.invalid || (!parsed.email && !parsed.phone)) {
      return res.status(400).json({ error: "Enter a valid phone number or email." });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, city)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, phone, role, city, profile_pic, created_at`,
      [fullName.trim(), parsed.email, parsed.phone, hash, role, city]
    );
    const user = rows[0];
    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "An account with that phone or email already exists." });
    }
    console.error(err);
    return res.status(500).json({ error: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  const { identifier, password } = req.body || {};
  const parsed = splitIdentifier(identifier);
  if ((!parsed.email && !parsed.phone) || !password) {
    return res.status(400).json({ error: "Phone/email and password are required." });
  }

  const { rows } = await query(
    `SELECT * FROM users
     WHERE ($1::text IS NOT NULL AND email = $1)
        OR ($2::text IS NOT NULL AND phone = $2)
     LIMIT 1`,
    [parsed.email, parsed.phone]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "No matching account. Check your phone/email." });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Incorrect password." });
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", authRequired, (req, res) => {
  res.json({ user: publicUser(req.user, { includePasswordHint: true }) });
});

router.put("/profile", authRequired, async (req, res) => {
  const { fullName, email, phone, city, currentPassword, newPassword, confirmPassword } = req.body || {};
  if (city && !CITY_SLUGS.includes(city)) return res.status(400).json({ error: "Invalid city." });
  if (email && !isEmail(email)) return res.status(400).json({ error: "Invalid email." });
  if (phone && !isPhone(phone)) return res.status(400).json({ error: "Invalid phone number." });

  let passwordHash;
  if (newPassword) {
    if (newPassword !== confirmPassword) return res.status(400).json({ error: "Passwords do not match." });
    const { rows } = await query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id]);
    const ok = await bcrypt.compare(currentPassword || "", rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect." });
    passwordHash = await bcrypt.hash(newPassword, 10);
  }

  try {
    const nextEmail = email === undefined ? null : email?.trim() ? email.trim().toLowerCase() : null;
    const nextPhone = phone === undefined ? null : phone?.trim() || null;
    const { rows } = await query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         city = COALESCE($4, city),
         password_hash = COALESCE($5, password_hash),
         updated_at = NOW()
       WHERE id = $6
       RETURNING id, full_name, email, phone, role, city, profile_pic, created_at`,
      [
        fullName?.trim() || null,
        nextEmail,
        nextPhone,
        city || null,
        passwordHash || null,
        req.user.id,
      ]
    );
    res.json({ user: publicUser(rows[0], { includePasswordHint: true }) });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email or phone already in use." });
    throw err;
  }
});

export default router;
