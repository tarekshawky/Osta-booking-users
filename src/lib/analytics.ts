import { allowed, CONSENT_KEY, parseConsent, type Needs } from "./consent";

export type TrackingConfig = { gtm: boolean; ga4: boolean; pixel: boolean; requireConsent: boolean };

let config: TrackingConfig = { gtm: false, ga4: false, pixel: false, requireConsent: true };
export const configureTracking = (c: TrackingConfig) => {
  config = c;
};

// Meta's standard event names where one fits; everything else is a custom event.
const PIXEL_EVENTS: Record<string, string> = { form_submit: "Lead", call_click: "Contact", whatsapp_click: "Contact", booking_completed: "Schedule" };

// Which destinations may receive an event. Pure so it can be tested.
export function destinations(cfg: TrackingConfig, perm: Needs): { dataLayer: boolean; gtag: boolean; pixel: boolean } {
  return {
    dataLayer: perm.analytics && cfg.gtm,
    gtag: perm.analytics && !cfg.gtm && cfg.ga4,
    pixel: perm.marketing && cfg.pixel,
  };
}

type W = { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };

// Records a conversion/interaction. Does nothing until the visitor has allowed that kind of tracking.
export function track(name: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as W;
  const perm = allowed(parseConsent(window.localStorage.getItem(CONSENT_KEY), Date.now()), config.requireConsent);
  const d = destinations(config, perm);
  if (d.dataLayer) (w.dataLayer = w.dataLayer || []).push({ event: name, ...params });
  if (d.gtag && w.gtag) w.gtag("event", name, params);
  if (d.pixel && w.fbq) w.fbq(PIXEL_EVENTS[name] ? "track" : "trackCustom", PIXEL_EVENTS[name] ?? name, params);
}
