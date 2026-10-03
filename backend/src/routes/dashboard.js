import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const starsReceived = await query(
    `SELECT f.created_at, u.id, u.full_name, u.phone, u.profile_pic, u.role, u.city
     FROM favorites f
     JOIN users u ON u.id = f.user_id
     WHERE f.target_user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );

  const starsGiven = await query(
    `SELECT f.created_at, u.id, u.full_name, u.phone, u.profile_pic, u.role, u.city
     FROM favorites f
     JOIN users u ON u.id = f.target_user_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );

  let posts;
  let counterparts;
  if (role === "farmer") {
    posts = await query(
      `SELECT id, crop, city, amount_quintal AS value, created_at FROM farmer_listings WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    counterparts = await query(
      `SELECT DISTINCT ON (u.id)
         u.id, u.full_name, u.phone, u.profile_pic, o.crop, o.city, o.price_etb AS extra, o.created_at
       FROM merchant_offers o
       JOIN users u ON u.id = o.user_id
       WHERE o.city = $1
       ORDER BY u.id, o.created_at DESC
       LIMIT 40`,
      [req.user.city]
    );
  } else {
    posts = await query(
      `SELECT id, crop, city, price_etb AS value, reference_price, created_at FROM merchant_offers WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    counterparts = await query(
      `SELECT DISTINCT ON (u.id)
         u.id, u.full_name, u.phone, u.profile_pic, l.crop, l.city, l.amount_quintal AS extra, l.created_at
       FROM farmer_listings l
       JOIN users u ON u.id = l.user_id
       WHERE l.city = $1
       ORDER BY u.id, l.created_at DESC
       LIMIT 40`,
      [req.user.city]
    );
  }

  const activity = [
    ...posts.rows.map((p) => ({
      type: role === "farmer" ? "listing" : "offer",
      at: p.created_at,
      crop: p.crop,
      city: p.city,
      value: Number(p.value),
    })),
    ...starsReceived.rows.map((s) => ({
      type: "star_received",
      at: s.created_at,
      from: s.full_name,
    })),
    ...starsGiven.rows.map((s) => ({
      type: "star_given",
      at: s.created_at,
      to: s.full_name,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  res.json({
    role,
    starCount: starsReceived.rowCount,
    starredBy: starsReceived.rows.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      phone: u.phone,
      profilePic: u.profile_pic,
      role: u.role,
      city: u.city,
      at: u.created_at,
    })),
    favorites: starsGiven.rows.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      phone: u.phone,
      profilePic: u.profile_pic,
      role: u.role,
      city: u.city,
      at: u.created_at,
    })),
    posts: posts.rows,
    marketPulse: counterparts.rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      phone: r.phone,
      profilePic: r.profile_pic,
      crop: r.crop,
      city: r.city,
      extra: Number(r.extra),
      at: r.created_at,
    })),
    activity: activity.slice(0, 30),
  });
});

export default router;
