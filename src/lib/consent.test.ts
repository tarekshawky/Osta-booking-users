import { describe, it, expect } from "vitest";
import { CONSENT_MAX_AGE_MS, CONSENT_VERSION, allowed, makeConsent, parseConsent, shouldAskConsent } from "./consent";
import { destinations } from "./analytics";

const NOW = 1_800_000_000_000;

describe("parseConsent", () => {
  it("round-trips a valid choice", () => {
    const c = makeConsent(true, false, NOW);
    expect(parseConsent(JSON.stringify(c), NOW + 1000)).toEqual(c);
  });
  it("rejects missing, malformed, wrong-version, expired and future-dated values", () => {
    expect(parseConsent(null, NOW)).toBeNull();
    expect(parseConsent("not json", NOW)).toBeNull();
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION + 1, analytics: true, marketing: true, at: NOW }), NOW)).toBeNull();
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION, analytics: "yes", marketing: true, at: NOW }), NOW)).toBeNull();
    expect(parseConsent(JSON.stringify(makeConsent(true, true, NOW)), NOW + CONSENT_MAX_AGE_MS + 1)).toBeNull();
    expect(parseConsent(JSON.stringify(makeConsent(true, true, NOW + 10 * 60_000)), NOW)).toBeNull();
  });
});

describe("allowed / shouldAskConsent", () => {
  it("nothing runs without a choice when consent is required", () => {
    expect(allowed(null, true)).toEqual({ analytics: false, marketing: false });
    expect(allowed(makeConsent(true, false, NOW), true)).toEqual({ analytics: true, marketing: false });
  });
  it("everything runs when consent is not required", () => expect(allowed(null, false)).toEqual({ analytics: true, marketing: true }));
  it("asks only when needed, required and undecided", () => {
    expect(shouldAskConsent({ analytics: true, marketing: false }, true, null)).toBe(true);
    expect(shouldAskConsent({ analytics: false, marketing: false }, true, null)).toBe(false); // nothing to consent to
    expect(shouldAskConsent({ analytics: true, marketing: true }, false, null)).toBe(false);
    expect(shouldAskConsent({ analytics: true, marketing: true }, true, makeConsent(false, false, NOW))).toBe(false); // already chose "reject"
  });
});

describe("tracking destinations", () => {
  const cfg = { gtm: false, ga4: true, pixel: true, requireConsent: true };
  it("sends nothing before consent", () => expect(destinations(cfg, { analytics: false, marketing: false })).toEqual({ dataLayer: false, gtag: false, pixel: false }));
  it("analytics consent reaches GA4 only, marketing consent reaches the pixel only", () => {
    expect(destinations(cfg, { analytics: true, marketing: false })).toEqual({ dataLayer: false, gtag: true, pixel: false });
    expect(destinations(cfg, { analytics: false, marketing: true })).toEqual({ dataLayer: false, gtag: false, pixel: true });
  });
  it("uses GTM instead of direct GA4 when both are set (no double counting)", () => {
    expect(destinations({ ...cfg, gtm: true }, { analytics: true, marketing: false })).toEqual({ dataLayer: true, gtag: false, pixel: false });
  });
  it("sends to nothing that isn't configured", () => expect(destinations({ gtm: false, ga4: false, pixel: false, requireConsent: true }, { analytics: true, marketing: true })).toEqual({ dataLayer: false, gtag: false, pixel: false }));
});
