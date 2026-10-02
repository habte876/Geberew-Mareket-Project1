import { useState } from "react";
import { api } from "../api";
import { useLang } from "../LangContext";

export default function Forgot() {
  const { t } = useLang();
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState("email");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setPreview(null);
    try {
      const data = await api("/api/auth/forgot", { method: "POST", body: { identifier, channel } });
      setMessage(data.message);
      setPreview(data.preview);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card-glass p-8">
        <h1 className="font-display text-3xl">{t("forgotTitle")}</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input className="field" placeholder={t("identifier")} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <p className="text-sm text-cream/60">{t("resetVia")}</p>
          <div className="grid grid-cols-2 gap-2">
            {["email", "sms"].map((c) => (
              <button type="button" key={c} className={`btn-ghost ${channel === c ? "border-gold-500 text-gold-400" : ""}`} onClick={() => setChannel(c)}>
                {t(c)}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-leaf">{message}</p>}
          {preview?.link && (
            <p className="break-all text-xs text-cream/50">
              Dev delivery: <a className="text-gold-400" href={preview.link}>{preview.link}</a>
            </p>
          )}
          <button className="btn-gold w-full" type="submit">{t("sendReset")}</button>
        </form>
      </div>
    </div>
  );
}
