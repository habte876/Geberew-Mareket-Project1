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

export function cropLabel(slug, lang) {
  const crop = CROPS.find((c) => c.slug === slug);
  if (!crop) return slug;
  return lang === "am" ? crop.nameAm : crop.name;
}

export function cityLabel(slug, lang) {
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) return slug;
  return lang === "am" ? city.nameAm : city.name;
}
