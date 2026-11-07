"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, X } from "lucide-react";
import { Paragraphs, useBi } from "@/components/cms/blockShared";
import { api, ApiError, type MaintenanceData, type MaintenancePackage } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import type { Bi } from "@/lib/cms";

type P = Record<string, unknown>;
type Lang = "en" | "ar";
const EMIRATES: [string, string][] = [["Abu Dhabi", "أبوظبي"], ["Dubai", "دبي"], ["Sharjah", "الشارقة"], ["Ajman", "عجمان"], ["Al Ain", "العين"], ["Umm Al Quwain", "أم القيوين"], ["Ras Al Khaimah", "رأس الخيمة"], ["Fujairah", "الفجيرة"]];
const BUSINESS_TYPES: [string, string][] = [["Office", "مكتب"], ["Shop", "محل"], ["Restaurant", "مطعم"], ["Clinic", "عيادة"], ["Warehouse", "مستودع"], ["Building", "مبنى"], ["Other", "أخرى"]];

function money(n: number, lang: Lang) {
  const v = n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return lang === "ar" ? `${v} د.إ` : `AED ${v}`;
}

// "AED 999", "Starting from AED 399" or "Custom Quotation", the way the package is priced in the admin.
function priceOf(pk: MaintenancePackage, lang: Lang): { prefix: string; amount: string; custom: boolean } {
  if (pk.price == null) return { prefix: "", amount: (lang === "ar" ? pk.priceTextAr || pk.priceTextEn : pk.priceTextEn || pk.priceTextAr) || (lang === "ar" ? "عرض سعر مخصص" : "Custom Quotation"), custom: true };
  return { prefix: (lang === "ar" ? pk.pricePrefixAr || pk.pricePrefixEn : pk.pricePrefixEn || pk.pricePrefixAr) ?? "", amount: money(pk.price, lang), custom: false };
}

// The annual maintenance packages, in the order the page needs: heading, package cards, the comparison table right after them,
// terms and exclusions, then the request form. Everything comes from Website → Maintenance Packages in the admin.
export function MaintenancePackagesBlock({ p, data }: { p: P; data: MaintenanceData | null }) {
  const bi = useBi();
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const [view, setView] = useState<{ id: string; mode: "details" | "request" } | null>(null);
  const packages = data?.packages ?? [];
  if (!data || packages.length === 0) return null;

  const quote = data.ctaMode === "quote";
  const s = data.settings;
  const heading = bi(p.heading as Bi) || (s ? (lang === "ar" ? s.headingAr || s.headingEn : s.headingEn || s.headingAr) : "");
  const subtitle = bi(p.subtitle as Bi) || (s ? (lang === "ar" ? s.subtitleAr || s.subtitleEn : s.subtitleEn || s.subtitleAr) : "");
  const note = s ? (lang === "ar" ? s.noteAr || s.noteEn : s.noteEn || s.noteAr) : "";
  const terms = lang === "ar" && data.terms.ar.length ? data.terms.ar : data.terms.en.length ? data.terms.en : data.terms.ar;
  const name = (pk: MaintenancePackage) => (lang === "ar" ? pk.nameAr || pk.nameEn : pk.nameEn || pk.nameAr);
  const cols = packages.length >= 4 ? "xl:grid-cols-4" : packages.length === 3 ? "lg:grid-cols-3" : "";
  const cta = quote ? t("Request a Quote", "اطلب عرض سعر") : t("Subscribe Now", "اشترك الآن");

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12">
      {(heading || subtitle) && (
        <div className="mx-auto mb-10 max-w-3xl text-center">
          {heading && <h2 className="text-3xl font-bold text-text sm:text-4xl">{heading}</h2>}
          {subtitle && <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-text-muted sm:text-base"><Paragraphs text={subtitle} /></div>}
        </div>
      )}

      <div className={`grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 ${cols}`}>
        {packages.map((pk) => {
          const badge = lang === "ar" ? pk.badgeAr || pk.badgeEn : pk.badgeEn || pk.badgeAr;
          const suitable = lang === "ar" ? pk.suitableAr || pk.suitableEn : pk.suitableEn || pk.suitableAr;
          const price = priceOf(pk, lang);
          return (
            <article key={pk.id} className={`osta-card relative flex flex-col gap-4 p-6 ${pk.highlighted ? "border-accent ring-2 ring-accent/70 xl:-translate-y-3" : ""}`}>
              {badge && <span className="absolute -top-3 start-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold text-white rtl:translate-x-1/2">{badge}</span>}
              <div>
                <h3 className="text-lg font-bold text-text">{name(pk)}</h3>
                {suitable && <p className="mt-1 text-xs leading-relaxed text-text-muted">{suitable}</p>}
              </div>
              <div>
                {price.prefix && <p className="text-xs font-medium text-text-muted">{price.prefix}</p>}
                <p className="flex flex-wrap items-baseline gap-1.5">
                  <span className={`${price.custom ? "text-2xl" : "text-4xl"} font-extrabold text-text`}>{price.amount}</span>
                  {!price.custom && <span className="text-sm text-text-muted">{t("/ Year", "/ سنوياً")}</span>}
                </p>
              </div>
              <Features pk={pk} data={data} className="flex-1" />
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => setView({ id: pk.id, mode: "request" })} className={`rounded-xl px-5 py-3 text-sm font-semibold ${pk.highlighted ? "osta-btn-primary text-white" : "border border-card-border text-text hover:border-accent"}`}>{cta}</button>
                <button type="button" onClick={() => setView({ id: pk.id, mode: "details" })} className="rounded-xl px-5 py-2 text-sm font-medium text-accent-2 hover:text-text">{t("View Details", "عرض التفاصيل")}</button>
              </div>
            </article>
          );
        })}
      </div>

      {p.showComparison !== "no" && data.comparison.length > 0 && (
        <div className="mt-14">
          <h3 className="mb-4 text-center text-2xl font-bold text-text">{t("Package Comparison", "مقارنة الباقات")}</h3>
          <div className="overflow-x-auto rounded-2xl border border-card-border">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-card">
                  <th scope="col" className="sticky start-0 z-10 bg-card p-3 text-start font-semibold text-text-muted">{t("Features", "المزايا")}</th>
                  {packages.map((pk) => <th key={pk.id} scope="col" className={`p-3 text-center font-bold ${pk.highlighted ? "bg-accent/20 text-text" : "text-text"}`}>{name(pk).replace(/\s*(Package|الباقة|باقة)\s*/g, " ").trim() || name(pk)}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.comparison.map((r) => (
                  <tr key={r.key} className="border-t border-card-border">
                    <th scope="row" className="sticky start-0 z-10 bg-bg p-3 text-start font-medium text-text">{lang === "ar" ? r.labelAr || r.labelEn : r.labelEn || r.labelAr}</th>
                    {r.cells.map((c, i) => {
                      const v = lang === "ar" ? c.ar || c.en : c.en || c.ar;
                      return (
                        <td key={i} className={`p-3 text-center ${packages[i]?.highlighted ? "bg-accent/10" : ""} ${v === "—" ? "text-text-faint" : "text-text-muted"}`}>
                          {v === "✓" ? <Check size={18} className="mx-auto text-emerald-500" aria-label={t("Included", "مشمول")} /> : v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {note && <p className="mt-2 text-center text-xs text-text-muted">{note}</p>}
        </div>
      )}

      {p.showTerms !== "no" && terms.length > 0 && (
        <details className="osta-card mx-auto mt-10 max-w-4xl p-5">
          <summary className="cursor-pointer text-base font-bold text-text">{t("Terms, Conditions & Exclusions", "الشروط والأحكام والاستثناءات")}</summary>
          <ol className="mt-4 flex list-decimal flex-col gap-2 ps-5 text-sm leading-relaxed text-text-muted">
            {terms.map((term, i) => <li key={i}>{term}</li>)}
          </ol>
        </details>
      )}

      {p.showForm !== "no" && (
        <div id="request-form" className="osta-card mx-auto mt-10 max-w-3xl scroll-mt-24 p-5 sm:p-7">
          <h3 className="mb-1 text-xl font-bold text-text">{quote ? t("Request a Quote", "اطلب عرض سعر") : t("Subscription Request", "طلب الاشتراك")}</h3>
          <p className="mb-5 text-sm text-text-muted">{quote ? t("Tell us about your business and we will send you a quotation.", "أخبرنا عن نشاطك وسنرسل لك عرض السعر.") : t("Send your details and our team will contact you to activate your package.", "أرسل بياناتك وسيتواصل معك فريقنا لتفعيل باقتك.")}</p>
          <RequestForm key={packages[0].id} quote={quote} packages={packages} initialId={packages.find((x) => x.highlighted)?.id ?? packages[0].id} nameOf={name} />
        </div>
      )}

      {view && (() => {
        const pk = packages.find((x) => x.id === view.id);
        if (!pk) return null;
        return view.mode === "details" ? (
          <DetailsModal pk={pk} data={data} nameOf={name} cta={cta} onClose={() => setView(null)} onRequest={() => setView({ id: pk.id, mode: "request" })} />
        ) : (
          <Modal title={cta} subtitle={`${name(pk)} — ${priceOf(pk, lang).prefix ? `${priceOf(pk, lang).prefix} ` : ""}${priceOf(pk, lang).amount}${priceOf(pk, lang).custom ? "" : ` ${t("/ Year", "/ سنوياً")}`}`} onClose={() => setView(null)}>
            <RequestForm quote={quote} packages={packages} initialId={pk.id} nameOf={name} onDone={() => undefined} />
          </Modal>
        );
      })()}
    </section>
  );
}

// What a package includes: its own bullet list when it has one, otherwise the included services with their quantities.
function Features({ pk, data, className = "" }: { pk: MaintenancePackage; data: MaintenanceData; className?: string }) {
  const { lang } = useLanguage();
  const items: { key: string; text: string; sub?: string }[] = (pk.bullets?.length ?? 0) > 0
    ? pk.bullets!.map((b, i) => ({ key: String(i), text: lang === "ar" ? b.ar || b.en : b.en || b.ar }))
    : pk.lines.flatMap((l) => {
        const sv = data.services.find((x) => x.id === l.serviceId);
        if (!sv) return [];
        return [{ key: l.serviceId, text: lang === "ar" ? sv.nameAr || sv.nameEn : sv.nameEn || sv.nameAr, sub: lang === "ar" ? l.quantityAr || l.quantityEn : l.quantityEn || l.quantityAr }];
      });
  return (
    <ul className={`flex flex-col gap-2.5 ${className}`} aria-label={lang === "ar" ? "الخدمات المشمولة" : "Included services"}>
      {items.map((it) => (
        <li key={it.key} className="flex items-start gap-2.5 text-sm text-text">
          <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden />
          <span>{it.text}{it.sub && <span className="block text-xs text-text-muted">{it.sub}</span>}</span>
        </li>
      ))}
    </ul>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  const { lang } = useLanguage();
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="osta-card max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-b-none p-5 sm:rounded-b-2xl sm:p-7">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-text">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={lang === "ar" ? "إغلاق" : "Close"} className="rounded-lg p-1.5 text-text-muted hover:text-text"><X size={20} aria-hidden /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailsModal({ pk, data, nameOf, cta, onClose, onRequest }: { pk: MaintenancePackage; data: MaintenanceData; nameOf: (p: MaintenancePackage) => string; cta: string; onClose: () => void; onRequest: () => void }) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const price = priceOf(pk, lang);
  const suitable = lang === "ar" ? pk.suitableAr || pk.suitableEn : pk.suitableEn || pk.suitableAr;
  const description = lang === "ar" ? pk.descriptionAr || pk.descriptionEn : pk.descriptionEn || pk.descriptionAr;
  return (
    <Modal title={nameOf(pk)} subtitle={suitable} onClose={onClose}>
      <p className="mb-4 flex flex-wrap items-baseline gap-2">
        {price.prefix && <span className="text-sm text-text-muted">{price.prefix}</span>}
        <span className="text-3xl font-extrabold text-text">{price.amount}</span>
        {!price.custom && <span className="text-sm text-text-muted">{t("/ Year", "/ سنوياً")}</span>}
      </p>
      {description && <p className="mb-4 text-sm leading-relaxed text-text-muted">{description}</p>}
      <p className="mb-2 text-sm font-semibold text-text">{t("What's included", "ما تشمله الباقة")}</p>
      <Features pk={pk} data={data} />
      {pk.maxAcUnits != null && <p className="mt-4 text-xs text-text-muted">{t(`Covers up to ${pk.maxAcUnits} AC units.`, `تغطي حتى ${pk.maxAcUnits} مكيفات.`)}</p>}
      <button type="button" onClick={onRequest} className="osta-btn-primary mt-6 w-full rounded-xl px-6 py-3 text-sm font-semibold text-white">{cta}</button>
    </Modal>
  );
}

// The form behind "Subscribe Now" (a household's property details) and "Request a Quote" (a business enquiry). Used in the popup and
// at the bottom of the block.
function RequestForm({ quote, packages, initialId, nameOf, onDone }: { quote: boolean; packages: MaintenancePackage[]; initialId: string; nameOf: (p: MaintenancePackage) => string; onDone?: () => void }) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const [f, setF] = useState({ packageId: initialId, name: "", company: "", phone: "", email: "", emirate: "Dubai", location: "", propertyType: quote ? "Office" : "Apartment", bedrooms: "2", acUnits: quote ? "" : "2", activationDate: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const first = useRef<HTMLInputElement>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const pkg = packages.find((x) => x.id === f.packageId);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => { if (onDone) first.current?.focus(); }, [onDone]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const digits = f.phone.replace(/\D/g, "");
    const acUnits = f.acUnits.trim() === "" ? 0 : Number(f.acUnits);
    if (f.name.trim().length < 2) return setError(t("Enter your full name.", "أدخل اسمك الكامل."));
    if (digits.length < 8 || digits.length > 15) return setError(t("Enter a valid mobile number.", "أدخل رقم جوال صحيحاً."));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setError(t("Enter a valid email address.", "أدخل بريداً إلكترونياً صحيحاً."));
    if (!Number.isInteger(acUnits) || acUnits < (quote ? 0 : 1)) return setError(t("Enter the number of AC units.", "أدخل عدد المكيفات."));
    if (f.activationDate && f.activationDate < today) return setError(t("The date cannot be in the past.", "لا يمكن أن يكون التاريخ في الماضي."));
    setBusy(true);
    try {
      await api.subscribeMaintenance({ kind: quote ? "quote" : "subscribe", packageId: f.packageId, name: f.name.trim(), phone: f.phone, email: f.email.trim(), emirate: f.emirate, location: f.location.trim(), propertyType: f.propertyType, bedrooms: quote ? 0 : Number(f.bedrooms), acUnits, activationDate: f.activationDate, company: f.company.trim(), message: f.message.trim() });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError && (err.status === 429 || err.status === 404 || err.status === 400) ? err.message : t("Something went wrong. Please try again, or contact us on WhatsApp.", "حدث خطأ ما. حاول مرة أخرى أو تواصل معنا عبر واتساب."));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
        <CheckCircle2 size={44} className="text-emerald-500" aria-hidden />
        <p className="text-lg font-semibold text-text">{t("Thank you! We received your request.", "شكراً لك! استلمنا طلبك.")}</p>
        <p className="max-w-md text-sm text-text-muted">{quote ? t("Our team will contact you soon with your quotation.", "سيتواصل معك فريقنا قريباً بعرض السعر.") : t("Our team will contact you soon to confirm the details and activate your package.", "سيتواصل معك فريقنا قريباً لتأكيد التفاصيل وتفعيل باقتك.")}</p>
      </div>
    );
  }

  const input = "w-full rounded-xl border border-card-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent";
  const lab = "flex flex-col gap-1.5 text-xs font-medium text-text-muted";
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <label className={lab}>{t("Full Name", "الاسم الكامل")}<input ref={first} className={input} autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
      {quote ? <label className={lab}>{t("Company / Business Name (optional)", "اسم الشركة / النشاط (اختياري)")}<input className={input} autoComplete="organization" value={f.company} onChange={(e) => set("company", e.target.value)} /></label> : null}
      <label className={lab}>{t("Mobile Number", "رقم الهاتف")}<input className={input} type="tel" inputMode="tel" dir="ltr" autoComplete="tel" placeholder="+971 50 123 4567" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></label>
      <label className={lab}>{t("Email Address", "البريد الإلكتروني")}<input className={input} type="email" dir="ltr" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
      <label className={lab}>{t("Emirate", "الإمارة")}
        <select className={input} value={f.emirate} onChange={(e) => set("emirate", e.target.value)}>{EMIRATES.map(([en, ar]) => <option key={en} value={en}>{lang === "ar" ? ar : en}</option>)}</select>
      </label>
      <label className={`${lab} sm:col-span-2`}>{t("Property Location (area, building)", "موقع العقار (المنطقة، المبنى)")}<input className={input} autoComplete="street-address" value={f.location} onChange={(e) => set("location", e.target.value)} /></label>
      <label className={lab}>{t("Property Type", "نوع العقار")}
        {quote ? (
          <select className={input} value={f.propertyType} onChange={(e) => set("propertyType", e.target.value)}>{BUSINESS_TYPES.map(([en, ar]) => <option key={en} value={en}>{lang === "ar" ? ar : en}</option>)}</select>
        ) : (
          <select className={input} value={f.propertyType} onChange={(e) => set("propertyType", e.target.value)}><option value="Apartment">{t("Apartment", "شقة")}</option><option value="Villa">{t("Villa", "فيلا")}</option></select>
        )}
      </label>
      {!quote && (
        <label className={lab}>{t("Number of Bedrooms", "عدد غرف النوم")}
          <select className={input} value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value)}>
            <option value="0">{t("Studio", "استوديو")}</option>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
      <label className={lab}>{quote ? t("Number of AC Units (optional)", "عدد المكيفات (اختياري)") : t("Number of AC Units", "عدد المكيفات")}<input className={input} type="number" inputMode="numeric" min={quote ? 0 : 1} max={500} dir="ltr" value={f.acUnits} onChange={(e) => set("acUnits", e.target.value)} /></label>
      <label className={lab}>{t("Selected Package", "الباقة المختارة")}
        <select className={input} value={f.packageId} onChange={(e) => set("packageId", e.target.value)}>{packages.map((x) => <option key={x.id} value={x.id}>{nameOf(x)}</option>)}</select>
      </label>
      <label className={`${lab} ${quote ? "" : "sm:col-span-2"}`}>{quote ? t("Preferred Start Date (optional)", "تاريخ البدء المفضل (اختياري)") : t("Preferred Activation Date (optional)", "تاريخ التفعيل المفضل (اختياري)")}<input className={input} type="date" min={today} dir="ltr" value={f.activationDate} onChange={(e) => set("activationDate", e.target.value)} /></label>
      {quote && <label className={`${lab} sm:col-span-2`}>{t("Message (optional)", "رسالة (اختياري)")}<textarea className={`${input} resize-y`} rows={3} maxLength={1000} value={f.message} onChange={(e) => set("message", e.target.value)} /></label>}
      {!quote && pkg?.maxAcUnits != null && Number(f.acUnits) > pkg.maxAcUnits && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200 sm:col-span-2">
          {t(`This package covers up to ${pkg.maxAcUnits} AC units. Send your request anyway and we will help you choose the right package.`, `تغطي هذه الباقة حتى ${pkg.maxAcUnits} مكيفات. أرسل طلبك وسنساعدك في اختيار الباقة المناسبة.`)}
        </p>
      )}
      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200 sm:col-span-2">{error}</p>}
      <button type="submit" disabled={busy} aria-busy={busy} className="osta-btn-primary rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">
        {busy ? t("Sending…", "جارٍ الإرسال…") : quote ? t("Send quote request", "إرسال طلب عرض السعر") : t("Send subscription request", "إرسال طلب الاشتراك")}
      </button>
    </form>
  );
}
