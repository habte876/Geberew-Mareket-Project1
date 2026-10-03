import { useEffect, useState } from "react";
import { api, assetUrl } from "../api";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { cityLabel } from "../catalog";

export default function Profile() {
  const { user, setSession, refresh } = useAuth();
  const { t, lang } = useLang();
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/catalog").then((d) => setCities(d.cities));
  }, []);

  async function onSave(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await api("/api/auth/profile", { method: "PUT", body: form });
      const token = localStorage.getItem("geberewu_token");
      setSession(token, data.user);
      setMessage(t("saved"));
    } catch (err) {
      setError(err.message);
    }
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("photo", file);
    try {
      const data = await api("/api/auth/avatar", { method: "POST", body, isForm: true });
      const token = localStorage.getItem("geberewu_token");
      setSession(token, data.user);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <section className="card-glass p-8">
        <h1 className="font-display text-3xl">{t("profile")}</h1>
        <div className="mt-6 flex items-center gap-4">
          {user.profilePic ? (
            <img src={assetUrl(user.profilePic)} alt="" className="h-20 w-20 rounded-3xl object-cover" />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gold-500/20 font-display text-3xl text-gold-400">
              {user.fullName.slice(0, 1)}
            </div>
          )}
          <div>
            <p className="font-display text-2xl">{user.fullName}</p>
            <p className="text-cream/60">{t(user.role)}</p>
          </div>
        </div>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-white/10 py-2"><dt className="text-cream/50">{t("email")}</dt><dd>{user.email || "—"}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 py-2"><dt className="text-cream/50">{t("phone")}</dt><dd>{user.phone || "—"}</dd></div>
          <div className="flex justify-between gap-4 border-b border-white/10 py-2"><dt className="text-cream/50">{t("city")}</dt><dd>{cityLabel(user.city, lang)}</dd></div>
          <div className="flex justify-between gap-4 py-2"><dt className="text-cream/50">{t("password")}</dt><dd>{t("hiddenPassword")}</dd></div>
        </dl>
      </section>

      <section className="card-glass p-8">
        <h2 className="font-display text-3xl">{t("settings")}</h2>
        <label className="mt-4 block text-sm text-cream/60">{t("photo")}</label>
        <input className="mt-2 text-sm" type="file" accept="image/*" onChange={onPhoto} />
        <form className="mt-6 space-y-4" onSubmit={onSave}>
          <input className="field" placeholder={t("fullName")} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input className="field" placeholder={t("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" placeholder={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>{lang === "am" ? c.nameAm : c.name}</option>
            ))}
          </select>
          <p className="text-sm text-cream/50">{t("changePassword")}</p>
          <input className="field" type="password" placeholder={t("currentPassword")} value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          <input className="field" type="password" placeholder={t("newPassword")} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          <input className="field" type="password" placeholder={t("confirmPassword")} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-leaf">{message}</p>}
          <button className="btn-gold" type="submit">{t("save")}</button>
        </form>
      </section>
    </div>
  );
}
