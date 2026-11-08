import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { LanguageProvider } from "@/lib/language-context";
import { SiteProvider } from "@/lib/site-context";
import { DEFAULT_SITE } from "@/lib/site";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { imageProCss, imageProHref } from "@/components/cms/ImagePro";
import type { CmsBlock } from "@/lib/cms";

const bi = (en = "", ar = "") => ({ en, ar });
const base = () => ({
  imageUrl: "https://osta-invoices.vercel.app/api/media/abc123", alt: bi("AC cleaning offer", "عرض تنظيف المكيفات"), title: bi(), caption: bi(), description: bi(), credit: bi(), lazy: "yes", body: bi(),
  size: { mode: "auto", width: 0, widthUnit: "%", maxWidth: 0, height: 0, heightUnit: "px", maxHeight: 0, fit: "cover", focusX: 50, focusY: 50, cropTop: 0, cropRight: 0, cropBottom: 0, cropLeft: 0, rotate: 0, flipH: "no", flipV: "no" },
  position: { align: "center", wrap: "none", shiftX: 0, shiftY: 0, marginTop: 0, marginBottom: 0, marginStart: 0, marginEnd: 0, padding: 0 },
  frame: { style: "none", width: 2, radius: 12, shadow: "none" }, effects: { opacity: 100, grayscale: 0, blur: 0, overlayOpacity: 0, hover: "none" },
  link: { type: "none", url: "", whatsappText: bi(), newTab: "no", nofollow: "no", sponsored: "no", title: bi() },
  banner: { heading: bi(), text: bi(), buttonLabel: bi(), buttonStyle: "solid", vertical: "center", horizontal: "center", panel: "no" },
  tablet: { width: 0, widthUnit: "%", maxWidth: 0, height: 0, maxHeight: 0, align: "inherit", wrap: "inherit", space: "inherit" },
  mobile: { width: 0, widthUnit: "%", maxWidth: 0, height: 0, maxHeight: 0, align: "inherit", wrap: "inherit", space: "inherit" },
});
const merge = (over: Record<string, unknown>) => { const b = base() as Record<string, unknown>; for (const [k, v] of Object.entries(over)) b[k] = v && typeof v === "object" && !Array.isArray(v) && b[k] && typeof b[k] === "object" && !("en" in (v as object)) ? { ...(b[k] as object), ...(v as object) } : v; return b; };
const render = (over: Record<string, unknown>, lang: "en" | "ar" = "en") => {
  const block: CmsBlock = { id: "ip", type: "imagePro", props: merge(over), hidden: false, visibility: { desktop: true, mobile: true } };
  return renderToString(<LanguageProvider initialLang={lang}><SiteProvider site={DEFAULT_SITE}><BlockRenderer blocks={[block]} data={{ services: [], posts: [], sections: [], pricing: null, jobs: { listUrl: "", items: [] }, subPages: [], locations: [], catalog: [] } as never} /></SiteProvider></LanguageProvider>);
};

describe("advanced image: size, position and frame (CSS)", () => {
  it("is responsive by default and never wider than its container", () => {
    const css = imageProCss("c", base(), null); expect(css).toContain(".c{display:block;width:100%;"); expect(css).toContain("max-width:100%");
  });
  it("applies custom width, maximum width, height and fit with the focus point", () => {
    const css = imageProCss("c", merge({ size: { mode: "custom", width: 480, widthUnit: "px", maxWidth: 600, height: 300, fit: "cover", focusX: 20, focusY: 80 } }), null);
    expect(css).toContain("width:480px;max-width:100%;"); expect(css).toContain("max-width:min(100%,600px)"); expect(css).toContain("height:300px"); expect(css).toContain("object-position:20% 80%");
  });
  it("aligns, floats for text wrap, and moves the picture to a custom position", () => {
    expect(imageProCss("c", merge({ position: { align: "end" } }), null)).toContain("margin-inline-start:auto");
    expect(imageProCss("c", merge({ position: { wrap: "start" } }), null)).toContain("float:inline-start");
    expect(imageProCss("c", merge({ position: { wrap: "end" } }), null)).toContain("float:inline-end");
    expect(imageProCss("c", merge({ position: { shiftX: 30, shiftY: 10, marginTop: 20 } }), null)).toMatch(/inset-inline-start:30px;top:10px[\s\S]*|margin-top:20px/);
  });
  it("draws the frame styles, round frames, shadow and background", () => {
    expect(imageProCss("c", merge({ frame: { style: "thick", color: "#112233", shadow: "lg" } }), null)).toContain("border:4px solid #112233");
    expect(imageProCss("c", merge({ frame: { style: "dashed" } }), null)).toContain("2px dashed");
    expect(imageProCss("c", merge({ frame: { style: "round" } }), null)).toContain("border-radius:50%");
    expect(imageProCss("c", merge({ frame: { style: "custom", width: 7, radius: 24, bgColor: "#ffeeaa" } }), null)).toMatch(/border:7px solid[\s\S]*background:#ffeeaa/);
  });
  it("applies effects without touching the file: opacity, grayscale, blur, colour layer and hover", () => {
    const css = imageProCss("c", merge({ effects: { opacity: 60, grayscale: 100, blur: 3, overlayColor: "#000000", overlayOpacity: 40, hover: "zoom" } }), null);
    for (const w of ["opacity:0.6", "grayscale(100%)", "blur(3px)", "background:#000000", "opacity:0.4", "scale(1.07)"]) expect(css, w).toContain(w);
  });
  it("rotates, flips and crops", () => {
    expect(imageProCss("c", merge({ size: { rotate: 90, flipH: "yes", flipV: "yes" } }), null)).toContain("transform:rotate(90deg) scaleX(-1) scaleY(-1)");
    const crop = imageProCss("c", merge({ size: { cropLeft: 10, cropRight: 10, cropTop: 20, cropBottom: 0 } }), { w: 1000, h: 500 });
    expect(crop).toContain(".c .ip-crop{"); expect(crop).toContain("width:125.000%"); expect(crop).toContain("left:-12.500%"); expect(crop).toContain("aspect-ratio:2.00000");
  });
  it("lets tablets and phones override only what they change", () => {
    const css = imageProCss("c", merge({ tablet: { width: 80, align: "start" }, mobile: { width: 100, maxHeight: 220, space: "none", wrap: "none" } }), null);
    expect(css).toContain("@media (max-width:1023px){.c{width:80%;max-width:100%;float:none;margin-inline-end:auto;}}");
    expect(css).toMatch(/@media \(max-width:639px\)\{\.c\{width:100%;max-width:100%;float:none;margin-inline:auto;padding-block:0px;\}/);
    expect(css).toContain("max-height:220px");
    expect(imageProCss("c", base(), null)).not.toContain("@media (max-width");
  });
});

describe("advanced image: link types", () => {
  const settings = { whatsapp: "971568676036", phone: "+971568676036" };
  const wa = (m?: string) => `https://wa.me/971568676036${m ? `?text=${encodeURIComponent(m)}` : ""}`;
  const href = (link: Record<string, unknown>, lang: "en" | "ar" = "en") => imageProHref({ ...base().link, ...link }, (v) => (lang === "ar" ? v.ar || v.en : v.en || v.ar), settings, lang, wa, (p) => `tel:${p}`);
  it("resolves every link type", () => {
    expect(href({ type: "none" })).toBe(""); expect(href({ type: "external", url: "https://example.com/a" })).toBe("https://example.com/a"); expect(href({ type: "internal", url: "/about" })).toBe("/about");
    expect(href({ type: "service", url: "/split-ac-installation" })).toBe("/split-ac-installation"); expect(href({ type: "product", url: "/p/x" })).toBe("/p/x"); expect(href({ type: "booking" })).toBe("/pricing"); expect(href({ type: "contact" })).toBe("/contact");
    expect(href({ type: "whatsapp", whatsappText: bi("Hello Osta", "مرحباً") })).toBe(wa("Hello Osta")); expect(href({ type: "whatsapp", whatsappText: bi("Hello Osta", "مرحباً") }, "ar")).toBe(wa("مرحباً")); expect(href({ type: "phone" })).toBe("tel:+971568676036"); expect(href({ type: "custom", url: "mailto:a@b.ae" })).toBe("mailto:a@b.ae");
  });
});

describe("advanced image: rendering", () => {
  it("renders alt text in the visitor's language, lazy loading and the image", () => {
    const en = render({}); expect(en).toContain('alt="AC cleaning offer"'); expect(en).toContain('loading="lazy"'); expect(en).toContain("/api/media/abc123");
    expect(render({}, "ar")).toContain('alt="عرض تنظيف المكيفات"');
    expect(render({ lazy: "no" })).toContain('loading="eager"');
    expect(render({ imageUrl: "" })).not.toContain("<img");
  });
  it("makes the whole picture a link with the chosen attributes", () => {
    const h = render({ link: { type: "booking", newTab: "yes", nofollow: "yes", sponsored: "yes", title: bi("Book AC cleaning") } });
    expect(h).toContain('href="/pricing"'); expect(h).toContain('target="_blank"'); expect(h).toContain('rel="noopener noreferrer nofollow sponsored"'); expect(h).toContain('title="Book AC cleaning"');
    expect(render({})).not.toContain("<a ");
  });
  it("turns a banner with a title and a button into one click target stretched over the picture", () => {
    const h = render({ link: { type: "whatsapp", whatsappText: bi("Hi", "مرحبا") }, banner: { heading: bi("AC Cleaning Offer", "عرض تنظيف المكيفات"), text: bi("From AED 99", "ابتداءً من 99"), buttonLabel: bi("Book now", "احجز الآن") } });
    expect(h).toContain("AC Cleaning Offer"); expect(h).toContain("From AED 99"); expect(h).toContain("Book now"); expect(h).toContain("https://wa.me/"); expect(h).toContain("ip-cta::after");
    expect((h.match(/<a /g) ?? []).length).toBe(1); // one anchor, never nested links
  });
  it("shows caption and credit, and describes the picture for search engines", () => {
    const h = render({ caption: bi("Summer offer"), credit: bi("Photo: Osta"), description: bi("A technician cleaning a split AC"), title: bi("AC cleaning") });
    expect(h).toContain("Summer offer"); expect(h).toContain("Photo: Osta"); expect(h).toContain('"@type":"ImageObject"'); expect(h).toContain("A technician cleaning a split AC");
  });
  it("wraps text around a floated picture", () => {
    const h = render({ position: { wrap: "start" }, body: bi("Text that wraps beside the picture.") }); expect(h).toContain("Text that wraps beside the picture."); expect(h).toContain("float:inline-start");
  });
});
