import { createContext, useContext, useMemo, useState } from "react";
import { t } from "./i18n";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("geberewu_lang") || "en");
  const value = useMemo(
    () => ({
      lang,
      setLang: (next) => {
        localStorage.setItem("geberewu_lang", next);
        setLang(next);
      },
      t: (key) => t(lang, key),
    }),
    [lang]
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
