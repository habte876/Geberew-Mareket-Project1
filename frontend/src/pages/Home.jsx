import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import CropCard from "../CropCard";
import { CROPS } from "../catalog";

export default function Home() {
  const [crops, setCrops] = useState([]);
  const { user } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    api("/api/catalog")
      .then((d) => setCrops(d.crops))
      .catch(() => setCrops(CROPS));
  }, []);

  function openCrop(crop) {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/crops/${crop.slug}`)}`);
      return;
    }
    navigate(`/crops/${crop.slug}`);
  }

  return (
    <div className="space-y-16 md:space-y-24">
      <section className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-soil-900/75 shadow-glow lg:min-h-[510px] lg:grid-cols-[1fr_0.9fr]">
        <div className="flex flex-col items-start justify-center p-7 sm:p-10 lg:p-14">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-gold-400">
            <span aria-hidden="true">✳</span> {t("welcome")}
          </p>
          <h1 className="max-w-xl font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            {lang === "am" ? t("brand") : <>{t("heroTitle")}<br /><span className="text-gold-400">{t("heroAccent")}</span></>}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-cream/70">{t("tagline")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="btn-gold" href="#crops">{t("exploreHarvest")} <span className="ml-2" aria-hidden="true">↓</span></a>
            {!user && <button className="btn-ghost" onClick={() => navigate("/register")}>{t("register")}</button>}
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-sm text-cream/55">
            <span><strong className="mr-2 text-gold-400">10</strong>{t("localCrops")}</span>
            <span><strong className="mr-2 text-gold-400">10</strong>{t("cityMarkets")}</span>
          </div>
        </div>
        <div className="relative min-h-[340px] lg:min-h-full">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=90"
            alt={t("heroImageAlt")}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-soil-950/75 via-soil-950/5 to-soil-950/10 lg:bg-gradient-to-r lg:from-soil-900/35 lg:via-transparent lg:to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-soil-950/55 p-5 backdrop-blur-md sm:bottom-8 sm:left-8 sm:right-8">
            <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t("fromLocalSoil")}</p>
            <p className="mt-2 font-display text-2xl text-white">{t("cropIntro")}</p>
          </div>
        </div>
      </section>
      <section id="crops" className="scroll-mt-28">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold-400">{t("harvestEyebrow")}</p>
            <h2 className="font-display text-4xl sm:text-5xl">{t("cropHeading")}</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-cream/50">{t("cropDescription")}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {crops.map((crop) => (
            <CropCard key={crop.slug} crop={crop} lang={lang} onDetail={openCrop} actionLabel={t("viewDetail")} t={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
