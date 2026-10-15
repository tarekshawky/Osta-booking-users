// Cookie-consent state. Pure functions (no browser access) so the rules are unit-tested; ConsentManager does the I/O.
export const CONSENT_KEY = "osta_consent";
export const CONSENT_CHANGED_EVENT = "osta:consent-changed";
export const CONSENT_VERSION = 1; // bump to ask everyone again (e.g. when a new kind of tracking is added)
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export type Consent = { v: number; analytics: boolean; marketing: boolean; at: number };
export type Needs = { analytics: boolean; marketing: boolean };

export function parseConsent(raw: string | null, now: number): Consent | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as Partial<Consent>;
    if (c.v !== CONSENT_VERSION || typeof c.at !== "number" || typeof c.analytics !== "boolean" || typeof c.marketing !== "boolean") return null;
    if (now - c.at > CONSENT_MAX_AGE_MS || c.at > now + 60_000) return null; // expired, or a clock-tampered future date
    return { v: c.v, analytics: c.analytics, marketing: c.marketing, at: c.at };
  } catch {
    return null;
  }
}

export const makeConsent = (analytics: boolean, marketing: boolean, now: number): Consent => ({ v: CONSENT_VERSION, analytics, marketing, at: now });

// What may run right now. With "require consent" off, everything configured runs; otherwise only what the visitor allowed.
export function allowed(consent: Consent | null, requireConsent: boolean): Needs {
  if (!requireConsent) return { analytics: true, marketing: true };
  return { analytics: consent?.analytics === true, marketing: consent?.marketing === true };
}

// The banner only appears when something that needs consent is configured and the visitor hasn't chosen yet.
export function shouldAskConsent(needs: Needs, requireConsent: boolean, consent: Consent | null): boolean {
  return requireConsent && (needs.analytics || needs.marketing) && consent === null;
}
