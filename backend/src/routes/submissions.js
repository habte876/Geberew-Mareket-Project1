import { Router } from "express";
import { query } from "../db.js";
import { CROP_SLUGS, CITY_SLUGS } from "../constants.js";
import { authRequired } from "../middleware/auth.js";
import { getReferencePrice, validateMerchantPrice } from "../services/priceIndex.js";

const router = Router();

function requirePhone(user) {
  if (!user.phone) {
    return "Add a phone number in your profile before submitting. Buyers need a way to call you.";
  }
  return null;
}

router.post("/farmer", authRequired, async (req, res) => {
  if (req.user.role !== "farmer") return res.status(403).json({ error: "Only farmers can post crop amounts." });
  const phoneError = requirePhone(req.user);
  if (phoneError) return res.status(400).json({ error: phoneError, code: "PHONE_REQUIRED" });

  const { crop, amountQuintal } = req.body || {};
  if (!CROP_SLUGS.includes(crop)) return res.status(400).json({ error: "Choose a crop from the list." });
  const amount = Number(amountQuintal);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0 quintals." });
  }

  const { rows } = await query(
    `INSERT INTO farmer_listings (user_id, crop, city, amount_quintal)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [req.user.id, crop, req.user.city, amount]
  );
  res.status(201).json({ listing: rows[0] });
});

router.post("/merchant", authRequired, async (req, res) => {
  if (req.user.role !== "merchant") return res.status(403).json({ error: "Only merchants can post prices." });
  const phoneError = requirePhone(req.user);
  if (phoneError) return res.status(400).json({ error: phoneError, code: "PHONE_REQUIRED" });

  const { crop, priceEtb, city } = req.body || {};
  const marketCity = city || req.user.city;
  if (!CROP_SLUGS.includes(crop)) return res.status(400).json({ error: "Choose a crop from the list." });
  if (!CITY_SLUGS.includes(marketCity)) return res.status(400).json({ error: "Invalid city market." });

  const check = validateMerchantPrice(crop, marketCity, priceEtb);
  if (!check.ok) return res.status(400).json({ error: check.error, reference: check.reference });

  const { rows } = await query(
    `INSERT INTO merchant_offers (user_id, crop, city, price_etb, reference_price)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.user.id, crop, marketCity, Number(priceEtb), check.reference.price]
  );
  res.status(201).json({ offer: rows[0], reference: check.reference });
});

router.get("/reference", authRequired, (req, res) => {
  const { crop, city } = req.query;
  if (!CROP_SLUGS.includes(crop) || !CITY_SLUGS.includes(city)) {
    return res.status(400).json({ error: "crop and city are required." });
  }
  res.json(getReferencePrice(crop, city));
});

export default router;
