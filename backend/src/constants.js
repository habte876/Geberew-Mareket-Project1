export const CROPS = [
  { slug: "corn", name: "Corn", nameAm: "በቆሎ", icon: "🌽", imageUrl: "https://plus.unsplash.com/premium_photo-1667047165840-803e47970128" },
  { slug: "rice", name: "Rice", nameAm: "ሩዝ", icon: "🍚", imageUrl: "https://images.unsplash.com/photo-1728895604559-a4e16081504e" },
  { slug: "wheat", name: "Wheat", nameAm: "ስንዴ", icon: "🌾", imageUrl: "https://images.unsplash.com/photo-1529511582893-2d7e684dd128" },
  { slug: "teff", name: "Teff", nameAm: "ጤፍ", icon: "🌿", imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/The_Teff_Harvest%2C_Northern_Ethiopia_%283131617016%29.jpg/960px-The_Teff_Harvest%2C_Northern_Ethiopia_%283131617016%29.jpg" },
  { slug: "potatoes", name: "Potatoes", nameAm: "ድንች", icon: "🥔", imageUrl: "https://plus.unsplash.com/premium_photo-1675365779531-031dfdcdf947" },
  { slug: "tomatoes", name: "Tomatoes", nameAm: "ቲማቲም", icon: "🍅", imageUrl: "https://images.unsplash.com/photo-1686278895718-26a2331d7297" },
  { slug: "berbere", name: "Berbere", nameAm: "በርበሬ", icon: "🌶️", imageUrl: "https://images.unsplash.com/photo-1622993361024-ae1c39cda16c" },
  { slug: "onions", name: "Onions", nameAm: "ሽንኩርት", icon: "🧅", imageUrl: "https://plus.unsplash.com/premium_photo-1668076517573-fa01307d87ad" },
  { slug: "garlic", name: "Garlic", nameAm: "ነጭ ሽንኩርት", icon: "🧄", imageUrl: "https://plus.unsplash.com/premium_photo-1675731118551-79b3da05a5d4" },
  { slug: "coffee", name: "Coffee", nameAm: "ቡና", icon: "☕", imageUrl: "https://plus.unsplash.com/premium_photo-1671399374947-feee46d4388a" },
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
