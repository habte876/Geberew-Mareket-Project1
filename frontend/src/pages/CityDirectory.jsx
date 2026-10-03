import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, assetUrl } from "../api";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { cityLabel, cropLabel } from "../catalog";

function Avatar({ user }) {
  if (user.profilePic) {
    return <img src={assetUrl(user.profilePic)} alt="" className="h-14 w-14 rounded-2xl object-cover" />;
  }
  return (
    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-500/20 font-display text-xl text-gold-400">
      {(user.fullName || "?").slice(0, 1)}
    </div>
  );
}

export default function CityDirectory() {
  const { crop, city } = useParams();
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [data, setData] = useState(null);

  async function load() {
    const next = await api(`/api/market/${crop}/${city}`);
    setData(next);
  }

  useEffect(() => {
    load().catch(() => setData(null));
  }, [crop, city]);

  async function toggleStar(id) {
    await api(`/api/favorites/${id}`, { method: "POST" });
    load();
  }

  if (!data) return <p className="text-cream/60">{t("loading")}</p>;
  const imageUrl = data.crop.imageUrl.includes("unsplash.com/")
    ? `${data.crop.imageUrl}?auto=format&fit=crop&w=1500&q=85`
    : data.crop.imageUrl;
  const cropName = lang === "am" ? data.crop.nameAm : data.crop.name;
  const cityName = lang === "am" ? data.city.nameAm : data.city.name;
  const title = user?.role === "farmer" ? t("merchantsTitle") : t("farmersTitle");

  return (
    <div>
      <p className="text-sm text-cream/50">
        <Link className="text-gold-400" to="/">{t("breadcrumbHome")}</Link>
        {" / "}
        <Link className="text-gold-400" to={`/crops/${crop}`}>{cropName}</Link>
        {" / "}
        {cityName}
      </p>
      <section className="relative mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-soil-800">
        <img
          src={imageUrl}
          alt={t("cropHarvestAlt", { crop: cropName })}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-soil-950/95 via-soil-950/75 to-soil-950/25" />
        <div className="relative max-w-2xl p-7 sm:p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-gold-400">{cropName} · {cityName}</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-3 text-cream/70">
            {t(user?.role === "farmer" ? "directoryMerchantIntro" : "directoryFarmerIntro", { crop: cropName, city: cityName })}
          </p>
        </div>
      </section>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {data.items.length === 0 && (
          <div className="card-glass p-6 lg:col-span-2">
            <p className="text-cream/50">{t("empty")}</p>
            <Link className="btn-gold mt-4 inline-flex" to="/submit">{t("goSubmit")}</Link>
          </div>
        )}
        {data.items.map((item) => (
          <article key={item.id} className="card-glass flex min-w-0 items-start gap-4 p-5 sm:gap-5 sm:p-6">
            <Avatar user={item} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-display text-xl">{item.fullName}</h2>
                <span className="rounded-full border border-leaf/40 bg-leaf/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-leaf">
                  {t(user?.role === "farmer" ? "merchant" : "farmer")}
                </span>
              </div>
              <p className="mt-1 text-sm text-cream/55">{cityLabel(item.city, lang)} · {t("phone")}: {item.phone || "—"}</p>
              {item.priceEtb != null && (
                <p className="mt-3 font-medium text-gold-400">{item.priceEtb.toLocaleString()} {t("etb")} <span className="text-cream/50">/ {t("quintal")}</span></p>
              )}
              {item.amountQuintal != null && (
                <p className="mt-3 font-medium text-gold-400">{t("amountAvailable", { amount: item.amountQuintal })}</p>
              )}
              <p className="mt-2 text-xs text-cream/40">{cropLabel(crop, lang)}</p>
            </div>
            <button
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${
                item.starred
                  ? "border-gold-500/45 bg-gold-500/15 text-gold-400"
                  : "border-white/10 text-cream/45 hover:border-gold-500/40 hover:text-gold-400"
              }`}
              onClick={() => toggleStar(item.id)}
              aria-label={t("star")}
              aria-pressed={item.starred}
            >
              <span className="text-xl" aria-hidden="true">★</span>
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
