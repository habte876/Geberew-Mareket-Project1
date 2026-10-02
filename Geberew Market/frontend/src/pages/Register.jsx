import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { CITIES } from "../catalog";

export default function Register() {
  const { t, lang } = useLang();
  const { setSession } = useAuth();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    identifier: "",
    password: "",
    confirmPassword: "",
    role: "farmer",
    city: "bahir-dar",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/catalog").then((d) => setCities(d.cities)).catch(() => setCities(CITIES));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/register", { method: "POST", body: form });
      setSession(data.token, data.user);
      navigate(next);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card-glass p-8">
        <h1 className="font-display text-3xl">{t("register")}</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input className="field" placeholder={t("fullName")} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input className="field" placeholder={t("identifier")} value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
          <input className="field" type="password" placeholder={t("password")} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className="field" type="password" placeholder={t("confirmPassword")} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            {["farmer", "merchant"].map((role) => (
              <button type="button" key={role} className={`btn-ghost ${form.role === role ? "border-gold-500 text-gold-400" : ""}`} onClick={() => setForm({ ...form, role })}>
                {t(role)}
              </button>
            ))}
          </div>
          <select className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {lang === "am" ? c.nameAm : c.name}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="btn-gold w-full" type="submit">{t("register")}</button>
        </form>
        <p className="mt-6 text-sm text-cream/60">
          {t("haveAccount")} <Link className="text-gold-400" to="/login">{t("login")}</Link>
        </p>
      </div>
    </div>
  );
}
