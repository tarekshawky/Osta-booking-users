import { describe, it, expect } from "vitest";
import { autoOpenDelayMs, mayAutoOpen, popupText, popupVisible, WA_QUIET_MS } from "./waPopup";
import { DEFAULT_SITE, type SiteSettings } from "./site";

const s = (over: Partial<SiteSettings> = {}): SiteSettings => ({ ...DEFAULT_SITE.settings, whatsapp: "971568676036", ...over });

describe("WhatsApp pop-up", () => {
  it("shows when enabled (the default) and a valid number is set", () => {
    expect(popupVisible(s())).toBe(true);
    expect(popupVisible(s({ waPopupEnabled: false }))).toBe(false);
    expect(popupVisible(s({ whatsapp: "" }))).toBe(false);
    expect(popupVisible(s({ whatsapp: "+971 56" }))).toBe(false);
  });
  it("opens by itself once, then stays quiet for a week", () => {
    const now = 1_000_000_000_000;
    expect(mayAutoOpen(s(), null, now)).toBe(true);
    expect(mayAutoOpen(s(), now - 60_000, now)).toBe(false);
    expect(mayAutoOpen(s(), now - WA_QUIET_MS - 1, now)).toBe(true);
    expect(mayAutoOpen(s(), now + 10 * 60_000, now)).toBe(true); // a clock-tampered future time doesn't silence it forever
    expect(mayAutoOpen(s({ waPopupAutoOpen: false }), null, now)).toBe(false);
    expect(mayAutoOpen(s({ waPopupEnabled: false }), null, now)).toBe(false);
  });
  it("clamps the delay", () => {
    expect(autoOpenDelayMs(s())).toBe(10_000);
    expect(autoOpenDelayMs(s({ waPopupDelaySeconds: 0 }))).toBe(0);
    expect(autoOpenDelayMs(s({ waPopupDelaySeconds: 999 }))).toBe(120_000);
    expect(autoOpenDelayMs(s({ waPopupDelaySeconds: -5 }))).toBe(0);
  });
  it("uses the visitor's language, then the other one, then the built-in text", () => {
    expect(popupText(s({ waPopupTitleEn: "Talk to us", waPopupTitleAr: "كلمنا" }), "ar").title).toBe("كلمنا");
    expect(popupText(s({ waPopupTitleEn: "Talk to us", waPopupTitleAr: "" }), "ar").title).toBe("Talk to us");
    expect(popupText(s({ waPopupTitleEn: "", waPopupTitleAr: "" }), "en").title).toBe("Chat with us on WhatsApp");
    expect(popupText(s(), "en").text).toMatch(/24\/7/);
    expect(popupText(s(), "ar").text).toMatch(/على مدار الساعة/);
  });
});
