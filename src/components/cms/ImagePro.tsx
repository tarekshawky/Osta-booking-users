"use client";

import { useId, useState } from "react";
import { Paragraphs, imgProps } from "@/components/cms/blockShared";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { telHref, whatsappHref } from "@/lib/site";

type P = Record<string, unknown>;
type Bi = { en: string; ar: string };
type O = Record<string, unknown>;

const obj = (v: unknown): O => (v && typeof v === "object" ? (v as O) : {});
const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const pick = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => (typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : d);
const hexOk = (v: unknown) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : "");
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

const SHADOW = { none: "none", sm: "0 2px 8px rgba(0,0,0,.18)", md: "0 8px 24px rgba(0,0,0,.28)", lg: "0 16px 48px rgba(0,0,0,.4)" } as const;
const SPACE = { none: "0px", sm: "12px", md: "24px", lg: "48px" } as const;

// The look of one advanced image as CSS, scoped to its own class so every image on a page can differ. Desktop first; tablets (up to 1023px)
// and phones (up to 639px) only override what their own settings change. Pure, so it can be tested.
export function imageProCss(cls: string, p: P, nat: { w: number; h: number } | null): string {
  const size = obj(p.size), pos = obj(p.position), frame = obj(p.frame), fx = obj(p.effects);
  const rules: string[] = [];
  const mode = pick(size.mode, ["auto", "original", "custom"] as const, "auto");
  const fit = pick(size.fit, ["cover", "contain", "fill", "none"] as const, "cover");
  const fx_ = clamp(num(size.focusX, 50), 0, 100), fy = clamp(num(size.focusY, 50), 0, 100);
  const crop = { t: clamp(num(size.cropTop), 0, 80) / 100, r: clamp(num(size.cropRight), 0, 80) / 100, b: clamp(num(size.cropBottom), 0, 80) / 100, l: clamp(num(size.cropLeft), 0, 80) / 100 };
  const cropped = crop.t + crop.r + crop.b + crop.l > 0 && crop.l + crop.r < 1 && crop.t + crop.b < 1;
  const rotate = clamp(num(size.rotate), 0, 359);
  const flips = `${size.flipH === "yes" ? " scaleX(-1)" : ""}${size.flipV === "yes" ? " scaleY(-1)" : ""}`;

  const width = (w: number, unit: string) => (w > 0 ? `width:${w}${unit === "px" ? "px" : "%"};max-width:100%;` : "");
  // Box width and height on the desktop.
  let box = "width:100%;";
  if (mode === "original") box = "width:auto;max-width:100%;";
  if (mode === "custom") box = width(num(size.width), pick(size.widthUnit, ["px", "%"] as const, "%")) || "width:100%;";
  if (num(size.maxWidth) > 0) box += `max-width:min(100%,${num(size.maxWidth)}px);`;
  const heightRule = (h: number, unit: string) => (h > 0 ? (unit === "%" ? `height:auto;aspect-ratio:100 / ${h};` : `height:${h}px;`) : "");
  const fixedHeight = mode === "custom" ? heightRule(num(size.height), pick(size.heightUnit, ["px", "%"] as const, "px")) : "";
  const maxHeight = num(size.maxHeight) > 0 ? `max-height:${num(size.maxHeight)}px;` : "";

  // Position and wrap.
  const align = pick(pos.align, ["start", "center", "end"] as const, "center");
  const wrap = pick(pos.wrap, ["none", "start", "end"] as const, "none");
  const alignCss = (a: string, w: string) => (w !== "none" ? `float:inline-${w === "start" ? "start" : "end"};margin-inline-${w === "start" ? "end" : "start"}:1.25rem;` : a === "start" ? "float:none;margin-inline-end:auto;" : a === "end" ? "float:none;margin-inline-start:auto;" : "float:none;margin-inline:auto;");
  const shiftX = clamp(num(pos.shiftX), 0, 1000), shiftY = clamp(num(pos.shiftY), 0, 1000);
  const m = (k: string) => clamp(num(pos[k]), 0, 300);
  const margins = `${m("marginTop") ? `margin-top:${m("marginTop")}px;` : ""}${m("marginBottom") ? `margin-bottom:${m("marginBottom")}px;` : ""}${m("marginStart") ? `margin-inline-start:${m("marginStart")}px;` : ""}${m("marginEnd") ? `margin-inline-end:${m("marginEnd")}px;` : ""}`;
  const shift = shiftX || shiftY ? `position:relative;inset-inline-start:${shiftX}px;top:${shiftY}px;` : "";

  rules.push(`.${cls}{display:block;${box}${alignCss(align, wrap)}${margins}${shift}padding-block:16px;}`);

  // Frame.
  const fstyle = pick(frame.style, ["none", "thin", "thick", "dashed", "round", "custom"] as const, "none");
  const bcol = hexOk(frame.color) || "#94a3b8";
  const bw = fstyle === "thin" ? 1 : fstyle === "thick" ? 4 : fstyle === "dashed" ? 2 : fstyle === "custom" ? clamp(num(frame.width, 2), 0, 30) : 0;
  const bstyle = fstyle === "dashed" ? "dashed" : "solid";
  const radius = fstyle === "round" ? "50%" : `${clamp(num(frame.radius), 0, 500)}px`;
  const shadow = SHADOW[pick(frame.shadow, ["none", "sm", "md", "lg"] as const, "none")];
  const bg = hexOk(frame.bgColor);
  const padding = clamp(num(pos.padding), 0, 200);
  rules.push(`.${cls} .ip-frame{position:relative;overflow:hidden;${fixedHeight}${maxHeight}border-radius:${radius};${bw ? `border:${bw}px ${bstyle} ${bcol};` : ""}box-shadow:${shadow};${bg ? `background:${bg};` : ""}${padding ? `padding:${padding}px;` : ""}transition:transform .25s ease,box-shadow .25s ease;}`);
  if (fstyle === "round" && !fixedHeight && !cropped) rules.push(`.${cls} .ip-frame{aspect-ratio:1 / 1;}`);

  // The picture.
  const ratio = nat && nat.w > 0 && nat.h > 0 ? ((nat.w * (1 - crop.l - crop.r)) / (nat.h * (1 - crop.t - crop.b))).toFixed(5) : "3 / 2";
  const filter = `${num(fx.grayscale) > 0 ? `grayscale(${clamp(num(fx.grayscale), 0, 100)}%)` : ""} ${num(fx.blur) > 0 ? `blur(${clamp(num(fx.blur), 0, 30)}px)` : ""}`.trim();
  const opacity = clamp(num(fx.opacity, 100), 0, 100);
  const common = `${filter ? `filter:${filter};` : ""}${opacity < 100 ? `opacity:${opacity / 100};` : ""}${rotate || flips ? `transform:${rotate ? `rotate(${rotate}deg)` : ""}${flips};` : ""}`;
  if (cropped) {
    const w = 100 / (1 - crop.l - crop.r), h = 100 / (1 - crop.t - crop.b);
    rules.push(`.${cls} .ip-crop{position:relative;overflow:hidden;width:100%;aspect-ratio:${ratio};}`);
    rules.push(`.${cls} .ip-img{position:absolute;max-width:none;width:${w.toFixed(3)}%;height:${h.toFixed(3)}%;left:${(-(crop.l / (1 - crop.l - crop.r)) * 100).toFixed(3)}%;top:${(-(crop.t / (1 - crop.t - crop.b)) * 100).toFixed(3)}%;object-fit:fill;${common}}`);
  } else {
    const fill = !!(fixedHeight || maxHeight || fstyle === "round");
    rules.push(`.${cls} .ip-img{display:block;width:${mode === "original" ? "auto" : "100%"};max-width:100%;height:${fixedHeight && !fixedHeight.includes("aspect") ? "100%" : fill && fstyle === "round" ? "100%" : "auto"};${maxHeight ? `max-height:${num(size.maxHeight)}px;` : ""}${fill ? `object-fit:${fit};object-position:${fx_}% ${fy}%;` : fit === "fill" ? "object-fit:fill;" : ""}${common}}`);
    if (fixedHeight.includes("aspect")) rules.push(`.${cls} .ip-img{height:100%;object-fit:${fit};object-position:${fx_}% ${fy}%;}`);
  }
  // Colour layer.
  const ov = hexOk(fx.overlayColor);
  if (ov && num(fx.overlayOpacity) > 0) rules.push(`.${cls} .ip-ov{position:absolute;inset:0;pointer-events:none;background:${ov};opacity:${clamp(num(fx.overlayOpacity), 0, 100) / 100};}`);
  // Hover.
  const hover = pick(fx.hover, ["none", "zoom", "lift", "brighten", "color"] as const, "none");
  if (hover === "zoom") rules.push(`.${cls} .ip-zoom{transition:transform .4s ease;}@media (hover:hover){.${cls}:hover .ip-zoom{transform:scale(1.07);}}`);
  if (hover === "lift") rules.push(`@media (hover:hover){.${cls}:hover .ip-frame{transform:translateY(-5px);box-shadow:${SHADOW.lg};}}`);
  if (hover === "brighten") rules.push(`.${cls} .ip-img{transition:filter .25s ease;}@media (hover:hover){.${cls}:hover .ip-img{filter:brightness(1.15);}}`);
  if (hover === "color") rules.push(`.${cls} .ip-img{transition:filter .25s ease;}@media (hover:hover){.${cls}:hover .ip-img{filter:grayscale(0%);}}`);
  rules.push(`.${cls} .ip-zoom{position:relative;overflow:hidden;height:100%;}`);

  // Tablet and phone overrides: 0 / "inherit" means "as on the desktop".
  const device = (d: O, query: string) => {
    let css = "";
    const w = num(d.width);
    if (w > 0) css += `${width(w, pick(d.widthUnit, ["px", "%"] as const, "%"))}`;
    if (num(d.maxWidth) > 0) css += `max-width:min(100%,${num(d.maxWidth)}px);`;
    const a = pick(d.align, ["inherit", "start", "center", "end"] as const, "inherit"), wr = pick(d.wrap, ["inherit", "none", "start", "end"] as const, "inherit");
    if (a !== "inherit" || wr !== "inherit") css += alignCss(a === "inherit" ? align : a, wr === "inherit" ? wrap : wr);
    const space = pick(d.space, ["inherit", "none", "sm", "md", "lg"] as const, "inherit");
    if (space !== "inherit") css += `padding-block:${SPACE[space]};`;
    const out: string[] = [];
    if (css) out.push(`.${cls}{${css}}`);
    if (num(d.height) > 0) out.push(`.${cls} .ip-frame{height:${num(d.height)}px;aspect-ratio:auto;}.${cls} .ip-img{height:100%;object-fit:${fit};object-position:${fx_}% ${fy}%;}`);
    if (num(d.maxHeight) > 0) out.push(`.${cls} .ip-frame{max-height:${num(d.maxHeight)}px;}.${cls} .ip-img{max-height:${num(d.maxHeight)}px;object-fit:${fit};object-position:${fx_}% ${fy}%;}`);
    return out.length ? `@media ${query}{${out.join("")}}` : "";
  };
  rules.push(device(obj(p.tablet), "(max-width:1023px)"), device(obj(p.mobile), "(max-width:639px)"));
  return rules.filter(Boolean).join("");
}

// The address a click goes to, or "" when the picture is not a link.
export function imageProHref(link: O, bi: (v: Bi) => string, settings: { whatsapp: string; phone: string }, lang: "en" | "ar", whatsapp: (m?: string) => string, tel: (p: string) => string): string {
  const type = pick(link.type, ["none", "external", "internal", "service", "product", "booking", "contact", "whatsapp", "phone", "custom"] as const, "none");
  const url = typeof link.url === "string" ? link.url.trim() : "";
  switch (type) {
    case "none": return "";
    case "booking": return "/pricing";
    case "contact": return "/contact";
    case "whatsapp": return whatsapp(bi(obj(link.whatsappText) as Bi) || undefined);
    case "phone": return settings.phone ? tel(settings.phone) : "";
    default: return url;
  }
}

export function ImageProBlock({ p }: { p: P }) {
  const { lang } = useLanguage();
  const { settings } = useSite();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `ip${uid}`;
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const bi = (v: unknown) => { const b = obj(v) as Partial<Bi>; return lang === "ar" ? b.ar || b.en || "" : b.en || b.ar || ""; };
  const url = typeof p.imageUrl === "string" ? p.imageUrl : "";
  if (!url) return null;

  const link = obj(p.link), banner = obj(p.banner), position = obj(p.position), size = obj(p.size);
  const href = imageProHref(link, bi as (v: Bi) => string, settings, lang, (m) => whatsappHref(settings, lang, m), telHref);
  const newTab = link.newTab === "yes";
  const rel = [newTab ? "noopener noreferrer" : "", link.nofollow === "yes" ? "nofollow" : "", link.sponsored === "yes" ? "sponsored" : ""].filter(Boolean).join(" ") || undefined;
  const linkTitle = bi(link.title) || undefined;
  const alt = bi(p.alt) || bi(p.caption);
  const title = bi(p.title) || undefined;
  const caption = bi(p.caption), credit = bi(p.credit), description = bi(p.description);
  const heading = bi(banner.heading), text = bi(banner.text), buttonLabel = bi(banner.buttonLabel);
  const hasBanner = !!(heading || text || buttonLabel);
  const wrap = pick(position.wrap, ["none", "start", "end"] as const, "none");
  const body = bi(p.body);
  const cropped = ["cropTop", "cropRight", "cropBottom", "cropLeft"].some((k) => num(size[k]) > 0);
  const css = imageProCss(cls, p, nat);
  const imgAttrs = imgProps(url, "(min-width: 1024px) 1100px, 100vw");
  const lazy = p.lazy === "no" ? { loading: "eager" as const, fetchPriority: "high" as const } : {};

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...imgAttrs} {...lazy} alt={alt} title={title} className="ip-img" onLoad={(e) => { const t = e.currentTarget; if (cropped && t.naturalWidth) setNat({ w: t.naturalWidth, h: t.naturalHeight }); }} />
  );
  const media = (
    <div className="ip-zoom">
      {cropped ? <div className="ip-crop">{img}</div> : img}
      <span className="ip-ov" aria-hidden />
    </div>
  );
  const ctaClass = { solid: "osta-btn-primary text-white", outline: "border-2 border-white text-white", light: "bg-white text-slate-900" }[pick(banner.buttonStyle, ["solid", "outline", "light"] as const, "solid")];
  const justify = { start: "flex-start", center: "center", end: "flex-end" } as const;
  const vAlign = justify[pick(banner.vertical, ["start", "center", "end"] as const, "center")], hAlign = justify[pick(banner.horizontal, ["start", "center", "end"] as const, "center")];
  const textColor = hexOk(banner.textColor) || "#ffffff";
  const overlayContent = hasBanner && (
    <div className="absolute inset-0 flex p-4 sm:p-8" style={{ alignItems: vAlign, justifyContent: hAlign, color: textColor, pointerEvents: "none" }}>
      <div className={`flex max-w-xl flex-col gap-2 sm:gap-3 ${banner.panel === "yes" ? "rounded-2xl bg-[rgba(5,11,26,.6)] p-4 sm:p-6" : ""}`} style={{ textAlign: hAlign === "center" ? "center" : "start", alignItems: hAlign === "center" ? "center" : "flex-start" }}>
        {heading && <h2 className="text-xl font-extrabold leading-tight sm:text-3xl" style={{ textShadow: banner.panel === "yes" ? undefined : "0 2px 12px rgba(0,0,0,.45)" }}>{heading}</h2>}
        {text && <p className="text-sm sm:text-base" style={{ textShadow: banner.panel === "yes" ? undefined : "0 1px 8px rgba(0,0,0,.45)" }}>{text}</p>}
        {buttonLabel && (href
          ? <a href={href} target={newTab ? "_blank" : undefined} rel={rel} title={linkTitle} className={`ip-cta mt-1 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold ${ctaClass}`} style={{ pointerEvents: "auto" }}>{buttonLabel}</a>
          : <span className={`mt-1 inline-flex rounded-xl px-5 py-2.5 text-sm font-bold ${ctaClass}`}>{buttonLabel}</span>)}
      </div>
    </div>
  );

  // The whole picture is the link: a wrapping anchor, or (with a banner button) the button's own anchor stretched over the picture.
  const stretched = !!(href && buttonLabel);
  const framed = (
    <div className="ip-frame">
      {href && !stretched ? <a href={href} target={newTab ? "_blank" : undefined} rel={rel} title={linkTitle} aria-label={linkTitle || alt || undefined} className="block h-full">{media}</a> : media}
      {overlayContent}
    </div>
  );
  const schema = description || credit || title ? { "@context": "https://schema.org", "@type": "ImageObject", contentUrl: url, ...(title ? { name: title } : {}), ...(caption ? { caption } : {}), ...(description ? { description } : {}), ...(credit ? { creditText: credit } : {}) } : null;
  const figure = (
    <figure className={cls}>
      <style dangerouslySetInnerHTML={{ __html: `${css}${stretched ? `.${cls} .ip-cta::after{content:"";position:absolute;inset:0;}` : ""}` }} />
      {framed}
      {(caption || credit) && <figcaption className="mt-2 text-center text-xs text-text-muted">{caption}{caption && credit ? " · " : ""}{credit && <span className="opacity-80">{credit}</span>}</figcaption>}
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />}
    </figure>
  );
  // Text that wraps around a floated picture has to live in the same flow as the picture.
  if (wrap !== "none" && body) return <div className="mx-auto w-full max-w-6xl px-5 py-4 [&::after]:clear-both [&::after]:block [&::after]:content-['']"><div className="text-text">{figure}<Paragraphs text={body} className="mb-3 text-text-muted" /></div></div>;
  return <div className="mx-auto w-full max-w-6xl px-5">{figure}</div>;
}
