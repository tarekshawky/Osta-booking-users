"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Download, FileText, Loader2, MessageCircle, Plus, Trash2, Upload } from "lucide-react";
import { Paragraphs } from "@/components/cms/blockShared";
import {
  acQuotePdfPath, api, ApiError, downloadAgreementPdf, uploadAcFile,
  type AcConfig, type AcCustomer, type AcInput, type AcLine, type AcPackageKey, type AcProject, type AcQuoteView, type AcTotals,
} from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { whatsappHref } from "@/lib/site";

type P = Record<string, unknown>;
type Lang = "en" | "ar";

const money = (n: number, lang: Lang) => {
  const v = n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
  return lang === "ar" ? `${v} د.إ` : `AED ${v}`;
};
const pickBi = (lang: Lang, en: string, ar: string) => (lang === "ar" ? ar || en : en || ar);
const pickList = (lang: Lang, l: { en: string[]; ar: string[] }) => (lang === "ar" && l.ar.length ? l.ar : l.en);

// The price table, the packages, the plenum charge, the exclusions and the estimate notice, drawn from the price list the administrator keeps
// up to date (Self-Service Quotations → Pricing). It follows the language of the page.
function Pricing({ config }: { config: AcConfig }) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const caps = config.capacities, pk = config.packages;
  const plen = config.plenum.price;
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <h2 className="mb-2 text-center text-2xl font-bold text-text sm:text-3xl">{t("Installation packages", "باقات التركيب")}</h2>
      <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-text-muted">{t("All prices are in UAE Dirhams (AED) per unit, before VAT.", "جميع الأسعار بالدرهم الإماراتي لكل وحدة، قبل ضريبة القيمة المضافة.")}</p>

      <div className="grid gap-5 lg:grid-cols-3">
        {pk.map((k) => {
          const low = caps.length ? Math.min(...caps.map((c) => c.prices[k.key])) + plen : 0;
          return (
            <article key={k.key} className={`osta-card flex flex-col gap-3 p-6 ${k.key === "complete" ? "border-accent ring-2 ring-accent/60" : ""}`}>
              <div><h3 className="text-xl font-bold text-text">{pickBi(lang, k.nameEn, k.nameAr)}</h3><p className="text-sm text-text-muted">{pickBi(lang, k.subtitleEn, k.subtitleAr)}</p></div>
              {caps.length > 0 && <p className="text-sm text-text-muted">{t("From", "ابتداءً من")} <span className="text-2xl font-extrabold text-text">{money(low, lang)}</span> <span>{t("per unit", "لكل وحدة")}</span></p>}
              <ul className="flex flex-col gap-1.5 text-sm text-text">
                {pickList(lang, k.included).map((x) => <li key={x} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />{x}</li>)}
              </ul>
              {pickList(lang, k.notIncluded).length > 0 && <ul className="mt-1 flex flex-col gap-1 border-t border-card-border pt-3 text-xs text-text-muted">{pickList(lang, k.notIncluded).map((x) => <li key={x}>— {x}</li>)}</ul>}
            </article>
          );
        })}
      </div>

      <div className="osta-card mt-8 overflow-x-auto p-4">
        <h3 className="mb-3 text-base font-bold text-text">{t("Price table (AED per unit)", "جدول الأسعار (درهم لكل وحدة)")}</h3>
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-card-border text-start text-xs text-text-muted">
              <th className="px-2 py-2 text-start">{t("Capacity", "السعة")}</th>
              {pk.map((k) => <th key={`b${k.key}`} className="px-2 py-2 text-start">{pickBi(lang, k.nameEn, k.nameAr)} <span className="font-normal">{t("base", "أساسي")}</span></th>)}
              <th className="px-2 py-2 text-start">{t("Plenum connection", "توصيل البلينم")}</th>
              {pk.map((k) => <th key={`t${k.key}`} className="px-2 py-2 text-start text-text">{pickBi(lang, k.nameEn, k.nameAr)} <span className="font-normal">{t("total", "الإجمالي")}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {caps.map((c) => (
              <tr key={c.key} className="border-b border-card-border/60">
                <td className="px-2 py-2 font-semibold text-text">{pickBi(lang, c.labelEn, c.labelAr)}</td>
                {pk.map((k) => <td key={`b${k.key}`} className="px-2 py-2 text-text-muted">{c.prices[k.key].toLocaleString("en-US")}</td>)}
                <td className="px-2 py-2 text-text-muted">{plen.toLocaleString("en-US")}</td>
                {pk.map((k) => <td key={`t${k.key}`} className="px-2 py-2 font-bold text-text">{(c.prices[k.key] + plen).toLocaleString("en-US")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-text-muted">{t("VAT is added to the quotation once, on the subtotal.", "تُضاف ضريبة القيمة المضافة مرة واحدة على المجموع في عرض السعر.")}</p>
      </div>

      <div className="osta-card mt-6 p-6">
        <h3 className="mb-1 text-lg font-bold text-text">{pickBi(lang, config.plenum.nameEn, config.plenum.nameAr)} — {money(plen, lang)} {t("per unit", "لكل وحدة")}</h3>
        <p className="mb-3 text-sm text-text-muted">{pickBi(lang, config.plenum.descriptionEn, config.plenum.descriptionAr)}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className="mb-1 text-sm font-semibold text-text">{t("Includes", "تشمل")}</p><ul className="flex flex-col gap-1 text-sm text-text-muted">{pickList(lang, config.plenum.included).map((x) => <li key={x} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />{x}</li>)}</ul></div>
          <div><p className="mb-1 text-sm font-semibold text-text">{t("Does not include", "لا تشمل")}</p><ul className="flex flex-col gap-1 text-sm text-text-muted">{pickList(lang, config.plenum.notIncluded).map((x) => <li key={x}>— {x}</li>)}</ul></div>
        </div>
      </div>

      <div className="osta-card mt-6 p-6">
        <h3 className="mb-2 text-lg font-bold text-text">{t("Not included in the prices", "غير مشمول في الأسعار")}</h3>
        <ul className="grid gap-1 text-sm text-text-muted sm:grid-cols-2">{pickList(lang, config.exclusions).map((x) => <li key={x}>— {x}</li>)}</ul>
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />{pickBi(lang, config.disclaimer.en, config.disclaimer.ar)}</p>
      </div>
    </div>
  );
}

// ---- the calculator ----

type UnitRow = { id: string; acType: string; capacity: string; packageKey: AcPackageKey; qty: string };
type SvcState = Record<string, { on: boolean; qty: string; note: string }>;
const rid = () => Math.random().toString(36).slice(2, 9);
const num = (v: string) => (v.trim() === "" ? 0 : Math.max(0, Math.floor(Number(v)) || 0));
const hex = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
const input = "w-full rounded-xl border border-card-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent";
const lab = "flex flex-col gap-1.5 text-xs font-medium text-text-muted";

type BiText = { en: string; ar: string };
function Calculator({ config, defaultLang, heading, subtitle, edit }: { config: AcConfig; defaultLang: Lang; heading: BiText; subtitle: BiText; edit?: { token: string; view: AcQuoteView } }) {
  const { settings } = useSite();
  const [lang, setLang] = useState<Lang>(edit ? edit.view.lang : defaultLang);
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const view = edit?.view;

  const firstType = config.acTypes[0]?.key ?? "", firstCap = config.capacities[0]?.key ?? "";
  const [step, setStep] = useState(1);
  const [units, setUnits] = useState<UnitRow[]>(() => view ? view.input.units.map((u) => ({ id: rid(), acType: u.acType, capacity: u.capacity, packageKey: u.packageKey, qty: String(u.qty) })) : [{ id: rid(), acType: firstType, capacity: firstCap, packageKey: "standard", qty: "1" }]);
  const [svc, setSvc] = useState<SvcState>(() => { const m: SvcState = {}; for (const s of view?.input.services ?? []) m[s.key] = { on: true, qty: String(s.qty), note: s.note ?? "" }; return m; });
  const [project, setProject] = useState<AcProject>(() => view ? { propertyType: view.project.propertyType, emirate: view.project.emirate, location: view.project.location, floors: view.project.floors ?? 0, existingDuct: view.project.existingDuct ?? "not-sure", existingCopper: view.project.existingCopper ?? "not-sure", ceilingType: view.project.ceilingType ?? "false", notes: view.project.notes ?? "" } : { propertyType: "residential", emirate: "Ajman", location: "", floors: 1, existingDuct: "not-sure", existingCopper: "not-sure", ceilingType: "false", notes: "" });
  const [cust, setCust] = useState<AcCustomer>(() => view?.customer ?? { name: "", phone: "", whatsapp: "", email: "", contactMethod: "phone", preferredDate: "" });
  const [files, setFiles] = useState<{ id: string; name: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadKey] = useState(hex);
  const [calc, setCalc] = useState<{ lines: AcLine[]; totals: AcTotals } | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(edit?.token ?? null);
  const [done, setDone] = useState<null | { number: string; version?: number }>(null);
  const [sent, setSent] = useState<null | "sent" | "booked">(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const quoteInput = useMemo<AcInput>(() => ({
    units: units.map((u) => ({ acType: u.acType, capacity: u.capacity, packageKey: u.packageKey, qty: num(u.qty) })),
    services: config.services.filter((s) => svc[s.key]?.on).map((s) => ({ key: s.key, qty: Math.max(1, num(svc[s.key].qty)), ...(svc[s.key].note.trim() ? { note: svc[s.key].note.trim() } : {}) })),
  }), [units, svc, config.services]);

  // The live price: the server works it out and the page draws what it answers.
  const inputKey = JSON.stringify(quoteInput);
  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(() => {
      api.acQuoteCalculate(quoteInput).then((r) => { if (live) { setCalc(r); setCalcError(null); } }).catch((e) => { if (live) setCalcError(e instanceof ApiError ? e.message : t("Could not calculate. Please check your choices.", "تعذر الحساب. يرجى مراجعة اختياراتك.")); });
    }, 300);
    return () => { live = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey]);

  const goto = (n: number) => { setError(null); setStep(n); window.setTimeout(() => top.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 0); };
  const setUnit = (id: string, patch: Partial<UnitRow>) => setUnits((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const typeName = (k: string) => { const x = config.acTypes.find((a) => a.key === k); return x ? pickBi(lang, x.nameEn, x.nameAr) : k; };

  function problem(forStep: number): string | null {
    if (forStep >= 1) {
      if (units.length === 0) return t("Add at least one AC unit.", "أضف وحدة تكييف واحدة على الأقل.");
      if (units.some((u) => !u.acType || !u.capacity || num(u.qty) < 1)) return t("Choose the type, capacity and quantity for every unit.", "اختر النوع والسعة والكمية لكل وحدة.");
    }
    if (forStep >= 2 && config.services.some((s) => svc[s.key]?.on && num(svc[s.key].qty) < 1)) return t("Enter a quantity for each selected service.", "أدخل كمية لكل خدمة مختارة.");
    if (forStep >= 3) {
      if (project.location.trim().length < 2) return t("Enter the project location.", "أدخل موقع المشروع.");
    }
    if (forStep >= 4) {
      const d = cust.phone.replace(/\D/g, "");
      if (cust.name.trim().length < 2) return t("Enter your full name.", "أدخل اسمك الكامل.");
      if (d.length < 8 || d.length > 15) return t("Enter a valid mobile number.", "أدخل رقم جوال صحيحاً.");
      if (cust.whatsapp.trim() && (cust.whatsapp.replace(/\D/g, "").length < 8)) return t("The WhatsApp number is not valid.", "رقم الواتساب غير صحيح.");
      if (cust.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cust.email.trim())) return t("Enter a valid email address.", "أدخل بريداً إلكترونياً صحيحاً.");
      if (cust.contactMethod === "email" && !cust.email.trim()) return t("Add your email address, or choose another contact method.", "أضف بريدك الإلكتروني أو اختر وسيلة تواصل أخرى.");
      if (cust.preferredDate && cust.preferredDate < today) return t("The date cannot be in the past.", "لا يمكن أن يكون التاريخ في الماضي.");
    }
    return null;
  }
  const next = () => { const p = problem(step); if (p) return setError(p); goto(step + 1); };

  async function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null); setUploading(true);
    try {
      for (const f of Array.from(list)) {
        if (files.length >= config.uploads.maxFiles) { setError(t(`You can attach up to ${config.uploads.maxFiles} files.`, `يمكنك إرفاق ${config.uploads.maxFiles} ملفات كحد أقصى.`)); break; }
        if (f.size > config.uploads.maxMb * 1024 * 1024) { setError(t(`${f.name} is larger than ${config.uploads.maxMb} MB.`, `الملف ${f.name} أكبر من ${config.uploads.maxMb} ميجابايت.`)); continue; }
        try { const r = await uploadAcFile(f, uploadKey); setFiles((x) => [...x, r]); } catch (e) { setError(e instanceof ApiError ? e.message : t("The upload failed.", "فشل رفع الملف.")); }
      }
    } finally { setUploading(false); }
  }

  async function generate() {
    if (busy) return;
    const p = problem(4);
    if (p) return setError(p);
    setBusy(true); setError(null);
    const body = { lang, input: quoteInput, customer: { ...cust, name: cust.name.trim(), email: cust.email.trim() }, project: { ...project, location: project.location.trim() }, ...(files.length ? { uploadKey } : {}) };
    try {
      if (token) { const r = await api.acQuoteEdit(token, body); setDone({ number: r.number, version: r.version }); }
      else { const r = await api.acQuoteCreate(body); setToken(r.token); setDone({ number: r.number }); }
      setSent(null);
      window.setTimeout(() => top.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("Something went wrong. Please try again, or contact us on WhatsApp.", "حدث خطأ ما. حاول مرة أخرى أو تواصل معنا عبر واتساب."));
    } finally { setBusy(false); }
  }
  async function submit(book: boolean) {
    if (!token || busy) return;
    setBusy(true); setError(null);
    try { await api.acQuoteSubmit(token, book); setSent(book ? "booked" : "sent"); }
    catch (e) { setError(e instanceof ApiError ? e.message : t("Something went wrong. Please try again.", "حدث خطأ ما. حاول مرة أخرى.")); }
    finally { setBusy(false); }
  }
  async function pdf() {
    if (!token) return;
    setPdfBusy(true); setError(null);
    try { await downloadAgreementPdf(acQuotePdfPath(token, lang), null, `${done?.number ?? "quotation"}.pdf`); }
    catch { setError(t("The PDF could not be prepared. Please try again.", "تعذر تجهيز ملف PDF. حاول مرة أخرى.")); }
    finally { setPdfBusy(false); }
  }

  const totals = calc?.totals;
  const label = (l: AcLine) => pickBi(lang, l.labelEn, l.labelAr);
  const usedPackages = config.packages.filter((k) => units.some((u) => u.packageKey === k.key));
  const steps = [t("AC units", "وحدات التكييف"), t("Services", "الخدمات"), t("Project", "المشروع"), t("Your details", "بياناتك"), t("Review", "المراجعة")];
  const waText = t(`Hello Osta, I generated quotation ${done?.number ?? ""} for AC installation.`, `مرحباً اسطا، أنشأت عرض السعر ${done?.number ?? ""} لتركيب المكيفات.`);

  const summary = (
    <aside className="rounded-xl border border-card-border bg-bg-elevated p-4 text-sm" aria-label={t("Price summary", "ملخص السعر")}>
      <p className="mb-2 font-bold text-text">{t("Price summary", "ملخص السعر")}</p>
      {!calc ? <p className="text-xs text-text-muted">{calcError ?? t("Calculating…", "جارٍ الحساب…")}</p> : (
        <>
          <ul className="flex flex-col gap-1.5">
            {calc.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span className="text-text-muted">{label(l)}{l.qty > 1 ? ` × ${l.qty}` : ""}</span>
                <span className="shrink-0 text-end text-text">{l.amount == null ? <span className="text-amber-300">{t("Quotation", "عرض سعر")}</span> : money(l.amount, lang)}</span>
              </li>
            ))}
          </ul>
          {totals && (
            <dl className="mt-3 flex flex-col gap-1.5 border-t border-card-border pt-3">
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Base installation", "التركيب الأساسي")}</dt><dd className="text-text">{money(totals.baseTotal, lang)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Plenum modification", "تعديل البلينم")}</dt><dd className="text-text">{money(totals.plenumTotal, lang)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Additional services", "الخدمات الإضافية")}</dt><dd className="text-text">{money(totals.servicesTotal, lang)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-card-border pt-1.5"><dt className="text-text-muted">{t("Subtotal", "المجموع قبل الضريبة")}</dt><dd className="text-text">{money(totals.subtotal, lang)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t(`VAT ${totals.vatPercent}%`, `ضريبة القيمة المضافة ${totals.vatPercent}%`)}</dt><dd className="text-text">{money(totals.vat, lang)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-card-border pt-2 text-base font-extrabold"><dt className="text-text">{t("Grand total incl. VAT", "الإجمالي شامل الضريبة")}</dt><dd className="text-text">{money(totals.total, lang)}</dd></div>
            </dl>
          )}
          {totals?.rfq && <p className="mt-2 text-xs text-amber-200">{t("Items marked “Quotation” need measurements or a visit. They are not in the total and will be priced after inspection.", "البنود المعلّمة «عرض سعر» تحتاج إلى قياسات أو معاينة. غير مشمولة في الإجمالي وسيتم تسعيرها بعد المعاينة.")}</p>}
        </>
      )}
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

  if (done && token) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="osta-card p-5 sm:p-7">
        {header}
        <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
          <CheckCircle2 size={44} className="text-emerald-500" aria-hidden />
          <p className="text-xl font-bold text-text">{done.version ? t("Your quotation was updated", "تم تحديث عرض السعر") : t("Your quotation is ready", "عرض السعر جاهز")}</p>
          <p className="text-sm text-text-muted">{t("Quotation number", "رقم عرض السعر")}: <b className="text-text" dir="ltr">{done.number}</b>{done.version ? ` · v${done.version}` : ""}</p>
          {totals && <p className="text-2xl font-extrabold text-accent-2">{money(totals.total, lang)} <span className="text-sm font-normal text-text-muted">{t("incl. VAT", "شامل الضريبة")}</span></p>}
          {totals?.rfq && <p className="max-w-md text-xs text-amber-200">{t("Some items are marked as a request for quotation. They are not in this total.", "بعض البنود معلّمة كطلب عرض سعر وهي غير مشمولة في هذا الإجمالي.")}</p>}
        </div>
        <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-2">
          <button type="button" disabled={pdfBusy} onClick={() => void pdf()} className="osta-btn-primary flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{pdfBusy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Download size={16} aria-hidden />}{t("Download PDF Quotation", "تحميل عرض السعر PDF")}</button>
          <button type="button" onClick={() => { setDone(null); setSent(null); goto(1); }} className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-5 py-3 text-sm font-semibold text-text">{t("Edit Quotation", "تعديل عرض السعر")}</button>
          <button type="button" disabled={busy || sent !== null} onClick={() => void submit(false)} className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-5 py-3 text-sm font-semibold text-text disabled:opacity-60"><FileText size={16} aria-hidden />{t("Send to Osta", "إرسال إلى اسطا")}</button>
          <button type="button" disabled={busy || sent === "booked"} onClick={() => void submit(true)} className="flex items-center justify-center gap-2 rounded-xl border border-accent px-5 py-3 text-sm font-semibold text-accent-2 disabled:opacity-60">{t("Book Installation", "حجز التركيب")}</button>
          <a href={whatsappHref(settings, lang, waText)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-5 py-3 text-sm font-semibold text-text sm:col-span-2"><MessageCircle size={16} aria-hidden />{t("Contact via WhatsApp", "التواصل عبر واتساب")}</a>
        </div>
        {sent && <p role="status" className="mx-auto mt-4 max-w-2xl rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{sent === "booked" ? t("We received your booking request. This does not confirm an appointment: our team will review it and confirm the date with you.", "استلمنا طلب الحجز. هذا لا يعني تأكيد الموعد: سيراجعه فريقنا ويؤكد التاريخ معك.") : t("Your quotation was sent to Osta. Our team will review it and contact you.", "تم إرسال عرض السعر إلى اسطا. سيراجعه فريقنا ويتواصل معك.")}</p>}
        {error && <p role="alert" className="mx-auto mt-4 max-w-2xl rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-text-muted">{t("Keep this private link to come back, change or download your quotation:", "احتفظ بهذا الرابط الخاص للعودة إلى عرض السعر أو تعديله أو تحميله:")} <a className="break-all font-semibold text-accent-2 underline" dir="ltr" href={`/quote/${token}`}>{`/quote/${token}`}</a></p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-xs text-text-muted">{pickBi(lang, config.disclaimer.en, config.disclaimer.ar)}</p>
      </div>
    );
  }

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="osta-card p-5 sm:p-7">
      {header}
      <ol className="mb-5 flex items-center gap-2 text-xs" aria-label={t("Steps", "الخطوات")}>
        {steps.map((s, i) => (
          <li key={s} aria-current={step === i + 1 ? "step" : undefined} className={`flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 ${step === i + 1 ? "bg-accent/20 font-bold text-text" : i + 1 < step ? "text-emerald-400" : "text-text-faint"}`}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${i + 1 < step ? "bg-emerald-500 text-white" : "bg-card-border text-text"}`}>{i + 1 < step ? <Check size={12} aria-hidden /> : i + 1}</span>
            <span className="hidden sm:inline">{s}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-muted">{t("Add every AC unit of your project. Each one is priced on its own, and the plenum modification (AED " + config.plenum.price + ") is added to every unit.", "أضف كل وحدات التكييف في مشروعك. تُحسب كل وحدة على حدة، ويُضاف تعديل البلينم (" + config.plenum.price + " د.إ) لكل وحدة.")}</p>
              {units.map((u, i) => (
                <fieldset key={u.id} className="rounded-xl border border-card-border p-4">
                  <legend className="px-2 text-sm font-bold text-text">{t("Unit", "الوحدة")} {i + 1}</legend>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <label className={lab}>{t("AC Type", "نوع المكيف")}<select className={input} value={u.acType} onChange={(e) => setUnit(u.id, { acType: e.target.value })}>{config.acTypes.map((a) => <option key={a.key} value={a.key}>{pickBi(lang, a.nameEn, a.nameAr)}</option>)}</select></label>
                    <label className={lab}>{t("Capacity", "السعة")}<select className={input} value={u.capacity} onChange={(e) => setUnit(u.id, { capacity: e.target.value })}>{config.capacities.map((c) => <option key={c.key} value={c.key}>{pickBi(lang, c.labelEn, c.labelAr)}</option>)}</select></label>
                    <label className={lab}>{t("Package", "الباقة")}<select className={input} value={u.packageKey} onChange={(e) => setUnit(u.id, { packageKey: e.target.value as AcPackageKey })}>{config.packages.map((k) => <option key={k.key} value={k.key}>{pickBi(lang, k.nameEn, k.nameAr)}</option>)}</select></label>
                    <label className={lab}>{t("Quantity", "الكمية")}<input className={input} type="number" inputMode="numeric" min={1} max={100} dir="ltr" value={u.qty} onChange={(e) => setUnit(u.id, { qty: e.target.value })} /></label>
                  </div>
                  <p className="mt-2 text-xs text-text-muted">{pickBi(lang, config.acTypes.find((a) => a.key === u.acType)?.descriptionEn ?? "", config.acTypes.find((a) => a.key === u.acType)?.descriptionAr ?? "")}</p>
                  {units.length > 1 && <button type="button" onClick={() => setUnits((x) => x.filter((y) => y.id !== u.id))} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300"><Trash2 size={13} aria-hidden />{t("Remove Unit", "حذف الوحدة")}</button>}
                </fieldset>
              ))}
              <button type="button" onClick={() => setUnits((x) => [...x, { id: rid(), acType: x[x.length - 1]?.acType ?? firstType, capacity: x[x.length - 1]?.capacity ?? firstCap, packageKey: x[x.length - 1]?.packageKey ?? "standard", qty: "1" }])} disabled={units.length >= 30} className="inline-flex items-center gap-2 self-start rounded-xl border border-card-border px-4 py-2 text-sm font-semibold text-text disabled:opacity-50"><Plus size={15} aria-hidden />{t("Add Another Unit", "إضافة وحدة أخرى")}</button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-muted">{t("Add optional services if you need them. Items that need measurements or a site visit are sent as a request for quotation: no price is guessed.", "أضف خدمات اختيارية عند الحاجة. البنود التي تحتاج قياسات أو معاينة تُرسل كطلب عرض سعر دون تخمين السعر.")}</p>
              <div className="grid gap-2">
                {config.services.map((s) => {
                  const st = svc[s.key] ?? { on: false, qty: "1", note: "" };
                  const priced = !s.rfq && s.price != null;
                  const unit = s.unit === "meter" ? t("metres", "متر") : s.unit === "unit" ? t("units", "وحدة") : t("quantity", "الكمية");
                  return (
                    <div key={s.key} className={`rounded-xl border p-3 ${st.on ? "border-accent/60 bg-accent/5" : "border-card-border"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-text"><input type="checkbox" className="h-4 w-4 accent-[#087bff]" checked={st.on} onChange={(e) => setSvc((m) => ({ ...m, [s.key]: { ...st, on: e.target.checked } }))} />{pickBi(lang, s.nameEn, s.nameAr)}</label>
                        <span className={`text-xs ${priced ? "text-text-muted" : "font-semibold text-amber-300"}`}>{priced ? `${money(s.price!, lang)} / ${s.unit === "meter" ? t("metre", "متر") : s.unit === "unit" ? t("unit", "وحدة") : t("job", "عمل")}` : t("Request for quotation", "طلب عرض سعر")}</span>
                      </div>
                      {st.on && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-[8rem_1fr]">
                          <label className={lab}>{unit}<input className={input} type="number" inputMode="numeric" min={1} dir="ltr" value={st.qty} onChange={(e) => setSvc((m) => ({ ...m, [s.key]: { ...st, qty: e.target.value } }))} /></label>
                          <label className={lab}>{s.key === "other" ? t("Describe the service you need", "صف الخدمة المطلوبة") : t("Notes (optional)", "ملاحظات (اختياري)")}<input className={input} maxLength={500} value={st.note} onChange={(e) => setSvc((m) => ({ ...m, [s.key]: { ...st, note: e.target.value } }))} /></label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={lab}>{t("Property Type", "نوع العقار")}<select className={input} value={project.propertyType} onChange={(e) => setProject({ ...project, propertyType: e.target.value })}>{config.propertyTypes.map((x) => <option key={x.key} value={x.key}>{pickBi(lang, x.en, x.ar)}</option>)}</select></label>
              <label className={lab}>{t("Emirate", "الإمارة")}<select className={input} value={project.emirate} onChange={(e) => setProject({ ...project, emirate: e.target.value })}>{config.emirates.map((x) => <option key={x.key} value={x.key}>{pickBi(lang, x.en, x.ar)}</option>)}</select></label>
              <label className={`${lab} sm:col-span-2`}>{t("Project Location", "موقع المشروع")}<input className={input} autoComplete="street-address" value={project.location} onChange={(e) => setProject({ ...project, location: e.target.value })} /></label>
              <label className={lab}>{t("Number of Floors", "عدد الطوابق")}<input className={input} type="number" inputMode="numeric" min={0} max={200} dir="ltr" value={project.floors || ""} onChange={(e) => setProject({ ...project, floors: num(e.target.value) })} /></label>
              <label className={lab}>{t("Ceiling Type", "نوع السقف")}<select className={input} value={project.ceilingType} onChange={(e) => setProject({ ...project, ceilingType: e.target.value })}><option value="false">{t("False Ceiling", "سقف مستعار")}</option><option value="exposed">{t("Exposed Ceiling", "سقف مكشوف")}</option><option value="other">{t("Other", "أخرى")}</option></select></label>
              {([["existingDuct", t("Existing Duct Available?", "هل شبكة الدكت موجودة؟")], ["existingCopper", t("Existing Copper Pipes Available?", "هل مواسير النحاس موجودة؟")]] as const).map(([k, l]) => (
                <label key={k} className={lab}>{l}<select className={input} value={project[k]} onChange={(e) => setProject({ ...project, [k]: e.target.value })}><option value="yes">{t("Yes", "نعم")}</option><option value="no">{t("No", "لا")}</option><option value="not-sure">{t("Not Sure", "غير متأكد")}</option></select></label>
              ))}
              <label className={`${lab} sm:col-span-2`}>{t("Project Notes", "ملاحظات المشروع")}<textarea className={`${input} resize-y`} rows={3} maxLength={2000} value={project.notes} onChange={(e) => setProject({ ...project, notes: e.target.value })} /></label>
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-xs font-medium text-text-muted">{t("Upload Drawings / BOQ / Site Photos (optional)", "رفع المخططات / جدول الكميات / صور الموقع (اختياري)")}</p>
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-card-border px-4 py-4 text-sm text-text-muted ${uploading ? "opacity-60" : ""}`}>
                  {uploading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Upload size={16} aria-hidden />}{t("Choose files (PDF, JPG, PNG, WebP)", "اختر الملفات (PDF, JPG, PNG, WebP)")}
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
                </label>
                <p className="mt-1 text-[11px] text-text-faint">{t(`Up to ${config.uploads.maxFiles} files, ${config.uploads.maxMb} MB each.`, `حتى ${config.uploads.maxFiles} ملفات، ${config.uploads.maxMb} ميجابايت لكل ملف.`)}</p>
                {files.length > 0 && <ul className="mt-2 flex flex-col gap-1 text-xs text-text">{files.map((f) => <li key={f.id} className="flex items-center gap-2"><Check size={13} className="text-emerald-400" aria-hidden />{f.name}</li>)}</ul>}
                {view && view.files.length > 0 && <p className="mt-1 text-[11px] text-text-faint">{t(`${view.files.length} file(s) already attached to this quotation.`, `يوجد ${view.files.length} ملف(ات) مرفقة بالفعل بهذا العرض.`)}</p>}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={lab}>{t("Full Name", "الاسم الكامل")}<input className={input} autoComplete="name" value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} /></label>
              <label className={lab}>{t("Mobile Number", "رقم الجوال")}<input className={input} type="tel" dir="ltr" autoComplete="tel" placeholder="+971 50 123 4567" value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} /></label>
              <label className={lab}>{t("WhatsApp Number", "رقم الواتساب")}<input className={input} type="tel" dir="ltr" value={cust.whatsapp} onChange={(e) => setCust({ ...cust, whatsapp: e.target.value })} /></label>
              <label className={lab}>{t("Email Address", "البريد الإلكتروني")}<input className={input} type="email" dir="ltr" autoComplete="email" value={cust.email} onChange={(e) => setCust({ ...cust, email: e.target.value })} /></label>
              <label className={lab}>{t("Preferred Contact Method", "وسيلة التواصل المفضلة")}<select className={input} value={cust.contactMethod} onChange={(e) => setCust({ ...cust, contactMethod: e.target.value as AcCustomer["contactMethod"] })}><option value="phone">{t("Phone call", "اتصال هاتفي")}</option><option value="whatsapp">WhatsApp</option><option value="email">{t("Email", "البريد الإلكتروني")}</option></select></label>
              <label className={lab}>{t("Preferred Installation Date", "تاريخ التركيب المفضل")}<input className={input} type="date" min={today} dir="ltr" value={cust.preferredDate} onChange={(e) => setCust({ ...cust, preferredDate: e.target.value })} /></label>
              <p className="text-xs text-text-muted sm:col-span-2">{t("You do not need an account to create a quotation.", "لا تحتاج إلى حساب لإنشاء عرض السعر.")}</p>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4 text-sm">
              <p className="text-base font-bold text-text">{t("Quotation Preview", "معاينة عرض السعر")}</p>
              <section className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">{t("Customer & project", "العميل والمشروع")}</h4>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  {([[t("Name", "الاسم"), cust.name], [t("Mobile", "الجوال"), cust.phone], [t("WhatsApp", "واتساب"), cust.whatsapp], [t("Email", "البريد"), cust.email], [t("Location", "الموقع"), `${config.emirates.find((e) => e.key === project.emirate) ? pickBi(lang, config.emirates.find((e) => e.key === project.emirate)!.en, config.emirates.find((e) => e.key === project.emirate)!.ar) : project.emirate} — ${project.location}`], [t("Property", "العقار"), pickBi(lang, config.propertyTypes.find((x) => x.key === project.propertyType)?.en ?? "", config.propertyTypes.find((x) => x.key === project.propertyType)?.ar ?? "")]] as [string, string][]).filter(([, v]) => v && v.trim()).map(([k, v]) => <div key={k} className="contents"><dt className="text-text-muted">{k}</dt><dd className="text-text">{v}</dd></div>)}
                </dl></section>
              <section className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">{t("Your units", "وحداتك")}</h4>
                <ul className="flex flex-col gap-1">{units.map((u) => <li key={u.id} className="text-text">{num(u.qty)} × {typeName(u.acType)} · {pickBi(lang, config.capacities.find((c) => c.key === u.capacity)?.labelEn ?? "", config.capacities.find((c) => c.key === u.capacity)?.labelAr ?? "")} · {pickBi(lang, config.packages.find((k) => k.key === u.packageKey)?.nameEn ?? "", config.packages.find((k) => k.key === u.packageKey)?.nameAr ?? "")}</li>)}</ul></section>
              {usedPackages.map((k) => (
                <section key={k.key} className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-sm font-bold text-text">{pickBi(lang, k.nameEn, k.nameAr)} — {pickBi(lang, k.subtitleEn, k.subtitleAr)}</h4>
                  <div className="grid gap-3 sm:grid-cols-2"><ul className="flex flex-col gap-1 text-xs text-text">{pickList(lang, k.included).map((x) => <li key={x} className="flex gap-1.5"><Check size={13} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />{x}</li>)}</ul>
                  <ul className="flex flex-col gap-1 text-xs text-text-muted">{[...pickList(lang, k.notIncluded), ...pickList(lang, config.exclusions)].map((x) => <li key={x}>— {x}</li>)}</ul></div></section>
              ))}
              <p className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-100"><AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />{pickBi(lang, config.disclaimer.en, config.disclaimer.ar)}</p>
              <div className="lg:hidden">{summary}</div>
            </div>
          )}

          {calcError && step <= 2 && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{calcError}</p>}
          {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            {step > 1 && <button type="button" onClick={() => goto(step - 1)} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text">{t("Back", "رجوع")}</button>}
            {step < 5 && <button type="button" onClick={next} disabled={uploading} className="osta-btn-primary ms-auto flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{t("Continue", "متابعة")}<ArrowRight size={16} className="rtl:rotate-180" aria-hidden /></button>}
            {step === 5 && <button type="button" onClick={() => void generate()} disabled={busy || !calc} aria-busy={busy} className="osta-btn-primary ms-auto flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <FileText size={16} aria-hidden />}{busy ? t("Generating…", "جارٍ الإنشاء…") : token ? t("Save changes & update quotation", "حفظ التعديلات وتحديث العرض") : t("Generate Quotation", "إنشاء عرض السعر")}</button>}
          </div>
        </div>
        <div className={step === 5 ? "hidden lg:block" : ""}><div className="lg:sticky lg:top-2">{summary}</div></div>
      </div>
    </div>
  );
}

export { Calculator };

// The block on the page: the packages and price table, then the calculator. Both are filled from the administrator's price list.
export function DuctedCalculatorBlock({ p, config }: { p: P; config: AcConfig | null }) {
  if (!config) return null;
  // The calculator has its own English / Arabic switch, so its heading and text are kept in both languages (not the page's language).
  const h = (p.heading ?? {}) as Partial<BiText>, sub = (p.subtitle ?? {}) as Partial<BiText>;
  const heading: BiText = { en: h.en || "Calculate Your Ducted AC Installation Cost", ar: h.ar || "احسب تكلفة تركيب مكيف الدكت الآن" };
  const subtitle: BiText = { en: sub.en ?? "", ar: sub.ar ?? "" };
  const totals = config.packages.flatMap((k) => config.capacities.map((c) => c.prices[k.key] + config.plenum.price));
  const schema = {
    "@context": "https://schema.org", "@type": "Service", name: "Ducted & Concealed AC Installation", serviceType: "Air conditioning installation",
    areaServed: { "@type": "Country", name: "United Arab Emirates" }, provider: { "@type": "Organization", name: "Osta Services", url: "https://www.ostaservices.com" },
    ...(totals.length ? { offers: { "@type": "AggregateOffer", priceCurrency: "AED", lowPrice: Math.min(...totals), highPrice: Math.max(...totals), offerCount: totals.length } } : {}),
  };
  return (
    <section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      {p.showPricing !== "no" && <Pricing config={config} />}
      <div id="ducted-calculator" className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-12">
        <Calculator config={config} defaultLang={p.defaultLang === "ar" ? "ar" : "en"} heading={heading} subtitle={subtitle} />
      </div>
    </section>
  );
}
