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
  const initialIdentifier = params.get("verify") || "";
  const next = params.get("next") || "/";
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [step, setStep] = useState(initialIdentifier ? "verify" : "register");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    identifier: initialIdentifier,
    password: "",
    confirmPassword: "",
    role: "farmer",
    city: "bahir-dar",
  });

  useEffect(() => {
    api("/api/catalog").then((data) => setCities(data.cities)).catch(() => setCities(CITIES));
  }, []);

  useEffect(() => {
    if (initialIdentifier) void resendCode();
  }, [initialIdentifier]);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (step === "register") {
        const data = await api("/api/auth/register", { method: "POST", body: form });
        setMessage(data.message);
        setStep("verify");
      } else {
        const data = await api("/api/auth/verify-account", {
          method: "POST",
          body: { identifier: form.identifier, code },
        });
        setSession(data.token, data.user);
        navigate(next);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setError("");
    setBusy(true);
    try {
      const data = await api("/api/auth/resend-verification", {
        method: "POST",
        body: { identifier: form.identifier },
      });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card-glass p-8">
        <h1 className="font-display text-3xl">{t(step === "register" ? "register" : "verifyAccountTitle")}</h1>
        {step === "verify" ? (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <p className="text-sm text-cream/70" role="status">{message}</p>
            <p className="text-sm text-cream/60">{form.identifier}</p>
            <label className="sr-only" htmlFor="account-verification-code">{t("otpCode")}</label>
            <input
              id="account-verification-code"
              className="field text-center tracking-[0.4em]"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              placeholder={t("otpCode")}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
            <button className="btn-gold w-full" type="submit" disabled={busy}>
              {busy ? t("working") : t("verifyAccount")}
            </button>
            <button className="btn-ghost w-full" type="button" disabled={busy} onClick={resendCode}>
              {t("resendCode")}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="register-name">{t("fullName")}</label>
            <input
              id="register-name"
              className="field"
              autoComplete="name"
              required
              placeholder={t("fullName")}
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            />
            <label className="sr-only" htmlFor="register-identifier">{t("identifier")}</label>
            <input
              id="register-identifier"
              className="field"
              autoComplete="username"
              required
              placeholder={t("identifier")}
              value={form.identifier}
              onChange={(event) => setForm({ ...form, identifier: event.target.value })}
            />
            <label className="sr-only" htmlFor="register-password">{t("password")}</label>
            <input
              id="register-password"
              className="field"
              type="password"
              autoComplete="new-password"
              required
              placeholder={t("password")}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <label className="sr-only" htmlFor="register-confirm-password">{t("confirmPassword")}</label>
            <input
              id="register-confirm-password"
              className="field"
              type="password"
              autoComplete="new-password"
              required
              placeholder={t("confirmPassword")}
              value={form.confirmPassword}
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              {["farmer", "merchant"].map((role) => (
                <button
                  type="button"
                  key={role}
                  aria-pressed={form.role === role}
                  className={`btn-ghost ${form.role === role ? "border-gold-500 text-gold-400" : ""}`}
                  onClick={() => setForm({ ...form, role })}
                >
                  {t(role)}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="register-city">{t("city")}</label>
            <select id="register-city" className="field" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>
              {cities.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {lang === "am" ? city.nameAm : city.name}
                </option>
              ))}
            </select>
            {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
            <button className="btn-gold w-full" type="submit" disabled={busy}>
              {busy ? t("working") : t("register")}
            </button>
          </form>
        )}
        {step === "register" && (
          <p className="mt-6 text-sm text-cream/60">
            {t("haveAccount")} <Link className="text-gold-400" to="/login">{t("login")}</Link>
          </p>
        )}
      </div>
    </div>
  );
}
