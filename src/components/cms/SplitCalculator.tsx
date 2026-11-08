"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Copy, Download, FileText, Loader2, MessageCircle, Plus, Printer, Share2, Trash2, X } from "lucide-react";
import { Paragraphs, imgProps } from "@/components/cms/blockShared";
import { DynamicIcon } from "@/components/DynamicIcon";
import {
  api, ApiError, downloadAgreementPdf, fetchPdfBlobUrl, splitQuotePdfPath,
  type SplitConfig, type SplitCustomer, type SplitInput, type SplitLine, type SplitPackage, type SplitProject, type SplitQuoteView, type SplitTotals,
} from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { whatsappHref } from "@/lib/site";

type P = Record<string, unknown>;
type Lang = "en" | "ar";
type BiText = { en: string; ar: string };

const money = (n: number, lang: Lang) => {
  const v = n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
  return lang === "ar" ? `${v} د.إ` : `AED ${v}`;
};
const pickBi = (lang: Lang, en: string, ar: string) => (lang === "ar" ? ar || en : en || ar);
const pickList = (lang: Lang, l: { en: string[]; ar: string[] }) => (lang === "ar" && l.ar.length ? l.ar : l.en);
const rid = () => Math.random().toString(36).slice(2, 9);
const input = "w-full rounded-xl border border-card-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent";
const lab = "flex flex-col gap-1.5 text-xs font-medium text-text-muted";
const EXTRA_UNIT: Record<string, { en: string; ar: string; priceEn: string; priceAr: string }> = {
  meter: { en: "metres", ar: "متر", priceEn: "per metre", priceAr: "بالمتر" }, unit: { en: "units", ar: "وحدة", priceEn: "per unit", priceAr: "للوحدة" }, lot: { en: "quantity", ar: "الكمية", priceEn: "per job", priceAr: "للعمل" },
};

const range = (p: SplitPackage, caps: SplitConfig["capacities"]) => {
  const v = caps.map((c) => p.prices[c.key]).filter((x): x is number => typeof x === "number");
  return v.length ? { min: Math.min(...v), max: Math.max(...v) } : null;
};

// ---- the packages, the price table and the conditions on the page ----

function Packages({ config }: { config: SplitConfig }) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const pk = config.packages, caps = config.capacities;
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <h2 className="mb-2 text-center text-2xl font-bold text-text sm:text-3xl">{t("Split AC installation packages", "باقات تركيب المكيف السبليت")}</h2>
      <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-text-muted">{t("All prices are in UAE Dirhams (AED) per AC unit, before VAT, and depend on the AC capacity.", "جميع الأسعار بالدرهم الإماراتي لكل وحدة تكييف، قبل ضريبة القيمة المضافة، وتعتمد على سعة المكيف.")}</p>
      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        {pk.map((p) => {
          const r = range(p, caps);
          return (
            <article key={p.key} className={`osta-card relative flex flex-col gap-3 p-6 ${p.highlighted ? "border-accent ring-2 ring-accent/60" : ""}`}>
              {p.highlighted && <span className="absolute -top-3 start-6 rounded-full bg-accent px-3 py-0.5 text-[11px] font-bold text-white">{t("Recommended", "الأكثر اختياراً")}</span>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.imageUrl && <img {...imgProps(p.imageUrl, "(min-width:1024px) 380px, 100vw")} alt={pickBi(lang, p.imageAltEn, p.imageAltAr) || pickBi(lang, p.nameEn, p.nameAr)} className="h-36 w-full rounded-xl object-cover" />}
              <div className="flex items-start gap-3">
                {p.icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-2"><DynamicIcon name={p.icon} size={20} /></span>}
                <div><h3 className="text-lg font-bold text-text">{pickBi(lang, p.nameEn, p.nameAr)}</h3><p className="text-sm text-text-muted">{pickBi(lang, p.subtitleEn, p.subtitleAr)}</p></div>
              </div>
              {r && <p className="text-sm text-text-muted">{t("From", "ابتداءً من")} <span className="text-2xl font-extrabold text-text">{money(r.min, lang)}</span> <span>{t("per unit", "لكل وحدة")}</span></p>}
              <p className="text-xs font-semibold text-accent-2">{p.copperMeters > 0 ? t(`Copper piping up to ${p.copperMeters} metres`, `مواسير نحاس حتى ${p.copperMeters} أمتار`) : t("No new copper piping", "بدون مواسير نحاس جديدة")}</p>
              <p className="text-sm text-text-muted">{pickBi(lang, p.descriptionEn, p.descriptionAr)}</p>
              {pickList(lang, p.materials).length > 0 && <div><p className="mb-1 text-xs font-bold text-text">{t("Included materials", "الخامات المشمولة")}</p><ul className="flex flex-col gap-1 text-sm text-text">{pickList(lang, p.materials).map((x) => <li key={x} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden /><span>{x}</span></li>)}</ul></div>}
              <div><p className="mb-1 text-xs font-bold text-text">{t("Included services", "الخدمات المشمولة")}</p><ul className="flex flex-col gap-1 text-sm text-text">{pickList(lang, p.services).map((x) => <li key={x} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden /><span>{x}</span></li>)}</ul></div>
              <div className="border-t border-card-border pt-3"><p className="mb-1 text-xs font-bold text-text">{t("Not included", "غير مشمول")}</p><ul className="flex flex-col gap-1 text-xs text-text-muted">{pickList(lang, p.notIncluded).map((x) => <li key={x} className="flex gap-2"><X size={13} className="mt-0.5 shrink-0 text-rose-400" aria-hidden /><span>{x}</span></li>)}</ul></div>
              <a href="#split-calculator" className="osta-btn-primary mt-auto rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white">{t("Get a quotation", "احصل على عرض سعر")}</a>
            </article>
          );
        })}
      </div>

      <div className="osta-card mt-8 overflow-x-auto p-4">
        <h3 className="mb-3 text-base font-bold text-text">{t("Price per AC unit (AED, before VAT)", "السعر لكل وحدة تكييف (درهم، قبل الضريبة)")}</h3>
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b border-card-border text-xs text-text-muted"><th className="px-2 py-2 text-start">{t("AC capacity", "سعة المكيف")}</th>{pk.map((p) => <th key={p.key} className={`px-2 py-2 text-start ${p.highlighted ? "text-accent-2" : ""}`}>{pickBi(lang, p.nameEn, p.nameAr)}</th>)}</tr></thead>
          <tbody>
            {caps.map((c) => (
              <tr key={c.key} className="border-b border-card-border/60">
                <td className="px-2 py-2 font-semibold text-text">{pickBi(lang, c.labelEn, c.labelAr)}</td>
                {pk.map((p) => <td key={p.key} className={`px-2 py-2 ${p.highlighted ? "font-bold text-text" : "text-text-muted"}`}>{typeof p.prices[c.key] === "number" ? p.prices[c.key].toLocaleString("en-US") : "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-text-muted">{t(`VAT ${config.vatPercent}% is added to the quotation once, on the total.`, `تُضاف ضريبة القيمة المضافة ${config.vatPercent}% مرة واحدة على الإجمالي في عرض السعر.`)}</p>
      </div>

      <div className="osta-card mt-6 p-6">
        <h3 className="mb-2 text-lg font-bold text-text">{t("Important package conditions", "شروط مهمة للباقات")}</h3>
        <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-sm text-text-muted">{pickList(lang, config.conditions).map((x) => <li key={x}>{x}</li>)}</ol>
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />{pickBi(lang, config.technicalNote.en, config.technicalNote.ar)}</p>
      </div>
    </div>
  );
}

// ---- the calculator ----

type UnitRow = { id: string; capacity: string; packageKey: string; qty: string };
type ExtraState = Record<string, { on: boolean; qty: string; note: string }>;
const qtyN = (v: string) => (v.trim() === "" ? 0 : Math.max(0, Math.floor(Number(v)) || 0));

const REQ_ERR = (t: (a: string, b: string) => string) => t("Something went wrong. Please try again, or contact us on WhatsApp.", "حدث خطأ ما. حاول مرة أخرى أو تواصل معنا عبر واتساب.");

function Calculator({ config, defaultLang, heading, subtitle, edit }: { config: SplitConfig; defaultLang: Lang; heading: BiText; subtitle: BiText; edit?: { token: string; view: SplitQuoteView } }) {
  const { settings } = useSite();
  const [lang, setLang] = useState<Lang>(edit ? edit.view.lang : defaultLang);
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const view = edit?.view;
  const bi = (x: BiText) => (lang === "ar" ? x.ar || x.en : x.en || x.ar);

  const firstCap = config.capacities[0]?.key ?? "";
  const [step, setStep] = useState(1);
  // The package chosen in step 1 is what a new AC row starts with; every row can still pick its own.
  const [pkgKey, setPkgKey] = useState<string>(() => view?.input.units[0]?.packageKey ?? "");
  const [units, setUnits] = useState<UnitRow[]>(() => (view ? view.input.units.map((u) => ({ id: rid(), capacity: u.capacity, packageKey: u.packageKey, qty: String(u.qty) })) : []));
  const [extras, setExtras] = useState<ExtraState>(() => { const m: ExtraState = {}; for (const s of view?.input.services ?? []) m[s.key] = { on: true, qty: String(s.qty), note: s.note ?? "" }; return m; });
  const [cust, setCust] = useState<SplitCustomer>(() => view?.customer ?? { name: "", phone: "", email: "" });
  const [proj, setProj] = useState<SplitProject>(() => view?.project ?? { propertyType: "", emirate: "", location: "", address: "", notes: "" });
  const [calcRaw, setCalc] = useState<{ lines: SplitLine[]; totals: SplitTotals } | null>(null);
  const [calcErrRaw, setCalcError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(edit?.token ?? null);
  const [done, setDone] = useState<null | { number: string; version?: number }>(null);
  const [pdfLang, setPdfLang] = useState<Lang | "both">(edit ? edit.view.lang : defaultLang);
  const [pdfBusy, setPdfBusy] = useState<null | "download" | "print">(null);
  const [booked, setBooked] = useState(false);
  const [copied, setCopied] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const quoteInput = useMemo<SplitInput>(() => ({
    units: units.filter((u) => qtyN(u.qty) >= 1 && u.capacity && u.packageKey).map((u) => ({ capacity: u.capacity, packageKey: u.packageKey, qty: qtyN(u.qty) })),
    services: config.extras.filter((s) => extras[s.key]?.on && qtyN(extras[s.key].qty) >= 1).map((s) => ({ key: s.key, qty: qtyN(extras[s.key].qty), ...(extras[s.key].note.trim() ? { note: extras[s.key].note.trim() } : {}) })),
  }), [units, extras, config.extras]);

  // The live quotation: the server works it out and the page draws what it answers.
  const inputKey = JSON.stringify(quoteInput);
  useEffect(() => {
    let live = true;
    if (quoteInput.units.length === 0) return;
    const timer = window.setTimeout(() => {
      api.splitQuoteCalculate(quoteInput).then((r) => { if (live) { setCalc(r); setCalcError(null); } }).catch((e) => { if (live) setCalcError(e instanceof ApiError ? e.message : t("Could not calculate. Please check your choices.", "تعذر الحساب. يرجى مراجعة اختياراتك.")); });
    }, 250);
    return () => { live = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey]);
  const calc = quoteInput.units.length ? calcRaw : null;
  const calcError = quoteInput.units.length ? calcErrRaw : null;
  const totals = calc?.totals;

  const goto = (n: number) => { setError(null); setStep(n); window.setTimeout(() => top.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 0); };
  const pkgOf = (k: string) => config.packages.find((p) => p.key === k);
  const capOf = (k: string) => config.capacities.find((c) => c.key === k);
  const setUnit = (id: string, patch: Partial<UnitRow>) => setUnits((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const validUnits = units.filter((u) => qtyN(u.qty) >= 1 && u.capacity && u.packageKey);
  const lineOf = (id: string) => { const i = validUnits.findIndex((u) => u.id === id); return i < 0 ? undefined : calc?.lines.find((l) => l.id === `u${i}`); };
  const label = (l: SplitLine) => pickBi(lang, l.labelEn, l.labelAr);

  function choosePackage(key: string) {
    setPkgKey(key);
    setUnits((u) => (u.length ? u : [{ id: rid(), capacity: firstCap, packageKey: key, qty: "1" }]));
    goto(2);
  }

  function problem(forStep: number): string | null {
    if (forStep >= 1 && !pkgKey) return t("Choose an installation package.", "اختر باقة التركيب.");
    if (forStep >= 2) {
      if (units.length === 0) return t("Add at least one AC unit.", "أضف وحدة تكييف واحدة على الأقل.");
      if (units.some((u) => !u.capacity || !u.packageKey || qtyN(u.qty) < 1)) return t("Choose the capacity, package and quantity for every AC unit.", "اختر السعة والباقة والكمية لكل وحدة تكييف.");
    }
    if (forStep >= 3 && config.extras.some((s) => extras[s.key]?.on && qtyN(extras[s.key].qty) < 1)) return t("Enter a quantity for each selected service.", "أدخل كمية لكل خدمة مختارة.");
    if (forStep >= 4) {
      const d = cust.phone.replace(/\D/g, "");
      if (cust.name.trim().length < 2) return t("Enter your full name.", "أدخل اسمك الكامل.");
      if (d.length < 8 || d.length > 15) return t("Enter a valid mobile number.", "أدخل رقم جوال صحيحاً.");
      if (cust.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cust.email.trim())) return t("Enter a valid email address.", "أدخل بريداً إلكترونياً صحيحاً.");
      if (!proj.emirate) return t("Choose the emirate.", "اختر الإمارة.");
      if (proj.location.trim().length < 2) return t("Enter the area / location.", "أدخل المنطقة / الموقع.");
      if (!proj.propertyType) return t("Choose the property type.", "اختر نوع العقار.");
      if (proj.address.trim().length < 2) return t("Enter the installation address.", "أدخل عنوان التركيب.");
    }
    return null;
  }
  const next = () => { const p = problem(step); if (p) return setError(p); goto(step + 1); };

  async function generate() {
    if (busy) return;
    const p = problem(4);
    if (p) return setError(p);
    setBusy(true); setError(null);
    const body = { lang, input: quoteInput, customer: { name: cust.name.trim(), phone: cust.phone.trim(), email: cust.email.trim() }, project: { ...proj, location: proj.location.trim(), address: proj.address.trim(), notes: proj.notes.trim() } };
    try {
      if (token) { const r = await api.splitQuoteEdit(token, body); setDone({ number: r.number, version: r.version }); }
      else { const r = await api.splitQuoteCreate(body); setToken(r.token); setDone({ number: r.number }); }
      setBooked(false); setStep(6);
      window.setTimeout(() => top.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 0);
    } catch (e) { setError(e instanceof ApiError ? e.message : REQ_ERR(t)); } finally { setBusy(false); }
  }
  async function book() {
    if (!token || busy) return;
    setBusy(true); setError(null);
    try { await api.splitQuoteBook(token); setBooked(true); } catch (e) { setError(e instanceof ApiError ? e.message : REQ_ERR(t)); } finally { setBusy(false); }
  }
  async function pdf() {
    if (!token) return;
    setPdfBusy("download"); setError(null);
    try { await downloadAgreementPdf(splitQuotePdfPath(token, pdfLang), null, `${done?.number ?? "quotation"}.pdf`); } catch { setError(t("The PDF could not be prepared. Please try again.", "تعذر تجهيز ملف PDF. حاول مرة أخرى.")); } finally { setPdfBusy(null); }
  }
  async function printPdf() {
    if (!token) return;
    setPdfBusy("print"); setError(null);
    try {
      const url = await fetchPdfBlobUrl(splitQuotePdfPath(token, pdfLang));
      const f = document.createElement("iframe");
      f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
      f.onload = () => { try { f.contentWindow?.focus(); f.contentWindow?.print(); } catch { window.open(url, "_blank"); } window.setTimeout(() => { f.remove(); URL.revokeObjectURL(url); }, 120_000); };
      f.src = url; document.body.appendChild(f);
    } catch { setError(t("The PDF could not be prepared. Please try again.", "تعذر تجهيز ملف PDF. حاول مرة أخرى.")); } finally { setPdfBusy(null); }
  }
  const quoteLink = () => (typeof window === "undefined" ? "" : `${window.location.origin}/split-quote/${token}`);
  const shareHref = () => `https://wa.me/?text=${encodeURIComponent(t(`Osta split AC installation quotation ${done?.number ?? ""}: ${quoteLink()}`, `عرض سعر اسطا لتركيب مكيف سبليت ${done?.number ?? ""}: ${quoteLink()}`))}`;
  async function copyLink() { try { await navigator.clipboard.writeText(quoteLink()); setCopied(true); window.setTimeout(() => setCopied(false), 2500); } catch { setError(t("Copy the link from the address below.", "انسخ الرابط من العنوان أدناه.")); } }

  const steps = [t("Package", "الباقة"), t("AC units", "الوحدات"), t("Extras", "الخدمات"), t("Your details", "بياناتك"), t("Summary", "الملخص")];
  const stepper = (
    <ol className="mb-5 flex items-center gap-1 overflow-x-auto pb-1 text-xs" aria-label={t("Steps", "الخطوات")}>
      {steps.map((s, i) => (
        <li key={i} aria-current={step === i + 1 ? "step" : undefined} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 ${step === i + 1 ? "bg-accent/20 font-bold text-text" : i + 1 < step ? "text-emerald-400" : "text-text-faint"}`}>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${i + 1 < step ? "bg-emerald-500 text-white" : "bg-card-border text-text"}`}>{i + 1 < step ? <Check size={12} aria-hidden /> : i + 1}</span>
          <span className={step === i + 1 ? "inline" : "hidden sm:inline"}>{s}</span>
        </li>
      ))}
    </ol>
  );

  const summary = (
    <aside className="rounded-xl border border-card-border bg-bg-elevated p-4 text-sm" aria-label={t("Quotation summary", "ملخص عرض السعر")}>
      <p className="mb-2 font-bold text-text">{t("Live quotation summary", "ملخص عرض السعر المباشر")}</p>
      {!calc ? <p className="text-xs text-text-muted">{calcError ?? t("Add your AC units to see the cost.", "أضف وحدات التكييف لعرض التكلفة.")}</p> : (
        <>
          <ul className="flex flex-col gap-2">
            {calc.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span className="text-text-muted">{l.kind === "unit" ? <>{l.qty}× {pickBi(lang, l.capacityEn, l.capacityAr)}<span className="block text-[11px] text-text-faint">{pickBi(lang, l.packageEn, l.packageAr)}</span></> : <>{label(l)}{l.qty > 1 ? ` × ${l.qty}` : ""}</>}</span>
                <span className="shrink-0 text-end text-text">{l.amount == null ? <span className="text-amber-300">{t("Quotation", "عرض سعر")}</span> : `${l.kind === "discount" ? "− " : ""}${money(l.amount, lang)}`}</span>
              </li>
            ))}
          </ul>
          {totals && (
            <dl className="mt-3 flex flex-col gap-1.5 border-t border-card-border pt-3">
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("AC installation", "تركيب المكيفات")}</dt><dd className="text-text">{money(totals.unitsTotal, lang)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Additional services", "الخدمات الإضافية")}</dt><dd className="text-text">{money(totals.servicesTotal, lang)}</dd></div>
              {totals.discount > 0 && <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Discount", "الخصم")}</dt><dd className="text-text">− {money(totals.discount, lang)}</dd></div>}
              <div className="flex justify-between gap-3 border-t border-card-border pt-1.5"><dt className="text-text-muted">{t("Total before VAT", "الإجمالي قبل الضريبة")}</dt><dd className="text-text">{money(totals.subtotal, lang)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t(`VAT ${totals.vatPercent}%`, `ضريبة القيمة المضافة ${totals.vatPercent}%`)}</dt><dd className="text-text">{money(totals.vat, lang)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-card-border pt-2 text-base font-extrabold"><dt className="text-text">{t("Grand Total", "الإجمالي الكلي")}</dt><dd className="text-text">{money(totals.total, lang)}</dd></div>
            </dl>
          )}
          {totals?.rfq && <p className="mt-2 text-xs text-amber-200">{t("Items marked “Quotation” are not in the total and will be priced after review.", "البنود المعلّمة «عرض سعر» غير مشمولة في الإجمالي وسيتم تسعيرها بعد المراجعة.")}</p>}
        </>
      )}
      <p className="mt-3 flex items-start gap-1.5 border-t border-card-border pt-3 text-[11px] text-amber-100"><AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />{bi(config.disclaimer)}</p>
    </aside>
  );

  const header = (
    <div ref={top} className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-text sm:text-2xl">{pickBi(lang, heading.en, heading.ar)}</h2>
        {pickBi(lang, subtitle.en, subtitle.ar) && <div className="mt-1 text-sm text-text-muted"><Paragraphs text={pickBi(lang, subtitle.en, subtitle.ar)} /></div>}
      </div>
      <div className="flex shrink-0 overflow-hidden rounded-lg border border-card-border text-xs font-semibold" role="group" aria-label={t("Calculator language", "لغة الحاسبة")}>
        {(["en", "ar"] as const).map((l) => <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className={`px-3 py-1.5 ${lang === l ? "bg-accent text-white" : "text-text-muted"}`}>{l === "en" ? "English" : "العربية"}</button>)}
      </div>
    </div>
  );

  // ---- the quotation is ready ----
  if (done && token) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="osta-card p-5 sm:p-7">
        {header}
        <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
          <CheckCircle2 size={44} className="text-emerald-500" aria-hidden />
          <p className="text-xl font-bold text-text">{done.version ? t("Your quotation was updated", "تم تحديث عرض السعر") : t("Your quotation is ready", "عرض السعر جاهز")}</p>
          <p className="text-sm text-text-muted">{t("Quotation number", "رقم عرض السعر")}: <b className="text-text" dir="ltr">{done.number}</b>{done.version ? ` · v${done.version}` : ""}</p>
          {totals && <p className="text-2xl font-extrabold text-accent-2">{money(totals.total, lang)} <span className="text-sm font-normal text-text-muted">{t("incl. VAT", "شامل الضريبة")}</span></p>}
          {totals?.rfq && <p className="max-w-md text-xs text-amber-200">{t("Some items are marked as a request for quotation. They are not in this total.", "بعض البنود معلّمة كطلب عرض سعر وهي غير مشمولة في هذا الإجمالي.")}</p>}
        </div>
        <div className="mx-auto max-w-2xl">
          <fieldset className="mb-3 flex flex-wrap items-center justify-center gap-2 text-sm">
            <legend className="sr-only">{t("PDF language", "لغة ملف PDF")}</legend>
            <span className="text-xs text-text-muted">{t("PDF language", "لغة ملف PDF")}:</span>
            {([["en", "English"], ["ar", "العربية"], ["both", t("English + Arabic", "إنجليزي + عربي")]] as const).map(([k, l]) => (
              <label key={k} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold ${pdfLang === k ? "border-accent bg-accent/15 text-text" : "border-card-border text-text-muted"}`}><input type="radio" name="split-pdf-lang" className="sr-only" checked={pdfLang === k} onChange={() => setPdfLang(k)} />{l}</label>
            ))}
          </fieldset>
          <div className="grid gap-2 sm:grid-cols-3">
            <button type="button" disabled={pdfBusy !== null} onClick={() => void pdf()} className="osta-btn-primary flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{pdfBusy === "download" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Download size={16} aria-hidden />}{t("Download PDF", "تحميل PDF")}</button>
            <button type="button" disabled={pdfBusy !== null} onClick={() => void printPdf()} className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text disabled:opacity-60">{pdfBusy === "print" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Printer size={16} aria-hidden />}{t("Print", "طباعة")}</button>
            <a href={shareHref()} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text"><Share2 size={16} aria-hidden />{t("Share on WhatsApp", "مشاركة عبر واتساب")}</a>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={busy || booked} onClick={() => void book()} className="flex items-center justify-center gap-2 rounded-xl border border-accent px-4 py-3 text-sm font-semibold text-accent-2 disabled:opacity-60">{busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <FileText size={16} aria-hidden />}{t("Request Booking", "طلب الحجز")}</button>
            <button type="button" onClick={() => { setDone(null); setBooked(false); goto(1); }} className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text">{t("Edit Quotation", "تعديل عرض السعر")}</button>
            <a href={whatsappHref(settings, lang, t(`Hello Osta, I generated split AC quotation ${done.number}.`, `مرحباً اسطا، أنشأت عرض سعر تركيب مكيف سبليت ${done.number}.`))} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text sm:col-span-2"><MessageCircle size={16} aria-hidden />{t("Contact via WhatsApp", "التواصل عبر واتساب")}</a>
          </div>
          {booked && <p role="status" className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{t("We received your booking request. This does not confirm an appointment: our team will review it and confirm the date with you.", "استلمنا طلب الحجز. هذا لا يعني تأكيد الموعد: سيراجعه فريقنا ويؤكد التاريخ معك.")}</p>}
          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          <p className="mt-4 text-center text-xs text-text-muted">{t("Keep this private link to come back, change or download your quotation:", "احتفظ بهذا الرابط الخاص للعودة إلى عرض السعر أو تعديله أو تحميله:")} <a className="break-all font-semibold text-accent-2 underline" dir="ltr" href={`/split-quote/${token}`}>{`/split-quote/${token}`}</a>{" "}
            <button type="button" onClick={() => void copyLink()} className="ms-1 inline-flex items-center gap-1 rounded-md border border-card-border px-2 py-0.5 font-semibold text-text"><Copy size={11} aria-hidden />{copied ? t("Copied", "تم النسخ") : t("Copy", "نسخ")}</button></p>
        </div>
      </div>
    );
  }

  const mobileTotal = totals ? <p className="flex items-center justify-between rounded-xl border border-card-border bg-bg-elevated px-3 py-2 text-sm lg:hidden"><span className="text-text-muted">{t("Total incl. VAT", "الإجمالي شامل الضريبة")}</span><b className="text-text">{money(totals.total, lang)}</b></p> : null;

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="osta-card p-5 sm:p-7">
      {header}
      {stepper}
      <div className="grid gap-5 lg:grid-cols-[1fr_21rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-muted">{t("Choose the installation package. You can still pick a different package for each AC unit in the next step.", "اختر باقة التركيب. يمكنك اختيار باقة مختلفة لكل وحدة تكييف في الخطوة التالية.")}</p>
              <div className="grid gap-3 md:grid-cols-3">
                {config.packages.map((p) => {
                  const r = range(p, config.capacities), on = pkgKey === p.key;
                  return (
                    <div key={p.key} className={`relative flex flex-col gap-2 rounded-xl border p-4 ${on ? "border-accent bg-accent/10 ring-1 ring-accent/50" : p.highlighted ? "border-accent/60" : "border-card-border"}`}>
                      {p.highlighted && <span className="absolute -top-2.5 start-4 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-white">{t("Recommended", "الأكثر اختياراً")}</span>}
                      <div className="flex items-start gap-2.5">{p.icon && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-2"><DynamicIcon name={p.icon} size={18} /></span>}<div><p className="text-sm font-bold text-text">{pickBi(lang, p.nameEn, p.nameAr)}</p><p className="text-xs text-text-muted">{pickBi(lang, p.subtitleEn, p.subtitleAr)}</p></div></div>
                      <p className="text-xs font-semibold text-accent-2">{p.copperMeters > 0 ? t(`Copper piping up to ${p.copperMeters} m`, `مواسير نحاس حتى ${p.copperMeters} م`) : t("No new copper piping", "بدون مواسير نحاس جديدة")}</p>
                      <ul className="flex flex-col gap-1 text-xs text-text">{pickList(lang, p.services).slice(0, 4).map((x) => <li key={x} className="flex gap-1.5"><Check size={12} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />{x}</li>)}</ul>
                      {r && <p className="mt-auto pt-1 text-sm text-text-muted">{t("From", "ابتداءً من")} <b className="text-base text-text">{money(r.min, lang)}</b>{r.max > r.min ? <span className="text-xs"> · {t("up to", "حتى")} {money(r.max, lang)}</span> : null}</p>}
                      <button type="button" onClick={() => choosePackage(p.key)} aria-pressed={on} className={`rounded-xl px-4 py-2 text-sm font-semibold ${on ? "osta-btn-primary text-white" : "border border-card-border text-text"}`}>{on ? <span className="inline-flex items-center gap-1.5"><Check size={14} aria-hidden />{t("Selected", "تم الاختيار")}</span> : t("Select Package", "اختر الباقة")}</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-muted">{t("Add every AC unit. Each row has its own capacity, quantity and package.", "أضف كل وحدات التكييف. لكل صف سعته وكميته وباقته.")}</p>
              {units.map((u, i) => {
                const l = lineOf(u.id);
                return (
                  <fieldset key={u.id} className="rounded-xl border border-card-border p-4">
                    <legend className="px-2 text-sm font-bold text-text">{t("AC", "مكيف")} {i + 1}</legend>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className={lab}>{t("AC Capacity", "سعة المكيف")}<select className={input} value={u.capacity} onChange={(e) => setUnit(u.id, { capacity: e.target.value })}>{config.capacities.map((c) => <option key={c.key} value={c.key}>{pickBi(lang, c.labelEn, c.labelAr)}</option>)}</select></label>
                      <label className={lab}>{t("Quantity", "الكمية")}<input className={input} type="number" inputMode="numeric" min={1} max={100} dir="ltr" value={u.qty} onChange={(e) => setUnit(u.id, { qty: e.target.value })} /></label>
                      <label className={lab}>{t("Package", "الباقة")}<select className={input} value={u.packageKey} onChange={(e) => setUnit(u.id, { packageKey: e.target.value })}>{config.packages.map((p) => <option key={p.key} value={p.key}>{pickBi(lang, p.nameEn, p.nameAr)}</option>)}</select></label>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <p className="text-text-muted">{t("Unit price", "سعر الوحدة")}: <b className="text-text">{l?.unitPrice != null ? money(l.unitPrice, lang) : (() => { const pr = pkgOf(u.packageKey)?.prices[u.capacity]; return pr != null ? money(pr, lang) : "—"; })()}</b> · {t("Subtotal", "المجموع")}: <b className="text-text">{l?.amount != null ? money(l.amount, lang) : "—"}</b></p>
                      {units.length > 1 && <button type="button" onClick={() => setUnits((x) => x.filter((y) => y.id !== u.id))} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300"><Trash2 size={13} aria-hidden />{t("Remove", "حذف")}</button>}
                    </div>
                  </fieldset>
                );
              })}
              <button type="button" onClick={() => setUnits((x) => [...x, { id: rid(), capacity: x[x.length - 1]?.capacity ?? firstCap, packageKey: x[x.length - 1]?.packageKey ?? pkgKey, qty: "1" }])} disabled={units.length >= 30} className="inline-flex items-center gap-2 self-start rounded-xl border border-card-border px-4 py-2 text-sm font-semibold text-text disabled:opacity-50"><Plus size={15} aria-hidden />{t("Add Another AC Unit", "إضافة مكيف آخر")}</button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-muted">{t("Add optional services if you need them. The price of each one is shown before you add it. An item without a set price is sent as a request for quotation: no price is guessed.", "أضف خدمات اختيارية عند الحاجة. يظهر سعر كل خدمة قبل إضافتها. البند بدون سعر محدد يُرسل كطلب عرض سعر دون تخمين السعر.")}</p>
              <div className="grid gap-2">
                {config.extras.map((s) => {
                  const st = extras[s.key] ?? { on: false, qty: "1", note: "" };
                  const priced = !s.rfq && s.price != null;
                  const u = EXTRA_UNIT[s.unit] ?? EXTRA_UNIT.lot;
                  const desc = pickBi(lang, s.descriptionEn, s.descriptionAr);
                  return (
                    <div key={s.key} className={`rounded-xl border p-3 ${st.on ? "border-accent/60 bg-accent/5" : "border-card-border"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-text"><input type="checkbox" className="h-4 w-4 accent-[#087bff]" checked={st.on} onChange={(e) => setExtras((m) => ({ ...m, [s.key]: { ...st, on: e.target.checked } }))} />{pickBi(lang, s.nameEn, s.nameAr)}</label>
                        <span className={`text-xs ${priced ? "text-text-muted" : "font-semibold text-amber-300"}`}>{priced ? `${money(s.price!, lang)} ${lang === "ar" ? u.priceAr : u.priceEn}` : t("Request for quotation", "طلب عرض سعر")}</span>
                      </div>
                      {desc && <p className="mt-1 ps-6 text-xs text-text-muted">{desc}</p>}
                      {st.on && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-[8rem_1fr]">
                          <label className={lab}>{lang === "ar" ? u.ar : u.en}<input className={input} type="number" inputMode="numeric" min={1} dir="ltr" value={st.qty} onChange={(e) => setExtras((m) => ({ ...m, [s.key]: { ...st, qty: e.target.value } }))} /></label>
                          <label className={lab}>{s.key.startsWith("other") ? t("Describe the service you need", "صف الخدمة المطلوبة") : t("Notes (optional)", "ملاحظات (اختياري)")}<input className={input} maxLength={500} value={st.note} onChange={(e) => setExtras((m) => ({ ...m, [s.key]: { ...st, note: e.target.value } }))} /></label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={lab}>{t("Customer Full Name", "الاسم الكامل")}<input className={input} autoComplete="name" value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} /></label>
              <label className={lab}>{t("Mobile / WhatsApp Number", "رقم الجوال / واتساب")}<input className={input} type="tel" dir="ltr" autoComplete="tel" placeholder="+971 50 123 4567" value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} /></label>
              <label className={lab}>{t("Email Address (optional)", "البريد الإلكتروني (اختياري)")}<input className={input} type="email" dir="ltr" autoComplete="email" value={cust.email} onChange={(e) => setCust({ ...cust, email: e.target.value })} /></label>
              <label className={lab}>{t("Emirate", "الإمارة")}<select className={input} value={proj.emirate} onChange={(e) => setProj({ ...proj, emirate: e.target.value })}><option value="">{t("— Select —", "— اختر —")}</option>{config.emirates.map((x) => <option key={x.key} value={x.key}>{pickBi(lang, x.en, x.ar)}</option>)}</select></label>
              <label className={lab}>{t("Area / Location", "المنطقة / الموقع")}<input className={input} value={proj.location} onChange={(e) => setProj({ ...proj, location: e.target.value })} /></label>
              <label className={lab}>{t("Property Type", "نوع العقار")}<select className={input} value={proj.propertyType} onChange={(e) => setProj({ ...proj, propertyType: e.target.value })}><option value="">{t("— Select —", "— اختر —")}</option>{config.propertyTypes.map((x) => <option key={x.key} value={x.key}>{pickBi(lang, x.en, x.ar)}</option>)}</select></label>
              <label className={`${lab} sm:col-span-2`}>{t("Installation Address", "عنوان التركيب")}<input className={input} autoComplete="street-address" value={proj.address} onChange={(e) => setProj({ ...proj, address: e.target.value })} /></label>
              <label className={`${lab} sm:col-span-2`}>{t("Additional Notes (optional)", "ملاحظات إضافية (اختياري)")}<textarea className={`${input} resize-y`} rows={3} maxLength={2000} value={proj.notes} onChange={(e) => setProj({ ...proj, notes: e.target.value })} /></label>
              <p className="text-xs text-text-muted sm:col-span-2">{t("You do not need an account to create a quotation.", "لا تحتاج إلى حساب لإنشاء عرض السعر.")}</p>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4 text-sm">
              <p className="text-base font-bold text-text">{t("Review your quotation", "راجع عرض السعر")}</p>
              <section className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">{t("Customer & installation", "العميل والتركيب")}</h4>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  {([[t("Name", "الاسم"), cust.name, false], [t("Mobile", "الجوال"), cust.phone, true], [t("Email", "البريد"), cust.email, true], [t("Emirate", "الإمارة"), (() => { const e = config.emirates.find((x) => x.key === proj.emirate); return e ? pickBi(lang, e.en, e.ar) : proj.emirate; })(), false], [t("Area", "المنطقة"), proj.location, false], [t("Property", "العقار"), (() => { const e = config.propertyTypes.find((x) => x.key === proj.propertyType); return e ? pickBi(lang, e.en, e.ar) : proj.propertyType; })(), false], [t("Address", "العنوان"), proj.address, false], [t("Notes", "ملاحظات"), proj.notes, false]] as [string, string, boolean][]).filter(([, v]) => v && v.trim()).map(([k, v, ltr]) => <div key={k} className="contents"><dt className="text-text-muted">{k}</dt><dd className="text-text" dir={ltr ? "ltr" : undefined} style={ltr ? { textAlign: lang === "ar" ? "right" : "left" } : undefined}>{v}</dd></div>)}
                </dl></section>
              <section className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">{t("Your AC units", "وحدات التكييف")}</h4>
                <ul className="flex flex-col gap-1">{validUnits.map((u) => <li key={u.id} className="text-text">{qtyN(u.qty)} × {pickBi(lang, capOf(u.capacity)?.labelEn ?? "", capOf(u.capacity)?.labelAr ?? "")} · {pickBi(lang, pkgOf(u.packageKey)?.nameEn ?? "", pkgOf(u.packageKey)?.nameAr ?? "")}</li>)}</ul></section>
              {[...new Set(validUnits.map((u) => u.packageKey))].map((k) => pkgOf(k)).filter((p): p is SplitPackage => !!p).map((p) => (
                <section key={p.key} className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-sm font-bold text-text">{pickBi(lang, p.nameEn, p.nameAr)}</h4>
                  <div className="grid gap-3 sm:grid-cols-2"><ul className="flex flex-col gap-1 text-xs text-text">{[...pickList(lang, p.materials), ...pickList(lang, p.services)].map((x) => <li key={x} className="flex gap-1.5"><Check size={13} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />{x}</li>)}</ul>
                  <ul className="flex flex-col gap-1 text-xs text-text-muted">{pickList(lang, p.notIncluded).map((x) => <li key={x} className="flex gap-1.5"><X size={13} className="mt-0.5 shrink-0 text-rose-400" aria-hidden />{x}</li>)}</ul></div></section>
              ))}
              <section className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">{t("Terms and conditions", "الشروط والأحكام")}</h4><ol className="flex list-decimal flex-col gap-1 ps-5 text-xs text-text-muted">{pickList(lang, config.conditions).map((x) => <li key={x}>{x}</li>)}</ol><p className="mt-2 text-xs font-semibold text-text">{bi(config.technicalNote)}</p></section>
              <div className="lg:hidden">{summary}</div>
            </div>
          )}

          {calcError && step >= 2 && step <= 3 && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{calcError}</p>}
          {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          {step >= 2 && step <= 4 && mobileTotal}

          <div className="flex flex-wrap items-center gap-2">
            {step > 1 && <button type="button" onClick={() => goto(step - 1)} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text">{t("Back", "رجوع")}</button>}
            {step === 1 && pkgKey && <button type="button" onClick={next} className="osta-btn-primary ms-auto flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white">{t("Continue", "متابعة")}<ArrowRight size={16} className="rtl:rotate-180" aria-hidden /></button>}
            {step > 1 && step < 5 && <button type="button" onClick={next} className="osta-btn-primary ms-auto flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white">{t("Continue", "متابعة")}<ArrowRight size={16} className="rtl:rotate-180" aria-hidden /></button>}
            {step === 5 && <button type="button" onClick={() => void generate()} disabled={busy || !calc} aria-busy={busy} className="osta-btn-primary ms-auto flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <FileText size={16} aria-hidden />}{busy ? t("Generating…", "جارٍ الإنشاء…") : token ? t("Save changes & update quotation", "حفظ التعديلات وتحديث العرض") : t("Generate My Quotation PDF", "إنشاء عرض السعر PDF")}</button>}
          </div>
        </div>
        <div className={step === 5 ? "hidden lg:block" : ""}><div className="lg:sticky lg:top-2">{summary}</div></div>
      </div>
    </div>
  );
}

export { Calculator };

// The block on the page: the packages, price table and conditions, then the calculator. Both are filled from the administrator's price list.
export function SplitQuoteCalculatorBlock({ p, config }: { p: P; config: SplitConfig | null }) {
  if (!config) return null;
  const h = (p.heading ?? {}) as Partial<BiText>, sub = (p.subtitle ?? {}) as Partial<BiText>;
  const heading: BiText = { en: h.en || "Instant Split AC Installation Quotation", ar: h.ar || "احسب تكلفة تركيب المكيف الآن" };
  const subtitle: BiText = { en: sub.en ?? "", ar: sub.ar ?? "" };
  const all = config.packages.flatMap((k) => config.capacities.map((c) => k.prices[c.key]).filter((x): x is number => typeof x === "number"));
  const schema = {
    "@context": "https://schema.org", "@type": "Service", name: "Split AC Installation", serviceType: "Split air conditioner installation",
    areaServed: { "@type": "Country", name: "United Arab Emirates" }, provider: { "@type": "Organization", name: "Osta Services", url: "https://www.ostaservices.com" },
    ...(all.length ? { offers: { "@type": "AggregateOffer", priceCurrency: "AED", lowPrice: Math.min(...all), highPrice: Math.max(...all), offerCount: all.length } } : {}),
  };
  return (
    <section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      {p.showPackages !== "no" && <Packages config={config} />}
      <div id="split-calculator" className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-12">
        <Calculator config={config} defaultLang={p.defaultLang === "ar" ? "ar" : "en"} heading={heading} subtitle={subtitle} />
      </div>
    </section>
  );
}
