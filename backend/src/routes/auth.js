import { Router } from "express";
import { randomBytes, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { pool, query } from "../db.js";
import { CITIES, CITY_SLUGS, isEmail, isPhone, splitIdentifier } from "../constants.js";
import { authRequired, publicUser, signToken } from "../middleware/auth.js";
import {
  deliverReset,
  deliverVerification,
  isDeliveryConfigured,
} from "../services/notify.js";

const router = Router();
const RESET_PURPOSE = "password_reset";
const VERIFICATION_PURPOSE = "account_verification";
const RESET_TOKEN_ISSUER = "geberewu-market";
const RESET_TOKEN_AUDIENCE = "password-reset";
const MAX_OTP_ATTEMPTS = 5;
const genericResetResponse = {
  ok: true,
  message: "If an account matches those details, a reset code has been sent.",
};

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reset requests. Please try again later." },
});
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts. Please try again later." },
});
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset attempts. Please try again later." },
});
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});
const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification requests. Please try again later." },
});
const accountVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts. Please try again later." },
});
const genericVerificationResponse = {
  ok: true,
  message: "If the account exists and is not yet verified, a new code has been sent.",
};

function getPasswordResetSecret() {
  const secret = process.env.PASSWORD_RESET_JWT_SECRET || "";
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("PASSWORD_RESET_JWT_SECRET must contain at least 32 bytes.");
  }
  return secret;
}

function badOtpResponse(res) {
  return res.status(400).json({ error: "Invalid or expired verification code." });
}

async function rollback(client) {
  try {
    await client.query("ROLLBACK");
  } catch (error) {
    console.error("Password reset transaction rollback failed:", error.message);
  }
}

async function issueAccountVerificationCode(userId) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const hashedCode = await bcrypt.hash(code, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE otps SET used = TRUE, reset_jti = NULL, reset_expires_at = NULL
       WHERE user_id = $1 AND purpose = $2 AND (used = FALSE OR reset_jti IS NOT NULL)`,
      [userId, VERIFICATION_PURPOSE]
    );
    const { rows } = await client.query(
      `INSERT INTO otps (user_id, hashed_code, expires_at, purpose)
       VALUES ($1, $2, NOW() + INTERVAL '10 minutes', $3)
       RETURNING id`,
      [userId, hashedCode, VERIFICATION_PURPOSE]
    );
    await client.query("COMMIT");
    return { id: rows[0].id, code };
  } catch (error) {
    await rollback(client);
    throw error;
  } finally {
    client.release();
  }
}

async function invalidateOtp(id, purpose) {
  await query(
    `UPDATE otps SET used = TRUE, reset_jti = NULL, reset_expires_at = NULL
     WHERE id = $1 AND purpose = $2`,
    [id, purpose]
  );
}

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

    const channel = parsed.email ? "email" : "sms";
    if (!isDeliveryConfigured(channel)) {
      return res.status(503).json({
        error: `Account verification ${channel === "sms" ? "SMS" : "email"} delivery is not configured.`,
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    let user;
    let verificationCode;
    let verificationOtpId;
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, city, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)
         RETURNING id, full_name, email, phone, role, city, profile_pic, created_at`,
        [fullName.trim(), parsed.email, parsed.phone, hash, role, city]
      );
      user = rows[0];
      verificationCode = String(randomInt(0, 1_000_000)).padStart(6, "0");
      const hashedCode = await bcrypt.hash(verificationCode, 10);
      const { rows: otpRows } = await client.query(
        `INSERT INTO otps (user_id, hashed_code, expires_at, purpose)
         VALUES ($1, $2, NOW() + INTERVAL '10 minutes', $3)
         RETURNING id`,
        [user.id, hashedCode, VERIFICATION_PURPOSE]
      );
      await client.query("COMMIT");
      verificationOtpId = otpRows[0].id;
    } catch (error) {
      await rollback(client);
      throw error;
    } finally {
      client.release();
    }

    const destination = channel === "email" ? user.email : user.phone;
    let delivered = false;
    try {
      delivered = await deliverVerification({
        channel,
        destination,
        code: verificationCode,
      });
    } catch (error) {
      console.error("Account verification code delivery failed:", error.message);
    }
    if (!delivered) {
      try {
        await invalidateOtp(verificationOtpId, VERIFICATION_PURPOSE);
        await query(`DELETE FROM users WHERE id = $1 AND is_verified = FALSE`, [user.id]);
      } catch (error) {
        console.error("Failed to clean up an undelivered account verification:", error);
      }
      return res.status(503).json({ error: "Unable to deliver the verification code. Please try again later." });
    }
    return res.status(202).json({
      ok: true,
      message: "A verification code has been sent. Enter it to activate your account.",
    });
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
  if (!user.is_verified) {
    return res.status(403).json({
      code: "ACCOUNT_NOT_VERIFIED",
      error: "Verify your email or phone before logging in.",
    });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post("/resend-verification", resendVerificationLimiter, async (req, res) => {
  const parsed = splitIdentifier(req.body?.identifier);
  if (parsed.invalid) return res.status(400).json({ error: "Enter a valid phone number or email." });
  const channel = parsed.email ? "email" : "sms";
  if (!isDeliveryConfigured(channel)) {
    return res.status(503).json({
      error: `Account verification ${channel === "sms" ? "SMS" : "email"} delivery is not configured.`,
    });
  }

  try {
    const { rows } = await query(
      `SELECT id, email, phone, is_verified FROM users
       WHERE ($1::text IS NOT NULL AND email = $1)
          OR ($2::text IS NOT NULL AND phone = $2)
       LIMIT 1`,
      [parsed.email, parsed.phone]
    );
    const user = rows[0];
    if (!user || user.is_verified) return res.status(202).json(genericVerificationResponse);

    const otp = await issueAccountVerificationCode(user.id);
    let delivered = false;
    try {
      delivered = await deliverVerification({
        channel,
        destination: channel === "email" ? user.email : user.phone,
        code: otp.code,
      });
    } catch (error) {
      console.error("Account verification code delivery failed:", error.message);
    }
    if (!delivered) {
      try {
        await invalidateOtp(otp.id, VERIFICATION_PURPOSE);
      } catch (error) {
        console.error("Failed to invalidate an undelivered verification code:", error);
      }
      return res.status(503).json({ error: "Unable to deliver the verification code. Please try again later." });
    }
    return res.status(202).json(genericVerificationResponse);
  } catch (error) {
    console.error("Verification code request failed:", error);
    return res.status(500).json({ error: "Unable to process the verification request." });
  }
});

router.post("/verify-account", accountVerificationLimiter, async (req, res) => {
  const parsed = splitIdentifier(req.body?.identifier);
  const { code } = req.body || {};
  if (parsed.invalid || typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Enter a valid phone number or email and six-digit code." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT o.id, o.user_id, o.hashed_code, o.attempts
       FROM otps o
       JOIN users u ON u.id = o.user_id
       WHERE (($1::text IS NOT NULL AND u.email = $1)
          OR ($2::text IS NOT NULL AND u.phone = $2))
         AND u.is_verified = FALSE
         AND o.purpose = $3
         AND o.used = FALSE
         AND o.attempts < $4
         AND o.expires_at > NOW()
       ORDER BY o.id DESC
       LIMIT 1
       FOR UPDATE OF o`,
      [parsed.email, parsed.phone, VERIFICATION_PURPOSE, MAX_OTP_ATTEMPTS]
    );
    const otp = rows[0];
    if (!otp) {
      await client.query("ROLLBACK");
      return badOtpResponse(res);
    }

    if (!(await bcrypt.compare(code, otp.hashed_code))) {
      await client.query(
        `UPDATE otps
         SET attempts = attempts + 1,
             used = CASE WHEN attempts + 1 >= $2 THEN TRUE ELSE used END
         WHERE id = $1`,
        [otp.id, MAX_OTP_ATTEMPTS]
      );
      await client.query("COMMIT");
      return badOtpResponse(res);
    }

    await client.query(`UPDATE otps SET used = TRUE WHERE id = $1`, [otp.id]);
    const { rows: users } = await client.query(
      `UPDATE users SET is_verified = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, phone, role, city, profile_pic, created_at`,
      [otp.user_id]
    );
    await client.query("COMMIT");
    return res.json({ ok: true, token: signToken(users[0]), user: publicUser(users[0]) });
  } catch (error) {
    if (client) await rollback(client);
    console.error("Account verification failed:", error);
    return res.status(500).json({ error: "Unable to verify the account." });
  } finally {
    client?.release();
  }
});

router.get("/me", authRequired, (req, res) => {
  res.json({ user: publicUser(req.user, { includePasswordHint: true }) });
});

router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  const { identifier, channel } = req.body || {};
  const parsed = splitIdentifier(identifier);
  if (!["email", "sms"].includes(channel) || parsed.invalid) {
    return res.status(400).json({ error: "Enter a valid phone number or email and choose email or SMS." });
  }
  if (!isDeliveryConfigured(channel)) {
    return res.status(503).json({
      error: `Password reset ${channel === "sms" ? "SMS" : "email"} delivery is not configured.`,
    });
  }
  try {
    getPasswordResetSecret();
  } catch (error) {
    console.error("Password reset token configuration error:", error.message);
    return res.status(503).json({ error: "Password reset is temporarily unavailable." });
  }

  try {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const hashedCode = await bcrypt.hash(code, 10);
    const { rows } = await query(
      `SELECT id, email, phone FROM users
       WHERE (($1::text IS NOT NULL AND email = $1)
          OR ($2::text IS NOT NULL AND phone = $2))
         AND is_verified = TRUE
       LIMIT 1`,
      [parsed.email, parsed.phone]
    );
    const user = rows[0];
    const destination = user ? (channel === "email" ? user.email : user.phone) : null;
    if (!user || !destination) return res.status(202).json(genericResetResponse);

    let otpId;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE otps SET used = TRUE, reset_jti = NULL, reset_expires_at = NULL
         WHERE user_id = $1 AND purpose = $2 AND (used = FALSE OR reset_jti IS NOT NULL)`,
        [user.id, RESET_PURPOSE]
      );
      const insertedOtp = await client.query(
        `INSERT INTO otps (user_id, hashed_code, expires_at, purpose)
         VALUES ($1, $2, NOW() + INTERVAL '10 minutes', $3)
         RETURNING id`,
        [user.id, hashedCode, RESET_PURPOSE]
      );
      otpId = insertedOtp.rows[0].id;
      await client.query("COMMIT");
    } catch (error) {
      await rollback(client);
      throw error;
    } finally {
      client.release();
    }

    let delivered = false;
    try {
      delivered = await deliverReset({ channel, destination, code });
    } catch (error) {
      console.error("Password reset code delivery failed:", error.message);
    }
    if (!delivered) {
      try {
        await query(
          `UPDATE otps SET used = TRUE, reset_jti = NULL, reset_expires_at = NULL
           WHERE id = $1 AND purpose = $2`,
          [otpId, RESET_PURPOSE]
        );
      } catch (error) {
        console.error("Failed to invalidate undelivered password reset code:", error);
      }
      return res.status(503).json({ error: "Unable to deliver the reset code. Please try again later." });
    }
    return res.status(202).json(genericResetResponse);
  } catch (error) {
    console.error("Password reset request failed:", error);
    return res.status(500).json({ error: "Unable to process the password reset request." });
  }
});

router.post("/verify-otp", verifyOtpLimiter, async (req, res) => {
  const { identifier, code } = req.body || {};
  const parsed = splitIdentifier(identifier);
  if (parsed.invalid || typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Enter a valid phone number or email and six-digit code." });
  }

  let secret;
  try {
    secret = getPasswordResetSecret();
  } catch (error) {
    console.error("Password reset token configuration error:", error.message);
    return res.status(500).json({ error: "Password reset is temporarily unavailable." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT o.id, o.user_id, o.hashed_code, o.attempts
       FROM otps o
       JOIN users u ON u.id = o.user_id
       WHERE (($1::text IS NOT NULL AND u.email = $1)
          OR ($2::text IS NOT NULL AND u.phone = $2))
         AND o.purpose = $3
         AND o.used = FALSE
         AND o.attempts < $4
         AND o.expires_at > NOW()
       ORDER BY o.id DESC
       LIMIT 1
       FOR UPDATE OF o`,
      [parsed.email, parsed.phone, RESET_PURPOSE, MAX_OTP_ATTEMPTS]
    );
    const otp = rows[0];
    if (!otp) {
      await client.query("ROLLBACK");
      return badOtpResponse(res);
    }

    const matches = await bcrypt.compare(code, otp.hashed_code);
    if (!matches) {
      await client.query(
        `UPDATE otps
         SET attempts = attempts + 1,
             used = CASE WHEN attempts + 1 >= $2 THEN TRUE ELSE used END
         WHERE id = $1`,
        [otp.id, MAX_OTP_ATTEMPTS]
      );
      await client.query("COMMIT");
      return badOtpResponse(res);
    }

    const resetJti = randomBytes(32).toString("hex");
    const resetToken = jwt.sign(
      { purpose: RESET_PURPOSE },
      secret,
      {
        algorithm: "HS256",
        audience: RESET_TOKEN_AUDIENCE,
        expiresIn: "5m",
        issuer: RESET_TOKEN_ISSUER,
        jwtid: resetJti,
        subject: String(otp.user_id),
      }
    );
    await client.query(
      `UPDATE otps
       SET used = TRUE, reset_jti = $2, reset_expires_at = NOW() + INTERVAL '5 minutes'
       WHERE id = $1 AND used = FALSE`,
      [otp.id, resetJti]
    );
    await client.query("COMMIT");
    return res.json({ ok: true, resetToken });
  } catch (error) {
    if (client) await rollback(client);
    console.error("OTP verification failed:", error);
    return res.status(500).json({ error: "Unable to verify the code." });
  } finally {
    client?.release();
  }
});

router.post("/reset-password", resetPasswordLimiter, async (req, res) => {
  const { token, password, confirmPassword } = req.body || {};
  if (typeof token !== "string" || token.length > 2048) {
    return res.status(400).json({ error: "A valid reset token is required." });
  }
  if (password !== confirmPassword) return res.status(400).json({ error: "Passwords do not match." });
  if (
    typeof password !== "string" ||
    Buffer.byteLength(password, "utf8") < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({ error: "Password must be 8 to 72 bytes long." });
  }

  let secret;
  try {
    secret = getPasswordResetSecret();
  } catch (error) {
    console.error("Password reset token configuration error:", error.message);
    return res.status(500).json({ error: "Password reset is temporarily unavailable." });
  }

  let claims;
  try {
    claims = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      audience: RESET_TOKEN_AUDIENCE,
      issuer: RESET_TOKEN_ISSUER,
    });
  } catch {
    return res.status(400).json({ error: "Invalid or expired reset token." });
  }
  if (
    typeof claims === "string" ||
    claims.purpose !== RESET_PURPOSE ||
    !/^[1-9]\d*$/.test(claims.sub || "") ||
    !/^[a-f0-9]{64}$/.test(claims.jti || "")
  ) {
    return res.status(400).json({ error: "Invalid or expired reset token." });
  }

  let client;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    client = await pool.connect();
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, user_id FROM otps
       WHERE reset_jti = $1
         AND user_id = $2
         AND purpose = $3
         AND used = TRUE
         AND reset_expires_at > NOW()
       FOR UPDATE`,
      [claims.jti, Number(claims.sub), RESET_PURPOSE]
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    await client.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, rows[0].user_id]
    );
    await client.query(
      `UPDATE otps SET reset_jti = NULL, reset_expires_at = NULL, used = TRUE
       WHERE user_id = $1 AND purpose = $2 AND reset_jti IS NOT NULL`,
      [rows[0].user_id, RESET_PURPOSE]
    );
    await client.query("COMMIT");
    return res.json({ ok: true });
  } catch (error) {
    if (client) await rollback(client);
    console.error("Password reset failed:", error);
    return res.status(500).json({ error: "Unable to reset the password." });
  } finally {
    client?.release();
  }
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
