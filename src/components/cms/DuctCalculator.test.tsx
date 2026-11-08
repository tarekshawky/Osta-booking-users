import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { LanguageProvider } from "@/lib/language-context";
import { SiteProvider } from "@/lib/site-context";
import { DEFAULT_SITE } from "@/lib/site";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { CmsBlock } from "@/lib/cms";
import type { DuctConfig } from "@/lib/api";

const lst = (en: string[], ar: string[]) => ({ en, ar });
const none = { enabled: false, rate: null };
const sys = (key: string, nameEn: string, nameAr: string, rate: number) => ({
  key, nameEn, nameAr, shortEn: key, shortAr: key, descriptionEn: `${nameEn} desc`, descriptionAr: `${nameAr} وصف`, included: lst([`${nameEn} included`], [`${nameAr} مشمول`]), notIncluded: lst(["Diffusers and grilles."], ["مخارج الهواء."]), technical: lst([], []),
  specFields: [], modes: { "supply-fabricate-install": { enabled: true, rate }, "fabricate-supply": none, "install-only": none, custom: { enabled: true, rate: null } }, active: true,
});
const config: DuctConfig = {
  vatPercent: 5, validityDays: 14,
  systems: [sys("gi", "GI Duct Fabrication & Installation", "تصنيع وتركيب دكت الصاج المجلفن", 130), sys("gi-fiberglass", "GI Duct with Fiberglass Insulation", "دكت صاج مع فايبر جلاس", 170), sys("pir", "PIR Pre-Insulated Duct", "دكت PIR", 160)],
  accessories: [{ key: "supply-diffuser", nameEn: "Supply Air Diffuser", nameAr: "مخرج هواء تغذية", units: ["PCS"], prices: { PCS: null }, active: true }],
  services: [{ key: "site-measurement", nameEn: "Site Measurement", nameAr: "معاينة وقياس الموقع", unit: "LOT", price: null, rfq: false, active: true }],
  discount: { enabled: false, type: "percent", value: 0, labelEn: "Discount", labelAr: "خصم" }, minAreaM2: 0,
  specs: { gauge: [], fiberglass: [], pir: [], pressure: [{ key: "low", en: "Low pressure", ar: "ضغط منخفض" }], application: [{ key: "supply", en: "Supply air", ar: "هواء تغذية" }] },
  estimateNotice: { en: "Estimated Quotation – Subject to Technical Review & Final Site Measurement", ar: "عرض سعر تقديري – يخضع للمراجعة الفنية والقياسات النهائية بالموقع" },
  straightDuctNote: { en: "This calculation covers straight duct surfaces only.", ar: "يغطي هذا الحساب أسطح الدكت المستقيمة فقط." }, reviewNote: { en: "r", ar: "ر" }, terms: lst(["Term one."], ["شرط أول."]),
  projectTypes: [{ key: "commercial", en: "Commercial", ar: "تجاري" }], emirates: [{ key: "Sharjah", en: "Sharjah", ar: "الشارقة" }], uploads: { maxFiles: 10, maxMb: 15 },
};
const mk = (props: Record<string, unknown> = {}): CmsBlock => ({ id: "dq", type: "ductQuoteCalculator", props: { heading: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, showSystems: "yes", defaultLang: "en", ...props }, hidden: false, visibility: { desktop: true, mobile: true } });
const render = (lang: "en" | "ar", block = mk(), ductQuote: DuctConfig | null = config) =>
  renderToString(<LanguageProvider initialLang={lang}><SiteProvider site={DEFAULT_SITE}><BlockRenderer blocks={[block]} data={{ services: [], posts: [], sections: [], pricing: null, jobs: { listUrl: "", items: [] }, subPages: [], locations: [], catalog: [], ductQuote } as never} /></SiteProvider></LanguageProvider>);

describe("Ductwork quotation calculator block", () => {
  it("draws the three systems and their rates from the administrator's price list", () => {
    const h = render("en");
    for (const w of ["Ductwork systems and rates", "GI Duct Fabrication &amp; Installation", "GI Duct with Fiberglass Insulation", "PIR Pre-Insulated Duct", "Rate table", "Supply &amp; Fabrication &amp; Installation"]) expect(h, w).toContain(w);
    for (const rate of ["AED 130", "AED 170", "AED 160"]) expect(h, rate).toContain(rate);
    expect(h).toContain("Estimated Quotation – Subject to Technical Review &amp; Final Site Measurement"); expect(h).toContain("straight duct surfaces only");
  });
  it("opens the calculator at step 1 with the project fields, ten steps, and its own language switch", () => {
    const h = render("en");
    for (const w of ["HVAC Ductwork – Smart Quotation Calculator", "Full Name", "Project Type", "Site Address", "Project Description", "Upload BOQ", "Upload Drawings", "Quotation summary"]) expect(h, w).toContain(w);
    expect(h).toContain('id="duct-quote-calculator"'); expect(h).toContain("English"); expect(h).toContain("العربية");
    expect((h.match(/<li aria-current|<li class="flex shrink-0/g) ?? []).length).toBeGreaterThanOrEqual(1);
    for (const n of ["Duct system", "Type of work", "Duct sections", "Components", "Specifications", "Review"]) expect(h, n).toContain(n);
  });
  it("keeps the calculator's own language whatever the page language is", () => {
    const ar = render("en", mk({ defaultLang: "ar" })); expect(ar).toContain("حاسبة عروض أسعار تصنيع وتركيب الدكت"); expect(ar).toContain('dir="rtl"'); expect(ar).toContain("الاسم الكامل");
    const en = render("ar", mk({ defaultLang: "en" })); expect(en).toContain("Full Name"); expect(en).toContain('dir="ltr"');
    expect(render("ar")).toContain("أنظمة الدكت والأسعار");
  });
  it("can hide the systems section and draws nothing without a price list", () => {
    expect(render("en", mk({ showSystems: "no" }))).not.toContain("Ductwork systems and rates");
    expect(render("en", mk(), null)).not.toContain("Full Name");
  });
  it("describes the service for search engines with the rate range", () => {
    const h = render("en"); expect(h).toContain('"@type":"Service"'); expect(h).toContain('"lowPrice":130'); expect(h).toContain('"highPrice":170'); expect(h).toContain('"priceCurrency":"AED"');
  });
});
