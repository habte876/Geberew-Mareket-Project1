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

  if (!data) return <p className="text-cream/60">Loading…</p>;
  const cropName = lang === "am" ? data.crop.nameAm : data.crop.name;

  return (
    <div>
      <p className="text-sm text-cream/50">
        <Link className="text-gold-400" to="/">{t("breadcrumbHome")}</Link>
        {" / "}
        {cropName}
      </p>
      <p className="mt-3 text-sm uppercase tracking-[0.25em] text-gold-400">{data.crop.icon} {cropName}</p>
      <h1 className="mt-2 font-display text-4xl">{t("citySelect")}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {data.cities.map((city) => (
          <article key={city.slug} className="card-glass p-6">
            <h2 className="font-display text-2xl">{lang === "am" ? city.nameAm : city.name}</h2>
            <p className="mt-2 text-sm text-cream/60">
              {t("todayRange")}: {city.reference.min.toLocaleString()} – {city.reference.max.toLocaleString()} {t("etb")}
            </p>
            <button className="btn-gold mt-5" onClick={() => navigate(`/crops/${crop}/cities/${city.slug}`)}>
              {t("viewDetail")}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
