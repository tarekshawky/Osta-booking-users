"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSite } from "@/lib/site-context";
import { useLanguage } from "@/lib/language-context";
import { allowed, CONSENT_CHANGED_EVENT, CONSENT_KEY, makeConsent, parseConsent, shouldAskConsent, type Consent } from "@/lib/consent";
import { configureTracking, track } from "@/lib/analytics";

type W = { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: ((...a: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown } };
const loaded = new Set<string>();

function inject(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

// The IDs were validated by the admin (exact provider formats), and are URL-encoded here as well.
function loadGtm(id: string) {
  if (loaded.has("gtm")) return;
  loaded.add("gtm");
  const w = window as unknown as W;
  (w.dataLayer = w.dataLayer || []).push({ "gtm.start": Date.now(), event: "gtm.js" });
  inject(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`);
}
function loadGa4(id: string) {
  if (loaded.has("ga4")) return;
  loaded.add("ga4");
  const w = window as unknown as W;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () {
    // gtag must push the real `arguments` object
    // eslint-disable-next-line prefer-rest-params
    (w.dataLayer as unknown[]).push(arguments);
  };
  inject(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  w.gtag("js", new Date());
  w.gtag("config", id);
}
function loadPixel(id: string) {
  if (loaded.has("pixel")) return;
  loaded.add("pixel");
  const w = window as unknown as W;
  const n = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else (n.queue as unknown[]).push(args);
  } as NonNullable<W["fbq"]>;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  w.fbq = n;
  inject("https://connect.facebook.net/en_US/fbevents.js");
  n("init", id);
  n("track", "PageView");
}

const TEXT = {
  en: {
    msg: "We use cookies to understand how the site is used and to improve our marketing. You choose what we may use.",
    acceptAll: "Accept all", reject: "Reject non-essential", customize: "Customize", save: "Save choices", privacy: "Privacy policy",
    analytics: "Analytics", analyticsHint: "Helps us see which pages and services people use.",
    marketing: "Marketing", marketingHint: "Lets us measure our ads and reach people who visited.",
    essential: "Essential", essentialHint: "Needed for the site to work. Always on.",
    settings: "Cookie settings",
  },
  ar: {
    msg: "نستخدم ملفات تعريف الارتباط لفهم كيفية استخدام الموقع وتحسين تسويقنا. أنت من يختار ما نستخدمه.",
    acceptAll: "قبول الكل", reject: "رفض غير الضروري", customize: "تخصيص", save: "حفظ الاختيارات", privacy: "سياسة الخصوصية",
    analytics: "التحليلات", analyticsHint: "تساعدنا على معرفة الصفحات والخدمات التي يستخدمها الناس.",
    marketing: "التسويق", marketingHint: "تتيح لنا قياس إعلاناتنا والوصول لمن زار الموقع.",
    essential: "أساسية", essentialHint: "ضرورية لعمل الموقع. مفعّلة دائماً.",
    settings: "إعدادات ملفات تعريف الارتباط",
  },
} as const;

export const OPEN_CONSENT_EVENT = "osta:open-consent";

export function ConsentManager() {
  const { integrations } = useSite();
  const { lang } = useLanguage();
  const pathname = usePathname();
  const t = TEXT[lang];
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [draftMarketing, setDraftMarketing] = useState(false);

  const cfg = useMemo(
    () => ({
      gtm: !!integrations?.gtmId, ga4: !!integrations?.ga4Id, pixel: !!integrations?.metaPixelId, requireConsent: integrations?.requireConsent ?? true,
    }),
    [integrations]
  );
  const needs = useMemo(() => ({ analytics: cfg.gtm || cfg.ga4, marketing: cfg.pixel }), [cfg]);

  // Read the stored choice after hydration (localStorage doesn't exist on the server).
  useEffect(() => {
    configureTracking(cfg);
    void Promise.resolve().then(() => {
      setConsent(parseConsent(window.localStorage.getItem(CONSENT_KEY), Date.now()));
      setReady(true);
    });
  }, [cfg]);

  useEffect(() => {
    const reopen = () => {
      setDraftAnalytics(consent?.analytics ?? false);
      setDraftMarketing(consent?.marketing ?? false);
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, [consent]);

  const perm = ready ? allowed(consent, cfg.requireConsent) : { analytics: false, marketing: false };

  // Scripts load only for what is currently allowed.
  useEffect(() => {
    if (!ready || !integrations) return;
    if (perm.analytics) {
      if (integrations.gtmId) loadGtm(integrations.gtmId);
      else if (integrations.ga4Id) loadGa4(integrations.ga4Id);
    }
    if (perm.marketing && integrations.metaPixelId) loadPixel(integrations.metaPixelId);
  }, [ready, integrations, perm.analytics, perm.marketing]);

  // Pixel page views for client-side navigation (GA4/GTM handle history changes themselves).
  useEffect(() => {
    const w = window as unknown as W;
    if (ready && perm.marketing && w.fbq && loaded.has("pixel")) w.fbq("track", "PageView");
    // first load is already counted by loadPixel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Phone and WhatsApp clicks anywhere on the site.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const href = a?.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) track("call_click");
      else if (/^https:\/\/wa\.me\//.test(href)) track("whatsapp_click");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const choose = useCallback(
    (analytics: boolean, marketing: boolean) => {
      const had = consent;
      const c = makeConsent(analytics, marketing, Date.now());
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
      setConsent(c);
      setOpen(false);
      setCustom(false);
      // Tells other parts of the page (custom code) that the visitor's choice changed.
      window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
      // Scripts already running can't be unloaded, so withdrawing a permission reloads the page without them.
      if ((had?.analytics && !analytics) || (had?.marketing && !marketing)) window.location.reload();
    },
    [consent]
  );

  const visible = ready && integrations && (open || shouldAskConsent(needs, cfg.requireConsent, consent));
  // Lets other floating widgets (WhatsApp) sit above the cookie bar while it is on screen.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-consent-bar", !!visible);
    return () => document.documentElement.removeAttribute("data-consent-bar");
  }, [visible]);
  if (!visible) return null;

  const showCustom = custom;
  return (
    <div role="region" aria-label={t.settings} className="fixed inset-x-0 bottom-0 z-50 border-t border-card-border bg-bg-elevated p-4 shadow-2xl print:hidden">
      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        <p className="text-xs leading-relaxed text-text-muted">
          {(lang === "ar" ? integrations.consentTextAr : integrations.consentTextEn) || t.msg}{" "}
          {integrations.privacyUrl && (
            <Link href={integrations.privacyUrl} className="underline hover:text-text">{t.privacy}</Link>
          )}
        </p>
        {showCustom && (
          <div className="flex flex-col gap-2 rounded-xl border border-card-border p-3 text-xs">
            <label className="flex items-start gap-2 opacity-70"><input type="checkbox" checked disabled className="mt-0.5" /><span><b className="text-text">{t.essential}</b><span className="block text-text-faint">{t.essentialHint}</span></span></label>
            {needs.analytics && (
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={draftAnalytics} onChange={(e) => setDraftAnalytics(e.target.checked)} /><span><b className="text-text">{t.analytics}</b><span className="block text-text-faint">{t.analyticsHint}</span></span></label>
            )}
            {needs.marketing && (
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={draftMarketing} onChange={(e) => setDraftMarketing(e.target.checked)} /><span><b className="text-text">{t.marketing}</b><span className="block text-text-faint">{t.marketingHint}</span></span></label>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {showCustom ? (
            <button type="button" onClick={() => choose(draftAnalytics, draftMarketing)} className="osta-btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold text-white">{t.save}</button>
          ) : (
            <>
              <button type="button" onClick={() => choose(true, true)} className="osta-btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold text-white">{t.acceptAll}</button>
              <button type="button" onClick={() => choose(false, false)} className="rounded-xl border border-card-border px-5 py-2.5 text-xs font-semibold text-text">{t.reject}</button>
              <button type="button" onClick={() => { setDraftAnalytics(false); setDraftMarketing(false); setCustom(true); }} className="rounded-xl px-3 py-2.5 text-xs font-medium text-text-muted underline">{t.customize}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
