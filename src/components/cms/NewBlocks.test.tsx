import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { LanguageProvider } from "@/lib/language-context";
import { SiteProvider } from "@/lib/site-context";
import { DEFAULT_SITE } from "@/lib/site";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { CmsBlock } from "@/lib/cms";

const bi = (en: string, ar: string) => ({ en, ar });
const cta = (en: string, url: string) => ({ label: bi(en, en + "-ar"), url });
const mk = (type: CmsBlock["type"], props: Record<string, unknown>): CmsBlock => ({ id: type, type, props, hidden: false, visibility: { desktop: true, mobile: true } });
const data = { services: [], posts: [], sections: [], pricing: null, jobs: { listUrl: "", items: [] }, subPages: [], locations: [], catalog: [{ slug: null, nameEn: "Cleaning", nameAr: "تنظيف", icon: "", services: [{ nameEn: "AC Cleaning", nameAr: "تنظيف مكيف", slug: "ac-cleaning", bookSlug: "ac-clean" }] }] } as never;

const blocks: CmsBlock[] = [
  mk("heading", { eyebrow: bi("EYE", "ع"), heading: bi("Head", "عنوان"), subtitle: bi("Sub", "فرعي"), align: "center", size: "lg" }),
  mk("list", { heading: bi("L", "ل"), variant: "check", columns: "2", items: [{ text: bi("one", "واحد"), icon: "Star" }, { text: bi("two", "اثنان"), icon: "" }] }),
  mk("quote", { variant: "quote", text: bi("Quote text", "نص"), author: bi("Ann", "آن"), role: bi("CEO", "مدير") }),
  mk("announcement", { text: bi("Sale now", "تخفيض"), link: cta("Go", "/pricing"), tone: "orange", icon: "Sparkles" }),
  mk("gallery", { heading: bi("G", "ج"), columns: "3", ratio: "3:2", images: [{ imageUrl: "/a.jpg", alt: bi("a", "أ"), caption: bi("cap", "تعليق") }] }),
  mk("slider", { heading: bi("S", "س"), ratio: "16:9", autoplay: "yes", slides: [{ imageUrl: "/a.jpg", heading: bi("Slide1", "شريحة"), text: bi("t", "ن"), cta: cta("Open", "/x") }, { imageUrl: "/b.jpg", heading: bi("Slide2", "ش"), text: bi("", ""), cta: cta("", "") }] }),
  mk("bgSection", { heading: bi("BG", "خلفية"), body: bi("b", "ب"), cta: cta("Click", "/c"), align: "center", height: "md", imageUrl: "/bg.jpg", overlay: 50 }),
  mk("showcase", { kind: "service", source: "catalogue", catalogueKey: "ac-clean", imageUrl: "/s.jpg", imageAlt: bi("", ""), name: bi("", ""), subtitle: bi("Sub", "ف"), description: bi("Desc", "وصف"), price: "150", oldPrice: "200", currency: "AED", features: [{ icon: "Check", text: bi("Fast", "سريع") }], badge: "popular", primary: { label: bi("", ""), url: "" }, secondaryType: "whatsapp", secondaryLabel: bi("", ""), secondaryUrl: "", rating: 4.5, reviews: 120, imagePosition: "end", layout: "split" }),
  mk("cardsGrid", { kind: "product", heading: bi("Cards", "بطاقات"), subtitle: bi("", ""), columns: "3", currency: "USD", cards: [{ imageUrl: "/c.jpg", name: bi("Card1", "بطاقة"), description: bi("d", "و"), price: "99", oldPrice: "120", badge: "new", cta: cta("Buy", "/b") }] }),
  mk("benefits", { eyebrow: bi("", ""), heading: bi("Why", "لماذا"), subtitle: bi("", ""), columns: "3", items: [{ icon: "ShieldCheck", title: bi("Safe", "آمن"), text: bi("t", "ن") }] }),
  mk("pricing", { heading: bi("Plans", "خطط"), subtitle: bi("", ""), currency: "SAR", plans: [{ name: bi("Basic", "أساسي"), price: "99", period: bi("visit", "زيارة"), description: bi("", ""), features: [{ text: bi("F1", "م1") }], badge: bi("Hot", "رائج"), highlighted: "yes", cta: cta("Book", "/pricing") }] }),
  mk("comparison", { heading: bi("Cmp", "مقارنة"), subtitle: bi("", ""), columns: [{ name: bi("A", "أ"), highlighted: "no" }, { name: bi("B", "ب"), highlighted: "yes" }], rows: [{ label: bi("Row", "صف"), values: [{ v: "✓" }, { v: "✗" }] }] }),
  mk("beforeAfter", { heading: bi("BA", "قبل"), subtitle: bi("", ""), beforeUrl: "/b.jpg", afterUrl: "/a.jpg", beforeLabel: bi("Before", "قبل"), afterLabel: bi("After", "بعد"), alt: bi("job", "عمل") }),
  mk("promo", { badge: bi("Limited", "محدود"), heading: bi("Promo", "عرض"), text: bi("", ""), price: "50", oldPrice: "80", currency: "AED", endDate: "2999-12-31", imageUrl: "", cta: cta("Grab", "/g") }),
  mk("ctaButtons", { heading: bi("Go", "اذهب"), subtitle: bi("", ""), align: "center", size: "lg", buttons: [{ kind: "book", label: bi("", ""), url: "" }, { kind: "call", label: bi("", ""), url: "" }, { kind: "whatsapp", label: bi("", ""), url: "" }, { kind: "quote", label: bi("", ""), url: "" }, { kind: "custom", label: bi("Custom", "مخصص"), url: "/cust" }] }),
  mk("contactBanner", { heading: bi("Help", "مساعدة"), subtitle: bi("", ""), showBook: "yes", showCall: "yes", showWhatsapp: "yes", tone: "dark" }),
];
const site = { ...DEFAULT_SITE, settings: { ...DEFAULT_SITE.settings, phone: "+971 50 123 4567", whatsapp: "971501234567" } };
const render = (lang: "en" | "ar", b: CmsBlock[]) => renderToString(<LanguageProvider initialLang={lang}><SiteProvider site={site}><BlockRenderer blocks={b} data={data} /></SiteProvider></LanguageProvider>);

describe("new blocks render", () => {
  it("every block renders in English with the right content and links", () => {
    for (const b of blocks) { const html = render("en", [b]); expect(html.length, b.type).toBeGreaterThan(40); }
    const html = render("en", blocks);
    expect(html).toContain("Sale now"); expect(html).toContain("AC Cleaning"); expect(html).toContain("/pricing?service=ac-clean");
    expect(html).toContain("tel:+971501234567"); expect(html).toContain("https://wa.me/971501234567"); expect(html).toContain("/contact"); expect(html).toContain("/cust");
    expect(html).toContain("AED 150"); expect(html).toContain("$99"); expect(html).toContain("SAR"); expect(html).toContain("line-through");
  });
  it("renders in Arabic", () => {
    const html = render("ar", blocks);
    expect(html).toContain("تخفيض"); expect(html).toContain("تنظيف مكيف"); expect(html).toContain("150 د.إ"); expect(html).toContain("احجز الآن");
  });
  it("an expired promo disappears and empty blocks render nothing", () => {
    expect(render("en", [mk("promo", { ...blocks.find((x) => x.type === "promo")!.props, endDate: "2000-01-01" })])).not.toContain("Promo");
    for (const t of ["gallery", "slider", "cardsGrid", "benefits", "pricing", "comparison", "beforeAfter", "list", "quote", "announcement"] as const) expect(render("en", [mk(t, {})]), t).not.toContain("undefined");
  });
  it("section spacing and alignment are applied", () => {
    const html = render("en", [mk("heading", { heading: bi("H", "ه"), style: { spacing: "xl", textAlign: "end" } })]);
    expect(html).toContain("py-24"); expect(html).toContain("text-end");
  });
});
