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
    <div>
      <section className="mb-12 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-gold-400">{t("welcome")}</p>
          <h1 className="font-display text-4xl leading-tight md:text-6xl">{t("brand")}</h1>
          <p className="mt-4 max-w-xl text-lg text-cream/70">{t("tagline")}</p>
          <p className="mt-3 max-w-xl text-cream/50">{t("lazyHint")}</p>
        </div>
        <div className="card-glass p-6">
          <p className="text-cream/80">{t("cropIntro")}</p>
        </div>
      </section>
      <h2 className="mb-6 font-display text-3xl">{t("crops")}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {crops.map((crop) => (
          <CropCard key={crop.slug} crop={crop} lang={lang} onDetail={openCrop} actionLabel={t("viewDetail")} />
        ))}
      </div>
      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {["stepBrowse", "stepCity", "stepMeet"].map((key, i) => (
          <div key={key} className="card-glass p-6">
            <p className="text-sm text-gold-400">0{i + 1}</p>
            <p className="mt-3 text-cream/80">{t(key)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
