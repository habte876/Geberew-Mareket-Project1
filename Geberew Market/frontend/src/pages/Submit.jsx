import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { CITIES, CROPS } from "../catalog";

export default function Submit() {
  const { user, refresh } = useAuth();
  const { t, lang } = useLang();
  const [crops, setCrops] = useState([]);
  const [cities, setCities] = useState([]);
  const [crop, setCrop] = useState("teff");
  const [amountKuntal, setAmount] = useState("");
  const [priceEtb, setPrice] = useState("");
  const [city, setCity] = useState(user?.city || "bahir-dar");
  const [ref, setRef] = useState(null);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/catalog").then((d) => {
      setCrops(d.crops);
      setCities(d.cities);
    }).catch(() => {
      setCrops(CROPS);
      setCities(CITIES);
    });
  }, []);

  useEffect(() => {
    if (user?.role !== "merchant") return;
    api(`/api/submissions/reference?crop=${crop}&city=${city}`)
      .then(setRef)
      .catch(() => setRef(null));
  }, [crop, city, user]);

  async function savePhone(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/auth/profile", { method: "PUT", body: { phone } });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      if (user.role === "farmer") {
        await api("/api/submissions/farmer", { method: "POST", body: { crop, amountKuntal } });
        setMessage("Posted.");
      } else {
        await api("/api/submissions/merchant", { method: "POST", body: { crop, priceEtb, city } });
        setMessage("Posted.");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user?.phone) {
    return (
      <div className="mx-auto max-w-lg card-glass p-8">
        <h1 className="font-display text-3xl">{t("needPhone")}</h1>
        <form className="mt-6 space-y-4" onSubmit={savePhone}>
          <input className="field" placeholder={t("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="btn-gold">{t("addPhone")}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card-glass p-8">
        <h1 className="font-display text-3xl">{user.role === "farmer" ? t("farmerSubmit") : t("merchantSubmit")}</h1>
        <p className="mt-2 text-cream/60">{user.role === "farmer" ? t("submitFarmerHint") : t("submitMerchantHint")}</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <select className="field" value={crop} onChange={(e) => setCrop(e.target.value)}>
            {crops.map((c) => (
              <option key={c.slug} value={c.slug}>
                {lang === "am" ? c.nameAm : c.name}
              </option>
            ))}
          </select>
          {user.role === "farmer" ? (
            <input className="field" type="number" min="0.1" step="0.1" placeholder={t("amount")} value={amountKuntal} onChange={(e) => setAmount(e.target.value)} />
          ) : (
            <>
              <select className="field" value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {lang === "am" ? c.nameAm : c.name}
                  </option>
                ))}
              </select>
              {ref && (
                <p className="text-sm text-gold-400">
                  {t("todayRange")}: {ref.min.toLocaleString()} – {ref.max.toLocaleString()} {t("etb")}. {t("referenceNote")}
                </p>
              )}
              <input className="field" type="number" min="1" step="1" placeholder={t("price")} value={priceEtb} onChange={(e) => setPrice(e.target.value)} />
            </>
          )}
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-leaf">{message}</p>}
          <button className="btn-gold w-full" type="submit">{t("submit")}</button>
        </form>
      </div>
    </div>
  );
}
