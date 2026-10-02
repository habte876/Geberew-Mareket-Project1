import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { CITIES, CITY_SLUGS, isEmail, isPhone, splitIdentifier } from "../constants.js";
import { authRequired, publicUser, signToken } from "../middleware/auth.js";
import { deliverReset, newToken } from "../services/notify.js";

const router = Router();

router.post("/register", async (req, res) => {
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
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "An account with that phone or email already exists." });
    }
    console.error(err);
    res.status(500).json({ error: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  const { fullName, identifier, password } = req.body || {};
  const parsed = splitIdentifier(identifier);
  if (!fullName?.trim() || (!parsed.email && !parsed.phone) || !password) {
    return res.status(400).json({ error: "Full name, phone/email, and password are required." });
  }

  const { rows } = await query(
    `SELECT * FROM users
     WHERE lower(full_name) = lower($1)
       AND (
         ($2::text IS NOT NULL AND email = $2)
         OR ($3::text IS NOT NULL AND phone = $3)
       )
     LIMIT 1`,
    [fullName.trim(), parsed.email, parsed.phone]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "No matching account. Check name and phone/email." });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Incorrect password." });
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", authRequired, (req, res) => {
  res.json({ user: publicUser(req.user, { includePasswordHint: true }) });
});

router.post("/forgot", async (req, res) => {
  const { identifier, channel } = req.body || {};
  if (!["email", "sms"].includes(channel)) {
    return res.status(400).json({ error: "Choose email or SMS reset." });
  }
  const parsed = splitIdentifier(identifier);
  const { rows } = await query(
    `SELECT * FROM users WHERE ($1::text IS NOT NULL AND email = $1) OR ($2::text IS NOT NULL AND phone = $2) LIMIT 1`,
    [parsed.email, parsed.phone]
  );
  const generic = { ok: true, message: "If an account exists, a reset message was sent." };
  if (!rows[0]) return res.json(generic);

  const user = rows[0];
  const destination = channel === "email" ? user.email : user.phone;
  if (!destination) {
    return res.status(400).json({
      error:
        channel === "email"
          ? "This account has no email. Choose SMS, or add an email in your profile."
          : "This account has no phone number. Choose email, or add a phone in your profile.",
    });
  }

  const token = newToken();
  await query(
    `INSERT INTO reset_tokens (user_id, token, channel, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`,
    [user.id, token, channel]
  );
  try {
    const preview = await deliverReset({
      channel,
      destination,
      token,
      clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    });
    res.json({ ...generic, preview });
  } catch (err) {
    console.error("Password reset delivery failed:", err.message);
    res.status(err.statusCode || 500).json({ error: err.message || "Password reset delivery failed." });
  }
});

router.post("/reset", async (req, res) => {
  const { token, password, confirmPassword } = req.body || {};
  if (!token) return res.status(400).json({ error: "Reset token is required." });
  if (password !== confirmPassword) return res.status(400).json({ error: "Passwords do not match." });
  if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

  const { rows } = await query(
    `SELECT * FROM reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
    [token]
  );
  if (!rows[0]) return res.status(400).json({ error: "Invalid or expired reset link." });
  const hash = await bcrypt.hash(password, 10);
  await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hash, rows[0].user_id]);
  await query(`UPDATE reset_tokens SET used = TRUE WHERE id = $1`, [rows[0].id]);
  res.json({ ok: true });
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
