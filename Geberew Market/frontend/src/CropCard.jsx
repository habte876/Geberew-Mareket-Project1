const GRADIENTS = {
  corn: "from-amber-700/80 to-yellow-500/40",
  rice: "from-stone-400/40 to-emerald-700/40",
  wheat: "from-yellow-700/50 to-amber-300/30",
  teff: "from-lime-900/70 to-stone-700/40",
  potatoes: "from-amber-900/60 to-yellow-800/30",
  tomatoes: "from-red-800/70 to-orange-600/30",
  berbere: "from-red-900/80 to-orange-700/40",
  onions: "from-purple-900/50 to-rose-700/30",
  garlic: "from-slate-300/20 to-lime-800/30",
  coffee: "from-amber-950/80 to-yellow-800/40",
};

export default function CropCard({ crop, lang, onDetail, actionLabel }) {
  const name = lang === "am" ? crop.nameAm : crop.name;
  return (
    <article className={`card-glass overflow-hidden bg-gradient-to-br ${GRADIENTS[crop.slug] || "from-leaf/30 to-soil-800"}`}>
      <div className="p-6">
        <p className="text-4xl">{crop.icon}</p>
        <h3 className="mt-4 font-display text-2xl">{name}</h3>
        {crop.samplePrice ? (
          <p className="mt-2 text-sm text-cream/70">~ {Number(crop.samplePrice).toLocaleString()} ETB / kuntal</p>
        ) : null}
        <button className="btn-gold mt-6" onClick={() => onDetail(crop)}>
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
