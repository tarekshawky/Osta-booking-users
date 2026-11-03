import { describe, it, expect } from "vitest";
import { SOCIAL_ICONS } from "./socialIcons";

describe("social icons", () => {
  it("has an official icon for each platform the footer links to", () => {
    for (const p of ["facebook", "instagram", "linkedin", "tiktok", "youtube", "x", "whatsapp"]) {
      const i = SOCIAL_ICONS[p];
      expect(i, p).toBeTruthy();
      expect(i.path.startsWith("M"), p).toBe(true);
      expect(i.color, p).toMatch(/^#[0-9A-F]{6}$/);
      expect(i.name.length, p).toBeGreaterThan(0);
    }
  });
  it("only draws with plain path data (nothing that could carry script)", () => {
    for (const i of Object.values(SOCIAL_ICONS)) expect(i.path).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/);
  });
  it("gives X a light colour: its own black would vanish on the dark navy footer", () => {
    expect(SOCIAL_ICONS.x.color).toBe("#FFFFFF");
  });
});
