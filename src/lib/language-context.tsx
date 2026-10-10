"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Lang, TranslationKey, translate } from "./i18n";

const STORAGE_KEY = "osta_lang";
const COOKIE_KEY = "osta_lang";

function persistLang(next: Lang) {
  window.localStorage.setItem(STORAGE_KEY, next);
  document.cookie = `${COOKIE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
}

type LanguageState = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    Promise.resolve().then(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if ((stored === "ar" || stored === "en") && stored !== lang) {
        setLangState(stored);
      }
      // Keep the cookie in sync even if it was missing (e.g. an older localStorage-only visit).
      persistLang(stored === "ar" || stored === "en" ? stored : lang);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    persistLang(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "en" ? "ar" : "en";
      persistLang(next);
      return next;
    });
  }, []);

  const t = useCallback((key: TranslationKey) => translate(key, lang), [lang]);

  const value = useMemo(
    () => ({ lang, dir: (lang === "ar" ? "rtl" : "ltr") as "ltr" | "rtl", setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
