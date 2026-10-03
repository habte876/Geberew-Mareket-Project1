import { Router } from "express";
import { query } from "../db.js";
import { CROP_SLUGS, CITY_SLUGS, CROPS, CITIES } from "../constants.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/:crop/:city", authRequired, async (req, res) => {
  const { crop, city } = req.params;
  if (!CROP_SLUGS.includes(crop) || !CITY_SLUGS.includes(city)) {
    return res.status(404).json({ error: "Unknown crop or city." });
  }

  const cropMeta = CROPS.find((c) => c.slug === crop);
  const cityMeta = CITIES.find((c) => c.slug === city);
  const starredIds = (
    await query(`SELECT target_user_id FROM favorites WHERE user_id = $1`, [req.user.id])
  ).rows.map((r) => r.target_user_id);

  if (req.user.role === "farmer") {
    const { rows } = await query(
      `SELECT DISTINCT ON (u.id)
         u.id, u.full_name, u.phone, u.profile_pic, u.city,
         o.price_etb, o.created_at
       FROM merchant_offers o
       JOIN users u ON u.id = o.user_id
       WHERE o.crop = $1 AND o.city = $2 AND u.role = 'merchant'
       ORDER BY u.id, o.created_at DESC`,
      [crop, city]
    );
    return res.json({
      crop: cropMeta,
      city: cityMeta,
      counterpartRole: "merchant",
      items: rows.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        phone: r.phone,
        profilePic: r.profile_pic,
        city: r.city,
        priceEtb: Number(r.price_etb),
        postedAt: r.created_at,
        starred: starredIds.includes(r.id),
      })),
    });
  }

  const { rows } = await query(
    `SELECT DISTINCT ON (u.id)
       u.id, u.full_name, u.phone, u.profile_pic, u.city,
       l.amount_quintal, l.created_at
     FROM farmer_listings l
     JOIN users u ON u.id = l.user_id
     WHERE l.crop = $1 AND l.city = $2 AND u.role = 'farmer'
     ORDER BY u.id, l.created_at DESC`,
    [crop, city]
  );
  res.json({
    crop: cropMeta,
    city: cityMeta,
    counterpartRole: "farmer",
    items: rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      phone: r.phone,
      profilePic: r.profile_pic,
      city: r.city,
      amountQuintal: Number(r.amount_quintal),
      postedAt: r.created_at,
      starred: starredIds.includes(r.id),
    })),
  });
});

export default router;
