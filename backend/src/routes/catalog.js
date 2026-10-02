import { Router } from "express";
import { CITIES, CROPS } from "../constants.js";
import { getReferencePrice } from "../services/priceIndex.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    crops: CROPS.map((c) => ({ ...c, samplePrice: getReferencePrice(c.slug, "bahir-dar").price })),
    cities: CITIES,
  });
});

router.get("/:crop/cities", (req, res) => {
  const crop = CROPS.find((c) => c.slug === req.params.crop);
  if (!crop) return res.status(404).json({ error: "Unknown crop." });
  res.json({
    crop,
    cities: CITIES.map((city) => ({
      ...city,
      reference: getReferencePrice(crop.slug, city.slug),
    })),
  });
});

export default router;
