"use client";

import { useLanguage } from "@/lib/language-context";

// Small inline flags (they draw the same on every device, unlike flag emoji which Windows does not show).
function UaeFlag() {
  return (
    <svg width="22" height="15" viewBox="0 0 22 15" aria-hidden className="shrink-0 rounded-[2px]">
      <rect width="22" height="5" fill="#009739" />
      <rect y="5" width="22" height="5" fill="#ffffff" />
      <rect y="10" width="22" height="5" fill="#111111" />
      <rect width="6" height="15" fill="#ce1126" />
    </svg>
  );
}

function UsaFlag() {
  return (
    <svg width="22" height="15" viewBox="0 0 22 15" aria-hidden className="shrink-0 rounded-[2px]">
      <rect width="22" height="15" fill="#ffffff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 15) / 13} width="22" height={15 / 13} fill="#b22234" />
      ))}
      <rect width="10" height="8.1" fill="#3c3b6e" />
      {[1.6, 4.1, 6.6, 9].flatMap((x, i) => [1.6, 4, 6.4].map((y) => <circle key={`${i}-${y}`} cx={x} cy={y} r="0.55" fill="#ffffff" />))}
    </svg>
  );
}

// Shows the language you would switch TO: the UAE flag for Arabic, the US flag for English.
export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
      title={lang === "en" ? "العربية" : "English"}
      className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-card-border px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-accent-2 hover:text-accent-2"
    >
      {lang === "en" ? <UaeFlag /> : <UsaFlag />}
      {lang === "en" ? "العربية" : "English"}
    </button>
  );
}
