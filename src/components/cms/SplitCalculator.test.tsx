import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { LanguageProvider } from "@/lib/language-context";
import { SiteProvider } from "@/lib/site-context";
import { DEFAULT_SITE } from "@/lib/site";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { CmsBlock } from "@/lib/cms";
import type { SplitConfig } from "@/lib/api";

const lst = (en: string[], ar: string[]) => ({ en, ar });
const CAPS = ["1", "1.5", "2", "2.5", "3", "4", "5"];
const pr = (v: number[]) => Object.fromEntries(CAPS.map((k, i) => [k, v[i]]));
const pkg = (key: string, nameEn: string, nameAr: string, copper: number, prices: number[], highlighted = false) => ({
  key, nameEn, nameAr, subtitleEn: `${nameEn} sub`, subtitleAr: `${nameAr} فرعي`, descriptionEn: `${nameEn} description`, descriptionAr: `${nameAr} وصف`, copperMeters: copper, icon: "Wrench", imageUrl: "", imageAltEn: "", imageAltAr: "", highlighted,
  materials: lst(copper ? [`Copper pipes up to ${copper} metres.`] : [], copper ? [`مواسير نحاس حتى ${copper} أمتار.`] : []), services: lst(["Indoor unit installation."], ["تركيب الوحدة الداخلية."]), notIncluded: lst(["Refrigerant gas charging."], ["شحن غاز التبريد."]), prices: pr(prices), active: true,
});
const config: SplitConfig = {
  vatPercent: 5, validityDays: 14,
  capacities: CAPS.map((k) => ({ key: k, labelEn: `${k} Ton`, labelAr: `${k} طن`, active: true })),
  packages: [pkg("standard", "Standard Installation – Labour Only", "التركيب الأساسي – دون خامات", 0, [150, 175, 200, 225, 250, 300, 350]), pkg("complete", "Complete Installation – Materials up to 3m", "التركيب الشامل – بخامات حتى 3 متر", 3, [450, 500, 550, 650, 750, 900, 1100]), pkg("premium", "Premium Installation – Materials up to 5m", "التركيب المميز – بخامات حتى 5 متر", 5, [600, 650, 700, 800, 950, 1150, 1400], true)],
  extras: [{ key: "additional-copper", nameEn: "Additional copper piping (per metre)", nameAr: "مواسير نحاس إضافية", descriptionEn: "", descriptionAr: "", unit: "meter", price: null, rfq: false, active: true }],
  discount: { enabled: false, type: "percent", value: 0, labelEn: "Discount", labelAr: "خصم" },
  conditions: lst(["All prices are per AC unit and depend on the selected AC capacity."], ["جميع الأسعار لكل وحدة تكييف."]),
  technicalNote: { en: "Important technical note: Leak testing and vacuuming should be performed whenever the refrigerant circuit is opened.", ar: "ملاحظة فنية مهمة: يجب إجراء اختبار التسريب." }, disclaimer: { en: "All quotations are estimates.", ar: "جميع العروض تقديرية." }, footer: { en: "Thank you.", ar: "شكراً." },
  propertyTypes: [{ key: "villa", en: "Villa", ar: "فيلا" }], emirates: [{ key: "Ajman", en: "Ajman", ar: "عجمان" }],
};
const mk = (props: Record<string, unknown> = {}): CmsBlock => ({ id: "sq", type: "splitQuoteCalculator", props: { heading: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, showPackages: "yes", defaultLang: "en", ...props }, hidden: false, visibility: { desktop: true, mobile: true } });
const render = (lang: "en" | "ar", block = mk(), splitQuote: SplitConfig | null = config) =>
  renderToString(<LanguageProvider initialLang={lang}><SiteProvider site={DEFAULT_SITE}><BlockRenderer blocks={[block]} data={{ services: [], posts: [], sections: [], pricing: null, jobs: { listUrl: "", items: [] }, subPages: [], locations: [], catalog: [], splitQuote } as never} /></SiteProvider></LanguageProvider>);

describe("Split AC installation calculator block", () => {
  it("draws the three packages with their names and every price of every capacity from the price list", () => {
    const h = render("en");
    for (const w of ["Split AC installation packages", "Standard Installation – Labour Only", "Complete Installation – Materials up to 3m", "Premium Installation – Materials up to 5m", "Price per AC unit", "Recommended", "Important package conditions"]) expect(h, w).toContain(w);
    for (const price of ["150", "175", "200", "225", "250", "300", "350", "450", "500", "550", "650", "750", "900", "1,100", "600", "700", "800", "950", "1,150", "1,400"]) expect(h, price).toContain(`>${price}<`);
    expect(h).toContain("Copper piping up to 3 metres"); expect(h).toContain("Copper piping up to 5 metres"); expect(h).toContain("Refrigerant gas charging."); expect(h).toContain("Important technical note");
  });
  it("opens the calculator at step 1 with the three package cards and the five steps", () => {
    const h = render("en");
    for (const w of ["Instant Split AC Installation Quotation", "Select Package", "Package", "AC units", "Extras", "Your details", "Summary", "Live quotation summary"]) expect(h, w).toContain(w);
    expect(h).toContain('id="split-calculator"'); expect(h).toContain("English"); expect(h).toContain("العربية");
  });
  it("follows the page language for the packages and keeps the calculator's own language", () => {
    expect(render("ar")).toContain("باقات تركيب المكيف السبليت");
    const ar = render("en", mk({ defaultLang: "ar" })); expect(ar).toContain("احسب تكلفة تركيب المكيف الآن"); expect(ar).toContain('dir="rtl"'); expect(ar).toContain("اختر الباقة");
    const en = render("ar", mk({ defaultLang: "en" })); expect(en).toContain("Instant Split AC Installation Quotation"); expect(en).toContain('dir="ltr"');
  });
  it("can hide the packages section and draws nothing without a price list", () => {
    expect(render("en", mk({ showPackages: "no" }))).not.toContain("Split AC installation packages");
    expect(render("en", mk(), null)).not.toContain("Select Package");
  });
  it("describes the service for search engines with the price range", () => {
    const h = render("en"); expect(h).toContain('"@type":"Service"'); expect(h).toContain('"lowPrice":150'); expect(h).toContain('"highPrice":1400'); expect(h).toContain('"priceCurrency":"AED"');
  });
});
