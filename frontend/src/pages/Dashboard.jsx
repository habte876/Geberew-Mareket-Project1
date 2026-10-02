import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { cityLabel, cropLabel } from "../catalog";

function fill(template, vars) {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), template);
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/api/dashboard").then(setData);
  }, []);

  if (!data) return <p className="text-cream/60">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">{t("dashboard")}</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-glass p-6">
          <p className="text-sm text-cream/50">{t("stars")}</p>
          <p className="mt-2 font-display text-5xl text-gold-400">{data.starCount}</p>
        </div>
        <div className="card-glass p-6">
          <p className="text-sm text-cream/50">{t("listings")}</p>
          <p className="mt-2 font-display text-5xl">{data.posts.length}</p>
        </div>
        <div className="card-glass p-6">
          <p className="text-sm text-cream/50">{t(user.role)}</p>
          <p className="mt-2 text-cream/70">{user.fullName}</p>
          <p className="text-sm text-cream/40">{cityLabel(user.city, lang)}</p>
        </div>
      </div>

      <section className="card-glass p-6">
        <h2 className="font-display text-2xl">{t("starredBy")}</h2>
        <div className="mt-4 space-y-3">
          {data.starredBy.length === 0 && <p className="text-cream/50">{t("empty")}</p>}
          {data.starredBy.map((p) => (
            <div key={p.id + p.at} className="flex items-center justify-between gap-3 border-b border-white/5 py-2">
              <div>
                <p>{p.fullName}</p>
                <p className="text-sm text-cream/50">{p.phone} · {cityLabel(p.city, lang)} · {t(p.role)}</p>
              </div>
              <p className="text-gold-400">★</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card-glass p-6">
        <h2 className="font-display text-2xl">{t("listings")}</h2>
        <div className="mt-4 space-y-2">
          {data.posts.length === 0 && <p className="text-cream/50">{t("empty")}</p>}
          {data.posts.map((p) => (
            <p key={p.id} className="text-cream/80">
              {cropLabel(p.crop, lang)} · {cityLabel(p.city, lang)} · {Number(p.value).toLocaleString()}{" "}
              {user.role === "farmer" ? t("kuntal") : t("etb")}
            </p>
          ))}
        </div>
        <Link className="btn-gold mt-4 inline-flex" to="/submit">{t("goSubmit")}</Link>
      </section>

      <section className="card-glass p-6">
        <h2 className="font-display text-2xl">{t("pulse")}</h2>
        <p className="mt-1 text-sm text-cream/50">
          {user.role === "farmer" ? t("merchantsTitle") : t("farmersTitle")}
        </p>
        <div className="mt-4 space-y-3">
          {data.marketPulse.map((p) => (
            <div key={`${p.id}-${p.crop}`} className="flex justify-between text-sm">
              <span>{p.fullName} · {cropLabel(p.crop, lang)} · {cityLabel(p.city, lang)}</span>
              <span className="text-gold-400">
                {p.extra} {user.role === "farmer" ? t("etb") : t("kuntal")}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card-glass p-6">
        <h2 className="font-display text-2xl">{t("activity")}</h2>
        <div className="mt-4 space-y-2 text-sm text-cream/70">
          {data.activity.map((a, i) => (
            <p key={i}>
              {a.type === "listing" &&
                fill(t("postedListing"), { value: a.value, crop: cropLabel(a.crop, lang), city: cityLabel(a.city, lang) })}
              {a.type === "offer" &&
                fill(t("postedOffer"), { value: a.value, crop: cropLabel(a.crop, lang), city: cityLabel(a.city, lang) })}
              {a.type === "star_received" && fill(t("starredByLine"), { name: a.from })}
              {a.type === "star_given" && fill(t("youStarred"), { name: a.to })}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
