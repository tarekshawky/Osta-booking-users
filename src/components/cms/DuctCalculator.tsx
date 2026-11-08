"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, ClipboardList, Copy, Download, FileText, HardHat, Loader2, MessageCircle, Plus, Printer, Share2, Trash2, Upload } from "lucide-react";
import { Paragraphs } from "@/components/cms/blockShared";
import {
  api, ApiError, downloadAgreementPdf, ductQuotePdfPath, fetchPdfBlobUrl, uploadDuctFile,
  type DuctConfig, type DuctInput, type DuctLine, type DuctMode, type DuctProject, type DuctQuoteView, type DuctRequestType, type DuctSectionInput, type DuctSpec, type DuctSpecKey,
  type DuctTotals, type DuctUnit, type DuctComputedSection, type DuctCustomer,
} from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { whatsappHref } from "@/lib/site";

type P = Record<string, unknown>;
type Lang = "en" | "ar";
type BiText = { en: string; ar: string };

const MODES: DuctMode[] = ["supply-fabricate-install", "fabricate-supply", "install-only", "custom"];
const MODE_LABEL: Record<DuctMode, BiText> = {
  "supply-fabricate-install": { en: "Supply & Fabrication & Installation", ar: "توريد وتصنيع وتركيب" },
  "fabricate-supply": { en: "Fabrication & Supply Only", ar: "تصنيع وتوريد فقط" },
  "install-only": { en: "Installation Only", ar: "تركيب فقط" },
  custom: { en: "Custom Project Requirement", ar: "متطلبات مشروع خاصة" },
};
const UNIT_LABEL: Record<DuctUnit, BiText> = { PCS: { en: "PCS", ar: "قطعة" }, LM: { en: "LM", ar: "متر طولي" }, m2: { en: "m²", ar: "م²" }, SET: { en: "SET", ar: "طقم" }, LOT: { en: "LOT", ar: "مجموعة" } };
const SPEC_NAME: Record<DuctSpecKey, BiText> = {
  gauge: { en: "Duct material thickness / gauge", ar: "سماكة الصاج" }, fiberglass: { en: "Fiberglass insulation thickness", ar: "سماكة عزل الفايبر جلاس" }, pir: { en: "PIR panel thickness", ar: "سماكة ألواح PIR" },
  pressure: { en: "Duct pressure class", ar: "فئة ضغط الدكت" }, application: { en: "Duct application", ar: "استخدام الدكت" },
};

const money = (n: number, lang: Lang) => {
  const v = n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
  return lang === "ar" ? `${v} د.إ` : `AED ${v}`;
};
const pickBi = (lang: Lang, en: string, ar: string) => (lang === "ar" ? ar || en : en || ar);
const pickList = (lang: Lang, l: { en: string[]; ar: string[] }) => (lang === "ar" && l.ar.length ? l.ar : l.en);
const unitName = (u: DuctUnit, lang: Lang) => UNIT_LABEL[u][lang];

const rid = () => Math.random().toString(36).slice(2, 9);
const hex = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
const n2 = (v: string) => (v.trim() === "" ? 0 : Number(v) || 0);
const input = "w-full rounded-xl border border-card-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent";
const lab = "flex flex-col gap-1.5 text-xs font-medium text-text-muted";
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.dwg,application/pdf,image/jpeg,image/png,image/webp";

// The lowest rate the administrator has set for a system (any work mode that is switched on and priced).
const fromRate = (s: DuctConfig["systems"][number]) => {
  const r = MODES.map((m) => (s.modes[m].enabled ? s.modes[m].rate : null)).filter((x): x is number => x != null);
  return r.length ? Math.min(...r) : null;
};
const enabledModes = (s: DuctConfig["systems"][number]) => MODES.filter((m) => s.modes[m].enabled);

// ---- the systems, rates and notices on the page ----

function Pricing({ config }: { config: DuctConfig }) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const modes = MODES.filter((m) => config.systems.some((s) => s.modes[m].enabled));
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <h2 className="mb-2 text-center text-2xl font-bold text-text sm:text-3xl">{t("Ductwork systems and rates", "أنظمة الدكت والأسعار")}</h2>
      <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-text-muted">{t("Rates are in UAE Dirhams (AED) per square metre of duct surface, before VAT.", "الأسعار بالدرهم الإماراتي لكل متر مربع من سطح الدكت، قبل ضريبة القيمة المضافة.")}</p>
      <div className="grid gap-5 lg:grid-cols-3">
        {config.systems.map((s) => {
          const low = fromRate(s);
          return (
            <article key={s.key} className="osta-card flex flex-col gap-3 p-6">
              <div><h3 className="text-lg font-bold text-text">{pickBi(lang, s.nameEn, s.nameAr)}</h3><p className="text-sm text-text-muted">{pickBi(lang, s.descriptionEn, s.descriptionAr)}</p></div>
              <p className="text-sm text-text-muted">{low != null ? <>{t("From", "ابتداءً من")} <span className="text-2xl font-extrabold text-text">{money(low, lang)}</span> <span>/ {unitName("m2", lang)}</span></> : <span className="font-semibold text-amber-300">{t("Request for quotation", "طلب عرض سعر")}</span>}</p>
              <ul className="flex flex-col gap-1.5 text-sm text-text">{pickList(lang, s.included).map((x) => <li key={x} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />{x}</li>)}</ul>
              {pickList(lang, s.notIncluded).length > 0 && <ul className="mt-1 flex flex-col gap-1 border-t border-card-border pt-3 text-xs text-text-muted">{pickList(lang, s.notIncluded).map((x) => <li key={x}>— {x}</li>)}</ul>}
            </article>
          );
        })}
      </div>
      {modes.length > 0 && (
        <div className="osta-card mt-8 overflow-x-auto p-4">
          <h3 className="mb-3 text-base font-bold text-text">{t("Rate table (AED per m²)", "جدول الأسعار (درهم لكل م²)")}</h3>
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-card-border text-xs text-text-muted"><th className="px-2 py-2 text-start">{t("System", "النظام")}</th>{modes.map((m) => <th key={m} className="px-2 py-2 text-start">{MODE_LABEL[m][lang]}</th>)}</tr></thead>
            <tbody>
              {config.systems.map((s) => (
                <tr key={s.key} className="border-b border-card-border/60">
                  <td className="px-2 py-2 font-semibold text-text">{pickBi(lang, s.nameEn, s.nameAr)}</td>
                  {modes.map((m) => <td key={m} className="px-2 py-2 text-text-muted">{!s.modes[m].enabled ? "—" : s.modes[m].rate != null ? <span className="font-bold text-text">{s.modes[m].rate!.toLocaleString("en-US")}</span> : <span className="text-amber-300">{t("On request", "عند الطلب")}</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-text-muted">{t("VAT is added to the quotation once, on the subtotal.", "تُضاف ضريبة القيمة المضافة مرة واحدة على المجموع في عرض السعر.")}</p>
        </div>
      )}
      <div className="osta-card mt-6 flex flex-col gap-3 p-6">
        <p className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />{pickBi(lang, config.estimateNotice.en, config.estimateNotice.ar)}</p>
        <p className="text-sm text-text-muted">{pickBi(lang, config.straightDuctNote.en, config.straightDuctNote.ar)}</p>
      </div>
    </div>
  );
}

// ---- the calculator ----

type SecRow = { id: string; system: string; method: "area" | "rect" | "round"; description: string; area: string; sections: string; widthMm: string; heightMm: string; diameterMm: string; lengthM: string; qty: string };
type AccState = Record<string, { on: boolean; unit: DuctUnit; qty: string; note: string }>;
type SvcState = Record<string, { on: boolean; qty: string; note: string }>;
type Upload = { id: string; name: string; size: number; category: "drawing" | "boq" };

const newRow = (system: string, method: SecRow["method"]): SecRow => ({ id: rid(), system, method, description: "", area: "", sections: "1", widthMm: "", heightMm: "", diameterMm: "", lengthM: "", qty: "1" });
const rowToInput = (r: SecRow, mode: DuctMode): DuctSectionInput => {
  const base = { id: r.id, method: r.method, system: r.system, mode, ...(r.description.trim() ? { description: r.description.trim() } : {}) };
  if (r.method === "area") return { ...base, area: n2(r.area), sections: Math.max(0, Math.floor(n2(r.sections))) };
  if (r.method === "rect") return { ...base, widthMm: n2(r.widthMm), heightMm: n2(r.heightMm), lengthM: n2(r.lengthM), qty: n2(r.qty) };
  return { ...base, diameterMm: n2(r.diameterMm), lengthM: n2(r.lengthM), qty: n2(r.qty) };
};
const rowValid = (r: SecRow) => (r.method === "area" ? n2(r.area) > 0 : r.method === "rect" ? n2(r.widthMm) > 0 && n2(r.heightMm) > 0 && n2(r.lengthM) > 0 && n2(r.qty) > 0 : n2(r.diameterMm) > 0 && n2(r.lengthM) > 0 && n2(r.qty) > 0);
const fromInputRow = (s: DuctSectionInput): SecRow => ({ id: s.id, system: s.system, method: s.method, description: s.description ?? "", area: s.area ? String(s.area) : "", sections: String(s.sections ?? 1), widthMm: s.widthMm ? String(s.widthMm) : "", heightMm: s.heightMm ? String(s.heightMm) : "", diameterMm: s.diameterMm ? String(s.diameterMm) : "", lengthM: s.lengthM ? String(s.lengthM) : "", qty: String(s.qty ?? 1) });

const REQUESTS: { type: DuctRequestType; en: string; ar: string; done: BiText; icon: typeof HardHat }[] = [
  { type: "inspection", en: "Request Site Inspection", ar: "طلب معاينة الموقع", icon: HardHat, done: { en: "We received your request for a site inspection. Our team will contact you to arrange it. This does not confirm an appointment.", ar: "استلمنا طلب معاينة الموقع. سيتواصل معك فريقنا لترتيبها. هذا لا يعني تأكيد الموعد." } },
  { type: "final", en: "Request Final Quotation", ar: "طلب عرض السعر النهائي", icon: ClipboardList, done: { en: "We received your request for the final quotation. Our team will review the details and send it to you.", ar: "استلمنا طلب عرض السعر النهائي. سيراجع فريقنا التفاصيل ويرسله إليك." } },
  { type: "inquiry", en: "Submit Project Inquiry", ar: "إرسال استفسار عن المشروع", icon: FileText, done: { en: "Your project inquiry was sent to Osta. Our team will review it and contact you.", ar: "تم إرسال استفسارك عن المشروع إلى اسطا. سيراجعه فريقنا ويتواصل معك." } },
];

function Calculator({ config, defaultLang, heading, subtitle, edit }: { config: DuctConfig; defaultLang: Lang; heading: BiText; subtitle: BiText; edit?: { token: string; view: DuctQuoteView } }) {
  const { settings } = useSite();
  const [lang, setLang] = useState<Lang>(edit ? edit.view.lang : defaultLang);
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const view = edit?.view;
  const bi = (x: BiText) => (lang === "ar" ? x.ar || x.en : x.en || x.ar);

  const [step, setStep] = useState(1);
  const [cust, setCust] = useState<DuctCustomer>(() => view?.customer ?? { name: "", company: "", phone: "", email: "" });
  const [proj, setProj] = useState<DuctProject>(() => view?.project ? { ...view.project, projectType: view.project.projectType, emirate: view.project.emirate } : { projectType: "", emirate: "", location: "", projectName: "", siteAddress: "", description: "" });
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploading, setUploading] = useState<"drawing" | "boq" | null>(null);
  const [uploadKey] = useState(hex);
  const [selSystems, setSelSystems] = useState<string[]>(() => (view ? [...new Set(view.input.sections.map((s) => s.system))] : []));
  const [modes, setModes] = useState<Record<string, DuctMode>>(() => {
    const m: Record<string, DuctMode> = {};
    for (const s of view?.input.sections ?? []) m[s.system] = s.mode;
    return m;
  });
  const [rows, setRows] = useState<SecRow[]>(() => (view ? view.input.sections.map(fromInputRow) : []));
  const [acc, setAcc] = useState<AccState>(() => { const m: AccState = {}; for (const a of view?.input.accessories ?? []) m[a.key] = { on: true, unit: a.unit, qty: String(a.qty), note: a.note ?? "" }; return m; });
  const [svc, setSvc] = useState<SvcState>(() => { const m: SvcState = {}; for (const s of view?.input.services ?? []) m[s.key] = { on: true, qty: String(s.qty), note: s.note ?? "" }; return m; });
  const [spec, setSpec] = useState<DuctSpec>(() => view?.spec ?? {});
  const [calcRaw, setCalc] = useState<{ lines: DuctLine[]; sections: DuctComputedSection[]; totals: DuctTotals } | null>(null);
  const [calcErrRaw, setCalcError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(edit?.token ?? null);
  const [done, setDone] = useState<null | { number: string; version?: number }>(null);
  const [pdfLang, setPdfLang] = useState<Lang | "both">(edit ? edit.view.lang : defaultLang);
  const [pdfBusy, setPdfBusy] = useState<null | "download" | "print">(null);
  const [requested, setRequested] = useState<DuctRequestType | null>(null);
  const [copied, setCopied] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const systems = config.systems;
  const sysOf = (key: string) => systems.find((s) => s.key === key);
  const chosen = systems.filter((s) => selSystems.includes(s.key));

  const quoteInput = useMemo<DuctInput>(() => ({
    sections: rows.filter((r) => selSystems.includes(r.system) && modes[r.system] && rowValid(r)).map((r) => rowToInput(r, modes[r.system])),
    accessories: config.accessories.filter((a) => acc[a.key]?.on && n2(acc[a.key].qty) > 0).map((a) => ({ key: a.key, unit: acc[a.key].unit, qty: n2(acc[a.key].qty), ...(acc[a.key].note.trim() ? { note: acc[a.key].note.trim() } : {}) })),
    services: config.services.filter((s) => svc[s.key]?.on && n2(svc[s.key].qty) > 0).map((s) => ({ key: s.key, qty: n2(svc[s.key].qty), ...(svc[s.key].note.trim() ? { note: svc[s.key].note.trim() } : {}) })),
  }), [rows, selSystems, modes, acc, svc, config.accessories, config.services]);

  // The live summary: the server works the areas and prices out and the page draws what it answers.
  const inputKey = JSON.stringify(quoteInput);
  useEffect(() => {
    let live = true;
    if (quoteInput.sections.length === 0) return;
    const timer = window.setTimeout(() => {
      api.ductQuoteCalculate(quoteInput).then((r) => { if (live) { setCalc(r); setCalcError(null); } }).catch((e) => { if (live) setCalcError(e instanceof ApiError ? e.message : t("Could not calculate. Please check your entries.", "تعذر الحساب. يرجى مراجعة المدخلات.")); });
    }, 300);
    return () => { live = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey]);

  // Without a valid section there is nothing to price, whatever the last answer was.
  const calc = quoteInput.sections.length ? calcRaw : null;
  const calcError = quoteInput.sections.length ? calcErrRaw : null;

  const goto = (n: number) => { setError(null); setStep(n); window.setTimeout(() => top.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 0); };

  const toggleSystem = (key: string) => {
    const s = sysOf(key)!;
    setError(null);
    setSelSystems((cur) => (cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key]));
    // When the administrator offers only one kind of work for a system, that is the work: nothing for the customer to guess.
    const on = enabledModes(s);
    if (!selSystems.includes(key) && on.length === 1 && !modes[key]) setModes((m) => ({ ...m, [key]: on[0] }));
  };
  const setRow = (id: string, patch: Partial<SecRow>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const rowArea = (id: string) => calc?.sections.find((s) => s.id === id)?.areaM2;
  const specFields = useMemo(() => { const set = new Set<DuctSpecKey>(["pressure", "application"]); for (const s of chosen) for (const f of s.specFields) set.add(f); return (["gauge", "fiberglass", "pir", "pressure", "application"] as DuctSpecKey[]).filter((k) => set.has(k) && config.specs[k].length > 0); }, [chosen, config.specs]);

  function problem(forStep: number): string | null {
    if (forStep >= 1) {
      const d = cust.phone.replace(/\D/g, "");
      if (cust.name.trim().length < 2) return t("Enter your full name.", "أدخل اسمك الكامل.");
      if (d.length < 8 || d.length > 15) return t("Enter a valid phone number.", "أدخل رقم هاتف صحيحاً.");
      if (cust.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cust.email.trim())) return t("Enter a valid email address.", "أدخل بريداً إلكترونياً صحيحاً.");
      if (!proj.projectType) return t("Choose the project type.", "اختر نوع المشروع.");
      if (!proj.emirate) return t("Choose the emirate.", "اختر الإمارة.");
      if (proj.location.trim().length < 2) return t("Enter the project location.", "أدخل موقع المشروع.");
      if (proj.siteAddress.trim().length < 2) return t("Enter the site address.", "أدخل عنوان الموقع.");
      if (proj.description.trim().length < 3) return t("Describe the project in a few words.", "صف المشروع بكلمات قليلة.");
    }
    if (forStep >= 2 && selSystems.length === 0) return t("Choose at least one duct system.", "اختر نظام دكت واحداً على الأقل.");
    if (forStep >= 3 && chosen.some((s) => !modes[s.key])) return t("Choose the type of work for every system.", "اختر نوع العمل لكل نظام.");
    if (forStep >= 4) {
      const mine = rows.filter((r) => selSystems.includes(r.system));
      if (mine.length === 0) return t("Add at least one duct section.", "أضف مقطع دكت واحداً على الأقل.");
      if (mine.some((r) => !rowValid(r))) return t("Complete or delete the sections that have empty or zero values.", "أكمل المقاطع التي بها قيم فارغة أو صفرية أو احذفها.");
      if (chosen.some((s) => !mine.some((r) => r.system === s.key))) return t("Every chosen system needs at least one section. Add one, or untick the system in step 2.", "كل نظام مختار يحتاج مقطعاً واحداً على الأقل. أضف مقطعاً أو ألغِ اختيار النظام في الخطوة 2.");
      if (calcError) return calcError;
    }
    if (forStep >= 6 && config.accessories.some((a) => acc[a.key]?.on && n2(acc[a.key].qty) <= 0)) return t("Enter a quantity for each selected component.", "أدخل كمية لكل مكون مختار.");
    if (forStep >= 7 && config.services.some((s) => svc[s.key]?.on && n2(svc[s.key].qty) <= 0)) return t("Enter a quantity for each selected service.", "أدخل كمية لكل خدمة مختارة.");
    if (forStep >= 8 && spec.completionDate && spec.completionDate < today) return t("The completion date cannot be in the past.", "لا يمكن أن يكون تاريخ الإنجاز في الماضي.");
    return null;
  }
  const next = () => { const p = problem(step); if (p) return setError(p); goto(step + 1); };

  async function addFiles(list: FileList | null, category: "drawing" | "boq") {
    if (!list || list.length === 0) return;
    setError(null); setUploading(category);
    try {
      let count = uploads.length;
      for (const f of Array.from(list)) {
        if (count >= config.uploads.maxFiles) { setError(t(`You can attach up to ${config.uploads.maxFiles} files.`, `يمكنك إرفاق ${config.uploads.maxFiles} ملفات كحد أقصى.`)); break; }
        if (f.size > config.uploads.maxMb * 1024 * 1024) { setError(t(`${f.name} is larger than ${config.uploads.maxMb} MB.`, `الملف ${f.name} أكبر من ${config.uploads.maxMb} ميجابايت.`)); continue; }
        try { const r = await uploadDuctFile(f, uploadKey, category); setUploads((x) => [...x, { id: r.id, name: r.name, size: r.size, category }]); count++; } catch (e) { setError(e instanceof ApiError ? e.message : t("The upload failed.", "فشل رفع الملف.")); }
      }
    } finally { setUploading(null); }
  }

  const specOut = (): DuctSpec => Object.fromEntries(Object.entries(spec).filter(([, v]) => typeof v === "string" && v.trim() !== "").map(([k, v]) => [k, (v as string).trim()])) as DuctSpec;

  async function generate() {
    if (busy) return;
    const p = problem(8);
    if (p) return setError(p);
    setBusy(true); setError(null);
    const body = { lang, input: quoteInput, spec: specOut(), customer: { ...cust, name: cust.name.trim(), company: cust.company.trim(), email: cust.email.trim() }, project: { ...proj, location: proj.location.trim(), siteAddress: proj.siteAddress.trim(), projectName: proj.projectName.trim(), description: proj.description.trim() }, ...(uploads.length ? { uploadKey } : {}) };
    try {
      if (token) { const r = await api.ductQuoteEdit(token, body); setDone({ number: r.number, version: r.version }); }
      else { const r = await api.ductQuoteCreate(body); setToken(r.token); setDone({ number: r.number }); }
      setRequested(null); setStep(10);
      window.setTimeout(() => top.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("Something went wrong. Please try again, or contact us on WhatsApp.", "حدث خطأ ما. حاول مرة أخرى أو تواصل معنا عبر واتساب."));
    } finally { setBusy(false); }
  }
  async function request(type: DuctRequestType) {
    if (!token || busy) return;
    setBusy(true); setError(null);
    try { await api.ductQuoteSubmit(token, type); setRequested(type); }
    catch (e) { setError(e instanceof ApiError ? e.message : t("Something went wrong. Please try again.", "حدث خطأ ما. حاول مرة أخرى.")); }
    finally { setBusy(false); }
  }
  async function pdf() {
    if (!token) return;
    setPdfBusy("download"); setError(null);
    try { await downloadAgreementPdf(ductQuotePdfPath(token, pdfLang), null, `${done?.number ?? "quotation"}.pdf`); }
    catch { setError(t("The PDF could not be prepared. Please try again.", "تعذر تجهيز ملف PDF. حاول مرة أخرى.")); }
    finally { setPdfBusy(null); }
  }
  async function printPdf() {
    if (!token) return;
    setPdfBusy("print"); setError(null);
    try {
      const url = await fetchPdfBlobUrl(ductQuotePdfPath(token, pdfLang));
      const f = document.createElement("iframe");
      f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
      f.onload = () => { try { f.contentWindow?.focus(); f.contentWindow?.print(); } catch { window.open(url, "_blank"); } window.setTimeout(() => { f.remove(); URL.revokeObjectURL(url); }, 120_000); };
      f.src = url; document.body.appendChild(f);
    } catch { setError(t("The PDF could not be prepared. Please try again.", "تعذر تجهيز ملف PDF. حاول مرة أخرى.")); }
    finally { setPdfBusy(null); }
  }
  const quoteLink = () => (typeof window === "undefined" ? "" : `${window.location.origin}/duct-quote/${token}`);
  const shareHref = () => `https://wa.me/?text=${encodeURIComponent(t(`Osta ductwork quotation ${done?.number ?? ""}: ${quoteLink()}`, `عرض سعر اسطا لتصنيع وتركيب الدكت ${done?.number ?? ""}: ${quoteLink()}`))}`;
  async function copyLink() { try { await navigator.clipboard.writeText(quoteLink()); setCopied(true); window.setTimeout(() => setCopied(false), 2500); } catch { setError(t("Copy the link from the address below.", "انسخ الرابط من العنوان أدناه.")); } }

  const totals = calc?.totals;
  const label = (l: DuctLine) => pickBi(lang, l.labelEn, l.labelAr);
  const optLabel = (list: { key: string; en: string; ar: string }[], key: string) => { const o = list.find((x) => x.key === key); return o ? pickBi(lang, o.en, o.ar) : key; };
  const steps = [t("Project", "المشروع"), t("Duct system", "نظام الدكت"), t("Type of work", "نوع العمل"), t("Duct sections", "مقاطع الدكت"), t("Area & cost", "المساحة والتكلفة"), t("Components", "المكونات"), t("Services", "الخدمات"), t("Specifications", "المواصفات"), t("Review", "المراجعة"), t("Quotation", "عرض السعر")];
  // The cost of each system: its area and the sum of its ductwork lines.
  const perSystem = chosen.map((s) => ({ s, area: totals?.areas.filter((a) => a.system === s.key).reduce((x, a) => x + a.area, 0) ?? 0, lines: calc?.lines.filter((l) => l.kind === "duct" && l.system === s.key) ?? [] }));

  const summary = (
    <aside className="rounded-xl border border-card-border bg-bg-elevated p-4 text-sm" aria-label={t("Quotation summary", "ملخص عرض السعر")}>
      <p className="mb-2 font-bold text-text">{t("Quotation summary", "ملخص عرض السعر")}</p>
      {!calc ? <p className="text-xs text-text-muted">{calcError ?? t("Add your duct sections to see the cost.", "أضف مقاطع الدكت لعرض التكلفة.")}</p> : (
        <>
          <ul className="flex flex-col gap-1.5">
            {calc.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span className="text-text-muted">{label(l)}{l.kind === "duct" || l.qty !== 1 ? ` × ${l.qty} ${unitName(l.unit, lang)}` : ""}</span>
                <span className="shrink-0 text-end text-text">{l.amount == null ? <span className="text-amber-300">{t("Quotation", "عرض سعر")}</span> : `${l.kind === "discount" ? "− " : ""}${money(l.amount, lang)}`}</span>
              </li>
            ))}
          </ul>
          {totals && (
            <dl className="mt-3 flex flex-col gap-1.5 border-t border-card-border pt-3">
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Total duct area", "إجمالي مساحة الدكت")}</dt><dd className="text-text" dir="ltr">{totals.totalArea} m²</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Ductwork", "الدكت")}</dt><dd className="text-text">{money(totals.ductSubtotal, lang)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Accessories", "الإكسسوارات")}</dt><dd className="text-text">{money(totals.accessoriesSubtotal, lang)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Additional services", "الخدمات الإضافية")}</dt><dd className="text-text">{money(totals.servicesSubtotal, lang)}</dd></div>
              {totals.discount > 0 && <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Discount", "الخصم")}</dt><dd className="text-text">− {money(totals.discount, lang)}</dd></div>}
              <div className="flex justify-between gap-3 border-t border-card-border pt-1.5"><dt className="text-text-muted">{t("Subtotal", "المجموع قبل الضريبة")}</dt><dd className="text-text">{money(totals.subtotal, lang)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-muted">{t(`VAT ${totals.vatPercent}%`, `ضريبة القيمة المضافة ${totals.vatPercent}%`)}</dt><dd className="text-text">{money(totals.vat, lang)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-card-border pt-2 text-base font-extrabold"><dt className="text-text">{t("Grand total", "الإجمالي")}</dt><dd className="text-text">{money(totals.total, lang)}</dd></div>
            </dl>
          )}
          {totals?.rfq && <p className="mt-2 text-xs text-amber-200">{t("Items marked “Quotation” are not in the total and will be priced after technical review.", "البنود المعلّمة «عرض سعر» غير مشمولة في الإجمالي وسيتم تسعيرها بعد المراجعة الفنية.")}</p>}
        </>
      )}
      <p className="mt-3 flex items-start gap-1.5 border-t border-card-border pt-3 text-[11px] text-amber-100"><AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />{bi(config.estimateNotice)}</p>
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
  const stepper = (
    <ol className="mb-5 flex items-center gap-1 overflow-x-auto pb-1 text-xs" aria-label={t("Steps", "الخطوات")}>
      {steps.map((s, i) => (
        <li key={i} aria-current={step === i + 1 ? "step" : undefined} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 ${step === i + 1 ? "bg-accent/20 font-bold text-text" : i + 1 < step ? "text-emerald-400" : "text-text-faint"}`}>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${i + 1 < step ? "bg-emerald-500 text-white" : "bg-card-border text-text"}`}>{i + 1 < step ? <Check size={12} aria-hidden /> : i + 1}</span>
          <span className={step === i + 1 ? "inline" : "hidden xl:inline"}>{s}</span>
        </li>
      ))}
    </ol>
  );

  // ---- step 10: the quotation is ready ----
  if (done && token) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="osta-card p-5 sm:p-7">
        {header}
        {stepper}
        <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
          <CheckCircle2 size={44} className="text-emerald-500" aria-hidden />
          <p className="text-xl font-bold text-text">{done.version ? t("Your quotation was updated", "تم تحديث عرض السعر") : t("Your quotation is ready", "عرض السعر جاهز")}</p>
          <p className="text-sm text-text-muted">{t("Quotation number", "رقم عرض السعر")}: <b className="text-text" dir="ltr">{done.number}</b>{done.version ? ` · v${done.version}` : ""}</p>
          {totals && <p className="text-2xl font-extrabold text-accent-2">{money(totals.total, lang)} <span className="text-sm font-normal text-text-muted">{t("incl. VAT", "شامل الضريبة")}</span></p>}
          {totals?.rfq && <p className="max-w-md text-xs text-amber-200">{t("Some items are marked as a request for quotation. They are not in this total.", "بعض البنود معلّمة كطلب عرض سعر وهي غير مشمولة في هذا الإجمالي.")}</p>}
          <p className="flex max-w-xl items-start gap-1.5 text-xs text-amber-100"><AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />{bi(config.estimateNotice)}</p>
        </div>

        <div className="mx-auto max-w-2xl">
          <fieldset className="mb-3 flex flex-wrap items-center justify-center gap-2 text-sm">
            <legend className="sr-only">{t("PDF language", "لغة ملف PDF")}</legend>
            <span className="text-xs text-text-muted">{t("PDF language", "لغة ملف PDF")}:</span>
            {([["en", "English"], ["ar", "العربية"], ["both", t("English + Arabic", "إنجليزي + عربي")]] as const).map(([k, l]) => (
              <label key={k} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold ${pdfLang === k ? "border-accent bg-accent/15 text-text" : "border-card-border text-text-muted"}`}><input type="radio" name="pdf-lang" className="sr-only" checked={pdfLang === k} onChange={() => setPdfLang(k)} />{l}</label>
            ))}
          </fieldset>
          <div className="grid gap-2 sm:grid-cols-3">
            <button type="button" disabled={pdfBusy !== null} onClick={() => void pdf()} className="osta-btn-primary flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{pdfBusy === "download" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Download size={16} aria-hidden />}{t("Download PDF", "تحميل PDF")}</button>
            <button type="button" disabled={pdfBusy !== null} onClick={() => void printPdf()} className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text disabled:opacity-60">{pdfBusy === "print" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Printer size={16} aria-hidden />}{t("Print", "طباعة")}</button>
            <a href={shareHref()} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text"><Share2 size={16} aria-hidden />{t("Share on WhatsApp", "مشاركة عبر واتساب")}</a>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {REQUESTS.map((r) => {
              const Icon = r.icon;
              return <button key={r.type} type="button" disabled={busy || requested === r.type} onClick={() => void request(r.type)} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-60 ${r.type === "final" ? "border-accent text-accent-2" : "border-card-border text-text"}`}><Icon size={16} aria-hidden />{lang === "ar" ? r.ar : r.en}</button>;
            })}
          </div>
          {requested && <p role="status" className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{bi(REQUESTS.find((r) => r.type === requested)!.done)}</p>}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => { setDone(null); setRequested(null); goto(1); }} className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text">{t("Edit Quotation", "تعديل عرض السعر")}</button>
            <a href={whatsappHref(settings, lang, t(`Hello Osta, I generated ductwork quotation ${done.number}.`, `مرحباً اسطا، أنشأت عرض سعر الدكت ${done.number}.`))} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text"><MessageCircle size={16} aria-hidden />{t("Contact via WhatsApp", "التواصل عبر واتساب")}</a>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          <p className="mt-4 text-center text-xs text-text-muted">{t("Keep this private link to come back, change or download your quotation:", "احتفظ بهذا الرابط الخاص للعودة إلى عرض السعر أو تعديله أو تحميله:")} <a className="break-all font-semibold text-accent-2 underline" dir="ltr" href={`/duct-quote/${token}`}>{`/duct-quote/${token}`}</a>{" "}
            <button type="button" onClick={() => void copyLink()} className="ms-1 inline-flex items-center gap-1 rounded-md border border-card-border px-2 py-0.5 font-semibold text-text"><Copy size={11} aria-hidden />{copied ? t("Copied", "تم النسخ") : t("Copy", "نسخ")}</button></p>
        </div>
      </div>
    );
  }

  const secFields = (r: SecRow) => (
    <div className="grid gap-3 sm:grid-cols-4">
      {r.method === "area" && <>
        <label className={`${lab} sm:col-span-2`}>{t("Total duct area from the approved BOQ (m²)", "إجمالي مساحة الدكت من جدول الكميات المعتمد (م²)")}<input className={input} type="number" inputMode="decimal" min={0} step="any" dir="ltr" value={r.area} onChange={(e) => setRow(r.id, { area: e.target.value })} /></label>
        <label className={lab}>{t("Number of sections (optional)", "عدد المقاطع (اختياري)")}<input className={input} type="number" inputMode="numeric" min={0} dir="ltr" value={r.sections} onChange={(e) => setRow(r.id, { sections: e.target.value })} /></label>
      </>}
      {r.method === "rect" && <>
        <label className={lab}>{t("Width (mm)", "العرض (مم)")}<input className={input} type="number" inputMode="decimal" min={0} step="any" dir="ltr" value={r.widthMm} onChange={(e) => setRow(r.id, { widthMm: e.target.value })} /></label>
        <label className={lab}>{t("Height (mm)", "الارتفاع (مم)")}<input className={input} type="number" inputMode="decimal" min={0} step="any" dir="ltr" value={r.heightMm} onChange={(e) => setRow(r.id, { heightMm: e.target.value })} /></label>
        <label className={lab}>{t("Length (m)", "الطول (م)")}<input className={input} type="number" inputMode="decimal" min={0} step="any" dir="ltr" value={r.lengthM} onChange={(e) => setRow(r.id, { lengthM: e.target.value })} /></label>
        <label className={lab}>{t("Quantity", "الكمية")}<input className={input} type="number" inputMode="numeric" min={0} step="any" dir="ltr" value={r.qty} onChange={(e) => setRow(r.id, { qty: e.target.value })} /></label>
      </>}
      {r.method === "round" && <>
        <label className={lab}>{t("Diameter (mm)", "القطر (مم)")}<input className={input} type="number" inputMode="decimal" min={0} step="any" dir="ltr" value={r.diameterMm} onChange={(e) => setRow(r.id, { diameterMm: e.target.value })} /></label>
        <label className={lab}>{t("Length (m)", "الطول (م)")}<input className={input} type="number" inputMode="decimal" min={0} step="any" dir="ltr" value={r.lengthM} onChange={(e) => setRow(r.id, { lengthM: e.target.value })} /></label>
        <label className={lab}>{t("Quantity", "الكمية")}<input className={input} type="number" inputMode="numeric" min={0} step="any" dir="ltr" value={r.qty} onChange={(e) => setRow(r.id, { qty: e.target.value })} /></label>
      </>}
      <label className={`${lab} sm:col-span-4`}>{t("Description (optional, for example Supply duct – Floor 1)", "الوصف (اختياري، مثال: دكت تغذية – الطابق الأول)")}<input className={input} maxLength={300} value={r.description} onChange={(e) => setRow(r.id, { description: e.target.value })} /></label>
    </div>
  );

  const specSelect = (k: DuctSpecKey) => {
    const v = spec[k] ?? "";
    return (
      <label key={k} className={lab}>{SPEC_NAME[k][lang]}
        <select className={input} value={v} onChange={(e) => setSpec({ ...spec, [k]: e.target.value })}>
          <option value="">{t("— Select (optional) —", "— اختر (اختياري) —")}</option>
          {config.specs[k].map((o) => <option key={o.key} value={o.key}>{pickBi(lang, o.en, o.ar)}</option>)}
          <option value="not-sure">{t("Not sure", "غير متأكد")}</option>
        </select>
        {(v === "" || v === "not-sure") && <span className="text-[11px] font-normal text-violet-300">{t("Not confirmed: subject to technical review", "غير مؤكد: يخضع للمراجعة الفنية")}</span>}
      </label>
    );
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="osta-card p-5 sm:p-7">
      {header}
      {stepper}

      <div className="grid gap-5 lg:grid-cols-[1fr_21rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={lab}>{t("Full Name", "الاسم الكامل")}<input className={input} autoComplete="name" value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} /></label>
              <label className={lab}>{t("Company Name (optional)", "اسم الشركة (اختياري)")}<input className={input} autoComplete="organization" value={cust.company} onChange={(e) => setCust({ ...cust, company: e.target.value })} /></label>
              <label className={lab}>{t("Phone / WhatsApp", "الهاتف / واتساب")}<input className={input} type="tel" dir="ltr" autoComplete="tel" placeholder="+971 50 123 4567" value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} /></label>
              <label className={lab}>{t("Email Address", "البريد الإلكتروني")}<input className={input} type="email" dir="ltr" autoComplete="email" value={cust.email} onChange={(e) => setCust({ ...cust, email: e.target.value })} /></label>
              <label className={lab}>{t("Project Name (optional)", "اسم المشروع (اختياري)")}<input className={input} value={proj.projectName} onChange={(e) => setProj({ ...proj, projectName: e.target.value })} /></label>
              <label className={lab}>{t("Project Type", "نوع المشروع")}<select className={input} value={proj.projectType} onChange={(e) => setProj({ ...proj, projectType: e.target.value })}><option value="">{t("— Select —", "— اختر —")}</option>{config.projectTypes.map((x) => <option key={x.key} value={x.key}>{pickBi(lang, x.en, x.ar)}</option>)}</select></label>
              <label className={lab}>{t("Emirate", "الإمارة")}<select className={input} value={proj.emirate} onChange={(e) => setProj({ ...proj, emirate: e.target.value })}><option value="">{t("— Select —", "— اختر —")}</option>{config.emirates.map((x) => <option key={x.key} value={x.key}>{pickBi(lang, x.en, x.ar)}</option>)}</select></label>
              <label className={lab}>{t("Project Location (area / city)", "موقع المشروع (المنطقة / المدينة)")}<input className={input} value={proj.location} onChange={(e) => setProj({ ...proj, location: e.target.value })} /></label>
              <label className={`${lab} sm:col-span-2`}>{t("Site Address", "عنوان الموقع")}<input className={input} autoComplete="street-address" value={proj.siteAddress} onChange={(e) => setProj({ ...proj, siteAddress: e.target.value })} /></label>
              <label className={`${lab} sm:col-span-2`}>{t("Project Description", "وصف المشروع")}<textarea className={`${input} resize-y`} rows={3} maxLength={3000} value={proj.description} onChange={(e) => setProj({ ...proj, description: e.target.value })} /></label>
              {(["drawing", "boq"] as const).map((cat) => (
                <div key={cat}>
                  <p className="mb-1.5 text-xs font-medium text-text-muted">{cat === "drawing" ? t("Upload Drawings (optional)", "رفع المخططات (اختياري)") : t("Upload BOQ (optional)", "رفع جدول الكميات BOQ (اختياري)")}</p>
                  <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-card-border px-4 py-4 text-sm text-text-muted ${uploading ? "opacity-60" : ""}`}>
                    {uploading === cat ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Upload size={16} aria-hidden />}{t("Choose files (PDF, XLSX, XLS, DWG, JPG, PNG)", "اختر الملفات (PDF, XLSX, XLS, DWG, JPG, PNG)")}
                    <input type="file" multiple accept={ACCEPT} className="sr-only" disabled={uploading !== null} onChange={(e) => { void addFiles(e.target.files, cat); e.target.value = ""; }} />
                  </label>
                  {uploads.filter((f) => f.category === cat).length > 0 && <ul className="mt-2 flex flex-col gap-1 text-xs text-text">{uploads.filter((f) => f.category === cat).map((f) => <li key={f.id} className="flex items-center gap-2"><Check size={13} className="text-emerald-400" aria-hidden />{f.name}</li>)}</ul>}
                </div>
              ))}
              <p className="text-[11px] text-text-faint sm:col-span-2">{t(`Up to ${config.uploads.maxFiles} files, ${config.uploads.maxMb} MB each. ${view && view.files.length ? `${view.files.length} file(s) are already attached to this quotation. ` : ""}You do not need an account to create a quotation.`, `حتى ${config.uploads.maxFiles} ملفات، ${config.uploads.maxMb} ميجابايت لكل ملف. ${view && view.files.length ? `يوجد ${view.files.length} ملف(ات) مرفقة بالفعل بهذا العرض. ` : ""}لا تحتاج إلى حساب لإنشاء عرض السعر.`)}</p>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-muted">{t("Choose one or more duct systems. You will enter the sections of each system and get a separate total for it.", "اختر نظام دكت أو أكثر. ستدخل مقاطع كل نظام وتحصل على إجمالي منفصل له.")}</p>
              <div className="grid gap-3 md:grid-cols-3">
                {systems.map((s) => {
                  const on = selSystems.includes(s.key), low = fromRate(s);
                  return (
                    <label key={s.key} className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-4 ${on ? "border-accent bg-accent/10 ring-1 ring-accent/50" : "border-card-border"}`}>
                      <span className="flex items-start gap-2.5"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#087bff]" checked={on} onChange={() => toggleSystem(s.key)} /><span className="text-sm font-bold text-text">{pickBi(lang, s.nameEn, s.nameAr)}</span></span>
                      <span className="text-xs text-text-muted">{pickBi(lang, s.descriptionEn, s.descriptionAr)}</span>
                      <span className="text-sm">{low != null ? <><span className="text-xs text-text-muted">{t("From", "ابتداءً من")}</span> <b className="text-text">{money(low, lang)}</b> <span className="text-xs text-text-muted">/ m²</span></> : <span className="text-xs font-semibold text-amber-300">{t("Request for quotation", "طلب عرض سعر")}</span>}</span>
                      {on && <ul className="mt-1 flex flex-col gap-1 border-t border-card-border pt-2 text-xs text-text">{pickList(lang, s.included).map((x) => <li key={x} className="flex gap-1.5"><Check size={12} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />{x}</li>)}</ul>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-muted">{t("Choose the type of work for each system. Only the options we offer for that system are shown.", "اختر نوع العمل لكل نظام. تظهر فقط الخيارات التي نقدمها لهذا النظام.")}</p>
              {chosen.map((s) => (
                <fieldset key={s.key} className="rounded-xl border border-card-border p-4">
                  <legend className="px-2 text-sm font-bold text-text">{pickBi(lang, s.nameEn, s.nameAr)}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {enabledModes(s).map((m) => {
                      const rate = s.modes[m].rate;
                      return (
                        <label key={m} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 ${modes[s.key] === m ? "border-accent bg-accent/10" : "border-card-border"}`}>
                          <input type="radio" name={`mode-${s.key}`} className="mt-0.5 h-4 w-4 accent-[#087bff]" checked={modes[s.key] === m} onChange={() => setModes((x) => ({ ...x, [s.key]: m }))} />
                          <span className="flex flex-col"><span className="text-sm font-semibold text-text">{MODE_LABEL[m][lang]}</span><span className={`text-xs ${rate != null ? "text-text-muted" : "font-semibold text-amber-300"}`}>{rate != null ? `${money(rate, lang)} / m²` : t("Request for quotation", "طلب عرض سعر")}</span></span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-muted">{t("For each system, enter the total area from an approved BOQ, or add rectangular and circular duct sections. The area is worked out for you.", "لكل نظام، أدخل إجمالي المساحة من جدول كميات معتمد، أو أضف مقاطع دكت مستطيلة ودائرية. تُحسب المساحة تلقائياً.")}</p>
              <p className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-100"><AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />{bi(config.straightDuctNote)}</p>
              {chosen.map((s) => {
                const mine = rows.filter((r) => r.system === s.key);
                return (
                  <section key={s.key} className="rounded-xl border border-card-border p-4" aria-label={pickBi(lang, s.nameEn, s.nameAr)}>
                    <h3 className="text-sm font-bold text-text">{pickBi(lang, s.nameEn, s.nameAr)} <span className="text-xs font-normal text-text-muted">· {modes[s.key] ? MODE_LABEL[modes[s.key]][lang] : ""}</span></h3>
                    <div className="mt-3 flex flex-col gap-3">
                      {mine.map((r, i) => (
                        <fieldset key={r.id} className="rounded-xl bg-bg-elevated p-3">
                          <legend className="px-1 text-xs font-bold text-text">{t("Section", "المقطع")} {i + 1} · {r.method === "area" ? t("Total area", "إجمالي المساحة") : r.method === "rect" ? t("Rectangular duct", "دكت مستطيل") : t("Circular duct", "دكت دائري")}</legend>
                          {secFields(r)}
                          <p className="mt-2 text-[11px] text-text-faint" dir="ltr">{r.method === "rect" ? "Area = 2 × (W + H) × L × Qty" : r.method === "round" ? "Area = π × D × L × Qty" : ""}</p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-text-muted">{t("Section area", "مساحة المقطع")}: <b className="text-text" dir="ltr">{rowValid(r) && rowArea(r.id) != null ? `${rowArea(r.id)} m²` : "—"}</b></p>
                            <div className="flex gap-3 text-xs font-semibold">
                              <button type="button" onClick={() => setRows((x) => { const at = x.findIndex((y) => y.id === r.id); const copy = { ...r, id: rid() }; return [...x.slice(0, at + 1), copy, ...x.slice(at + 1)]; })} className="inline-flex items-center gap-1.5 text-text"><Copy size={13} aria-hidden />{t("Duplicate", "نسخ")}</button>
                              <button type="button" onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))} className="inline-flex items-center gap-1.5 text-rose-300"><Trash2 size={13} aria-hidden />{t("Delete", "حذف")}</button>
                            </div>
                          </div>
                        </fieldset>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {([["area", t("Add total area (BOQ)", "إضافة إجمالي مساحة (BOQ)")], ["rect", t("Add rectangular duct", "إضافة دكت مستطيل")], ["round", t("Add circular duct", "إضافة دكت دائري")]] as const).map(([m, l]) => (
                        <button key={m} type="button" disabled={rows.length >= 150} onClick={() => setRows((x) => [...x, newRow(s.key, m)])} className="inline-flex items-center gap-1.5 rounded-xl border border-card-border px-3 py-2 text-xs font-semibold text-text disabled:opacity-50"><Plus size={14} aria-hidden />{l}</button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-muted">{t("The area and cost of each duct system.", "مساحة وتكلفة كل نظام دكت.")}</p>
              <div className="overflow-x-auto rounded-xl border border-card-border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead><tr className="border-b border-card-border text-xs text-text-muted"><th className="px-3 py-2 text-start">{t("System", "النظام")}</th><th className="px-3 py-2 text-start">{t("Type of work", "نوع العمل")}</th><th className="px-3 py-2 text-end">{t("Area (m²)", "المساحة (م²)")}</th><th className="px-3 py-2 text-end">{t("Rate", "السعر")}</th><th className="px-3 py-2 text-end">{t("Cost", "التكلفة")}</th></tr></thead>
                  <tbody>
                    {perSystem.map(({ s, area, lines }) => {
                      const l = lines[0];
                      return (
                        <tr key={s.key} className="border-b border-card-border/60">
                          <td className="px-3 py-2 font-semibold text-text">{pickBi(lang, s.nameEn, s.nameAr)}</td>
                          <td className="px-3 py-2 text-text-muted">{modes[s.key] ? MODE_LABEL[modes[s.key]][lang] : "—"}</td>
                          <td className="px-3 py-2 text-end text-text" dir="ltr">{area}</td>
                          <td className="px-3 py-2 text-end text-text-muted">{l ? (l.unitPrice == null ? t("Quotation", "عرض سعر") : money(l.unitPrice, lang)) : "—"}</td>
                          <td className="px-3 py-2 text-end font-bold text-text">{!l ? "—" : lines.some((x) => x.amount == null) ? <span className="text-amber-300">{t("Quotation", "عرض سعر")}</span> : money(lines.reduce((a, x) => a + (x.amount ?? 0), 0), lang)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {totals && <tfoot><tr><td colSpan={2} className="px-3 py-2 text-xs text-text-muted">{t("Total", "الإجمالي")}</td><td className="px-3 py-2 text-end font-bold text-text" dir="ltr">{totals.totalArea}</td><td /><td className="px-3 py-2 text-end font-bold text-text">{money(totals.ductSubtotal, lang)}</td></tr></tfoot>}
                </table>
              </div>
              <p className="flex items-start gap-2 text-xs text-text-muted"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" aria-hidden />{bi(config.straightDuctNote)}</p>
              {chosen.map((s) => pickList(lang, s.notIncluded).length > 0 && (
                <section key={s.key} className="rounded-xl border border-card-border p-3"><h4 className="mb-1 text-xs font-bold text-text">{pickBi(lang, s.nameEn, s.nameAr)} — {t("not included", "غير مشمول")}</h4><ul className="grid gap-1 text-xs text-text-muted sm:grid-cols-2">{pickList(lang, s.notIncluded).map((x) => <li key={x}>— {x}</li>)}</ul></section>
              ))}
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-muted">{t("Add accessories and components if you need them. An item without a set price is sent as a request for quotation: no price is guessed.", "أضف الإكسسوارات والمكونات عند الحاجة. البند بدون سعر محدد يُرسل كطلب عرض سعر دون تخمين السعر.")}</p>
              <div className="grid gap-2">
                {config.accessories.map((a) => {
                  const st = acc[a.key] ?? { on: false, unit: a.units[0], qty: "1", note: "" };
                  const p = a.prices[st.unit];
                  return (
                    <div key={a.key} className={`rounded-xl border p-3 ${st.on ? "border-accent/60 bg-accent/5" : "border-card-border"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-text"><input type="checkbox" className="h-4 w-4 accent-[#087bff]" checked={st.on} onChange={(e) => setAcc((m) => ({ ...m, [a.key]: { ...st, on: e.target.checked } }))} />{pickBi(lang, a.nameEn, a.nameAr)}</label>
                        <span className={`text-xs ${p != null ? "text-text-muted" : "font-semibold text-amber-300"}`}>{p != null ? `${money(p, lang)} / ${unitName(st.unit, lang)}` : t("Request for quotation", "طلب عرض سعر")}</span>
                      </div>
                      {st.on && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-[8rem_8rem_1fr]">
                          <label className={lab}>{t("Unit", "الوحدة")}<select className={input} value={st.unit} onChange={(e) => setAcc((m) => ({ ...m, [a.key]: { ...st, unit: e.target.value as DuctUnit } }))}>{a.units.map((u) => <option key={u} value={u}>{unitName(u, lang)}</option>)}</select></label>
                          <label className={lab}>{t("Quantity", "الكمية")}<input className={input} type="number" inputMode="decimal" min={0} step="any" dir="ltr" value={st.qty} onChange={(e) => setAcc((m) => ({ ...m, [a.key]: { ...st, qty: e.target.value } }))} /></label>
                          <label className={lab}>{t("Notes (optional)", "ملاحظات (اختياري)")}<input className={input} maxLength={300} value={st.note} onChange={(e) => setAcc((m) => ({ ...m, [a.key]: { ...st, note: e.target.value } }))} /></label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-muted">{t("Add optional services if you need them. Services without a set price are sent as a request for quotation.", "أضف خدمات اختيارية عند الحاجة. الخدمات بدون سعر محدد تُرسل كطلب عرض سعر.")}</p>
              <div className="grid gap-2">
                {config.services.map((s) => {
                  const st = svc[s.key] ?? { on: false, qty: "1", note: "" };
                  const priced = !s.rfq && s.price != null;
                  return (
                    <div key={s.key} className={`rounded-xl border p-3 ${st.on ? "border-accent/60 bg-accent/5" : "border-card-border"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-text"><input type="checkbox" className="h-4 w-4 accent-[#087bff]" checked={st.on} onChange={(e) => setSvc((m) => ({ ...m, [s.key]: { ...st, on: e.target.checked } }))} />{pickBi(lang, s.nameEn, s.nameAr)}</label>
                        <span className={`text-xs ${priced ? "text-text-muted" : "font-semibold text-amber-300"}`}>{priced ? `${money(s.price!, lang)} / ${unitName(s.unit, lang)}` : t("Request for quotation", "طلب عرض سعر")}</span>
                      </div>
                      {st.on && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-[8rem_1fr]">
                          <label className={lab}>{unitName(s.unit, lang)}<input className={input} type="number" inputMode="decimal" min={0} step="any" dir="ltr" value={st.qty} onChange={(e) => setSvc((m) => ({ ...m, [s.key]: { ...st, qty: e.target.value } }))} /></label>
                          <label className={lab}>{s.key.startsWith("other") ? t("Describe the service you need", "صف الخدمة المطلوبة") : t("Notes (optional)", "ملاحظات (اختياري)")}<input className={input} maxLength={500} value={st.note} onChange={(e) => setSvc((m) => ({ ...m, [s.key]: { ...st, note: e.target.value } }))} /></label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-muted">{t("Technical specifications are optional and nothing is pre-selected. Anything you leave blank or mark “Not sure” is shown on the quotation as subject to technical review.", "المواصفات الفنية اختيارية ولا يوجد خيار محدد مسبقاً. أي بند تتركه فارغاً أو تحدده «غير متأكد» يظهر في عرض السعر على أنه يخضع للمراجعة الفنية.")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {specFields.map(specSelect)}
                <label className={lab}>{t("Indoor / outdoor installation", "تركيب داخلي / خارجي")}
                  <select className={input} value={spec.indoorOutdoor ?? ""} onChange={(e) => setSpec({ ...spec, indoorOutdoor: e.target.value })}><option value="">{t("— Select (optional) —", "— اختر (اختياري) —")}</option><option value="indoor">{t("Indoor", "داخلي")}</option><option value="outdoor">{t("Outdoor", "خارجي")}</option><option value="not-sure">{t("Not sure", "غير متأكد")}</option></select>
                  {(!spec.indoorOutdoor || spec.indoorOutdoor === "not-sure") && <span className="text-[11px] font-normal text-violet-300">{t("Not confirmed: subject to technical review", "غير مؤكد: يخضع للمراجعة الفنية")}</span>}
                </label>
                <label className={lab}>{t("Are project drawings available?", "هل تتوفر مخططات للمشروع؟")}<select className={input} value={spec.drawingsAvailable ?? ""} onChange={(e) => setSpec({ ...spec, drawingsAvailable: e.target.value })}><option value="">{t("— Select (optional) —", "— اختر (اختياري) —")}</option><option value="yes">{t("Yes", "نعم")}</option><option value="no">{t("No", "لا")}</option><option value="not-sure">{t("Not sure", "غير متأكد")}</option></select></label>
                <label className={lab}>{t("Required completion date", "تاريخ الإنجاز المطلوب")}<input className={input} type="date" min={today} dir="ltr" value={spec.completionDate ?? ""} onChange={(e) => setSpec({ ...spec, completionDate: e.target.value })} /></label>
                <label className={lab}>{t("Other specification (optional)", "مواصفات أخرى (اختياري)")}<input className={input} maxLength={500} value={spec.otherSpec ?? ""} onChange={(e) => setSpec({ ...spec, otherSpec: e.target.value })} /></label>
                <label className={`${lab} sm:col-span-2`}>{t("Special requirements (optional)", "متطلبات خاصة (اختياري)")}<textarea className={`${input} resize-y`} rows={3} maxLength={2000} value={spec.special ?? ""} onChange={(e) => setSpec({ ...spec, special: e.target.value })} /></label>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="flex flex-col gap-4 text-sm">
              <p className="text-base font-bold text-text">{t("Review your quotation", "راجع عرض السعر")}</p>
              <section className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">{t("Customer & project", "العميل والمشروع")}</h4>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  {([[t("Name", "الاسم"), cust.name], [t("Company", "الشركة"), cust.company], [t("Phone", "الهاتف"), cust.phone], [t("Email", "البريد"), cust.email], [t("Project", "المشروع"), proj.projectName], [t("Type", "النوع"), optLabel(config.projectTypes, proj.projectType)], [t("Location", "الموقع"), `${optLabel(config.emirates, proj.emirate)} — ${proj.location}`], [t("Site address", "عنوان الموقع"), proj.siteAddress], [t("Description", "الوصف"), proj.description]] as [string, string][]).filter(([, v]) => v && v.trim()).map(([k, v]) => <div key={k} className="contents"><dt className="text-text-muted">{k}</dt><dd className="text-text" dir={k === t("Phone", "الهاتف") || k === t("Email", "البريد") ? "ltr" : undefined} style={k === t("Phone", "الهاتف") || k === t("Email", "البريد") ? { textAlign: lang === "ar" ? "right" : "left" } : undefined}>{v}</dd></div>)}
                  {uploads.length > 0 && <div className="contents"><dt className="text-text-muted">{t("Files", "الملفات")}</dt><dd className="text-text">{uploads.map((f) => `${f.category === "boq" ? "BOQ" : t("Drawing", "مخطط")}: ${f.name}`).join(" · ")}</dd></div>}
                </dl></section>
              <section className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">{t("Duct systems", "أنظمة الدكت")}</h4>
                <ul className="flex flex-col gap-1">{perSystem.map(({ s, area }) => <li key={s.key} className="text-text">{pickBi(lang, s.nameEn, s.nameAr)} · {modes[s.key] ? MODE_LABEL[modes[s.key]][lang] : ""} · <span dir="ltr">{area} m²</span></li>)}</ul></section>
              {specFields.length > 0 && (
                <section className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">{t("Technical specifications", "المواصفات الفنية")}</h4>
                  <ul className="flex flex-col gap-1">
                    {specFields.map((k) => { const v = spec[k] ?? ""; const ok = v !== "" && v !== "not-sure"; return <li key={k} className="flex flex-wrap justify-between gap-2"><span className="text-text-muted">{SPEC_NAME[k][lang]}</span><span className={ok ? "text-text" : "text-violet-300"}>{ok ? optLabel(config.specs[k], v) : t("Not confirmed – subject to technical review", "غير مؤكد – يخضع للمراجعة الفنية")}</span></li>; })}
                    <li className="flex flex-wrap justify-between gap-2"><span className="text-text-muted">{t("Indoor / outdoor", "داخلي / خارجي")}</span><span className={spec.indoorOutdoor === "indoor" || spec.indoorOutdoor === "outdoor" ? "text-text" : "text-violet-300"}>{spec.indoorOutdoor === "indoor" ? t("Indoor", "داخلي") : spec.indoorOutdoor === "outdoor" ? t("Outdoor", "خارجي") : t("Not confirmed – subject to technical review", "غير مؤكد – يخضع للمراجعة الفنية")}</span></li>
                  </ul></section>
              )}
              {chosen.map((s) => (
                <section key={s.key} className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-sm font-bold text-text">{pickBi(lang, s.nameEn, s.nameAr)}</h4>
                  <div className="grid gap-3 sm:grid-cols-2"><ul className="flex flex-col gap-1 text-xs text-text">{pickList(lang, s.included).map((x) => <li key={x} className="flex gap-1.5"><Check size={13} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />{x}</li>)}</ul>
                  <ul className="flex flex-col gap-1 text-xs text-text-muted">{pickList(lang, s.notIncluded).map((x) => <li key={x}>— {x}</li>)}</ul></div></section>
              ))}
              <section className="rounded-xl border border-card-border p-3"><h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">{t("Terms and notes", "الشروط والملاحظات")}</h4><ul className="flex flex-col gap-1 text-xs text-text-muted">{pickList(lang, config.terms).map((x) => <li key={x}>— {x}</li>)}</ul></section>
              <p className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-100"><AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />{bi(config.estimateNotice)}</p>
              <div className="lg:hidden">{summary}</div>
            </div>
          )}

          {calcError && step >= 4 && step <= 7 && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{calcError}</p>}
          {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            {step > 1 && <button type="button" onClick={() => goto(step - 1)} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text">{t("Back", "رجوع")}</button>}
            {step < 9 && <button type="button" onClick={next} disabled={uploading !== null} className="osta-btn-primary ms-auto flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{t("Continue", "متابعة")}<ArrowRight size={16} className="rtl:rotate-180" aria-hidden /></button>}
            {step === 9 && <button type="button" onClick={() => void generate()} disabled={busy || !calc} aria-busy={busy} className="osta-btn-primary ms-auto flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <FileText size={16} aria-hidden />}{busy ? t("Generating…", "جارٍ الإنشاء…") : token ? t("Save changes & update quotation", "حفظ التعديلات وتحديث العرض") : t("Generate Quotation", "إنشاء عرض السعر")}</button>}
          </div>
        </div>
        <div className={step === 9 ? "hidden lg:block" : ""}><div className="lg:sticky lg:top-2">{summary}</div></div>
      </div>
    </div>
  );
}

export { Calculator };

// The block on the page: the systems, rates and notices, then the calculator. Both are filled from the administrator's price list.
export function DuctQuoteCalculatorBlock({ p, config }: { p: P; config: DuctConfig | null }) {
  if (!config) return null;
  // The calculator has its own English / Arabic switch, so its heading and text are kept in both languages (not the page's language).
  const h = (p.heading ?? {}) as Partial<BiText>, sub = (p.subtitle ?? {}) as Partial<BiText>;
  const heading: BiText = { en: h.en || "HVAC Ductwork – Smart Quotation Calculator", ar: h.ar || "حاسبة عروض أسعار تصنيع وتركيب الدكت" };
  const subtitle: BiText = { en: sub.en ?? "", ar: sub.ar ?? "" };
  const rates = config.systems.map(fromRate).filter((x): x is number => x != null);
  const schema = {
    "@context": "https://schema.org", "@type": "Service", name: "HVAC Ductwork Fabrication & Installation", serviceType: "HVAC duct fabrication and installation",
    areaServed: { "@type": "Country", name: "United Arab Emirates" }, provider: { "@type": "Organization", name: "Osta Services", url: "https://www.ostaservices.com" },
    ...(rates.length ? { offers: { "@type": "AggregateOffer", priceCurrency: "AED", lowPrice: Math.min(...rates), highPrice: Math.max(...rates), offerCount: rates.length } } : {}),
  };
  return (
    <section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      {p.showSystems !== "no" && <Pricing config={config} />}
      <div id="duct-quote-calculator" className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-12">
        <Calculator config={config} defaultLang={p.defaultLang === "ar" ? "ar" : "en"} heading={heading} subtitle={subtitle} />
      </div>
    </section>
  );
}
