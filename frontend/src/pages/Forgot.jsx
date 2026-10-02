import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../LangContext";

const steps = ["request", "verify", "password", "complete"];

export default function Forgot() {
  const { t } = useLang();
  const [step, setStep] = useState("request");
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState("email");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (step === "request") {
        const data = await api("/api/auth/forgot-password", {
          method: "POST",
          body: { identifier, channel },
        });
        setStep("verify");
        setMessage(data.message);
      } else if (step === "verify") {
        const data = await api("/api/auth/verify-otp", {
          method: "POST",
          body: { identifier, code },
        });
        setResetToken(data.resetToken);
        setStep("password");
      } else if (step === "password") {
        await api("/api/auth/reset-password", {
          method: "POST",
          body: { token: resetToken, password, confirmPassword },
        });
        setResetToken("");
        setStep("complete");
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function requestAnotherCode() {
    setCode("");
    setError("");
    setMessage("");
    setStep("request");
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card-glass p-8">
        <h1 className="font-display text-3xl">{t(step === "request" ? "forgotTitle" : "resetTitle")}</h1>
        {step !== "complete" && (
          <ol className="mt-5 flex gap-2 text-xs text-cream/60" aria-label={t("passwordResetSteps")}>
            {steps.slice(0, 3).map((name, index) => (
              <li
                key={name}
                className={`flex-1 rounded-full border px-3 py-2 text-center ${
                  steps.indexOf(step) === index
                    ? "border-gold-500 text-gold-400"
                    : "border-white/10"
                }`}
                aria-current={steps.indexOf(step) === index ? "step" : undefined}
              >
                {t(`${name}Step`)}
              </li>
            ))}
          </ol>
        )}

        {step === "complete" ? (
          <div className="mt-6 space-y-4" role="status">
            <p className="text-sm text-leaf">{t("passwordUpdated")}</p>
            <Link className="btn-gold w-full" to="/login">{t("returnToLogin")}</Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {step === "request" && (
              <>
                <label className="sr-only" htmlFor="reset-identifier">{t("identifier")}</label>
                <input
                  id="reset-identifier"
                  className="field"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder={t("identifier")}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />
                <p className="text-sm text-cream/60">{t("resetVia")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {["email", "sms"].map((option) => (
                    <button
                      type="button"
                      key={option}
                      aria-pressed={channel === option}
                      className={`btn-ghost ${channel === option ? "border-gold-500 text-gold-400" : ""}`}
                      onClick={() => setChannel(option)}
                    >
                      {t(option)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "verify" && (
              <>
                <p className="text-sm text-cream/70" role="status">{message}</p>
                <label className="sr-only" htmlFor="reset-code">{t("otpCode")}</label>
                <input
                  id="reset-code"
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
                <p className="text-sm text-cream/60">{t("otpInstructions")}</p>
              </>
            )}

            {step === "password" && (
              <>
                <label className="sr-only" htmlFor="new-password">{t("newPassword")}</label>
                <input
                  id="new-password"
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  placeholder={t("newPassword")}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <label className="sr-only" htmlFor="confirm-new-password">{t("confirmPassword")}</label>
                <input
                  id="confirm-new-password"
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  placeholder={t("confirmPassword")}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </>
            )}

            {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
            {step === "verify" && (
              <button className="btn-ghost w-full" type="button" onClick={requestAnotherCode}>
                {t("requestAnotherCode")}
              </button>
            )}
            <button className="btn-gold w-full" type="submit" disabled={busy}>
              {busy
                ? t("working")
                : step === "request"
                  ? t("sendReset")
                  : step === "verify"
                    ? t("verifyCode")
                    : t("save")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
