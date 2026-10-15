import type { SiteSettings } from "@/lib/site";

export const WA_STORE = "osta_wa_popup";
// After the card has opened by itself (or been closed) it does not open by itself again for a week.
export const WA_QUIET_MS = 7 * 24 * 60 * 60 * 1000;

const DEFAULTS = {
  en: { title: "Chat with us on WhatsApp", text: "We're available 24/7. Send us a message and we'll reply as soon as we can.", button: "Start chat" },
  ar: { title: "تواصل معنا عبر واتساب", text: "نحن متواجدون على مدار الساعة طوال أيام الأسبوع. أرسل لنا رسالة وسنرد عليك في أقرب وقت.", button: "ابدأ المحادثة" },
};

// The wording for the visitor's language: the admin's text, the other language's text, or the built-in default.
export function popupText(s: SiteSettings, lang: "en" | "ar") {
  const pick = (en: string | undefined, ar: string | undefined, fallback: string) => ((lang === "ar" ? ar || en : en || ar) ?? "").trim() || fallback;
  return {
    title: pick(s.waPopupTitleEn, s.waPopupTitleAr, DEFAULTS[lang].title),
    text: pick(s.waPopupTextEn, s.waPopupTextAr, DEFAULTS[lang].text),
    button: pick(s.waPopupButtonEn, s.waPopupButtonAr, DEFAULTS[lang].button),
  };
}

// The widget needs a number to open a chat with; "enabled" defaults to on when the admin predates the setting.
export const popupVisible = (s: SiteSettings) => s.waPopupEnabled !== false && /^\d{8,15}$/.test(s.whatsapp);

export function mayAutoOpen(s: SiteSettings, lastShown: number | null, now: number): boolean {
  if (!popupVisible(s) || s.waPopupAutoOpen === false) return false;
  return lastShown === null || now - lastShown > WA_QUIET_MS || lastShown > now + 60_000;
}

export const autoOpenDelayMs = (s: SiteSettings) => Math.min(120, Math.max(0, Math.round(s.waPopupDelaySeconds ?? 10))) * 1000;
