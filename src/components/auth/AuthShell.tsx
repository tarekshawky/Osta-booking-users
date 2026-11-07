"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, CalendarCheck, Home, MessageCircle, ShieldCheck, Tag } from "lucide-react";
import { SiteLogo } from "@/components/SiteLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BrandArt } from "@/components/auth/BrandArt";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { whatsappHref } from "@/lib/site";
import type { TranslationKey } from "@/lib/i18n";

export const HOME_URL = "https://www.ostaservices.com/";

const FEATURES: { icon: typeof BadgeCheck; key: TranslationKey }[] = [
  { icon: BadgeCheck, key: "auth.featTechnicians" },
  { icon: CalendarCheck, key: "auth.featBooking" },
  { icon: Tag, key: "auth.featPricing" },
  { icon: ShieldCheck, key: "auth.featWarranty" },
];

// 971568676036 -> 0568676036, the way customers dial it inside the UAE.
const localNumber = (whatsapp: string) => (whatsapp.startsWith("971") ? `0${whatsapp.slice(3)}` : whatsapp);

// The frame of every customer sign-in page: logo, language switch and Back to Home on top, the page's own content in the middle,
// support and legal links underneath, and (on large screens) the brand panel. The columns follow the page direction, so in Arabic
// the whole layout mirrors.
export function AuthShell({ children }: { children: ReactNode }) {
  const { t, lang } = useLanguage();
  const { settings, integrations } = useSite();
  const wa = settings.whatsapp ? whatsappHref(settings, lang) : "";

  return (
    <div className="auth-theme min-h-screen overflow-x-hidden text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1500px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ---- the form column ---- */}
        <div className="relative flex min-h-screen flex-col px-5 pb-6 pt-5 sm:px-10 lg:px-14">
          <header className="flex items-center justify-between gap-3">
            <a href={HOME_URL} className="auth-outline" aria-label={t("auth.backHome")}>
              <Home size={16} aria-hidden />
              {t("auth.backHome")}
            </a>
            <LanguageToggle />
          </header>

          <div className="mt-8 flex justify-center">
            <a href={HOME_URL} aria-label={t("auth.brand")} className="auth-glow-logo block [&_img]:!h-20 sm:[&_img]:!h-24 [&_img]:!max-w-[70vw]">
              <SiteLogo size="lg" />
            </a>
          </div>

          <main className="flex flex-1 items-center justify-center py-8">
            <div className="auth-rise w-full max-w-md">{children}</div>
          </main>

          {/* compact feature cards: phones and tablets (the brand panel shows them on large screens) */}
          <ul className="mb-6 grid grid-cols-2 gap-2.5 lg:hidden" aria-label={t("auth.brand")}>
            {FEATURES.map(({ icon: Icon, key }) => (
              <li key={key} className="auth-feature flex items-center gap-2.5 !p-2.5">
                <span className="auth-icon !h-9 !w-9 shrink-0"><Icon size={18} aria-hidden /></span>
                <span className="text-xs font-medium leading-tight text-[#d8ecff]">{t(key)}</span>
              </li>
            ))}
          </ul>

          <div className="mb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-sm text-[#91a5c7]">
            <span>{t("auth.needHelp")}</span>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="auth-link inline-flex items-center gap-1.5" dir="ltr">
                <MessageCircle size={16} aria-hidden />
                {t("auth.whatsappSupport")} {localNumber(settings.whatsapp)}
              </a>
            )}
            <Link href="/contact" className="auth-link">{t("auth.contactSupport")}</Link>
          </div>

          <footer className="flex flex-col items-center gap-2 border-t border-[rgba(145,165,199,0.18)] pt-4 text-xs text-[#7f93b8]">
            <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-5 gap-y-1">
              {integrations?.privacyUrl && <Link href={integrations.privacyUrl} className="hover:text-white">{t("auth.privacy")}</Link>}
              <Link href="/terms-conditions" className="hover:text-white">{t("auth.terms")}</Link>
              <Link href="/contact" className="hover:text-white">{t("auth.contact")}</Link>
            </nav>
            <p>{t("auth.rights")}</p>
          </footer>
        </div>

        {/* ---- the brand panel: large screens ---- */}
        <aside className="relative hidden overflow-hidden lg:block" aria-label={t("auth.brand")}>
          <BrandArt className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06132b] via-[#06132b]/55 to-[#06132b]/10" />
          <div className="auth-blob pointer-events-none absolute -start-24 top-10 h-80 w-80 rounded-full bg-[#087bff] opacity-25 blur-3xl" />
          <div className="auth-blob pointer-events-none absolute -end-10 bottom-1/3 h-72 w-72 rounded-full bg-[#31c7ff] opacity-15 blur-3xl" style={{ animationDelay: "-6s" }} />
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} aria-hidden className="auth-particle" style={{ left: `${(i * 37 + 8) % 92}%`, top: `${(i * 53 + 10) % 70}%`, width: i % 3 === 0 ? 5 : 3, height: i % 3 === 0 ? 5 : 3, animationDelay: `${(i % 7) * -1.3}s`, animationDuration: `${8 + (i % 5)}s` }} />
          ))}
          <div className="relative z-10 flex h-full flex-col justify-end gap-8 p-12 xl:p-16">
            <div className="auth-rise">
              <h2 className="text-4xl font-extrabold leading-tight xl:text-5xl">
                <span className="bg-gradient-to-r from-white via-[#bfe9ff] to-[#31c7ff] bg-clip-text text-transparent">{t("auth.heroTitle")}</span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#b9c9e4]">{t("auth.heroText")}</p>
            </div>
            <ul className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {FEATURES.map(({ icon: Icon, key }) => (
                <li key={key} className="auth-feature flex flex-col gap-3">
                  <span className="auth-icon"><Icon size={22} aria-hidden /></span>
                  <span className="text-sm font-semibold leading-snug text-white">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* floating WhatsApp: phones and tablets */}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={t("auth.whatsappSupport")} className="fixed bottom-4 end-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-6px_rgba(37,211,102,0.7)] transition-transform hover:scale-105 lg:hidden">
          <MessageCircle size={26} aria-hidden />
        </a>
      )}
    </div>
  );
}
