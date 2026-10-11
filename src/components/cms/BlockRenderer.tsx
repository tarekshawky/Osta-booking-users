"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { API_BASE, type Bi, type CmsBlock, type Cta } from "@/lib/cms";
import type { ServiceSummary } from "@/lib/api";

type P = Record<string, unknown>;

// Images from the admin media library come in several WebP widths; let the browser pick the smallest that fits.
function imgProps(url: string, sizes: string) {
  if (/\/api\/media\/[^/?]+$/.test(url)) {
    return { src: url, srcSet: `${url}?w=480 480w, ${url}?w=960 960w, ${url}?w=1600 1600w`, sizes, loading: "lazy" as const, decoding: "async" as const };
  }
  return { src: url, loading: "lazy" as const, decoding: "async" as const };
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
  return (
    <>
      {text.split(/\n\s*\n/).filter(Boolean).map((para, i) => (
        <p key={i} className={className}>{para}</p>
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

function Hero({ p }: { p: P }) {
  const bi = useBi();
  const img = p.imageUrl as string;
  const bg = p.imagePosition === "background" && img;
  const center = p.align === "center";
  return (
    <section className="relative overflow-hidden px-5 py-16 sm:py-24" style={bg ? { backgroundImage: `linear-gradient(rgba(5,11,26,.78),rgba(5,11,26,.9)), url(${/\/api\/media\/[^/?]+$/.test(img) ? `${img}?w=1600` : img})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
      <div className={`mx-auto grid max-w-6xl items-center gap-10 ${img && !bg ? "md:grid-cols-2" : ""}`}>
        <div className={`${center || bg ? "mx-auto max-w-3xl text-center" : ""} ${img && !bg && p.imagePosition === "start" ? "md:order-2" : ""}`}>
          {bi(p.eyebrow as Bi) && <span className="inline-block rounded-full border border-card-border px-4 py-1.5 text-xs text-accent-2">{bi(p.eyebrow as Bi)}</span>}
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-text sm:text-5xl">{bi(p.heading as Bi)}</h1>
          <Paragraphs text={bi(p.subtitle as Bi)} className="mt-4 text-base text-text-muted" />
          <div className={center || bg ? "flex justify-center" : ""}><Buttons ctas={(p.ctas as Cta[]) ?? []} /></div>
        </div>
        {img && !bg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img {...imgProps(img, "(min-width: 768px) 50vw, 100vw")} alt="" className="w-full rounded-2xl object-cover" />
        )}
      </div>
    </section>
  );
}

function ServicesGrid({ p, services }: { p: P; services: ServiceSummary[] }) {
  const bi = useBi();
  const { lang } = useLanguage();
  const items = services.slice(0, Number(p.limit) || 8);
  if (!items.length) return null;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14">
      <div className="text-center">
        {bi(p.heading as Bi) && <h2 className="text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
        {bi(p.subtitle as Bi) && <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">{bi(p.subtitle as Bi)}</p>}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s) => (
          <Link key={s.slug} href={`/services/${s.slug}`} className="osta-card p-5">
            <h3 className="text-base font-semibold text-text">{lang === "ar" ? s.nameAr : s.nameEn}</h3>
            <p className="mt-1.5 text-sm text-text-muted">{lang === "ar" ? s.shortDescriptionAr : s.shortDescriptionEn}</p>
          </Link>
        ))}
      </div>
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
          <img {...imgProps(img, "(min-width: 768px) 50vw, 100vw")} alt={bi(p.imageAlt as Bi)} className={`w-full rounded-xl object-cover ${p.imagePosition === "start" ? "md:order-1" : ""}`} />
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
            <p className="mt-3 whitespace-pre-line text-sm text-text-muted">{bi(it.answer)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Stats({ p }: { p: P }) {
  const bi = useBi();
  const items = (p.items as { value: string; label: Bi }[]) ?? [];
  if (!items.length) return null;
  return (
    <section className="border-y border-card-border bg-bg-elevated">
      <div className="mx-auto max-w-6xl px-5 py-10">
        {bi(p.heading as Bi) && <h2 className="mb-6 text-center text-xl font-bold text-text">{bi(p.heading as Bi)}</h2>}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((it, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-text">{it.value}</p>
              <p className="mt-1 text-xs text-text-muted">{bi(it.label)}</p>
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
    <section className="mx-auto w-full max-w-4xl px-5 py-14 text-center">
      <div className="osta-card osta-glow-border px-6 py-12">
        <h2 className="text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>
        {bi(p.subtitle as Bi) && <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">{bi(p.subtitle as Bi)}</p>}
        <div className="flex justify-center">{button?.url && bi(button.label) && <Buttons ctas={[button]} />}</div>
      </div>
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
        // Lets analytics (when connected) count the conversion; harmless when nothing is listening.
        (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event: "form_submit", form: def.slug });
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
      {bi(p.intro as Bi) && <p className="mb-6 text-center text-sm text-text-muted">{bi(p.intro as Bi)}</p>}
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

function Block({ block, services }: { block: CmsBlock; services: ServiceSummary[] }) {
  const p = block.props;
  switch (block.type) {
    case "hero": return <Hero p={p} />;
    case "servicesGrid": return <ServicesGrid p={p} services={services} />;
    case "richText": return <RichText p={p} />;
    case "imageText": return <ImageText p={p} />;
    case "faq": return <Faq p={p} />;
    case "stats": return <Stats p={p} />;
    case "cta": return <CtaBlock p={p} />;
    case "form": return <FormBlock p={p} />;
    default: return null;
  }
}

// Per-device visibility is CSS-only (md breakpoint), so it works with static/ISR rendering.
export function BlockRenderer({ blocks, services }: { blocks: CmsBlock[]; services: ServiceSummary[] }) {
  return (
    <>
      {blocks
        .filter((b) => !b.hidden && (b.visibility.desktop || b.visibility.mobile))
        .map((b) => {
          const cls = b.visibility.desktop && b.visibility.mobile ? "" : b.visibility.mobile ? "md:hidden" : "hidden md:block";
          return (
            <div key={b.id} className={cls}>
              <Block block={b} services={services} />
            </div>
          );
        })}
    </>
  );
}
