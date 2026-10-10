"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label="Switch language"
      className="flex items-center gap-1 rounded-full border border-card-border px-2.5 py-1.5 text-xs font-medium text-text-muted"
    >
      <Languages size={14} />
      {lang === "en" ? "العربية" : "English"}
    </button>
  );
}
