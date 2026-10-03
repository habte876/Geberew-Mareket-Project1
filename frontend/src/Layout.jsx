import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useLang } from "./LangContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const submitLabel = user?.role === "farmer" ? t("farmerSubmit") : t("merchantSubmit");

  return (
    <div className="grain min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-soil-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-500 text-xl text-soil-950 shadow-glow">ገ</span>
            <div>
              <p className="font-display text-lg leading-none">{t("brand")}</p>
              <p className="text-xs text-cream/50">{t("taglineShort")}</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 md:gap-3">
            <Link className="hidden px-3 py-2 text-sm text-cream/65 transition hover:text-gold-400 sm:inline-flex" to="/#crops">
              {t("crops")}
            </Link>
            {user ? (
              <>
                <Link className="hidden px-3 py-2 text-sm text-cream/65 transition hover:text-gold-400 md:inline-flex" to="/dashboard">
                  {t("dashboard")}
                </Link>
                <NavLink className="btn-ghost hidden sm:inline-flex" to="/submit">
                  {submitLabel}
                </NavLink>
                <button className="btn-ghost hidden sm:inline-flex" onClick={() => { logout(); navigate("/"); }}>
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link className="btn-ghost" to={`/login?next=${encodeURIComponent(location.pathname)}`}>
                  {t("login")}
                </Link>
                <Link className="btn-gold" to="/register">
                  {t("register")}
                </Link>
              </>
            )}
            <button
              className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15"
              onClick={() => setOpen(true)}
              aria-label={t("menu")}
            >
              <span className="space-y-1.5">
                <span className="block h-0.5 w-5 bg-cream" />
                <span className="block h-0.5 w-5 bg-cream" />
                <span className="block h-0.5 w-4 bg-gold-500" />
              </span>
            </button>
          </nav>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setOpen(false)}>
          <aside
            className="h-full w-[min(100%,360px)] border-l border-white/10 bg-soil-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <p className="font-display text-xl">{t("menu")}</p>
              <button className="btn-ghost px-3 py-1" onClick={() => setOpen(false)}>
                {t("close")}
              </button>
            </div>
            <div className="space-y-3">
              {user ? (
                <>
                  <Link className="block rounded-2xl bg-white/5 px-4 py-3" to="/profile" onClick={() => setOpen(false)}>
                    {t("profile")}
                  </Link>
                  <Link className="block rounded-2xl bg-white/5 px-4 py-3" to="/submit" onClick={() => setOpen(false)}>
                    {submitLabel}
                  </Link>
                  <Link className="block rounded-2xl bg-white/5 px-4 py-3" to="/dashboard" onClick={() => setOpen(false)}>
                    {t("dashboard")}
                  </Link>
                  <button
                    className="block w-full rounded-2xl bg-white/5 px-4 py-3 text-left"
                    onClick={() => {
                      logout();
                      setOpen(false);
                      navigate("/");
                    }}
                  >
                    {t("logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link className="block rounded-2xl bg-white/5 px-4 py-3" to="/login" onClick={() => setOpen(false)}>
                    {t("login")}
                  </Link>
                  <Link className="block rounded-2xl bg-white/5 px-4 py-3" to="/register" onClick={() => setOpen(false)}>
                    {t("register")}
                  </Link>
                </>
              )}
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="mb-2 text-sm text-cream/60">{t("language")}</p>
                <div className="flex gap-2">
                  <button className={`btn-ghost ${lang === "en" ? "border-gold-500 text-gold-400" : ""}`} onClick={() => setLang("en")}>
                    {t("english")}
                  </button>
                  <button className={`btn-ghost ${lang === "am" ? "border-gold-500 text-gold-400" : ""}`} onClick={() => setLang("am")}>
                    {t("amharic")}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-cream/40">
        {t("brand")} · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
