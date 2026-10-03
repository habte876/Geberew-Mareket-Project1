import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useLang } from "./LangContext";

export default function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const { t } = useLang();
  const location = useLocation();
  if (!ready) return <p className="text-cream/60">{t("loading")}</p>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}
