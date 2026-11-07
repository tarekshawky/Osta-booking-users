import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { LanguageProvider } from "@/lib/language-context";
import { SiteProvider } from "@/lib/site-context";
import { DEFAULT_SITE } from "@/lib/site";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { parseVideo } from "@/components/cms/NewBlocks";
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
  it("showcase price note, discount, features heading, extra pictures and button styles", () => {
    const base = blocks.find((x) => x.type === "showcase")!.props;
    const html = render("en", [mk("showcase", { ...base, price: "100", oldPrice: "200", startingFrom: "yes", priceUnit: bi("Per AC unit", "للوحدة"), showDiscount: "yes", featuresHeading: bi("What's included?", "ماذا يشمل؟"), gallery: [{ imageUrl: "/g1.jpg", alt: bi("", "") }], secondaryType: "call", buttonStyle: "dark", badge: "bestSeller", shadow: "lg", radius: "md" })]);
    expect(html).toContain("Starting price · Per AC unit"); expect(html).toContain("-50%"); expect(html).toContain("What&#x27;s included?"); expect(html).toContain("/g1.jpg");
    expect(html).toContain("tel:+971501234567"); expect(html).toContain("bg-slate-900"); expect(html).toContain("Best seller"); expect(html).toContain("shadow-xl"); expect(html).toContain("rounded-md");
    expect(render("ar", [mk("showcase", { ...base, price: "100", startingFrom: "yes" })])).toContain("السعر يبدأ من");
    expect(render("en", [mk("showcase", { ...base, secondaryType: "quote" })])).toContain('href="/contact"');
  });
  it("section width, corners, shadow, anchor and class are applied (and unsafe values are not)", () => {
    const html = render("en", [mk("heading", { heading: bi("H", "ه"), style: { width: "narrow", radius: "2xl", shadow: "lg", anchorId: "offers", cssClass: "my-band dark" } })]);
    expect(html).toContain('id="offers"'); expect(html).toContain("max-w-3xl"); expect(html).toContain("rounded-2xl"); expect(html).toContain("shadow-xl"); expect(html).toContain("my-band dark");
    const bad = render("en", [mk("heading", { heading: bi("H", "ه"), style: { anchorId: "1 bad\"x", cssClass: "a\"><script>" } })]);
    expect(bad).not.toContain("<script>"); expect(bad).not.toContain("bad");
  });
  it("steps, testimonials, logos, team, divider and video", () => {
    const html = render("en", [
      mk("steps", { heading: bi("How", "كيف"), variant: "timeline", items: [{ icon: "Clock", title: bi("Step A", "أ"), text: bi("", ""), imageUrl: "" }, { icon: "", title: bi("Step B", "ب"), text: bi("", ""), imageUrl: "" }] }),
      mk("testimonials", { heading: bi("T", "ت"), layout: "carousel", items: [{ name: bi("Sara", "سارة"), role: bi("", ""), text: bi("Great job", "عمل رائع"), rating: 5, imageUrl: "" }] }),
      mk("logos", { heading: bi("", ""), grayscale: "yes", items: [{ imageUrl: "/l.png", name: bi("Brand", "ب"), icon: "", url: "https://example.com" }, { imageUrl: "", name: bi("Licensed", "مرخص"), icon: "BadgeCheck", url: "" }] }),
      mk("team", { heading: bi("", ""), columns: "3", members: [{ imageUrl: "", name: bi("Omar", "عمر"), role: bi("Lead", "قائد"), bio: bi("", "") }] }),
      mk("divider", { variant: "dots", size: "md" }),
      mk("video", { heading: bi("", ""), url: "https://youtu.be/dQw4w9WgXcQ", poster: "", caption: bi("", ""), ratio: "16:9" }),
    ]);
    expect(html).toContain("Step A"); expect(html).toContain("Great job"); expect(html).toContain("Sara"); expect(html).toContain("/l.png"); expect(html).toContain("Licensed");
    expect(html).toContain("Omar"); expect(html).toContain('role="separator"'); expect(html).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(render("ar", [mk("steps", { heading: bi("", ""), variant: "cards", items: [{ title: bi("Step", "خطوة"), text: bi("", ""), imageUrl: "" }] })])).toContain("خطوة");
  });
  it("google reviews: summary, chosen reviews and links, in both languages", () => {
    const props = { heading: bi("Rated on Google", "تقييمنا"), subtitle: bi("", ""), layout: "grid", rating: 4.8, total: 1234, googleUrl: "https://www.google.com/maps?cid=1", writeReviewUrl: "https://search.google.com/local/writereview?placeid=X", reviews: [{ author: "Sara", rating: 5, text: bi("Great service", "خدمة رائعة"), date: "2 weeks ago", imageUrl: "" }] };
    const en = render("en", [mk("googleReviews", props)]);
    expect(en).toContain("4.8"); expect(en).toContain("Based on 1,234 reviews on Google"); expect(en).toContain("Great service"); expect(en).toContain("Sara");
    expect(en).toContain('href="https://www.google.com/maps?cid=1"'); expect(en).toContain("Write a review");
    const ar = render("ar", [mk("googleReviews", props)]);
    expect(ar).toContain("بناءً على 1,234 مراجعة على Google"); expect(ar).toContain("خدمة رائعة"); expect(ar).toContain("اكتب مراجعة");
    // No write-review link: no button. No rating and no reviews: nothing is drawn.
    expect(render("en", [mk("googleReviews", { ...props, writeReviewUrl: "" })])).not.toContain("Write a review");
    expect(render("en", [mk("googleReviews", { ...props, rating: 0, reviews: [] })])).not.toContain("Rated on Google");
    // Rating only (the "star rating display" preset).
    const rated = render("en", [mk("googleReviews", { ...props, reviews: [] })]);
    expect(rated).toContain("4.8"); expect(rated).not.toContain("Sara");
    expect(render("en", [mk("googleReviews", { ...props, layout: "carousel" })])).toContain('aria-roledescription="carousel"');
  });
  it("only safe video addresses are embedded", () => {
    expect(parseVideo("https://vimeo.com/123456789")?.src).toBe("https://player.vimeo.com/video/123456789");
    expect(parseVideo("https://www.youtube.com/watch?v=abcdefghijk&t=3")?.src).toContain("/embed/abcdefghijk");
    expect(parseVideo("/api/media/abc123")?.kind).toBe("file"); expect(parseVideo("https://cdn.example.com/a.mp4")?.kind).toBe("file");
    expect(parseVideo("https://evil.example.com/watch?v=abcdefghijk")).toBeNull(); expect(parseVideo("javascript:alert(1)")).toBeNull(); expect(parseVideo("")).toBeNull();
  });
  it("per-device visibility, including blocks saved before tablets existed", () => {
    const h = (visibility: CmsBlock["visibility"]) => render("en", [{ ...mk("heading", { heading: bi("H", "ه") }), visibility }]);
    // The classes on the block's outer wrapper, as whole names (so "lg:hidden" is not confused with "md:max-lg:hidden").
    const has = (html: string, cls: string) => (html.match(/^<div class="([^"]*)"/)?.[1] ?? "").split(" ").includes(cls);
    const desktopOnly = h({ desktop: true, mobile: false }); // old "desktop" meant 768px and up, so tablets keep showing it
    expect(has(desktopOnly, "max-md:hidden")).toBe(true); expect(has(desktopOnly, "md:max-lg:hidden")).toBe(false); expect(has(desktopOnly, "lg:hidden")).toBe(false);
    const mobileOnly = h({ desktop: false, mobile: true });
    expect(has(mobileOnly, "md:max-lg:hidden")).toBe(true); expect(has(mobileOnly, "lg:hidden")).toBe(true); expect(has(mobileOnly, "max-md:hidden")).toBe(false);
    const noTablet = h({ desktop: true, mobile: true, tablet: false });
    expect(has(noTablet, "md:max-lg:hidden")).toBe(true); expect(has(noTablet, "max-md:hidden")).toBe(false); expect(has(noTablet, "lg:hidden")).toBe(false);
    const all = h({ desktop: true, mobile: true });
    expect(all).not.toContain("hidden");
    expect(render("en", [{ ...mk("heading", { heading: bi("Gone", "ذهب") }), visibility: { desktop: false, mobile: false, tablet: false } }])).not.toContain("Gone");
  });
  it("responsive spacing and content size", () => {
    const same = render("en", [mk("heading", { heading: bi("H", "ه"), style: { spacing: "lg" } })]);
    expect(same).toContain('class="py-14"'); // every device the same: one plain class, as before
    const per = render("en", [mk("heading", { heading: bi("H", "ه"), style: { spacing: "xl", spacingTablet: "md", spacingMobile: "none" } })]);
    expect(per).toContain("lg:py-24"); expect(per).toContain("md:max-lg:py-8"); expect(per).not.toContain("max-md:py");
    const sizes = render("en", [mk("heading", { heading: bi("H", "ه"), style: { fontSizeDesktop: "lg", fontSizeTablet: "inherit", fontSizeMobile: "sm" } })]);
    expect(sizes).toContain('data-fs-d="lg"'); expect(sizes).toContain('data-fs-t="lg"'); expect(sizes).toContain('data-fs-m="sm"');
    const auto = render("en", [mk("heading", { heading: bi("H", "ه"), style: { fontSizeDesktop: "xl", fontSizeMobile: "auto" } })]);
    expect(auto).toContain('data-fs-d="xl"'); expect(auto).toContain('data-fs-t="xl"'); expect(auto).not.toContain("data-fs-m");
  });
  it("typography: heading and text size, weight and line height, with phone overrides", () => {
    const html = render("en", [mk("heading", { heading: bi("H", "ه"), style: { headingSize: "lg", headingSizeMobile: "sm", textSize: "xl", headingWeight: "extrabold", lineHeight: "relaxed" } })]);
    expect(html).toContain('data-hs="lg"'); expect(html).toContain('data-hs-m="sm"'); expect(html).toContain('data-ts="xl"'); expect(html).toContain('data-ts-m="xl"');
    expect(html).toContain('data-hw="extrabold"'); expect(html).toContain('data-lh="relaxed"');
    const cleared = render("en", [mk("heading", { heading: bi("H", "ه"), style: { headingSize: "lg", headingSizeMobile: "auto", textSize: "auto", headingWeight: "auto", lineHeight: "auto" } })]);
    expect(cleared).toContain('data-hs="lg"'); expect(cleared).not.toContain("data-hs-m"); expect(cleared).not.toContain("data-ts"); expect(cleared).not.toContain("data-hw"); expect(cleared).not.toContain("data-lh");
    const onlyPhone = render("en", [mk("heading", { heading: bi("H", "ه"), style: { textSizeMobile: "lg" } })]);
    expect(onlyPhone).toContain('data-ts-m="lg"'); expect(onlyPhone).not.toContain('data-ts="');
  });
  it("text and accent colours, border and animation", () => {
    const html = render("en", [mk("heading", { heading: bi("H", "ه"), style: { textColor: "#112233", accentColor: "#ff6600", border: "accent", animation: "slideUp" } })]);
    expect(html).toContain("--text:#112233"); expect(html).toContain("--accent:#ff6600"); expect(html).toContain("border-accent"); expect(html).toContain("blk-anim-slide");
    const bad = render("en", [mk("heading", { heading: bi("H", "ه"), style: { textColor: "red;background:url(x)", accentColor: "#12" } })]);
    expect(bad).not.toContain("--text"); expect(bad).not.toContain("url(x)");
  });
  it("owner custom CSS is drawn scoped to its block; unsafe CSS and script text are not drawn", () => {
    const ok = render("en", [mk("heading", { heading: bi("H", "ه"), style: { customCss: "h2 { color: #ff6600; }" } })]);
    expect(ok).toContain('data-blk="heading"'); expect(ok).toContain('<style>[data-blk="heading"]{h2 { color: #ff6600; }}</style>');
    const bad = render("en", [mk("heading", { heading: bi("H", "ه"), style: { customCss: "</style><script>alert(1)</script>" } })]);
    expect(bad).not.toContain("<style>"); expect(bad).not.toContain("alert(1)"); expect(bad).not.toContain("data-blk");
    // JavaScript is never part of the server's HTML (it runs in the browser, after consent), but the block is marked for it.
    const js = render("en", [mk("heading", { heading: bi("H", "ه"), style: { customJs: "block.dataset.x = 'secret-marker';" } })]);
    expect(js).toContain('data-blk="heading"'); expect(js).not.toContain("secret-marker");
    expect(render("en", [mk("heading", { heading: bi("H", "ه") })])).not.toContain("data-blk");
  });
  it("section spacing and alignment are applied", () => {
    const html = render("en", [mk("heading", { heading: bi("H", "ه"), style: { spacing: "xl", textAlign: "end" } })]);
    expect(html).toContain("py-24"); expect(html).toContain("text-end");
  });
});
