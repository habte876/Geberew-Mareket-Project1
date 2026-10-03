export default function CropCard({ crop, lang, onDetail, actionLabel, t }) {
  const name = lang === "am" ? crop.nameAm : crop.name;
  const imageUrl = crop.imageUrl.includes("unsplash.com/")
    ? `${crop.imageUrl}?auto=format&fit=crop&w=900&q=85`
    : crop.imageUrl;

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-soil-900/80 shadow-glow transition duration-300 hover:-translate-y-1 hover:border-gold-500/40">
      <div className="relative h-56 overflow-hidden bg-soil-800">
        <img
          src={imageUrl}
          alt={t("cropHarvestAlt", { crop: name })}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-soil-950 via-soil-950/10 to-transparent" />
        <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-soil-950/55 px-3 py-1.5 text-xs font-medium text-cream/90 backdrop-blur">
          {crop.icon} <span className="ml-1 uppercase tracking-[0.16em]">{t("localProduce")}</span>
        </span>
        <h3 className="absolute bottom-5 left-6 font-display text-3xl text-white">{name}</h3>
      </div>
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-cream/45">{t("marketReference")}</p>
          {crop.samplePrice ? (
            <p className="mt-1 text-sm text-gold-400">
              ~ {Number(crop.samplePrice).toLocaleString()} {t("etb")} <span className="text-cream/45">/ {t("quintal")}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-cream/65">{t("exploreCityPrices")}</p>
          )}
        </div>
        <button
          className="btn-gold shrink-0 !px-4"
          onClick={() => onDetail(crop)}
          aria-label={`${actionLabel}: ${name}`}
        >
          {actionLabel} <span className="ml-2" aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}
