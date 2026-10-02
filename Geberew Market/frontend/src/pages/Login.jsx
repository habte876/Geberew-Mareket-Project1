import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";

export default function Login() {
  const { t } = useLang();
  const { setSession } = useAuth();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", identifier: "", password: "" });
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/login", { method: "POST", body: form });
      setSession(data.token, data.user);
      navigate(next);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card-glass p-8">
        {next !== "/" && <p className="mb-4 text-sm text-gold-400">{t("loginForced")}</p>}
        <h1 className="font-display text-3xl">{t("login")}</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input className="field" placeholder={t("fullName")} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input className="field" placeholder={t("identifier")} value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
          <input className="field" type="password" placeholder={t("password")} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="btn-gold w-full" type="submit">{t("login")}</button>
        </form>
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link className="text-gold-400" to="/forgot">{t("forgot")}</Link>
          <Link className="text-cream/70" to={next !== "/" ? `/register?next=${encodeURIComponent(next)}` : "/register"}>{t("newHere")}</Link>
        </div>
      </div>
    </div>
  );
}
