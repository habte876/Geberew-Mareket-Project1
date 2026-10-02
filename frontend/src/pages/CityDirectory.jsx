import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { cityLabel, cropLabel } from "../catalog";

function Avatar({ user }) {
  if (user.profilePic) {
    return <img src={user.profilePic} alt="" className="h-14 w-14 rounded-2xl object-cover" />;
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

  if (!data) return <p className="text-cream/60">Loading…</p>;
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
      <h1 className="mt-2 font-display text-4xl">{title}</h1>
      <p className="mt-2 text-cream/60">{cropName} · {cityName}</p>
      <div className="mt-8 space-y-4">
        {data.items.length === 0 && (
          <div className="card-glass p-6">
            <p className="text-cream/50">{t("empty")}</p>
            <Link className="btn-gold mt-4 inline-flex" to="/submit">{t("goSubmit")}</Link>
          </div>
        )}
        {data.items.map((item) => (
          <article key={item.id} className="card-glass flex items-center gap-4 p-5">
            <Avatar user={item} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-xl">{item.fullName}</h2>
              <p className="text-sm text-cream/60">{t("phone")}: {item.phone || "—"}</p>
              {item.priceEtb != null && (
                <p className="text-sm text-gold-400">{item.priceEtb.toLocaleString()} {t("etb")} / {t("kuntal")}</p>
              )}
              {item.amountKuntal != null && (
                <p className="text-sm text-gold-400">{item.amountKuntal} {t("kuntal")}</p>
              )}
              <p className="text-xs text-cream/40">{cityLabel(item.city, lang)} · {cropLabel(crop, lang)}</p>
            </div>
            <button
              className={`text-3xl ${item.starred ? "text-gold-400" : "text-cream/25"}`}
              onClick={() => toggleStar(item.id)}
              aria-label={t("star")}
            >
              ★
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
