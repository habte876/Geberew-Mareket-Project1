export const CROPS = [
  { slug: "corn", name: "Corn", nameAm: "በቆሎ", icon: "🌽" },
  { slug: "rice", name: "Rice", nameAm: "ሩዝ", icon: "🍚" },
  { slug: "wheat", name: "Wheat", nameAm: "ስንዴ", icon: "🌾" },
  { slug: "teff", name: "Teff", nameAm: "ጤፍ", icon: "🌿" },
  { slug: "potatoes", name: "Potatoes", nameAm: "ድንች", icon: "🥔" },
  { slug: "tomatoes", name: "Tomatoes", nameAm: "ቲማቲም", icon: "🍅" },
  { slug: "berbere", name: "Berbere", nameAm: "በርበሬ", icon: "🌶️" },
  { slug: "onions", name: "Onions", nameAm: "ቀይ ሽንኩርት", icon: "🧅" },
  { slug: "garlic", name: "Garlic", nameAm: "ነጭ ሽንኩርት", icon: "🧄" },
  { slug: "coffee", name: "Coffee", nameAm: "ቡና", icon: "☕" },
];

export const CITIES = [
  { slug: "bahir-dar", name: "Bahir Dar", nameAm: "ባሕር ዳር" },
  { slug: "gondar", name: "Gondar", nameAm: "ጎንደር" },
  { slug: "dessie", name: "Dessie", nameAm: "ደሴ" },
  { slug: "debre-markos", name: "Debre Markos", nameAm: "ደብረ ማርቆስ" },
  { slug: "debre-birhan", name: "Debre Birhan", nameAm: "ደብረ ብርሃን" },
  { slug: "debre-tabor", name: "Debre Tabor", nameAm: "ደብረ ታቦር" },
  { slug: "lalibela", name: "Lalibela", nameAm: "ላሊበላ" },
  { slug: "weldiya", name: "Weldiya", nameAm: "ወልድያ" },
  { slug: "debark", name: "Debark", nameAm: "ደባርቅ" },
  { slug: "kombolcha", name: "Kombolcha", nameAm: "ኮምቦልቻ" },
];

export const CROP_SLUGS = CROPS.map((c) => c.slug);
export const CITY_SLUGS = CITIES.map((c) => c.slug);

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const isPhone = (value) => /^\+?[0-9][0-9\s-]{7,17}$/.test(String(value).replace(/\s/g, ""));

export function splitIdentifier(identifier) {
  const raw = String(identifier || "").trim();
  if (isEmail(raw)) return { email: raw.toLowerCase(), phone: null };
  if (isPhone(raw)) return { email: null, phone: raw.replace(/\s/g, "") };
  return { email: null, phone: null, invalid: true };
}
