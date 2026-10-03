import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../LangContext";

export default function CropCities() {
  const { crop } = useParams();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api(`/api/catalog/${crop}/cities`).then(setData).catch(() => setData(null));
  }, [crop]);

  if (!data) return <p className="text-cream/60">{t("loading")}</p>;
  const cropName = lang === "am" ? data.crop.nameAm : data.crop.name;
  const imageUrl = data.crop.imageUrl.includes("unsplash.com/")
    ? `${data.crop.imageUrl}?auto=format&fit=crop&w=1500&q=85`
    : data.crop.imageUrl;

  return (
    <div>
      <p className="text-sm text-cream/50">
        <Link className="text-gold-400" to="/">{t("breadcrumbHome")}</Link>
        {" / "}
        {cropName}
      </p>
      <section className="relative mt-6 flex min-h-64 items-end overflow-hidden rounded-[1.75rem] border border-white/10 bg-soil-800 p-7 sm:min-h-80 sm:p-10">
        <img src={imageUrl} alt={t("cropHarvestAlt", { crop: cropName })} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-soil-950/90 via-soil-950/55 to-soil-950/10" />
        <div className="relative max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-gold-400">{data.crop.icon} {cropName}</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">{t("citySelect")}</h1>
          <p className="mt-3 max-w-xl text-cream/75">{t("cropCityIntro", { crop: cropName })}</p>
        </div>
      </section>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {data.cities.map((city) => (
          <article key={city.slug} className="card-glass flex items-center justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.17em] text-cream/45">{t("cityMarket")}</p>
              <h2 className="mt-1 font-display text-2xl">{lang === "am" ? city.nameAm : city.name}</h2>
              <p className="mt-2 text-sm text-cream/60">
                {t("todayRange")}: <span className="text-gold-400">{city.reference.min.toLocaleString()} – {city.reference.max.toLocaleString()} {t("etb")}</span>
              </p>
            </div>
            <button className="btn-ghost shrink-0 !px-4" onClick={() => navigate(`/crops/${crop}/cities/${city.slug}`)}>
              {t("viewDetail")} <span className="ml-2" aria-hidden="true">↗</span>
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
