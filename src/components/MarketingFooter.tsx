"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/lib/nav";
import { SiteLogo } from "./SiteLogo";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { telHref, whatsappHref } from "@/lib/site";
import { OPEN_CONSENT_EVENT } from "@/components/ConsentManager";
import { WhatsAppPopup } from "@/components/WhatsAppPopup";
import { BodyCodeSlot } from "@/components/CodeInjection";

const SOCIAL_BADGE: Record<string, string> = { facebook: "f", instagram: "ig", linkedin: "in", tiktok: "tt", youtube: "yt", x: "X", whatsapp: "wa" };

const FOOT_LINK = "transition-colors hover:text-accent-2 hover:underline underline-offset-4";
const FOOT_ACTIVE = "!text-accent-2 font-medium";

export function MarketingFooter() {
  const { t, lang } = useLanguage();
  const pathname = usePathname();
  const { settings, menus, social, integrations, serviceAreas } = useSite();
  const hasTracking = !!(integrations?.requireConsent && (integrations.gtmId || integrations.ga4Id || integrations.metaPixelId));
  const year = new Date().getFullYear();
  const ar = lang === "ar";
  const pick = (en: string, arText: string) => (ar ? arText || en : en || arText);

  return (
    <>
    <footer className="border-t border-card-border bg-bg-elevated">
      {/* Floating WhatsApp chat on every public page (controlled in Site & Contact). */}
      <WhatsAppPopup />
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <SiteLogo size="xl" />
          <p className="mt-3 text-sm text-text-muted">{pick(settings.taglineEn, settings.taglineAr)}</p>
          {social.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {social.map((s) => {
                const name = s.label || s.platform;
                return (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name} className="flex h-9 min-w-9 items-center justify-center rounded-full border border-card-border px-2 text-xs font-bold uppercase text-text-muted transition-colors hover:border-accent hover:text-accent-2">
                      {SOCIAL_BADGE[s.platform] ?? name.slice(0, 2)}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-text">{t("footer.quickLinks")}</h3>
          <ul className="flex flex-col gap-2 text-sm text-text-muted">
            {menus.footer.filter((m) => m.showDesktop || m.showMobile).map((m) => (
              <li key={m.url + m.labelEn}>
                {m.url.startsWith("/") && !m.newTab ? (
                  <Link href={m.url} className={`${FOOT_LINK} ${isActivePath(pathname, m.url) ? FOOT_ACTIVE : ""}`} {...(isActivePath(pathname, m.url) ? { "aria-current": "page" as const } : {})}>{pick(m.labelEn, m.labelAr)}</Link>
                ) : (
                  <a href={m.url} className={FOOT_LINK} {...(m.newTab || m.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{pick(m.labelEn, m.labelAr)}</a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-text">{t("footer.getInTouch")}</h3>
          <ul className="flex flex-col gap-2 text-sm text-text-muted">
            {settings.whatsapp && (
              <li>
                <a href={whatsappHref(settings, lang)} target="_blank" rel="noopener noreferrer" className={FOOT_LINK}>
                  WhatsApp: <span dir="ltr">{settings.phone || `+${settings.whatsapp}`}</span>
                </a>
              </li>
            )}
            {settings.phone && !settings.whatsapp && (
              <li><a href={telHref(settings.phone)} className={FOOT_LINK} dir="ltr">{settings.phone}</a></li>
            )}
            {settings.email && <li><a href={`mailto:${settings.email}`} className={FOOT_LINK}>{settings.email}</a></li>}
            {pick(settings.addressEn, settings.addressAr) && <li className="whitespace-pre-line">{pick(settings.addressEn, settings.addressAr)}</li>}
            {pick(settings.hoursEn, settings.hoursAr) && <li>{pick(settings.hoursEn, settings.hoursAr)}</li>}
            <li><Link href="/contact" className={`${FOOT_LINK} ${isActivePath(pathname, "/contact") ? FOOT_ACTIVE : ""}`}>{t("nav.contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-text">{t("footer.areasWeCover")}</h3>
          <p className="text-sm text-text-muted">{(serviceAreas.length ? serviceAreas.map((a) => pick(a.nameEn, a.nameAr)) : settings.footerAreas.map((a) => pick(a.en, a.ar))).join(" · ")}</p>
        </div>
      </div>

      <div className="border-t border-card-border px-5 py-5 text-center text-xs text-text-faint">
        <a href="https://tarekshawky.vercel.app" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent-2 hover:underline">
          © {year} {pick(settings.siteNameEn, settings.siteNameAr)}. {pick(settings.copyrightEn, settings.copyrightAr)}
        </a>
        {hasTracking && (
          <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className="ms-3 underline hover:text-text">
            {ar ? "إعدادات ملفات تعريف الارتباط" : "Cookie settings"}
          </button>
        )}
      </div>
    </footer>
    <BodyCodeSlot />
    </>
  );
}
