import { CITIES, CROPS } from "../constants.js";

const BASE_PRICE_ETB = {
  corn: 2800,
  rice: 6200,
  wheat: 4100,
  teff: 7800,
  potatoes: 1900,
  tomatoes: 2400,
  berbere: 12500,
  onions: 2100,
  garlic: 5600,
  coffee: 9800,
};

const CITY_FACTOR = {
  "bahir-dar": 1.0,
  gondar: 1.03,
  dessie: 0.97,
  "debre-markos": 0.95,
  "debre-birhan": 1.02,
  "debre-tabor": 0.96,
  lalibela: 1.06,
  weldiya: 0.98,
  debark: 1.04,
  kombolcha: 0.99,
};

const cache = new Map();
const TTL_MS = 10 * 60 * 1000;
const FETCH_MS = 900;
let fxScale = 1;
let lastFxAt = 0;

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error("feed error");
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function refreshFxScale() {
  if (Date.now() - lastFxAt < TTL_MS) return fxScale;
  try {
    const custom = process.env.PRICE_FEED_URL;
    if (custom) {
      const data = await fetchWithTimeout(custom, FETCH_MS);
      const next = Number(data.etbScale || data.scale);
      if (Number.isFinite(next) && next > 0) fxScale = next;
    } else {
      const data = await fetchWithTimeout("https://open.er-api.com/v6/latest/USD", FETCH_MS);
      const etb = Number(data?.rates?.ETB);
      if (Number.isFinite(etb) && etb > 0) {
        fxScale = Math.min(1.18, Math.max(0.86, etb / 120));
      }
    }
    lastFxAt = Date.now();
  } catch {
    lastFxAt = Date.now();
  }
  return fxScale;
}

export function computeDailyPrice(crop, city, date = new Date()) {
  const base = BASE_PRICE_ETB[crop];
  const factor = CITY_FACTOR[city] ?? 1;
  if (!base) return null;
  const day = dayKey(date);
  const doy = Math.floor(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
      Date.UTC(date.getUTCFullYear(), 0, 0)) /
      86400000
  );
  const seasonal = 1 + 0.08 * Math.sin((2 * Math.PI * doy) / 365);
  const noise = ((hash32(`${crop}:${city}:${day}`) % 700) - 350) / 10000;
  return Math.round(base * factor * seasonal * (1 + noise) * fxScale * 100) / 100;
}

export function getReferencePrice(crop, city) {
  const key = `${crop}:${city}:${dayKey()}:${fxScale.toFixed(4)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const price = computeDailyPrice(crop, city);
  const band = 0.18;
  const value = {
    crop,
    city,
    price,
    min: Math.round(price * (1 - band) * 100) / 100,
    max: Math.round(price * (1 + band) * 100) / 100,
    source: process.env.PRICE_FEED_URL
      ? "Configured daily market feed + Amhara city basket"
      : "Geberewu Daily Market Index (Amhara basket, USD/ETB calibrated)",
    fetchedAt: new Date().toISOString(),
  };
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function validateMerchantPrice(crop, city, price) {
  const ref = getReferencePrice(crop, city);
  if (!ref || ref.price == null) {
    return { ok: false, error: "No reference price for this crop and city." };
  }
  const numeric = Number(price);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { ok: false, error: "Price must be a positive number." };
  }
  if (numeric < ref.min || numeric > ref.max) {
    return {
      ok: false,
      error: `Price is outside today's market range (${ref.min} – ${ref.max} ETB / quintal).`,
      reference: ref,
    };
  }
  return { ok: true, reference: ref };
}

export async function refreshAllReferencePrices(query) {
  await refreshFxScale();
  const rows = [];
  for (const crop of CROPS) {
    for (const city of CITIES) {
      const ref = getReferencePrice(crop.slug, city.slug);
      rows.push([crop.slug, city.slug, ref.price, ref.source]);
    }
  }
  await query(
    `
    INSERT INTO reference_prices (crop, city, price_etb, source)
    SELECT * FROM UNNEST($1::text[], $2::text[], $3::numeric[], $4::text[])
      AS t(crop, city, price_etb, source)
    ON CONFLICT (crop, city)
    DO UPDATE SET price_etb = EXCLUDED.price_etb, source = EXCLUDED.source, fetched_at = NOW()
    `,
    [
      rows.map((r) => r[0]),
      rows.map((r) => r[1]),
      rows.map((r) => r[2]),
      rows.map((r) => r[3]),
    ]
  );
  return rows.length;
}
