import bcrypt from "bcryptjs";
import { query } from "./db.js";
import { CITIES, CROPS } from "./constants.js";

const DEMO = [
  { fullName: "Abebe Bekele", email: "abebe@geberewu.test", phone: "+251911000001", role: "farmer", city: "bahir-dar" },
  { fullName: "Tigist Hailu", email: "tigist@geberewu.test", phone: "+251911000002", role: "farmer", city: "gondar" },
  { fullName: "Mulugeta Desta", email: "mulugeta@geberewu.test", phone: "+251911000003", role: "farmer", city: "dessie" },
  { fullName: "Hanna Worku", email: "hanna@geberewu.test", phone: "+251911000004", role: "farmer", city: "kombolcha" },
  { fullName: "Aster Mekonnen", email: "aster@geberewu.test", phone: "+251911000009", role: "farmer", city: "debre-markos" },
  { fullName: "Getachew Tadesse", email: "getachew@geberewu.test", phone: "+251911000010", role: "farmer", city: "debre-birhan" },
  { fullName: "Meseret Alemu", email: "meseret@geberewu.test", phone: "+251911000011", role: "farmer", city: "debre-tabor" },
  { fullName: "Kebede Negash", email: "kebede@geberewu.test", phone: "+251911000012", role: "farmer", city: "lalibela" },
  { fullName: "Rahel Fikadu", email: "rahel@geberewu.test", phone: "+251911000013", role: "farmer", city: "weldiya" },
  { fullName: "Solomon Abate", email: "solomon@geberewu.test", phone: "+251911000014", role: "farmer", city: "debark" },
  { fullName: "Yonas Alemu", email: "yonas@geberewu.test", phone: "+251911000005", role: "merchant", city: "bahir-dar" },
  { fullName: "Selam Tesfaye", email: "selam@geberewu.test", phone: "+251911000006", role: "merchant", city: "gondar" },
  { fullName: "Dawit Kebede", email: "dawit@geberewu.test", phone: "+251911000007", role: "merchant", city: "dessie" },
  { fullName: "Marta Girma", email: "marta@geberewu.test", phone: "+251911000008", role: "merchant", city: "kombolcha" },
  { fullName: "Helen Assefa", email: "helen@geberewu.test", phone: "+251911000015", role: "merchant", city: "debre-markos" },
  { fullName: "Biruk Haile", email: "biruk@geberewu.test", phone: "+251911000016", role: "merchant", city: "debre-birhan" },
  { fullName: "Nardos Bekele", email: "nardos@geberewu.test", phone: "+251911000017", role: "merchant", city: "debre-tabor" },
  { fullName: "Samuel Gashaw", email: "samuel@geberewu.test", phone: "+251911000018", role: "merchant", city: "lalibela" },
  { fullName: "Liya Teshome", email: "liya@geberewu.test", phone: "+251911000019", role: "merchant", city: "weldiya" },
  { fullName: "Henok Desta", email: "henok@geberewu.test", phone: "+251911000020", role: "merchant", city: "debark" },
];

export async function seedIfEmpty() {
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM users");
  if (rows[0].n > 0) return;

  const hash = await bcrypt.hash("password123", 10);
  const ids = {};
  for (const u of DEMO) {
    const inserted = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, city)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [u.fullName, u.email, u.phone, hash, u.role, u.city]
    );
    ids[u.email] = inserted.rows[0].id;
  }

  const farmers = DEMO.filter((d) => d.role === "farmer");
  const merchants = DEMO.filter((d) => d.role === "merchant");
  const { getReferencePrice } = await import("./services/priceIndex.js");

  for (const farmer of farmers) {
    for (const crop of CROPS) {
      await query(
        `INSERT INTO farmer_listings (user_id, crop, city, amount_kuntal) VALUES ($1,$2,$3,$4)`,
        [ids[farmer.email], crop.slug, farmer.city, 6 + Math.round(Math.random() * 48)]
      );
    }
  }

  for (const merchant of merchants) {
    for (const crop of CROPS) {
      const ref = getReferencePrice(crop.slug, merchant.city);
      const price = Math.round(ref.price * 0.98);
      await query(
        `INSERT INTO merchant_offers (user_id, crop, city, price_etb, reference_price) VALUES ($1,$2,$3,$4,$5)`,
        [ids[merchant.email], crop.slug, merchant.city, price, ref.price]
      );
    }
  }

  await query(`INSERT INTO favorites (user_id, target_user_id) VALUES ($1,$2), ($3,$4), ($5,$6), ($7,$8)`, [
    ids["yonas@geberewu.test"],
    ids["abebe@geberewu.test"],
    ids["selam@geberewu.test"],
    ids["tigist@geberewu.test"],
    ids["abebe@geberewu.test"],
    ids["yonas@geberewu.test"],
    ids["helen@geberewu.test"],
    ids["aster@geberewu.test"],
  ]);

  console.log("Seeded demo users. Password for all: password123");
  void CITIES;
}
