"use client";

import Link from "next/link";
import { JOBS_PATH, jobPath } from "@/lib/jobsPaths";
import { ChevronDown, ChevronRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useSite } from "@/lib/site-context";
import { RichHtml, RichInline, RichLine, isRichText } from "@/components/cms/RichInline";
import { telHref, whatsappHref } from "@/lib/site";
import { BookingCalculator } from "@/components/booking/BookingCalculator";
import { DynamicIcon } from "@/components/DynamicIcon";
import { HomeSections } from "@/app/HomeSections";
import type { BlockData } from "@/lib/cms-data";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { track } from "@/lib/analytics";
import { API_BASE, type Bi, type CmsBlock, type Cta } from "@/lib/cms";

type P = Record<string, unknown>;

// Images from the admin media library come in several WebP widths; let the browser pick the smallest that fits.
function imgProps(url: string, sizes: string) {
  if (/\/api\/media\/[^/?]+$/.test(url)) {
    return { src: url, srcSet: `${url}?w=480 480w, ${url}?w=960 960w, ${url}?w=1600 1600w`, sizes, width: 1200, height: 800, loading: "lazy" as const, decoding: "async" as const };
  }
  return { src: url, width: 1200, height: 800, loading: "lazy" as const, decoding: "async" as const };
}

function SmartLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (href.startsWith("/")) return <Link href={href} className={className}>{children}</Link>;
  return (
    <a href={href} className={className} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

function useBi() {
  const { lang } = useLanguage();
  // Falls back to the other language so a half-translated block never renders empty.
  return (v: Bi | undefined) => (v ? (lang === "ar" ? v.ar || v.en : v.en || v.ar) : "");
}

function Paragraphs({ text, className }: { text: string; className?: string }) {
  if (isRichText(text)) return <RichHtml html={text} className={className} />;
  return (
    <>
      {text.split(/\n\s*\n/).filter(Boolean).map((para, i) => (
        <p key={i} className={className}><RichInline text={para} /></p>
      ))}
    </>
  );
}

function Buttons({ ctas }: { ctas: Cta[] }) {
  const bi = useBi();
  const shown = ctas.filter((c) => c.url && bi(c.label));
  if (!shown.length) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {shown.map((c, i) => (
        <SmartLink key={i} href={c.url} className={i === 0 ? "osta-btn-primary rounded-xl px-6 py-3 text-sm font-semibold text-white" : "rounded-xl border border-card-border px-6 py-3 text-sm font-semibold text-text"}>
          {bi(c.label)}
        </SmartLink>
      ))}
    </div>
  );
}

// Background image with an adjustable dark overlay (strength in %, colour as #rrggbb). Blocks saved before the controls
// existed fall back to the original look.
function heroBackground(p: P, img: string) {
  const strength = typeof p.overlay === "number" ? Math.min(100, Math.max(0, p.overlay)) : 85;
  const hex = typeof p.overlayColor === "string" && /^#[0-9a-fA-F]{6}$/.test(p.overlayColor) ? p.overlayColor : "#050b1a";
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const layer = `rgba(${r},${g},${b},${strength / 100})`;
  const url = /\/api\/media\/[^/?]+$/.test(img) ? `${img}?w=1600` : img;
  return { backgroundImage: `linear-gradient(${layer},${layer}), url(${url})`, backgroundSize: "cover", backgroundPosition: "center" };
}

function Hero({ p }: { p: P }) {
  const bi = useBi();
  const img = p.imageUrl as string;
  // The full-width background: the dedicated field, or (older blocks) the side image set to "Background".
  const bgImg = ((p.backgroundImage as string) || (p.imagePosition === "background" ? img : "")) as string;
  const ctas = (p.ctas as Cta[]) ?? [];

  // "Landing" style: the centered homepage hero with colour glow, accent line and trust badges.
  if (p.variant === "landing") {
    const badges = (p.badges as { icon: string; label: Bi }[]) ?? [];
    const shown = ctas.filter((c) => c.url && bi(c.label));
    return (
      <section className="relative overflow-hidden px-5 py-16 sm:py-24" style={bgImg ? heroBackground(p, bgImg) : undefined}>
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent-2) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {bi(p.eyebrow as Bi) && <span className="inline-block rounded-full border border-card-border px-4 py-1.5 text-xs text-accent-2">{bi(p.eyebrow as Bi)}</span>}
          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-text sm:text-6xl">
            {bi(p.heading as Bi)}
            {bi(p.headingAccent as Bi | undefined) && (
              <>
                {" "}
                <span className="bg-gradient-to-b from-accent-2 to-accent bg-clip-text text-transparent">{bi(p.headingAccent as Bi | undefined)}</span>
              </>
            )}
          </h1>
          {bi(p.subtitle as Bi) && <RichLine className="mx-auto mt-5 max-w-xl text-base text-text-muted" text={bi(p.subtitle as Bi)} />}
          {shown.length > 0 && (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {shown.map((c, i) => (
                <SmartLink key={i} href={c.url} className={i === 0 ? "osta-btn-primary w-full rounded-xl px-6 py-3.5 text-center text-sm font-semibold text-white sm:w-auto" : "w-full rounded-xl border border-card-border px-6 py-3.5 text-center text-sm font-semibold text-text sm:w-auto"}>
                  {bi(c.label)}
                </SmartLink>
              ))}
            </div>
          )}
          {badges.length > 0 && (
            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {badges.map((b, i) => (
                <div key={i} className="osta-card flex flex-col items-center gap-2 px-3 py-4">
                  {b.icon && <DynamicIcon name={b.icon} size={20} className="text-accent-2" />}
                  <span className="text-xs text-text-muted">{bi(b.label)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  const bg = !!bgImg;
  const sideImg = img && p.imagePosition !== "background" ? img : "";
  const center = p.align === "center";
  return (
    <section className="relative overflow-hidden px-5 py-16 sm:py-24" style={bg ? heroBackground(p, img) : undefined}>
      <div className={`mx-auto grid max-w-6xl items-center gap-10 ${sideImg ? "md:grid-cols-2" : ""}`}>
        <div className={`${center || (bg && !sideImg) ? "mx-auto max-w-3xl text-center" : ""} ${sideImg && p.imagePosition === "start" ? "md:order-2" : ""}`}>
          {bi(p.eyebrow as Bi) && <span className="inline-block rounded-full border border-card-border px-4 py-1.5 text-xs text-accent-2">{bi(p.eyebrow as Bi)}</span>}
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-text sm:text-5xl">{bi(p.heading as Bi)}</h1>
          <Paragraphs text={bi(p.subtitle as Bi)} className="mt-4 text-base text-text-muted" />
          <div className={center || (bg && !sideImg) ? "flex justify-center" : ""}><Buttons ctas={ctas} /></div>
        </div>
        {sideImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img {...imgProps(sideImg, "(min-width: 768px) 50vw, 100vw")} alt="" className="aspect-[3/2] h-auto w-full rounded-2xl object-cover" />
        )}
      </div>
    </section>
  );
}

function ServicesGrid({ p, services }: { p: P; services: BlockData["services"] }) {
  const bi = useBi();
  const { lang, t } = useLanguage();
  const items = services.slice(0, Number(p.limit) || 8);
  if (!items.length) return null;
  const viewAll = p.viewAllUrl as string | undefined;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16">
      <div className="text-center">
        {bi(p.eyebrow as Bi | undefined) && <span className="text-xs font-semibold uppercase tracking-wide text-accent-2">{bi(p.eyebrow as Bi | undefined)}</span>}
        {bi(p.heading as Bi) && <h2 className="mt-2 text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
        {bi(p.subtitle as Bi) && <RichLine className="mx-auto mt-2 max-w-xl text-sm text-text-muted" text={bi(p.subtitle as Bi)} />}
      </div>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s) => (
          <Link key={s.slug} href={`/services/${s.slug}`} className="osta-card group p-5">
            <h3 className="text-base font-semibold text-text">{lang === "ar" ? s.nameAr : s.nameEn}</h3>
            <p className="mt-1.5 text-sm text-text-muted">{lang === "ar" ? s.shortDescriptionAr : s.shortDescriptionEn}</p>
            <span className="mt-3 flex items-center gap-0.5 text-xs font-medium text-accent-2">
              {t("home.moreLink")} <ChevronRight size={14} className="osta-flip-rtl" />
            </span>
          </Link>
        ))}
      </div>
      {viewAll && bi(p.viewAllLabel as Bi | undefined) && (
        <div className="mt-8 text-center">
          <SmartLink href={viewAll} className="text-sm font-semibold text-accent-2">{bi(p.viewAllLabel as Bi | undefined)}</SmartLink>
        </div>
      )}
    </section>
  );
}

function RichText({ p }: { p: P }) {
  const bi = useBi();
  return (
    <section className={`mx-auto w-full max-w-3xl px-5 py-12 ${p.align === "center" ? "text-center" : ""}`}>
      {bi(p.heading as Bi) && <h2 className="mb-4 text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
      <div className="flex flex-col gap-4"><Paragraphs text={bi(p.body as Bi)} className="text-sm leading-relaxed text-text-muted" /></div>
    </section>
  );
}

function ImageText({ p }: { p: P }) {
  const bi = useBi();
  const img = p.imageUrl as string;
  const cta = p.cta as Cta;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14">
      <div className={`osta-card grid items-center gap-8 overflow-hidden p-6 sm:p-10 ${img ? "md:grid-cols-2" : ""}`}>
        <div className={p.imagePosition === "start" ? "md:order-2" : ""}>
          <h2 className="text-2xl font-bold text-text">{bi(p.heading as Bi)}</h2>
          <div className="mt-3 flex flex-col gap-3"><Paragraphs text={bi(p.body as Bi)} className="text-sm text-text-muted" /></div>
          {cta?.url && bi(cta.label) && <Buttons ctas={[cta]} />}
        </div>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img {...imgProps(img, "(min-width: 768px) 50vw, 100vw")} alt={bi(p.imageAlt as Bi)} className={`aspect-[3/2] h-auto w-full rounded-xl object-cover ${p.imagePosition === "start" ? "md:order-1" : ""}`} />
        )}
      </div>
    </section>
  );
}

const RATIO: Record<string, string> = { "16:9": "aspect-video", "3:2": "aspect-[3/2]", "1:1": "aspect-square", "21:9": "aspect-[21/9]" };
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

// A picture on its own, with an optional caption and link.
function ImageBlock({ p }: { p: P }) {
  const bi = useBi();
  const url = typeof p.imageUrl === "string" ? p.imageUrl : "";
  if (!url) return null;
  const size = oneOf(p.size, ["content", "wide", "full"] as const, "wide");
  const ratio = RATIO[oneOf(p.ratio, ["auto", "16:9", "3:2", "1:1", "21:9"] as const, "auto")] ?? "";
  const align = oneOf(p.align, ["start", "center", "end"] as const, "center");
  const rounded = p.rounded !== "no" && size !== "full";
  const link = typeof p.link === "string" ? p.link : "";
  const caption = bi(p.caption as Bi);
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...imgProps(url, size === "content" ? "(min-width: 768px) 768px, 100vw" : "100vw")} alt={bi(p.imageAlt as Bi)} className={`h-auto w-full object-cover ${ratio} ${rounded ? "rounded-xl" : ""}`} />
  );
  const width = size === "full" ? "w-full" : size === "wide" ? "mx-auto w-full max-w-6xl px-5" : `w-full max-w-3xl px-5 ${align === "start" ? "me-auto" : align === "end" ? "ms-auto" : "mx-auto"}`;
  return (
    <figure className={`${width} ${size === "full" ? "" : "py-8"}`}>
      {link ? <SmartLink href={link} className="block">{img}</SmartLink> : img}
      {caption && <figcaption className="mt-2 text-center text-xs text-text-muted">{caption}</figcaption>}
    </figure>
  );
}

// 1-3 columns side by side (stacked on phones); each column is formatted text or an image.
function Columns({ p }: { p: P }) {
  const bi = useBi();
  const cols = ((p.columns as { kind?: string; heading?: Bi; body?: Bi; cta?: Cta; imageUrl?: string; imageAlt?: Bi }[]) ?? []).slice(0, 3);
  if (!cols.length) return null;
  const layout = oneOf(p.layout, ["equal", "wide-start", "wide-end"] as const, "equal");
  const valign = { start: "md:items-start", center: "md:items-center", end: "md:items-end" }[oneOf(p.valign, ["start", "center", "end"] as const, "center")];
  const gap = { sm: "gap-4", md: "gap-8", lg: "gap-12" }[oneOf(p.gap, ["sm", "md", "lg"] as const, "md")];
  const template = cols.length === 1 ? "md:grid-cols-1" : cols.length === 3 ? "md:grid-cols-3" : { equal: "md:grid-cols-2", "wide-start": "md:grid-cols-[2fr_1fr]", "wide-end": "md:grid-cols-[1fr_2fr]" }[layout];
  const heading = bi(p.heading as Bi);
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12">
      {heading && <h2 className="mb-8 text-center text-2xl font-bold text-text sm:text-3xl">{heading}</h2>}
      <div className={`flex ${p.reverseMobile === "yes" ? "flex-col-reverse" : "flex-col"} ${gap} md:grid ${template} ${valign}`}>
        {cols.map((c, i) =>
          c.kind === "image" ? (
            c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} {...imgProps(c.imageUrl, "(min-width: 768px) 50vw, 100vw")} alt={bi(c.imageAlt)} className="aspect-[3/2] h-auto w-full rounded-xl object-cover" />
            ) : <div key={i} />
          ) : (
            <div key={i} className="min-w-0">
              {bi(c.heading) && <h3 className="text-xl font-bold text-text sm:text-2xl">{bi(c.heading)}</h3>}
              <div className={`${bi(c.heading) ? "mt-3 " : ""}flex flex-col gap-3`}><Paragraphs text={bi(c.body)} className="text-sm text-text-muted" /></div>
              {c.cta?.url && bi(c.cta.label) && <Buttons ctas={[c.cta]} />}
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function Faq({ p }: { p: P }) {
  const bi = useBi();
  const items = (p.items as { question: Bi; answer: Bi }[]) ?? [];
  if (!items.length) return null;
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-12">
      {bi(p.heading as Bi) && <h2 className="mb-6 text-center text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
      <div className="flex flex-col gap-3">
        {items.map((it, i) => (
          <details key={i} className="osta-card group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-text">
              {bi(it.question)}
              <ChevronDown size={16} className="shrink-0 text-text-muted transition group-open:rotate-180" />
            </summary>
            {isRichText(bi(it.answer))
              ? <RichHtml html={bi(it.answer)} className="mt-3 text-sm text-text-muted" />
              : <p className="mt-3 whitespace-pre-line text-sm text-text-muted"><RichInline text={bi(it.answer)} /></p>}
          </details>
        ))}
      </div>
    </section>
  );
}

function Stats({ p }: { p: P }) {
  const bi = useBi();
  const items = (p.items as { value: string; label: Bi; icon?: string }[]) ?? [];
  if (!items.length) return null;
  return (
    <section className="border-y border-card-border bg-bg-elevated">
      <div className="mx-auto max-w-6xl px-5 py-10">
        {bi(p.heading as Bi) && <h2 className="mb-6 text-center text-xl font-bold text-text">{bi(p.heading as Bi)}</h2>}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((it, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-center">
              {it.icon && <DynamicIcon name={it.icon} size={20} className="text-accent-2" />}
              <span className="text-xl font-bold text-text">{it.value}</span>
              <span className="text-xs text-text-muted">{bi(it.label)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBlock({ p }: { p: P }) {
  const bi = useBi();
  const button = p.button as Cta;
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-16 text-center">
      <div className="osta-card osta-glow-border px-6 py-12">
        <h2 className="text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>
        {bi(p.subtitle as Bi) && <RichLine className="mx-auto mt-3 max-w-md text-sm text-text-muted" text={bi(p.subtitle as Bi)} />}
        {button?.url && bi(button.label) && (
          <SmartLink href={button.url} className="osta-btn-primary mt-6 inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-white">
            {bi(button.label)}
          </SmartLink>
        )}
      </div>
    </section>
  );
}

// Open jobs from Jobs & Workforce. Each card links to the job page (where the application form is).
function JobsList({ p, jobs }: { p: P; jobs: BlockData["jobs"] }) {
  const bi = useBi();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const type = String(p.jobType ?? "all");
  const items = jobs.items.filter((j) => type === "all" || j.type === type).slice(0, Number(p.limit) || 6);
  const L = ar
    ? { daily: "عمل باليومية", permanent: "وظيفة ثابتة", workers: "العدد المطلوب", duration: "مدة العمل", start: "تاريخ البدء", deadline: "آخر موعد للتقديم", apply: "قدّم الآن" }
    : { daily: "Daily work", permanent: "Permanent position", workers: "Workers needed", duration: "Duration", start: "Start date", deadline: "Apply by", apply: "Apply now" };
  const viewAllLabel = bi(p.viewAllLabel as Bi);
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16">
      <div className="text-center">
        {bi(p.eyebrow as Bi) && <span className="text-xs font-semibold uppercase tracking-wide text-accent-2">{bi(p.eyebrow as Bi)}</span>}
        {bi(p.heading as Bi) && <h2 className="mt-2 text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
        {bi(p.subtitle as Bi) && <p className="mx-auto mt-3 max-w-2xl text-sm text-text-muted">{bi(p.subtitle as Bi)}</p>}
      </div>
      {items.length === 0 ? (
        <p className="osta-card mx-auto mt-10 max-w-xl p-6 text-center text-sm text-text-muted">{bi(p.emptyText as Bi)}</p>
      ) : (
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {items.map((j) => (
            <article key={j.slug} className="osta-card flex w-full flex-col gap-3 p-5 sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)]">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className={`rounded-full px-2.5 py-1 ${j.type === "DAILY" ? "bg-amber-400/15 text-amber-300" : "bg-accent/15 text-accent-2"}`}>{j.type === "DAILY" ? L.daily : L.permanent}</span>
                <span className="rounded-full border border-card-border px-2.5 py-1 text-text-muted">{ar ? j.categoryAr : j.categoryEn}</span>
              </div>
              <h3 className="text-base font-semibold text-text">{ar ? j.titleAr : j.titleEn}</h3>
              <dl className="flex flex-col gap-1 text-sm text-text-muted">
                <div>📍 {ar ? j.emirateAr : j.emirateEn}{j.area ? ` – ${j.area}` : ""}</div>
                <div>👷 {L.workers}: {ar ? j.workersAr : j.workersEn}</div>
                {(ar ? j.durationAr : j.durationEn) && <div>📅 {L.duration}: {ar ? j.durationAr : j.durationEn}</div>}
                {(ar ? j.wageAr : j.wageEn) && <div>💰 {ar ? j.wageAr : j.wageEn}</div>}
                {(ar ? j.startAr : j.startEn) && <div>🗓️ {L.start}: {ar ? j.startAr : j.startEn}</div>}
                {(ar ? j.deadlineAr : j.deadlineEn) && <div>⏰ {L.deadline}: {ar ? j.deadlineAr : j.deadlineEn}</div>}
              </dl>
              <Link href={jobPath(j.slug)} className="osta-btn-primary mt-auto rounded-xl px-5 py-2.5 text-center text-sm font-semibold text-white">{L.apply}</Link>
            </article>
          ))}
        </div>
      )}
      {viewAllLabel && (
        <div className="mt-8 text-center">
          <Link href={JOBS_PATH} className="inline-block rounded-xl border border-card-border px-6 py-3 text-sm font-semibold text-text hover:border-accent">{viewAllLabel}</Link>
        </div>
      )}
    </section>
  );
}

function BlogPreview({ p, posts }: { p: P; posts: BlockData["posts"] }) {
  const bi = useBi();
  const { lang, t } = useLanguage();
  const items = posts.slice(0, Number(p.limit) || 3);
  if (!items.length) return null;
  const viewAll = p.viewAllUrl as string | undefined;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16">
      <div className="text-center">
        {bi(p.eyebrow as Bi) && <span className="text-xs font-semibold uppercase tracking-wide text-accent-2">{bi(p.eyebrow as Bi)}</span>}
        {bi(p.heading as Bi) && <h2 className="mt-2 text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
      </div>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="osta-card flex flex-col overflow-hidden">
            {post.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.coverImageUrl} alt={lang === "ar" ? post.titleAr : post.titleEn} loading="lazy" width={640} height={160} className="h-40 w-full object-cover" />
            )}
            <div className="p-5">
              <h3 className="text-base font-semibold text-text">{lang === "ar" ? post.titleAr : post.titleEn}</h3>
              <p className="mt-1.5 line-clamp-3 text-sm text-text-muted">{lang === "ar" ? post.excerptAr : post.excerptEn}</p>
              <span className="mt-3 flex items-center gap-0.5 text-xs font-medium text-accent-2">
                {t("blog.readMore")} <ChevronRight size={14} className="osta-flip-rtl" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      {viewAll && bi(p.viewAllLabel as Bi) && (
        <div className="mt-8 text-center">
          <SmartLink href={viewAll} className="text-sm font-semibold text-accent-2">{bi(p.viewAllLabel as Bi)}</SmartLink>
        </div>
      )}
    </section>
  );
}

type FormDef = {
  slug: string; fields: { key: string; type: string; label: Bi; required: boolean; options?: { value: string; label: Bi }[] }[];
  submitLabelEn: string; submitLabelAr: string; successEn: string; successAr: string;
};

const FORM_ERRORS: Record<string, Bi> = {
  required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
  invalid_email: { en: "Enter a valid email address.", ar: "أدخل بريداً إلكترونياً صحيحاً." },
  invalid_phone: { en: "Enter a valid phone number.", ar: "أدخل رقم هاتف صحيحاً." },
  invalid_option: { en: "Choose one of the options.", ar: "اختر أحد الخيارات." },
  too_long: { en: "That is too long.", ar: "النص طويل جداً." },
};

function FormBlock({ p }: { p: P }) {
  const bi = useBi();
  const { lang } = useLanguage();
  const slug = String(p.formSlug ?? "");
  const [def, setDef] = useState<FormDef | null | "missing">(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot: people never see or fill this
  const startedAt = useRef(0);

  useEffect(() => {
    if (!slug) return;
    startedAt.current = Date.now();
    void fetch(`${API_BASE}/forms/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setDef(j.data as FormDef))
      .catch(() => setDef("missing"));
  }, [slug]);

  if (!slug || def === "missing") return null;
  if (!def) return <section className="mx-auto w-full max-w-xl px-5 py-12"><div className="osta-card h-40 animate-pulse" /></section>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!def || def === "missing") return;
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      const res = await fetch(`${API_BASE}/forms/${encodeURIComponent(def.slug)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: values, website, elapsedMs: Date.now() - startedAt.current, language: lang, path: window.location.pathname }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        // Counted by analytics only if the visitor has allowed it.
        track("form_submit", { form: def.slug });
      } else if (res.status === 422 && json?.error?.fields) setErrors(json.error.fields);
      else setFormError(res.status === 429 ? (lang === "ar" ? "محاولات كثيرة. يرجى المحاولة بعد قليل." : "Too many attempts. Please try again in a few minutes.") : lang === "ar" ? "تعذر الإرسال. يرجى المحاولة مرة أخرى." : "Could not send. Please try again.");
    } catch {
      setFormError(lang === "ar" ? "تعذر الإرسال. يرجى المحاولة مرة أخرى." : "Could not send. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const label = (b: Bi) => (lang === "ar" ? b.ar || b.en : b.en || b.ar);
  return (
    <section className="mx-auto w-full max-w-xl px-5 py-12">
      {bi(p.heading as Bi) && <h2 className="mb-2 text-center text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
      {bi(p.intro as Bi) && <RichLine className="mb-6 text-center text-sm text-text-muted" text={bi(p.intro as Bi)} />}
      {done ? (
        <div className="osta-card p-8 text-center" role="status">
          <p className="text-base font-semibold text-text">{lang === "ar" ? def.successAr : def.successEn}</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="osta-card flex flex-col gap-4 p-6">
          {def.fields.map((f) => {
            const id = `f-${def.slug}-${f.key}`;
            const err = errors[f.key];
            const base = "osta-input rounded-xl px-3 py-3 text-sm";
            return (
              <div key={f.key} className="flex flex-col gap-1.5">
                {f.type === "checkbox" ? (
                  <label htmlFor={id} className="flex items-start gap-2 text-sm text-text">
                    <input id={id} type="checkbox" className="mt-1" checked={values[f.key] === true} onChange={(e) => setValues({ ...values, [f.key]: e.target.checked })} aria-invalid={!!err} />
                    <span>{label(f.label)}{f.required && " *"}</span>
                  </label>
                ) : (
                  <>
                    <label htmlFor={id} className="text-xs font-medium text-text-muted">{label(f.label)}{f.required && " *"}</label>
                    {f.type === "textarea" ? (
                      <textarea id={id} rows={4} className={base} value={(values[f.key] as string) ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} aria-invalid={!!err} />
                    ) : f.type === "select" ? (
                      <select id={id} className={base} value={(values[f.key] as string) ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} aria-invalid={!!err}>
                        <option value="" />
                        {f.options?.map((o) => (<option key={o.value} value={o.value}>{label(o.label)}</option>))}
                      </select>
                    ) : (
                      <input id={id} className={base} type={f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"} dir={f.type === "email" || f.type === "phone" ? "ltr" : undefined} value={(values[f.key] as string) ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} aria-invalid={!!err} />
                    )}
                  </>
                )}
                {err && <p className="text-xs text-rose-400" role="alert">{FORM_ERRORS[err] ? label(FORM_ERRORS[err]) : err}</p>}
              </div>
            );
          })}
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
            <label>Website <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
          </div>
          {formError && <p className="text-xs text-rose-400" role="alert">{formError}</p>}
          <button type="submit" disabled={busy} className="osta-btn-primary rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60">
            {lang === "ar" ? def.submitLabelAr : def.submitLabelEn}
          </button>
        </form>
      )}
    </section>
  );
}

// WhatsApp / phone / email cards, address and hours: all from Website → Site & Contact.
function ContactCards({ p }: { p: P }) {
  const bi = useBi();
  const { t, lang } = useLanguage();
  const { settings } = useSite();
  const address = lang === "ar" ? settings.addressAr || settings.addressEn : settings.addressEn || settings.addressAr;
  const hours = lang === "ar" ? settings.hoursAr || settings.hoursEn : settings.hoursEn || settings.hoursAr;
  const wa = whatsappHref(settings, lang);
  const waLabel = bi(p.whatsappButtonLabel as Bi);
  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-12 text-center">
      {bi(p.heading as Bi) && <h2 className="text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
      {bi(p.subtitle as Bi) && <RichLine className="mx-auto mt-3 max-w-md text-sm text-text-muted" text={bi(p.subtitle as Bi)} />}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {settings.whatsapp && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="osta-card osta-pick flex flex-col items-center gap-2 p-6">
            <MessageCircle size={22} className="text-accent-2" />
            <span className="text-sm font-semibold text-text">{t("contact.whatsapp")}</span>
            <span className="text-xs text-text-muted" dir="ltr">{settings.phone || `+${settings.whatsapp}`}</span>
          </a>
        )}
        {settings.phone && (
          <a href={telHref(settings.phone)} className="osta-card osta-pick flex flex-col items-center gap-2 p-6">
            <Phone size={22} className="text-accent-2" />
            <span className="text-sm font-semibold text-text">{t("contact.phone")}</span>
            <span className="text-xs text-text-muted" dir="ltr">{settings.phone}</span>
          </a>
        )}
        {settings.email && (
          <a href={`mailto:${settings.email}`} className="osta-card osta-pick flex flex-col items-center gap-2 p-6">
            <Mail size={22} className="text-accent-2" />
            <span className="text-sm font-semibold text-text">{t("contact.email")}</span>
            <span className="text-xs text-text-muted">{settings.email}</span>
          </a>
        )}
      </div>
      {(address || hours) && (
        <div className="osta-card mx-auto mt-4 flex max-w-md flex-col gap-3 p-5 text-start text-sm text-text-muted">
          {address && (
            <p className="flex gap-2 whitespace-pre-line"><MapPin size={16} className="mt-0.5 shrink-0 text-accent-2" />
              {settings.mapsUrl ? <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-text">{address}</a> : address}
            </p>
          )}
          {hours && <p className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-accent-2" />{hours}</p>}
        </div>
      )}
      {settings.whatsapp && waLabel && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="osta-btn-primary mt-8 inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-white">{waLabel}</a>
      )}
    </section>
  );
}

// The live price calculator, as a block. Prices come from Dynamic Pricing.
function BookingCalcBlock({ p, pricing }: { p: P; pricing: BlockData["pricing"] }) {
  const bi = useBi();
  const { t } = useLanguage();
  const ready = pricing && pricing.services.some((s) => s.prices.length > 0) && pricing.bookingTypes.length > 0;
  return (
    <section className="py-10">
      {(bi(p.heading as Bi) || bi(p.subtitle as Bi)) && (
        <div className="mx-auto mb-8 max-w-2xl px-5 text-center">
          {bi(p.heading as Bi) && <h2 className="text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
          {bi(p.subtitle as Bi) && <RichLine className="mt-3 text-sm text-text-muted" text={bi(p.subtitle as Bi)} />}
        </div>
      )}
      {ready ? <BookingCalculator config={pricing} /> : <p className="px-5 text-center text-sm text-text-muted">{t("booking.noServices")}</p>}
    </section>
  );
}

// Optional section background set in the admin: an image under a dark overlay, or a plain colour.
function sectionBackground(style: unknown): React.CSSProperties | undefined {
  const s = (style ?? {}) as { bgImage?: string; overlay?: number; overlayColor?: string; bgColor?: string };
  const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
  if (s.bgImage) {
    const strength = typeof s.overlay === "number" ? Math.min(100, Math.max(0, s.overlay)) : 60;
    const hex = isHex(s.overlayColor) ? s.overlayColor : "#050b1a";
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const layer = `rgba(${r},${g},${b},${strength / 100})`;
    const url = /\/api\/media\/[^/?]+$/.test(s.bgImage) ? `${s.bgImage}?w=1600` : s.bgImage;
    return { backgroundImage: `linear-gradient(${layer},${layer}), url(${url})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  return isHex(s.bgColor) ? { backgroundColor: s.bgColor } : undefined;
}

function Block({ block, data }: { block: CmsBlock; data: BlockData }) {
  const p = block.props;
  switch (block.type) {
    case "hero": return <Hero p={p} />;
    case "servicesGrid": return <ServicesGrid p={p} services={data.services} />;
    case "richText": return <RichText p={p} />;
    case "imageText": return <ImageText p={p} />;
    case "image": return <ImageBlock p={p} />;
    case "columns": return <Columns p={p} />;
    case "faq": return <Faq p={p} />;
    case "stats": return <Stats p={p} />;
    case "cta": return <CtaBlock p={p} />;
    case "form": return <FormBlock p={p} />;
    case "blogPreview": return <BlogPreview p={p} posts={data.posts} />;
    case "jobsList": return <JobsList p={p} jobs={data.jobs} />;
    case "homeSections": return <HomeSections sections={data.sections} />;
    case "contactCards": return <ContactCards p={p} />;
    case "bookingCalculator": return <BookingCalcBlock p={p} pricing={data.pricing} />;
    default: return null;
  }
}

// Per-device visibility is CSS-only (md breakpoint), so it works with static/ISR rendering.
export function BlockRenderer({ blocks, data }: { blocks: CmsBlock[]; data: BlockData }) {
  return (
    <>
      {blocks
        .filter((b) => !b.hidden && (b.visibility.desktop || b.visibility.mobile))
        .map((b) => {
          const cls = b.visibility.desktop && b.visibility.mobile ? "" : b.visibility.mobile ? "md:hidden" : "hidden md:block";
          return (
            <div key={b.id} className={cls} style={b.type === "hero" ? undefined : sectionBackground(b.props.style)}>
              <Block block={b} data={data} />
            </div>
          );
        })}
    </>
  );
}
