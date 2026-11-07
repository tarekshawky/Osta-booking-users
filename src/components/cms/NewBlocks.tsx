"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { DynamicIcon } from "@/components/DynamicIcon";
import { RichInline } from "@/components/cms/RichInline";
import { Paragraphs, SmartLink, imgProps, isHex, oneOf, useBi } from "@/components/cms/blockShared";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { telHref, whatsappHref } from "@/lib/site";
import type { BlockData } from "@/lib/cms-data";
import type { Bi, Cta } from "@/lib/cms";

type P = Record<string, unknown>;
const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : "");

// ---- shared bits ----
const CURRENCY: Record<string, { en: string; ar: string; after: boolean }> = {
  AED: { en: "AED", ar: "د.إ", after: true }, USD: { en: "$", ar: "$", after: false }, SAR: { en: "SAR", ar: "ر.س", after: true }, EUR: { en: "€", ar: "€", after: false },
};

function Price({ price, oldPrice, currency, big, color }: { price: string; oldPrice?: string; currency: unknown; big?: boolean; color?: string }) {
  const { lang } = useLanguage();
  const c = CURRENCY[str(currency)] ?? CURRENCY.AED;
  const sym = lang === "ar" ? c.ar : c.en;
  // English puts the currency first ("AED 150", "$99"); Arabic puts a currency word after the number ("150 د.إ").
  const fmt = (v: string) => (lang === "ar" && c.after ? `${v} ${sym}` : /^[A-Z]{3}$/.test(sym) ? `${sym} ${v}` : `${sym}${v}`);
  if (!price.trim()) return null;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2" style={color ? { color } : undefined}>
      <span className={`${big ? "text-3xl" : "text-xl"} font-extrabold ${color ? "" : "text-text"}`}>{fmt(price.trim())}</span>
      {oldPrice?.trim() && <span className="text-sm line-through opacity-50">{fmt(oldPrice.trim())}</span>}
    </p>
  );
}

// "-25%" from an old and a current price typed as numbers ("1,200", "150.5"); null when they cannot be compared.
function discountPercent(price: string, oldPrice: string): number | null {
  const n = (v: string) => Number(v.replace(/,/g, "").trim());
  const a = n(price), b = n(oldPrice);
  if (!(a > 0) || !(b > a)) return null;
  return Math.round((1 - a / b) * 100);
}

const BADGE: Record<string, Bi> = {
  featured: { en: "Featured", ar: "مميز" }, popular: { en: "Popular", ar: "الأكثر طلباً" }, bestSeller: { en: "Best seller", ar: "الأكثر مبيعاً" }, new: { en: "New", ar: "جديد" }, offer: { en: "Special offer", ar: "عرض خاص" }, limited: { en: "Limited time", ar: "لفترة محدودة" },
};
function BadgePill({ kind }: { kind: unknown }) {
  const bi = useBi();
  const b = BADGE[str(kind)];
  return b ? <span className="inline-block rounded-full bg-orange-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">{bi(b)}</span> : null;
}

function FeatureIcon({ name, className }: { name?: string; className?: string }) {
  return name ? <DynamicIcon name={name} size={16} className={className} aria-hidden /> : <Check size={16} className={className} aria-hidden />;
}

function Stars({ rating, reviews, color }: { rating: number; reviews: number; color?: string }) {
  if (!(rating > 0)) return null;
  const r = Math.min(5, rating);
  return (
    <p className="flex items-center gap-1.5 text-xs" style={color ? { color } : undefined} aria-label={`${r.toFixed(1)} / 5`}>
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} className={i <= Math.round(r) ? "fill-amber-400 text-amber-400" : "text-slate-400"} />)}
      </span>
      <span className="font-semibold">{r.toFixed(1)}</span>
      {reviews > 0 && <span className="opacity-60">({reviews.toLocaleString("en-US")})</span>}
    </p>
  );
}

function Heading({ eyebrow, heading, subtitle, center = true }: { eyebrow?: string; heading?: string; subtitle?: string; center?: boolean }) {
  if (!eyebrow && !heading && !subtitle) return null;
  return (
    <div className={`mb-8 ${center ? "text-center" : ""}`}>
      {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-2">{eyebrow}</p>}
      {heading && <h2 className="text-2xl font-bold text-text sm:text-3xl">{heading}</h2>}
      {subtitle && <div className={`mt-3 flex max-w-2xl flex-col gap-2 text-sm text-text-muted ${center ? "mx-auto" : ""}`}><Paragraphs text={subtitle} /></div>}
    </div>
  );
}

const COLS: Record<string, string> = { "2": "sm:grid-cols-2", "3": "sm:grid-cols-2 lg:grid-cols-3", "4": "sm:grid-cols-2 lg:grid-cols-4" };
const RATIO: Record<string, string> = { "1:1": "aspect-square", "3:2": "aspect-[3/2]", "16:9": "aspect-video", "21:9": "aspect-[21/9]", auto: "" };

// ---- A. Text & content ----
export function HeadingBlock({ p }: { p: P }) {
  const bi = useBi();
  const size = oneOf(p.size, ["md", "lg", "xl"] as const, "lg");
  const center = p.align !== "start";
  return (
    <section className={`mx-auto w-full max-w-4xl px-5 py-10 ${center ? "text-center" : ""}`}>
      {bi(p.eyebrow as Bi) && <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-2">{bi(p.eyebrow as Bi)}</p>}
      {bi(p.heading as Bi) && <h2 className={`font-bold text-text ${size === "md" ? "text-2xl" : size === "lg" ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"}`}>{bi(p.heading as Bi)}</h2>}
      {bi(p.subtitle as Bi) && <div className={`mt-4 flex max-w-2xl flex-col gap-2 text-base text-text-muted ${center ? "mx-auto" : ""}`}><Paragraphs text={bi(p.subtitle as Bi)} /></div>}
    </section>
  );
}

export function ListBlock({ p }: { p: P }) {
  const bi = useBi();
  const variant = oneOf(p.variant, ["bullet", "check", "number"] as const, "check");
  const items = list<{ icon?: string; text: Bi }>(p.items).filter((i) => bi(i.text));
  if (!items.length && !bi(p.heading as Bi)) return null;
  const Tag = variant === "number" ? "ol" : "ul";
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-10">
      {bi(p.heading as Bi) && <h2 className="mb-5 text-2xl font-bold text-text">{bi(p.heading as Bi)}</h2>}
      <Tag className={`grid gap-x-8 gap-y-3 ${p.columns === "2" ? "sm:grid-cols-2" : ""}`}>
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-text-muted sm:text-base">
            {variant === "check" ? (
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-2"><FeatureIcon name={it.icon} /></span>
            ) : variant === "number" ? (
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
            ) : (
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-2" aria-hidden />
            )}
            <span className="text-text"><RichInline text={bi(it.text)} /></span>
          </li>
        ))}
      </Tag>
    </section>
  );
}

export function QuoteBlock({ p }: { p: P }) {
  const bi = useBi();
  const accent = isHex(p.accentColor) ? p.accentColor : undefined;
  if (!bi(p.text as Bi)) return null;
  const highlight = p.variant === "highlight";
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-10">
      <figure className={`rounded-2xl p-6 sm:p-8 ${highlight ? "border bg-card" : "border-s-4 bg-card/60"}`} style={{ borderColor: accent ?? "var(--accent)" }}>
        <blockquote className={`${highlight ? "text-base" : "text-xl italic sm:text-2xl"} leading-relaxed text-text`}><Paragraphs text={bi(p.text as Bi)} /></blockquote>
        {(bi(p.author as Bi) || bi(p.role as Bi)) && (
          <figcaption className="mt-4 text-sm">
            <span className="font-semibold text-text">{bi(p.author as Bi)}</span>
            {bi(p.role as Bi) && <span className="text-text-muted">{bi(p.author as Bi) ? " — " : ""}{bi(p.role as Bi)}</span>}
          </figcaption>
        )}
      </figure>
    </section>
  );
}

const TONES: Record<string, string> = { blue: "bg-accent text-white", orange: "bg-orange-500 text-white", green: "bg-emerald-600 text-white", dark: "bg-slate-900 text-white border-y border-white/10" };
export function AnnouncementBlock({ p }: { p: P }) {
  const bi = useBi();
  const link = p.link as Cta | undefined;
  if (!bi(p.text as Bi)) return null;
  const icon = str(p.icon);
  return (
    <div role="note" className={`${TONES[str(p.tone)] ?? TONES.blue} px-5 py-2.5 text-center text-sm font-medium`}>
      <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-2">{icon && <DynamicIcon name={icon} size={16} aria-hidden />}{bi(p.text as Bi)}</span>
        {link?.url && bi(link.label) && <SmartLink href={link.url} className="font-bold underline underline-offset-4">{bi(link.label)}</SmartLink>}
      </span>
    </div>
  );
}

// ---- B. Images & layouts ----
export function GalleryBlock({ p }: { p: P }) {
  const bi = useBi();
  const images = list<{ imageUrl: string; alt: Bi; caption: Bi }>(p.images).filter((i) => i.imageUrl);
  if (!images.length) return null;
  const ratio = RATIO[str(p.ratio)] ?? "aspect-[3/2]";
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12">
      <Heading heading={bi(p.heading as Bi)} />
      <div className={`grid grid-cols-1 gap-4 ${COLS[str(p.columns)] ?? COLS["3"]}`}>
        {images.map((im, i) => (
          <figure key={i} className="overflow-hidden rounded-xl border border-card-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img {...imgProps(im.imageUrl, "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw")} alt={bi(im.alt)} className={`h-auto w-full object-cover ${ratio}`} />
            {bi(im.caption) && <figcaption className="px-3 py-2 text-xs text-text-muted">{bi(im.caption)}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

export function SliderBlock({ p }: { p: P }) {
  const bi = useBi();
  const { lang } = useLanguage();
  const slides = list<{ imageUrl: string; heading: Bi; text: Bi; cta: Cta }>(p.slides).filter((s) => s.imageUrl);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const auto = p.autoplay !== "no";
  useEffect(() => {
    if (!auto || paused || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % count), 5500);
    return () => window.clearInterval(id);
  }, [auto, paused, count]);
  if (!count) return null;
  const cur = slides[Math.min(i, count - 1)];
  const go = (d: number) => setI((x) => (x + d + count) % count);
  // In Arabic the "next" arrow points left.
  const Prev = lang === "ar" ? ChevronRight : ChevronLeft;
  const Next = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label={bi(p.heading as Bi) || "Slider"}>
      <Heading heading={bi(p.heading as Bi)} />
      <div className={`relative overflow-hidden rounded-2xl border border-card-border bg-card ${RATIO[str(p.ratio)] ?? "aspect-video"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={i} {...imgProps(cur.imageUrl, "(min-width: 1024px) 1100px, 100vw")} alt={bi(cur.heading) || ""} className="absolute inset-0 h-full w-full object-cover" />
        {(bi(cur.heading) || bi(cur.text) || (cur.cta?.url && bi(cur.cta.label))) && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 bg-gradient-to-t from-black/75 to-transparent p-5 pt-16 text-white sm:p-8 sm:pt-20">
            {bi(cur.heading) && <h3 className="text-xl font-bold sm:text-3xl">{bi(cur.heading)}</h3>}
            {bi(cur.text) && <p className="max-w-xl text-sm text-white/85">{bi(cur.text)}</p>}
            {cur.cta?.url && bi(cur.cta.label) && <SmartLink href={cur.cta.url} className="osta-btn-primary mt-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-white">{bi(cur.cta.label)}</SmartLink>}
          </div>
        )}
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={lang === "ar" ? "السابق" : "Previous slide"} className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"><Prev size={20} aria-hidden /></button>
            <button type="button" onClick={() => go(1)} aria-label={lang === "ar" ? "التالي" : "Next slide"} className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"><Next size={20} aria-hidden /></button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Slides">
          {slides.map((_, n) => (
            <button key={n} type="button" role="tab" aria-selected={n === i} aria-label={`${n + 1} / ${count}`} onClick={() => setI(n)} className={`h-2 rounded-full transition-all ${n === i ? "w-6 bg-accent" : "w-2 bg-card-border"}`} />
          ))}
        </div>
      )}
    </section>
  );
}

export function BgSectionBlock({ p }: { p: P }) {
  const bi = useBi();
  const img = str(p.imageUrl);
  const cta = p.cta as Cta | undefined;
  const strength = typeof p.overlay === "number" ? Math.min(100, Math.max(0, p.overlay)) : 55;
  const hex = isHex(p.overlayColor) ? p.overlayColor : "#050b1a";
  const [r, g, b] = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
  const layer = `rgba(${r},${g},${b},${strength / 100})`;
  const url = /\/api\/media\/[^/?]+$/.test(img) ? `${img}?w=1600` : img;
  const height = oneOf(p.height, ["sm", "md", "lg"] as const, "md");
  const center = p.align !== "start";
  return (
    <section
      className={`flex w-full items-center ${height === "sm" ? "min-h-[260px]" : height === "lg" ? "min-h-[520px]" : "min-h-[380px]"}`}
      style={img ? { backgroundImage: `linear-gradient(${layer},${layer}), url(${url})`, backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: "#0c1a33" }}
    >
      <div className={`mx-auto w-full max-w-4xl px-5 py-14 text-white ${center ? "text-center" : ""}`}>
        {bi(p.heading as Bi) && <h2 className="text-3xl font-bold sm:text-4xl">{bi(p.heading as Bi)}</h2>}
        {bi(p.body as Bi) && <div className={`mt-4 flex max-w-2xl flex-col gap-2 text-base text-white/85 ${center ? "mx-auto" : ""}`}><Paragraphs text={bi(p.body as Bi)} /></div>}
        {cta?.url && bi(cta.label) && <SmartLink href={cta.url} className="osta-btn-primary mt-7 inline-block rounded-xl px-7 py-3 text-sm font-semibold text-white">{bi(cta.label)}</SmartLink>}
      </div>
    </section>
  );
}

// ---- C. Products & services ----
type CatalogService = { nameEn: string; nameAr: string; slug: string | null; bookSlug: string | null };
function findCatalogueService(catalog: BlockData["catalog"], key: string): CatalogService | null {
  if (!key) return null;
  for (const c of catalog) for (const s of c.services) if (s.bookSlug === key || s.slug === key) return s as CatalogService;
  return null;
}
const bookUrl = (s: CatalogService | null) => (s?.bookSlug ? `/pricing?service=${encodeURIComponent(s.bookSlug)}` : "/pricing");

// Secondary button: Call and WhatsApp always use the official contact details from Site & Contact.
function useContactLinks() {
  const { lang } = useLanguage();
  const { settings } = useSite();
  return {
    call: settings.phone ? telHref(settings.phone) : "",
    whatsapp: settings.whatsapp ? whatsappHref(settings, lang) : "",
  };
}

const SHADOW: Record<string, string> = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-xl" };
const RADIUS: Record<string, string> = { none: "rounded-none", md: "rounded-md", xl: "rounded-xl", "2xl": "rounded-2xl" };

export function ShowcaseBlock({ p, catalog }: { p: P; catalog: BlockData["catalog"] }) {
  const bi = useBi();
  const { lang } = useLanguage();
  const links = useContactLinks();
  const svc = p.source === "catalogue" ? findCatalogueService(catalog, str(p.catalogueKey)) : null;
  const name = bi(p.name as Bi) || (svc ? (lang === "ar" ? svc.nameAr || svc.nameEn : svc.nameEn || svc.nameAr) : "");
  const primary = p.primary as Cta | undefined;
  const primaryUrl = primary?.url || (svc ? bookUrl(svc) : "");
  const primaryLabel = bi(primary?.label) || (primaryUrl ? (lang === "ar" ? "احجز الآن" : "Book now") : "");
  const features = list<{ icon?: string; text: Bi }>(p.features).filter((f) => bi(f.text));
  const bg = isHex(p.bgColor) ? p.bgColor : undefined;
  const ink = isHex(p.textColor) ? p.textColor : undefined;
  const priceInk = isHex(p.priceColor) ? p.priceColor : ink;
  const pictures = [str(p.imageUrl), ...list<{ imageUrl: string }>(p.gallery).map((g) => str(g.imageUrl))].filter(Boolean);
  const [active, setActive] = useState(0);
  const img = pictures[Math.min(active, Math.max(0, pictures.length - 1))] ?? "";
  const position = oneOf(p.imagePosition, ["start", "end", "top"] as const, "end");
  const card = p.layout === "card" || position === "top";
  const dark = p.buttonStyle === "dark";
  const sec = str(p.secondaryType);
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const secUrl =
    sec === "call" ? links.call : sec === "whatsapp" ? links.whatsapp : sec === "quote" ? str(p.secondaryUrl) || "/contact"
    : sec === "learn" ? str(p.secondaryUrl) || (svc?.slug ? `/${svc.slug}` : "") : sec === "buy" || sec === "custom" ? str(p.secondaryUrl) : "";
  const secDefault = { call: t("Call now", "اتصل الآن"), whatsapp: t("WhatsApp", "واتساب"), quote: t("Request a quote", "اطلب عرض سعر"), learn: t("Learn more", "اعرف المزيد"), buy: t("Buy now", "اشترِ الآن"), custom: "" }[sec] ?? "";
  const secLabel = sec === "call" || sec === "whatsapp" ? secDefault : bi(p.secondaryLabel as Bi) || secDefault;
  if (!name && !img) return null;
  const muted = ink ? { color: ink, opacity: 0.75 } : undefined;
  const priceLabel = bi(p.priceLabel as Bi) || (p.startingFrom === "yes" ? t("Starting price", "السعر يبدأ من") : "");
  const priceNote = [priceLabel, bi(p.priceUnit as Bi)].filter(Boolean).join(" · ");
  const off = p.showDiscount === "yes" ? discountPercent(str(p.price), str(p.oldPrice)) : null;
  const radius = RADIUS[str(p.radius)] ?? RADIUS["2xl"];

  const picture = img ? (
    <div className="flex flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...imgProps(img, card ? "(min-width: 768px) 480px, 100vw" : "(min-width: 768px) 45vw, 100vw")} alt={bi(p.imageAlt as Bi) || name} className="aspect-[4/3] h-auto w-full rounded-xl bg-white object-cover" />
      {pictures.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {pictures.map((u, n) => (
            <button key={n} type="button" onClick={() => setActive(n)} aria-label={`${n + 1} / ${pictures.length}`} aria-pressed={n === active} className={`overflow-hidden rounded-lg border-2 ${n === active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={/\/api\/media\/[^/?]+$/.test(u) ? `${u}?w=480` : u} alt="" loading="lazy" decoding="async" className="aspect-square h-auto w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;
  const body = (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <BadgePill kind={p.badge} />
        {off !== null && <span className="inline-block rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">{`-${off}%`}</span>}
        <Stars rating={Number(p.rating) || 0} reviews={Number(p.reviews) || 0} color={ink} />
      </div>
      <div>
        <h2 className={`text-2xl font-bold sm:text-3xl ${ink ? "" : "text-text"}`} style={ink ? { color: ink } : undefined}>{name}</h2>
        {bi(p.subtitle as Bi) && <p className={`mt-1 text-sm ${ink ? "" : "text-text-muted"}`} style={muted}>{bi(p.subtitle as Bi)}</p>}
      </div>
      <div>
        <Price price={str(p.price)} oldPrice={str(p.oldPrice)} currency={p.currency} big color={priceInk} />
        {priceNote && <p className={`mt-1 text-xs ${ink ? "" : "text-text-muted"}`} style={muted}>{priceNote}</p>}
      </div>
      {bi(p.description as Bi) && <div className={`flex flex-col gap-2 text-sm ${ink ? "" : "text-text-muted"}`} style={muted}><Paragraphs text={bi(p.description as Bi)} /></div>}
      {features.length > 0 && (
        <div className="border-t pt-4" style={{ borderColor: ink ? `${ink}33` : "var(--card-border)" }}>
          {bi(p.featuresHeading as Bi) && <h3 className={`mb-3 text-base font-bold ${ink ? "" : "text-text"}`} style={ink ? { color: ink } : undefined}>{bi(p.featuresHeading as Bi)}</h3>}
          <ul className="flex flex-col gap-2.5">
            {features.map((f, i) => (
              <li key={i} className={`flex items-start gap-2.5 text-sm ${ink ? "" : "text-text"}`} style={ink ? { color: ink } : undefined}>
                <span className="mt-0.5 shrink-0 text-emerald-500"><FeatureIcon name={f.icon} /></span>
                {bi(f.text)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {((primaryUrl && primaryLabel) || (secUrl && sec !== "none" && secLabel)) && (
        <div className="mt-1 grid gap-3 sm:grid-cols-2 [&>*:only-child]:sm:col-span-2">
          {sec !== "none" && secUrl && secLabel && dark && (
            <SmartLink href={secUrl} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-500 hover:bg-emerald-500/10">
              {(sec === "call" || sec === "whatsapp") && <DynamicIcon name={sec === "call" ? "Phone" : "MessageCircle"} size={16} aria-hidden />}
              {secLabel}
            </SmartLink>
          )}
          {primaryUrl && primaryLabel && (
            <SmartLink href={primaryUrl} className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white ${dark ? "bg-slate-900 hover:bg-black" : "osta-btn-primary"}`}>{primaryLabel}</SmartLink>
          )}
          {sec !== "none" && secUrl && secLabel && !dark && (
            <SmartLink href={secUrl} className="inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold hover:opacity-80" style={{ borderColor: ink ?? "var(--card-border)", color: ink ?? "var(--text)" }}>
              {(sec === "call" || sec === "whatsapp") && <DynamicIcon name={sec === "call" ? "Phone" : "MessageCircle"} size={16} aria-hidden />}
              {secLabel}
            </SmartLink>
          )}
        </div>
      )}
    </div>
  );
  return (
    <section className={`mx-auto w-full px-5 py-12 ${card ? "max-w-xl" : "max-w-6xl"}`}>
      <div className={`${bg ? "" : "osta-card"} ${radius} ${SHADOW[str(p.shadow)] ?? ""} overflow-hidden p-5 sm:p-8 ${card || !img ? "flex flex-col gap-6" : "grid items-center gap-8 md:grid-cols-2"}`} style={bg ? { backgroundColor: bg } : undefined}>
        {card ? <>{picture}{body}</> : position === "start" ? <>{picture}{body}</> : <>{body}{picture}</>}
      </div>
    </section>
  );
}

export function CardsGridBlock({ p }: { p: P }) {
  const bi = useBi();
  const cards = list<{ imageUrl: string; name: Bi; description: Bi; price: string; oldPrice: string; badge: string; cta: Cta }>(p.cards).filter((c) => bi(c.name) || c.imageUrl);
  if (!cards.length) return null;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12">
      <Heading heading={bi(p.heading as Bi)} subtitle={bi(p.subtitle as Bi)} />
      <div className={`grid grid-cols-1 gap-5 ${COLS[str(p.columns)] ?? COLS["3"]}`}>
        {cards.map((c, i) => (
          <article key={i} className="osta-card flex flex-col overflow-hidden">
            {c.imageUrl && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img {...imgProps(c.imageUrl, "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw")} alt="" className="aspect-[4/3] h-auto w-full object-cover" />
                {c.badge !== "none" && <span className="absolute start-3 top-3"><BadgePill kind={c.badge} /></span>}
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2 p-5">
              {!c.imageUrl && c.badge !== "none" && <div><BadgePill kind={c.badge} /></div>}
              <h3 className="text-lg font-bold text-text">{bi(c.name)}</h3>
              {bi(c.description) && <p className="text-sm text-text-muted">{bi(c.description)}</p>}
              <div className="mt-auto flex flex-col gap-3 pt-2">
                <Price price={c.price} oldPrice={c.oldPrice} currency={p.currency} />
                {c.cta?.url && bi(c.cta.label) && <SmartLink href={c.cta.url} className="osta-btn-primary self-start rounded-xl px-5 py-2.5 text-sm font-semibold text-white">{bi(c.cta.label)}</SmartLink>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BenefitsBlock({ p }: { p: P }) {
  const bi = useBi();
  const items = list<{ icon?: string; title: Bi; text: Bi }>(p.items).filter((i) => bi(i.title) || bi(i.text));
  if (!items.length) return null;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12">
      <Heading eyebrow={bi(p.eyebrow as Bi)} heading={bi(p.heading as Bi)} subtitle={bi(p.subtitle as Bi)} />
      <div className={`grid grid-cols-1 gap-4 ${COLS[str(p.columns)] ?? COLS["3"]}`}>
        {items.map((it, i) => (
          <div key={i} className="osta-card flex flex-col gap-3 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent-2"><DynamicIcon name={str(it.icon) || "Sparkles"} size={22} aria-hidden /></span>
            {bi(it.title) && <h3 className="text-base font-bold text-text">{bi(it.title)}</h3>}
            {bi(it.text) && <p className="text-sm text-text-muted">{bi(it.text)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function PricingBlock({ p }: { p: P }) {
  const bi = useBi();
  const plans = list<{ name: Bi; price: string; period: Bi; description: Bi; features: { text: Bi }[]; badge: Bi; highlighted: string; cta: Cta }>(p.plans).filter((x) => bi(x.name) || x.price);
  if (!plans.length) return null;
  const cols = plans.length >= 3 ? "lg:grid-cols-3" : plans.length === 2 ? "md:grid-cols-2 md:max-w-3xl md:mx-auto" : "max-w-sm mx-auto";
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12">
      <Heading heading={bi(p.heading as Bi)} subtitle={bi(p.subtitle as Bi)} />
      <div className={`grid grid-cols-1 items-stretch gap-5 ${cols}`}>
        {plans.map((pl, i) => {
          const hi = pl.highlighted === "yes";
          return (
            <article key={i} className={`osta-card relative flex flex-col gap-4 p-6 ${hi ? "border-accent ring-2 ring-accent/60 lg:-translate-y-2" : ""}`}>
              {bi(pl.badge) && <span className="absolute -top-3 start-6 rounded-full bg-orange-500 px-3 py-0.5 text-[11px] font-semibold text-white">{bi(pl.badge)}</span>}
              <div>
                <h3 className="text-lg font-bold text-text">{bi(pl.name)}</h3>
                {bi(pl.description) && <p className="mt-1 text-sm text-text-muted">{bi(pl.description)}</p>}
              </div>
              <div className="flex items-baseline gap-2"><Price price={pl.price} currency={p.currency} big />{bi(pl.period) && <span className="text-sm text-text-muted">{bi(pl.period)}</span>}</div>
              <ul className="flex flex-1 flex-col gap-2">
                {list<{ text: Bi }>(pl.features).filter((f) => bi(f.text)).map((f, k) => (
                  <li key={k} className="flex items-start gap-2.5 text-sm text-text"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden />{bi(f.text)}</li>
                ))}
              </ul>
              {pl.cta?.url && bi(pl.cta.label) && (
                <SmartLink href={pl.cta.url} className={`rounded-xl px-5 py-3 text-center text-sm font-semibold ${hi ? "osta-btn-primary text-white" : "border border-card-border text-text hover:border-accent"}`}>{bi(pl.cta.label)}</SmartLink>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ComparisonBlock({ p }: { p: P }) {
  const bi = useBi();
  const cols = list<{ name: Bi; highlighted: string }>(p.columns);
  const rows = list<{ label: Bi; values: { v: string }[] }>(p.rows).filter((r) => bi(r.label));
  if (cols.length < 2 || !rows.length) return null;
  const cell = (v: string) => {
    const t = v.trim();
    if (t === "✓" || t === "✔" || /^(yes|نعم)$/i.test(t)) return <Check size={18} className="mx-auto text-emerald-500" aria-label="yes" />;
    if (t === "✗" || t === "✘" || t === "×" || /^(no|لا)$/i.test(t)) return <span className="text-text-faint" aria-label="no">—</span>;
    return t;
  };
  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-12">
      <Heading heading={bi(p.heading as Bi)} subtitle={bi(p.subtitle as Bi)} />
      <div className="overflow-x-auto rounded-2xl border border-card-border">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="bg-card">
              <th scope="col" className="p-4 text-start font-medium text-text-muted"><span className="sr-only">Feature</span></th>
              {cols.map((c, i) => <th key={i} scope="col" className={`p-4 text-center font-bold ${c.highlighted === "yes" ? "bg-accent/20 text-text" : "text-text"}`}>{bi(c.name)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-card-border">
                <th scope="row" className="p-4 text-start font-medium text-text">{bi(r.label)}</th>
                {cols.map((c, k) => <td key={k} className={`p-4 text-center text-text-muted ${c.highlighted === "yes" ? "bg-accent/10" : ""}`}>{cell(r.values?.[k]?.v ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function BeforeAfterBlock({ p }: { p: P }) {
  const bi = useBi();
  const [pos, setPos] = useState(50);
  const before = str(p.beforeUrl);
  const after = str(p.afterUrl);
  if (!before || !after) return null;
  const alt = bi(p.alt as Bi);
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-12">
      <Heading heading={bi(p.heading as Bi)} subtitle={bi(p.subtitle as Bi)} />
      <div dir="ltr" className="relative aspect-[3/2] w-full select-none overflow-hidden rounded-2xl border border-card-border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...imgProps(after, "(min-width: 896px) 860px, 100vw")} alt={alt ? `${alt} — ${bi(p.afterLabel as Bi)}` : bi(p.afterLabel as Bi)} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img {...imgProps(before, "(min-width: 896px) 860px, 100vw")} alt={alt ? `${alt} — ${bi(p.beforeLabel as Bi)}` : bi(p.beforeLabel as Bi)} className="h-full w-full object-cover" />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">{bi(p.beforeLabel as Bi)}</span>
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">{bi(p.afterLabel as Bi)}</span>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
          <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 text-slate-800 shadow-lg"><ChevronLeft size={14} className="-me-1 inline" aria-hidden /><ChevronRight size={14} className="-ms-1 inline" aria-hidden /></span>
        </div>
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={`${bi(p.beforeLabel as Bi)} / ${bi(p.afterLabel as Bi)}`} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>
    </section>
  );
}

// Time left until the end of the offer's last day (UAE time, UTC+4). Whether it has ended is decided while rendering (so the
// server never sends an expired offer); the ticking digits start after the page loads, so server and browser markup agree.
const hasEnded = (end: number) => Date.now() > end;

function useCountdown(endDate: string) {
  const end = useMemo(() => (/^\d{4}-\d{2}-\d{2}$/.test(endDate) ? Date.parse(`${endDate}T23:59:59+04:00`) : NaN), [endDate]);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (Number.isNaN(end)) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [end]);
  if (Number.isNaN(end)) return { expired: false, left: null as number | null };
  return { expired: hasEnded(end), left: now === null ? null : Math.max(0, end - now) };
}

export function PromoBlock({ p }: { p: P }) {
  const bi = useBi();
  const { lang } = useLanguage();
  const { expired, left } = useCountdown(str(p.endDate));
  const cta = p.cta as Cta | undefined;
  const accent = isHex(p.accentColor) ? p.accentColor : undefined;
  // After its end date the offer disappears, so an expired price is never shown.
  if (expired) return null;
  const img = str(p.imageUrl);
  const parts = left === null ? null : [
    [Math.floor(left / 86_400_000), lang === "ar" ? "يوم" : "d"],
    [Math.floor(left / 3_600_000) % 24, lang === "ar" ? "س" : "h"],
    [Math.floor(left / 60_000) % 60, lang === "ar" ? "د" : "m"],
    [Math.floor(left / 1000) % 60, lang === "ar" ? "ث" : "s"],
  ] as const;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12">
      <div className={`osta-card overflow-hidden border-2 p-6 sm:p-10 ${img ? "grid items-center gap-8 md:grid-cols-2" : ""}`} style={{ borderColor: accent ?? "var(--accent)" }}>
        <div className="flex flex-col gap-4">
          {bi(p.badge as Bi) && <span className="self-start rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: accent ?? "#f97316" }}>{bi(p.badge as Bi)}</span>}
          {bi(p.heading as Bi) && <h2 className="text-3xl font-extrabold text-text sm:text-4xl">{bi(p.heading as Bi)}</h2>}
          {bi(p.text as Bi) && <div className="flex flex-col gap-2 text-sm text-text-muted"><Paragraphs text={bi(p.text as Bi)} /></div>}
          <Price price={str(p.price)} oldPrice={str(p.oldPrice)} currency={p.currency} big />
          {parts && (
            <div dir="ltr" className="flex gap-2" role="timer" aria-label={lang === "ar" ? "الوقت المتبقي للعرض" : "Time left for the offer"}>
              {parts.map(([n, u]) => (
                <div key={u} className="min-w-14 rounded-lg border border-card-border bg-bg-elevated px-3 py-2 text-center">
                  <div className="text-xl font-bold tabular-nums text-text">{String(n).padStart(2, "0")}</div>
                  <div className="text-[10px] uppercase text-text-muted">{u}</div>
                </div>
              ))}
            </div>
          )}
          {cta?.url && bi(cta.label) && <SmartLink href={cta.url} className="osta-btn-primary mt-1 self-start rounded-xl px-7 py-3 text-sm font-semibold text-white">{bi(cta.label)}</SmartLink>}
        </div>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img {...imgProps(img, "(min-width: 768px) 45vw, 100vw")} alt="" className="aspect-[4/3] h-auto w-full rounded-xl object-cover" />
        )}
      </div>
    </section>
  );
}

// ---- D. Buttons & conversion ----
type BtnKind = "book" | "call" | "whatsapp" | "quote" | "custom";
const DEFAULT_LABEL: Record<BtnKind, Bi> = {
  book: { en: "Book now", ar: "احجز الآن" }, call: { en: "Call now", ar: "اتصل الآن" }, whatsapp: { en: "WhatsApp", ar: "واتساب" },
  quote: { en: "Request a quote", ar: "اطلب عرض سعر" }, custom: { en: "", ar: "" },
};

// One resolver for every conversion button so Call / WhatsApp / Book behave the same everywhere on the site.
function useConversionButton() {
  const bi = useBi();
  const links = useContactLinks();
  return (kind: BtnKind, label?: Bi, url?: string): { href: string; text: string } | null => {
    const text = bi(label) || bi(DEFAULT_LABEL[kind]);
    const href = kind === "call" ? links.call : kind === "whatsapp" ? links.whatsapp : kind === "book" ? url || "/pricing" : kind === "quote" ? url || "/contact" : url || "";
    return href && text ? { href, text } : null;
  };
}

const BTN_ICON: Record<BtnKind, string> = { book: "CalendarCheck", call: "Phone", whatsapp: "MessageCircle", quote: "Receipt", custom: "" };

export function CtaButtonsBlock({ p }: { p: P }) {
  const bi = useBi();
  const resolve = useConversionButton();
  const align = oneOf(p.align, ["start", "center", "end"] as const, "center");
  const large = p.size !== "md";
  const buttons = list<{ kind: BtnKind; label: Bi; url: string }>(p.buttons)
    .map((b) => ({ kind: b.kind, icon: BTN_ICON[b.kind] ?? "", r: resolve(oneOf(b.kind, ["book", "call", "whatsapp", "quote", "custom"] as const, "custom"), b.label, b.url) }))
    .filter((b): b is { kind: BtnKind; icon: string; r: { href: string; text: string } } => !!b.r);
  if (!buttons.length) return null;
  return (
    <section className={`mx-auto w-full max-w-4xl px-5 py-10 ${align === "center" ? "text-center" : align === "end" ? "text-end" : ""}`}>
      {bi(p.heading as Bi) && <h2 className="text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
      {bi(p.subtitle as Bi) && <div className={`mt-3 flex max-w-xl flex-col gap-2 text-sm text-text-muted ${align === "center" ? "mx-auto" : align === "end" ? "ms-auto" : ""}`}><Paragraphs text={bi(p.subtitle as Bi)} /></div>}
      <div className={`mt-6 flex flex-wrap gap-3 ${align === "center" ? "justify-center" : align === "end" ? "justify-end" : ""}`}>
        {buttons.map((b, i) => (
          <SmartLink
            key={i}
            href={b.r.href}
            className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold ${large ? "px-8 py-4 text-base" : "px-6 py-3 text-sm"} ${b.kind === "whatsapp" ? "bg-[#25D366] text-white hover:opacity-90" : i === 0 ? "osta-btn-primary text-white" : "border border-card-border text-text hover:border-accent"}`}
          >
            {b.icon && <DynamicIcon name={b.icon} size={large ? 20 : 17} aria-hidden />}
            {b.r.text}
          </SmartLink>
        ))}
      </div>
    </section>
  );
}

const BANNER_TONE: Record<string, string> = { dark: "bg-slate-900 text-white", blue: "bg-accent text-white", light: "bg-card text-text border border-card-border" };
export function ContactBannerBlock({ p }: { p: P }) {
  const bi = useBi();
  const resolve = useConversionButton();
  const tone = oneOf(p.tone, ["dark", "blue", "light"] as const, "dark");
  const buttons = ([["showBook", "book"], ["showCall", "call"], ["showWhatsapp", "whatsapp"]] as const)
    .filter(([flag]) => p[flag] !== "no")
    .map(([, kind]) => ({ kind, r: resolve(kind) }))
    .filter((b): b is { kind: "book" | "call" | "whatsapp"; r: { href: string; text: string } } => !!b.r);
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10">
      <div className={`flex flex-col items-start gap-6 rounded-2xl p-6 sm:p-10 md:flex-row md:items-center md:justify-between ${BANNER_TONE[tone]}`}>
        <div className="max-w-xl">
          {bi(p.heading as Bi) && <h2 className="text-2xl font-bold sm:text-3xl">{bi(p.heading as Bi)}</h2>}
          {bi(p.subtitle as Bi) && <div className="mt-2 flex flex-col gap-2 text-sm opacity-85"><Paragraphs text={bi(p.subtitle as Bi)} /></div>}
        </div>
        <div className="flex flex-wrap gap-3">
          {buttons.map((b) => (
            <SmartLink key={b.kind} href={b.r.href} className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${b.kind === "whatsapp" ? "bg-[#25D366] text-white" : b.kind === "book" ? "bg-white text-slate-900" : "border border-current"}`}>
              <DynamicIcon name={BTN_ICON[b.kind]} size={17} aria-hidden />
              {b.r.text}
            </SmartLink>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Trust, process and extras ----
export function DividerBlock({ p }: { p: P }) {
  const size = oneOf(p.size, ["sm", "md", "lg"] as const, "md");
  const pad = size === "sm" ? "py-3" : size === "lg" ? "py-12" : "py-6";
  const variant = oneOf(p.variant, ["line", "dots", "space"] as const, "line");
  if (variant === "space") return <div className={pad} aria-hidden />;
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 ${pad}`} role="separator">
      {variant === "dots" ? <div className="flex justify-center gap-2" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-accent-2" />)}</div> : <hr className="border-card-border" />}
    </div>
  );
}

export function StepsBlock({ p }: { p: P }) {
  const bi = useBi();
  const items = list<{ icon?: string; title: Bi; text: Bi; imageUrl: string }>(p.items).filter((i) => bi(i.title) || bi(i.text));
  if (!items.length) return null;
  const timeline = p.variant === "timeline";
  return (
    <section className={`mx-auto w-full px-5 py-12 ${timeline ? "max-w-3xl" : "max-w-6xl"}`}>
      <Heading eyebrow={bi(p.eyebrow as Bi)} heading={bi(p.heading as Bi)} subtitle={bi(p.subtitle as Bi)} />
      {timeline ? (
        <ol className="relative flex flex-col gap-8 border-s-2 border-card-border ps-8">
          {items.map((it, i) => (
            <li key={i} className="relative">
              <span className="absolute -start-[2.9rem] top-0 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{i + 1}</span>
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-lg font-bold text-text">{it.icon && <DynamicIcon name={it.icon} size={18} className="text-accent-2" aria-hidden />}{bi(it.title)}</h3>
                {bi(it.text) && <p className="text-sm text-text-muted">{bi(it.text)}</p>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.imageUrl && <img {...imgProps(it.imageUrl, "(min-width: 768px) 640px, 100vw")} alt="" className="mt-1 aspect-[3/2] h-auto w-full max-w-md rounded-xl object-cover" />}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {items.map((it, i) => (
            <li key={i} className="osta-card flex flex-col gap-3 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{i + 1}</span>
                {it.icon && <DynamicIcon name={it.icon} size={22} className="text-accent-2" aria-hidden />}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.imageUrl && <img {...imgProps(it.imageUrl, "(min-width: 1024px) 25vw, 100vw")} alt="" className="aspect-[3/2] h-auto w-full rounded-lg object-cover" />}
              <h3 className="text-base font-bold text-text">{bi(it.title)}</h3>
              {bi(it.text) && <p className="text-sm text-text-muted">{bi(it.text)}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function TestimonialsBlock({ p }: { p: P }) {
  const bi = useBi();
  const { lang } = useLanguage();
  const items = list<{ name: Bi; role: Bi; text: Bi; rating?: number; imageUrl: string }>(p.items).filter((i) => bi(i.text));
  const [n, setN] = useState(0);
  if (!items.length) return null;
  const carousel = p.layout === "carousel";
  const card = (it: (typeof items)[number], key?: number) => (
    <figure key={key} className="osta-card flex h-full flex-col gap-4 p-6">
      <Stars rating={Number(it.rating) || 0} reviews={0} />
      <blockquote className="flex-1 text-sm leading-relaxed text-text"><Paragraphs text={bi(it.text)} /></blockquote>
      <figcaption className="flex items-center gap-3">
        {it.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={/\/api\/media\/[^/?]+$/.test(it.imageUrl) ? `${it.imageUrl}?w=480` : it.imageUrl} alt="" loading="lazy" decoding="async" className="h-10 w-10 rounded-full object-cover" />
        )}
        <span className="text-sm"><span className="block font-semibold text-text">{bi(it.name)}</span>{bi(it.role) && <span className="text-text-muted">{bi(it.role)}</span>}</span>
      </figcaption>
    </figure>
  );
  const cur = items[Math.min(n, items.length - 1)];
  const Prev = lang === "ar" ? ChevronRight : ChevronLeft;
  const Next = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12">
      <Heading heading={bi(p.heading as Bi)} subtitle={bi(p.subtitle as Bi)} />
      {carousel ? (
        <div className="mx-auto max-w-2xl" aria-roledescription="carousel">
          {card(cur)}
          {items.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button type="button" onClick={() => setN((n - 1 + items.length) % items.length)} aria-label={lang === "ar" ? "السابق" : "Previous"} className="rounded-full border border-card-border p-2 text-text hover:border-accent"><Prev size={18} aria-hidden /></button>
              <span className="text-xs text-text-muted" aria-live="polite">{Math.min(n, items.length - 1) + 1} / {items.length}</span>
              <button type="button" onClick={() => setN((n + 1) % items.length)} aria-label={lang === "ar" ? "التالي" : "Next"} className="rounded-full border border-card-border p-2 text-text hover:border-accent"><Next size={18} aria-hidden /></button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((it, i) => card(it, i))}</div>
      )}
    </section>
  );
}

export function LogosBlock({ p }: { p: P }) {
  const bi = useBi();
  const items = list<{ imageUrl: string; name: Bi; icon?: string; url: string }>(p.items).filter((i) => i.imageUrl || bi(i.name));
  if (!items.length) return null;
  const gray = p.grayscale === "yes";
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12">
      <Heading heading={bi(p.heading as Bi)} subtitle={bi(p.subtitle as Bi)} />
      <ul className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, i) => {
          const inner = it.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img {...imgProps(it.imageUrl, "200px")} alt={bi(it.name)} className={`mx-auto h-14 w-auto max-w-full object-contain transition ${gray ? "opacity-70 grayscale hover:opacity-100 hover:grayscale-0" : ""}`} />
          ) : (
            <span className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent-2"><DynamicIcon name={it.icon || "BadgeCheck"} size={22} aria-hidden /></span>
              <span className="text-sm font-semibold text-text">{bi(it.name)}</span>
            </span>
          );
          return (
            <li key={i} className="osta-card flex items-center justify-center p-5">
              {it.url ? <SmartLink href={it.url} className="block w-full">{inner}</SmartLink> : inner}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TeamBlock({ p }: { p: P }) {
  const bi = useBi();
  const members = list<{ imageUrl: string; name: Bi; role: Bi; bio: Bi }>(p.members).filter((m) => bi(m.name));
  if (!members.length) return null;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12">
      <Heading heading={bi(p.heading as Bi)} subtitle={bi(p.subtitle as Bi)} />
      <div className={`grid grid-cols-1 gap-5 ${COLS[str(p.columns)] ?? COLS["3"]}`}>
        {members.map((m, i) => (
          <article key={i} className="osta-card flex flex-col items-center gap-3 p-6 text-center">
            {m.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img {...imgProps(m.imageUrl, "160px")} alt={bi(m.name)} className="h-28 w-28 rounded-full object-cover" />
            ) : (
              <span className="flex h-28 w-28 items-center justify-center rounded-full bg-accent/15 text-3xl font-bold text-accent-2" aria-hidden>{bi(m.name).slice(0, 1)}</span>
            )}
            <h3 className="text-base font-bold text-text">{bi(m.name)}</h3>
            {bi(m.role) && <p className="text-sm font-medium text-accent-2">{bi(m.role)}</p>}
            {bi(m.bio) && <p className="text-sm text-text-muted">{bi(m.bio)}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

// YouTube / Vimeo page addresses become privacy-friendly embeds; .mp4 / .webm files play in a native player.
export function parseVideo(url: string): { kind: "embed" | "file"; src: string } | null {
  const u = url.trim();
  if (!u) return null;
  const yt = u.match(/^https:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/);
  if (yt) return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vm = u.match(/^https:\/\/(?:www\.)?vimeo\.com\/(?:video\/)?(\d{5,12})/);
  if (vm) return { kind: "embed", src: `https://player.vimeo.com/video/${vm[1]}` };
  if (/^(https:\/\/\S+|\/api\/media\/\S+)\.(mp4|webm)(\?\S*)?$/.test(u) || /^\/api\/media\/[^/?\s]+$/.test(u)) return { kind: "file", src: u };
  return null;
}

export function VideoBlock({ p }: { p: P }) {
  const bi = useBi();
  const v = parseVideo(str(p.url));
  if (!v) return null;
  const ratio = p.ratio === "4:3" ? "aspect-[4/3]" : p.ratio === "1:1" ? "aspect-square" : "aspect-video";
  const title = bi(p.heading as Bi) || bi(p.caption as Bi) || "Video";
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-12">
      <Heading heading={bi(p.heading as Bi)} />
      <figure>
        <div className={`overflow-hidden rounded-2xl border border-card-border bg-black ${ratio}`}>
          {v.kind === "embed" ? (
            <iframe src={v.src} title={title} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full" />
          ) : (
            <video src={v.src} controls preload="none" playsInline poster={str(p.poster) || undefined} className="h-full w-full" />
          )}
        </div>
        {bi(p.caption as Bi) && <figcaption className="mt-2 text-center text-xs text-text-muted">{bi(p.caption as Bi)}</figcaption>}
      </figure>
    </section>
  );
}

// Google reviews: the rating, the number of reviews and the chosen reviews are typed in by the owner (there is no automatic
// sync), so they are shown exactly as entered, with links to the Google listing.
export function GoogleReviewsBlock({ p }: { p: P }) {
  const bi = useBi();
  const { lang } = useLanguage();
  const rating = Math.min(5, Math.max(0, Number(p.rating) || 0));
  const total = Math.max(0, Math.floor(Number(p.total) || 0));
  const reviews = list<{ author: string; rating: number; text: Bi; date: string; imageUrl: string }>(p.reviews).filter((r) => bi(r.text));
  const [n, setN] = useState(0);
  const googleUrl = str(p.googleUrl);
  const writeUrl = str(p.writeReviewUrl);
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  if (!(rating > 0) && reviews.length === 0) return null;
  const carousel = p.layout === "carousel";
  const card = (r: (typeof reviews)[number], key?: number) => (
    <figure key={key} className="osta-card flex h-full flex-col gap-3 p-6">
      <Stars rating={Number(r.rating) || 0} reviews={0} />
      <blockquote className="flex-1 text-sm leading-relaxed text-text"><Paragraphs text={bi(r.text)} /></blockquote>
      <figcaption className="flex items-center gap-3 text-sm">
        {r.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={/\/api\/media\/[^/?]+$/.test(r.imageUrl) ? `${r.imageUrl}?w=480` : r.imageUrl} alt="" loading="lazy" decoding="async" className="h-9 w-9 rounded-full object-cover" />
        )}
        <span><span className="block font-semibold text-text">{r.author}</span>{r.date && <span className="text-xs text-text-muted">{r.date}</span>}</span>
      </figcaption>
    </figure>
  );
  const cur = reviews[Math.min(n, Math.max(0, reviews.length - 1))];
  const Prev = lang === "ar" ? ChevronRight : ChevronLeft;
  const Next = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12">
      <Heading heading={bi(p.heading as Bi)} subtitle={bi(p.subtitle as Bi)} />
      {rating > 0 && (
        <div className="mx-auto mb-8 flex max-w-xl flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <span className="text-5xl font-extrabold text-text">{rating.toFixed(1)}</span>
            <Stars rating={rating} reviews={0} />
          </div>
          <p className="text-sm text-text-muted">
            {total > 0 ? t(`Based on ${total.toLocaleString("en-US")} reviews on Google`, `بناءً على ${total.toLocaleString("en-US")} مراجعة على Google`) : t("Rated on Google", "التقييم على Google")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {googleUrl && <SmartLink href={googleUrl} className="osta-btn-primary rounded-xl px-6 py-2.5 text-sm font-semibold text-white">{t("See all reviews on Google", "شاهد كل المراجعات على Google")}</SmartLink>}
            {writeUrl && <SmartLink href={writeUrl} className="rounded-xl border border-card-border px-6 py-2.5 text-sm font-semibold text-text hover:border-accent">{t("Write a review", "اكتب مراجعة")}</SmartLink>}
          </div>
        </div>
      )}
      {reviews.length > 0 && (carousel ? (
        <div className="mx-auto max-w-2xl" aria-roledescription="carousel">
          {card(cur)}
          {reviews.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button type="button" onClick={() => setN((n - 1 + reviews.length) % reviews.length)} aria-label={t("Previous", "السابق")} className="rounded-full border border-card-border p-2 text-text hover:border-accent"><Prev size={18} aria-hidden /></button>
              <span className="text-xs text-text-muted" aria-live="polite">{Math.min(n, reviews.length - 1) + 1} / {reviews.length}</span>
              <button type="button" onClick={() => setN((n + 1) % reviews.length)} aria-label={t("Next", "التالي")} className="rounded-full border border-card-border p-2 text-text hover:border-accent"><Next size={18} aria-hidden /></button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{reviews.map((r, i) => card(r, i))}</div>
      ))}
    </section>
  );
}
