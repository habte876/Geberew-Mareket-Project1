import bcrypt from "bcryptjs";
import { query } from "./db.js";
import { CROPS } from "./constants.js";

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
  { fullName: "Yared Solomon", email: "yared@geberewu.test", phone: "+251911000021", role: "farmer", city: "bahir-dar" },
  { fullName: "Selamawit Tadesse", email: "selamawit@geberewu.test", phone: "+251911000022", role: "farmer", city: "gondar" },
  { fullName: "Dawit Fenta", email: "dawit.fenta@geberewu.test", phone: "+251911000023", role: "farmer", city: "dessie" },
  { fullName: "Mekdes Abebe", email: "mekdes@geberewu.test", phone: "+251911000024", role: "farmer", city: "debre-tabor" },
  { fullName: "Biniam Getachew", email: "biniam@geberewu.test", phone: "+251911000025", role: "merchant", city: "bahir-dar" },
  { fullName: "Hana Mengistu", email: "hana.mengistu@geberewu.test", phone: "+251911000026", role: "merchant", city: "gondar" },
  { fullName: "Fikru Alemu", email: "fikru@geberewu.test", phone: "+251911000027", role: "merchant", city: "dessie" },
  { fullName: "Eden Woldemariam", email: "eden@geberewu.test", phone: "+251911000028", role: "merchant", city: "debre-tabor" },
];

const DEMO_FAVORITES = [
  ["yonas@geberewu.test", "abebe@geberewu.test"],
  ["selam@geberewu.test", "tigist@geberewu.test"],
  ["abebe@geberewu.test", "yonas@geberewu.test"],
  ["helen@geberewu.test", "aster@geberewu.test"],
  ["dawit@geberewu.test", "mulugeta@geberewu.test"],
  ["hanna@geberewu.test", "marta@geberewu.test"],
  ["biniam@geberewu.test", "yared@geberewu.test"],
  ["selamawit@geberewu.test", "hana.mengistu@geberewu.test"],
  ["fikru@geberewu.test", "dawit.fenta@geberewu.test"],
  ["mekdes@geberewu.test", "eden@geberewu.test"],
  ["yonas@geberewu.test", "yared@geberewu.test"],
  ["aster@geberewu.test", "biniam@geberewu.test"],
  ["samuel@geberewu.test", "rahel@geberewu.test"],
  ["liya@geberewu.test", "rahel@geberewu.test"],
  ["eden@geberewu.test", "mekdes@geberewu.test"],
  ["kebede@geberewu.test", "hana.mengistu@geberewu.test"],
];

export async function seedDemoData() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const ids = {};

  for (const account of DEMO) {
    const { rows } = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, city, profile_pic)
       VALUES ($1, $2, $3, $4, $5, $6, NULL)
       ON CONFLICT (email) DO UPDATE
         SET profile_pic = NULL
       RETURNING id`,
      [
        account.fullName,
        account.email,
        account.phone,
        passwordHash,
        account.role,
        account.city,
      ]
    );
    ids[account.email] = rows[0].id;
  }

  const { getReferencePrice } = await import("./services/priceIndex.js");
  for (const [accountIndex, account] of DEMO.entries()) {
    if (account.role === "farmer") {
      const existing = await query(
        "SELECT 1 FROM farmer_listings WHERE user_id = $1 LIMIT 1",
        [ids[account.email]]
      );
      if (!existing.rowCount) {
        for (const [cropIndex, crop] of CROPS.entries()) {
          const amount = 8 + ((accountIndex * 7 + cropIndex * 11) % 39);
          await query(
            `INSERT INTO farmer_listings (user_id, crop, city, amount_quintal)
             VALUES ($1, $2, $3, $4)`,
            [ids[account.email], crop.slug, account.city, amount]
          );
        }
      }
    } else {
      const existing = await query(
        "SELECT 1 FROM merchant_offers WHERE user_id = $1 LIMIT 1",
        [ids[account.email]]
      );
      if (!existing.rowCount) {
        for (const crop of CROPS) {
          const reference = getReferencePrice(crop.slug, account.city);
          await query(
            `INSERT INTO merchant_offers (user_id, crop, city, price_etb, reference_price)
             VALUES ($1, $2, $3, $4, $5)`,
            [ids[account.email], crop.slug, account.city, Math.round(reference.price * 0.98), reference.price]
          );
        }
      }
    }
  }

  for (const [fromEmail, toEmail] of DEMO_FAVORITES) {
    await query(
      `INSERT INTO favorites (user_id, target_user_id) VALUES ($1, $2)
       ON CONFLICT (user_id, target_user_id) DO NOTHING`,
      [ids[fromEmail], ids[toEmail]]
    );
  }

  console.log("Seeded demo farmers, merchants, market posts, and favorites. Password for all: password123");
}
