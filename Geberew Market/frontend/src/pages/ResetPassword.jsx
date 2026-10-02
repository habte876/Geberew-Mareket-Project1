import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../LangContext";

export default function ResetPassword() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/auth/reset", { method: "POST", body: { token, password, confirmPassword } });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card-glass p-8">
        <h1 className="font-display text-3xl">{t("resetTitle")}</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input className="field" type="password" placeholder={t("newPassword")} value={password} onChange={(e) => setPassword(e.target.value)} />
          <input className="field" type="password" placeholder={t("confirmPassword")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="btn-gold w-full" type="submit">{t("save")}</button>
        </form>
      </div>
    </div>
  );
}
