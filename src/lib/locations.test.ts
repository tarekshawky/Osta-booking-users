import { describe, it, expect } from "vitest";
import { branchHeading, crumbs, isSafeEmbed, reviewsLink, safeLink, whatsappWithText, type PublicBranch } from "./locations";

const b = { nameEn: "Osta Services Ajman", nameAr: "خدمات آسطا عجمان", areaNameEn: "Ajman", areaNameAr: "عجمان", whatsappUrl: "https://wa.me/971568676036", reviewsUrl: "", businessProfileUrl: "", mapsUrl: "https://www.google.com/maps/place/x" } as PublicBranch;

describe("branch section helpers", () => {
  it("builds the section heading in both languages", () => {
    expect(branchHeading(b, false)).toBe("Osta Services Ajman – Home Maintenance Company in Ajman");
    expect(branchHeading(b, true)).toBe("خدمات آسطا عجمان – شركة صيانة منزلية في عجمان");
  });
  it("only embeds Google's embeddable maps and only opens safe links", () => {
    expect(isSafeEmbed("https://maps.google.com/maps?q=25.39,55.57&z=16&output=embed")).toBe(true);
    expect(isSafeEmbed("https://www.google.com/maps/embed?pb=!1m18")).toBe(true);
    for (const u of ["https://evil.example/maps/embed", "http://maps.google.com/maps?output=embed", "javascript:alert(1)", "https://www.google.com/maps/place/x"]) expect(isSafeEmbed(u)).toBe(false);
    expect(safeLink("https://maps.apple.com/x")).toBe("https://maps.apple.com/x");
    expect(safeLink("tel:+971568676036")).toBe("tel:+971568676036");
    expect(safeLink("javascript:alert(1)")).toBe("");
    expect(safeLink("//evil.example")).toBe("");
  });
  it("opens WhatsApp with a ready message naming the branch", () => {
    expect(whatsappWithText(b, false)).toBe("https://wa.me/971568676036?text=Hello%20Osta%20Services%20Ajman%2C%20I%20would%20like%20to%20book%20a%20service.");
    expect(whatsappWithText({ ...b, whatsappUrl: "" }, false)).toBe("");
  });
  it("sends 'read our reviews' to the best link available", () => {
    expect(reviewsLink({ ...b, reviewsUrl: "https://g.page/r/abc" })).toBe("https://g.page/r/abc");
    expect(reviewsLink({ ...b, businessProfileUrl: "https://business.google.com/x" })).toBe("https://business.google.com/x");
    expect(reviewsLink(b)).toBe("https://www.google.com/maps/place/x");
  });
  it("builds the breadcrumb trail like the structured data does", () => {
    const page = { slug: "ajman", titleEn: "Ajman", titleAr: "عجمان", parent: { slug: "areas", titleEn: "Areas we cover", titleAr: "مناطق التغطية" } };
    expect(crumbs(page, false).map((c) => c.label)).toEqual(["Home", "Areas we cover", "Ajman"]);
    expect(crumbs({ ...page, parent: null }, true).map((c) => c.label)).toEqual(["الرئيسية", "عجمان"]);
    expect(crumbs(page, false).map((c) => c.href)).toEqual(["/", "/areas", "/ajman"]);
  });
});
