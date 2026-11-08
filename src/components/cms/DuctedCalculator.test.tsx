import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { LanguageProvider } from "@/lib/language-context";
import { SiteProvider } from "@/lib/site-context";
import { DEFAULT_SITE } from "@/lib/site";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { CmsBlock } from "@/lib/cms";
import type { AcConfig } from "@/lib/api";

const lst = (en: string[], ar: string[]) => ({ en, ar });
const caps: [string, number, number, number][] = [["3", 400, 950, 1250], ["4", 500, 1200, 1500], ["5", 600, 1450, 1800], ["6", 700, 1700, 2100], ["7.5", 850, 2000, 2500], ["10", 1100, 2600, 3200]];
const config: AcConfig = {
  vatPercent: 5, validityDays: 14,
  plenum: { nameEn: "Existing Plenum Modification & Duct Connection", nameAr: "تعديل وتوصيل البلينم بفتحات الدكت الموجودة", price: 250, descriptionEn: "AED 250 is added automatically to every unit.", descriptionAr: "يتم إضافة 250 درهماً لكل وحدة.", included: lst(["Plenum modification to suit the unit."], ["تعديل الـ Plenum."]), notIncluded: lst(["A completely new duct network."], ["شبكة دكت جديدة بالكامل."]) },
  acTypes: [{ key: "ducted-split", nameEn: "Ducted Split AC", nameAr: "مكيف دكت سبليت", descriptionEn: "d", descriptionAr: "و", active: true }, { key: "concealed", nameEn: "Concealed AC", nameAr: "مكيف كونسيلد", descriptionEn: "d", descriptionAr: "و", active: true }],
  capacities: caps.map(([key, standard, complete, premium]) => ({ key, labelEn: `${key} Ton`, labelAr: `${key} طن`, active: true, prices: { standard, complete, premium } })),
  packages: [
    { key: "standard", nameEn: "Standard", nameAr: "ستاندرد", subtitleEn: "Installation Only", subtitleAr: "تركيب فقط", included: lst(["Basic operational test."], ["اختبار التشغيل الأساسي."]), notIncluded: lst(["New copper pipes are not included."], ["لا تشمل مواسير نحاس جديدة."]), copperMeters: 0, active: true },
    { key: "complete", nameEn: "Complete", nameAr: "كومبليت", subtitleEn: "With Materials (Up to 3m)", subtitleAr: "مع الخامات (حتى 3 متر)", included: lst(["Copper pipes up to 3 metres."], ["مواسير نحاس حتى 3 أمتار."]), notIncluded: lst([], []), copperMeters: 3, active: true },
    { key: "premium", nameEn: "Premium", nameAr: "بريميوم", subtitleEn: "Extended Materials (Up to 5m)", subtitleAr: "خامات ممتدة (حتى 5 متر)", included: lst(["Nitrogen pressure test."], ["اختبار ضغط النيتروجين."]), notIncluded: lst([], []), copperMeters: 5, active: true },
  ],
  services: [{ key: "additional-copper", nameEn: "Additional Copper Piping", nameAr: "مواسير نحاس إضافية", unit: "meter", price: null, rfq: false, active: true }],
  exclusions: lst(["Supply of the air conditioning unit.", "Cranes, scaffolding and special lifting equipment."], ["توريد جهاز التكييف.", "الرافعات والسقالات ومعدات الرفع الخاصة."]),
  disclaimer: { en: "All quotations are estimates. Final pricing is subject to site inspection.", ar: "جميع عروض الأسعار تقديرية. يخضع السعر النهائي لمعاينة الموقع." },
  propertyTypes: [{ key: "villa", en: "Villa", ar: "فيلا" }], emirates: [{ key: "Ajman", en: "Ajman", ar: "عجمان" }], uploads: { maxFiles: 8, maxMb: 8 },
};
const mk = (props: Record<string, unknown> = {}): CmsBlock => ({ id: "dc", type: "ductedCalculator", props: { heading: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, showPricing: "yes", defaultLang: "en", ...props }, hidden: false, visibility: { desktop: true, mobile: true } });
const render = (lang: "en" | "ar", block = mk(), acQuote: AcConfig | null = config) =>
  renderToString(<LanguageProvider initialLang={lang}><SiteProvider site={DEFAULT_SITE}><BlockRenderer blocks={[block]} data={{ services: [], posts: [], sections: [], pricing: null, jobs: { listUrl: "", items: [] }, subPages: [], locations: [], catalog: [], acQuote } as never} /></SiteProvider></LanguageProvider>);

describe("AC installation calculator block", () => {
  it("draws the packages and the price table from the administrator's price list, with the totals of the brief", () => {
    const h = render("en");
    for (const w of ["Installation packages", "Standard", "Complete", "Premium", "Installation Only", "Price table", "Plenum connection"]) expect(h, w).toContain(w);
    // totals per unit = base + 250: 3 Ton 650 / 1,200 / 1,500 ... 10 Ton 1,350 / 2,850 / 3,450
    for (const total of ["650", "1,200", "1,500", "750", "1,450", "1,750", "850", "1,700", "2,050", "950", "1,950", "2,350", "1,100", "2,250", "2,750", "1,350", "2,850", "3,450"]) expect(h, total).toContain(`>${total}<`);
    expect(h).toContain("AED 250"); expect(h).toContain("Existing Plenum Modification &amp; Duct Connection"); expect(h).toContain("Supply of the air conditioning unit."); expect(h).toContain("All quotations are estimates.");
  });
  it("follows the page language for the pricing section and keeps its own language inside the calculator", () => {
    const ar = render("ar");
    expect(ar).toContain("باقات التركيب"); expect(ar).toContain("جدول الأسعار"); expect(ar).toContain("توريد جهاز التكييف.");
    // the calculator opens in the language set on the block, whatever the page language is
    const calcEn = render("ar", mk({ defaultLang: "en" })); expect(calcEn).toContain("Calculate Your Ducted AC Installation Cost"); expect(calcEn).toContain('dir="ltr"');
    const calcAr = render("en", mk({ defaultLang: "ar" })); expect(calcAr).toContain("احسب تكلفة تركيب مكيف الدكت الآن"); expect(calcAr).toContain('dir="rtl"');
    expect(calcEn).toContain("English") ; expect(calcEn).toContain("العربية"); // the switch inside the calculator
  });
  it("starts the calculator at step 1 with a unit to fill in, the three package choices and the add / remove controls", () => {
    const h = render("en");
    for (const w of ["Add Another Unit", "AC Type", "Capacity", "Package", "Quantity", "Ducted Split AC", "Concealed AC", "10 Ton", "Price summary"]) expect(h, w).toContain(w);
    expect(h).toContain('id="ducted-calculator"');
  });
  it("can hide the packages and price table above the calculator, and draws nothing without a price list", () => {
    expect(render("en", mk({ showPricing: "no" }))).not.toContain("Installation packages");
    expect(render("en", mk(), null)).not.toContain("Add Another Unit");
  });
  it("describes the service for search and answer engines (structured data with the price range)", () => {
    const h = render("en");
    expect(h).toContain("application/ld+json"); expect(h).toContain('"@type":"Service"'); expect(h).toContain('"lowPrice":650'); expect(h).toContain('"highPrice":3450'); expect(h).toContain('"priceCurrency":"AED"'); expect(h).toContain("United Arab Emirates");
  });
});

describe("FAQ structured data", () => {
  const faq: CmsBlock = { id: "f", type: "faq", props: { heading: { en: "FAQ", ar: "أسئلة" }, items: [{ question: { en: "Is it final?", ar: "هل هو نهائي؟" }, answer: { en: "No, it is an estimate.", ar: "لا، تقديري." } }] }, hidden: false, visibility: { desktop: true, mobile: true } };
  const r = (lang: "en" | "ar") => renderToString(<LanguageProvider initialLang={lang}><SiteProvider site={DEFAULT_SITE}><BlockRenderer blocks={[faq]} data={{ services: [], posts: [], sections: [], pricing: null, jobs: { listUrl: "", items: [] }, subPages: [], locations: [], catalog: [] } as never} /></SiteProvider></LanguageProvider>);
  it("publishes the questions and answers as FAQPage data in the visitor's language", () => {
    expect(r("en")).toContain('"@type":"FAQPage"'); expect(r("en")).toContain('"name":"Is it final?"'); expect(r("en")).toContain('"text":"No, it is an estimate."');
    expect(r("ar")).toContain("هل هو نهائي؟");
  });
});
