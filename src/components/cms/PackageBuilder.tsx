"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Download, FileText, Sparkles, X } from "lucide-react";
import { agreementPdfPath, api, ApiError, downloadAgreementPdf, type AgreementTerms, type BuilderEvaluation, type BuilderNeeds, type BuilderSubmitResult, type MaintenanceData, type MaintenancePackage } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

type Lang = "en" | "ar";
const EMIRATES: [string, string][] = [["Abu Dhabi", "أبوظبي"], ["Dubai", "دبي"], ["Sharjah", "الشارقة"], ["Ajman", "عجمان"], ["Al Ain", "العين"], ["Umm Al Quwain", "أم القيوين"], ["Ras Al Khaimah", "رأس الخيمة"], ["Fujairah", "الفجيرة"]];

const money = (n: number, lang: Lang) => {
  const v = n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return lang === "ar" ? `${v} د.إ` : `AED ${v}`;
};
const num = (v: string) => (v.trim() === "" ? 0 : Math.max(0, Math.floor(Number(v)) || 0));

// The Smart Package Builder: a guided form in four steps (details, requirements, customise, review). While the customer fills it in, the
// server compares what they need with what each package really includes and answers with upgrade suggestions and a live price. The
// customer's package is never changed unless they press an upgrade button, and every upgrade shows its price difference first.
export function PackageBuilder({ data, group, initialId, nameOf, onClose }: { data: MaintenanceData; group: string; initialId: string; nameOf: (p: MaintenancePackage) => string; onClose: () => void }) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const cfg = data.builder!.config;
  const options = data.builder!.options;
  const packages = data.packages;
  const pick = (en: string, ar: string) => (lang === "ar" ? ar || en : en || ar);

  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState(initialId);
  const [chosenId, setChosenId] = useState(initialId);
  const [f, setF] = useState({ name: "", phone: "", whatsapp: "", email: "", emirate: "Dubai", area: "", address: "", type: cfg.propertyTypes[0]?.key ?? "", bedrooms: "", bathrooms: "", floors: "", size: "", activationDate: "", notes: "" });
  const [needs, setNeeds] = useState<BuilderNeeds>({ acUnits: 0, handymanHours: 0, optionIds: [], extras: {}, otherText: "" });
  const [acText, setAcText] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [ev, setEv] = useState<BuilderEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { quote: boolean; contract?: BuilderSubmitResult["contract"] }>(null);
  // The Maintenance Service Agreement: its text is fetched when the customer reaches the review step; all five statements must be ticked to confirm.
  const [terms, setTerms] = useState<AgreementTerms | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false, false]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const allChecked = checks.every(Boolean);
  const top = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const chosen = packages.find((p) => p.id === chosenId) ?? packages[0];
  const selected = packages.find((p) => p.id === selectedId) ?? packages[0];
  const mode = (k: keyof typeof cfg.fields) => cfg.fields[k];

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, [onClose]);

  // Live comparison with the packages, a moment after the customer stops changing something.
  const needsKey = JSON.stringify([selectedId, chosenId, needs]);
  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(() => {
      api.evaluateBuilder({ group, selectedId, chosenId, needs }).then((r) => { if (live) setEv(r); }).catch(() => { if (live) setEv(null); });
    }, 350);
    return () => { live = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsKey, group]);

  useEffect(() => {
    if (step !== 4 || terms) return;
    api.agreementTerms(group).then(setTerms).catch(() => undefined);
  }, [step, group, terms]);

  const goto = (n: number) => { setError(null); setStep(n); window.setTimeout(() => top.current?.scrollIntoView({ block: "start" }), 0); };

  function stepOneProblem(): string | null {
    const digits = f.phone.replace(/\D/g, "");
    if (f.name.trim().length < 2) return t("Enter your full name.", "أدخل اسمك الكامل.");
    if (digits.length < 8 || digits.length > 15) return t("Enter a valid mobile number.", "أدخل رقم جوال صحيحاً.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return t("Enter a valid email address.", "أدخل بريداً إلكترونياً صحيحاً.");
    const need = (m: string, v: string) => m === "required" && !v.trim();
    if (need(mode("whatsapp"), f.whatsapp) || need(mode("area"), f.area) || need(mode("address"), f.address) || need(mode("bedrooms"), f.bedrooms) || need(mode("bathrooms"), f.bathrooms) || need(mode("floors"), f.floors) || need(mode("size"), f.size) || (mode("acUnits") === "required" && !acText.trim()))
      return t("Please fill in the required details.", "يرجى تعبئة البيانات المطلوبة.");
    if (f.activationDate && f.activationDate < today) return t("The date cannot be in the past.", "لا يمكن أن يكون التاريخ في الماضي.");
    return null;
  }

  function next() {
    if (step === 1) { const p = stepOneProblem(); if (p) return setError(p); }
    goto(step + 1);
  }

  async function submit(wantsQuote: boolean) {
    if (busy) return;
    if (!wantsQuote && !allChecked) return setError(t("Please read the agreement and tick every statement to confirm your subscription.", "يرجى قراءة الاتفاقية والموافقة على جميع الإقرارات لتأكيد اشتراكك."));
    setBusy(true);
    setError(null);
    try {
      const res = await api.submitBuilder({
        group, selectedId, chosenId, needs, notes: f.notes, activationDate: f.activationDate, wantsQuote,
        ...(wantsQuote ? {} : { agreement: { accepted: checks, lang } }),
        customer: { name: f.name.trim(), phone: f.phone, whatsapp: f.whatsapp, email: f.email.trim(), emirate: f.emirate, area: f.area.trim(), address: f.address.trim() },
        property: { type: f.type, bedrooms: num(f.bedrooms), bathrooms: num(f.bathrooms), floors: num(f.floors), size: Number(f.size) || 0 },
      });
      setDone({ quote: res.quoteRequested, contract: res.contract });
    } catch (err) {
      setError(err instanceof ApiError && [400, 404, 429].includes(err.status) ? err.message : t("Something went wrong. Please try again, or contact us on WhatsApp.", "حدث خطأ ما. حاول مرة أخرى أو تواصل معنا عبر واتساب."));
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-xl border border-card-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent";
  const lab = "flex flex-col gap-1.5 text-xs font-medium text-text-muted";
  const steps = [t("Details", "البيانات"), t("Requirements", "الاحتياجات"), t("Customize", "التخصيص"), t("Review", "المراجعة")];
  const pkgById = (id: string | null) => packages.find((p) => p.id === id);

  // Upgrade suggestions the customer has not set aside.
  const notices = (ev?.notices ?? []).filter((n) => !dismissed.includes(`${selectedId}:${n.kind}:${n.optionId ?? ""}`));
  const rec = ev?.recommendation && !dismissed.includes(`${selectedId}:rec`) ? ev.recommendation : null;
  const upgraded = chosenId !== selectedId;

  const advice = ev && (
    <div className="flex flex-col gap-3" aria-live="polite">
      {upgraded && chosen && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          <CheckCircle2 size={16} aria-hidden />
          <span>{t(`Upgraded to ${nameOf(chosen)}`, `تمت الترقية إلى ${nameOf(chosen)}`)}{chosen.price != null && selected.price != null ? ` (+${money(chosen.price - selected.price, lang)})` : ""}</span>
          <button type="button" onClick={() => setChosenId(selectedId)} className="ms-auto text-xs font-semibold underline">{t("Go back to my package", "العودة إلى باقتي")}</button>
        </div>
      )}
      {!upgraded && notices.map((n) => {
        const up = pkgById(n.upgradeTo);
        return (
          <div key={`${n.kind}:${n.optionId ?? ""}`} className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100">
            <p className="flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />{lang === "ar" ? n.ar : n.en}</p>
            {up && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => setChosenId(up.id)} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-900">{t(`Upgrade to ${nameOf(up)}`, `الترقية إلى ${nameOf(up)}`)}{up.price != null && selected.price != null ? ` (+${money(up.price - selected.price, lang)})` : ""}</button>
                <button type="button" onClick={() => setDismissed((d) => [...d, `${selectedId}:${n.kind}:${n.optionId ?? ""}`])} className="rounded-lg border border-amber-300/60 px-3 py-1.5 text-xs font-semibold">{t("Continue with Current Package", "الاستمرار بالباقة الحالية")}</button>
              </div>
            )}
          </div>
        );
      })}
      {!upgraded && ev.exceeds && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100"><p className="flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />{lang === "ar" ? ev.exceeds.ar : ev.exceeds.en}</p></div>
      )}
      {!upgraded && rec && ev.best && pkgById(rec.packageId) && (
        <div className="rounded-xl border border-accent/50 bg-accent/10 p-4 text-sm text-text">
          <p className="mb-2 flex items-start gap-2 font-semibold"><Sparkles size={16} className="mt-0.5 shrink-0 text-accent-2" aria-hidden />{lang === "ar" ? ev.best.ar : ev.best.en}</p>
          <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-text-muted">
            <dt>{t("Current package", "الباقة الحالية")}</dt><dd className="text-text">{nameOf(selected)}{selected.price != null ? ` — ${money(selected.price, lang)}` : ""}</dd>
            <dt>{t("Suggested package", "الباقة المقترحة")}</dt><dd className="text-text">{nameOf(pkgById(rec.packageId)!)}{pkgById(rec.packageId)!.price != null ? ` — ${money(pkgById(rec.packageId)!.price!, lang)}` : ` — ${t("custom quotation", "عرض سعر مخصص")}`}</dd>
            <dt>{t("Price difference", "فرق السعر")}</dt><dd className="font-semibold text-text">{rec.priceDiff != null ? `+${money(rec.priceDiff, lang)}` : t("By quotation", "حسب عرض السعر")}</dd>
            {rec.acCovers != null && (<><dt>{t("AC units covered", "المكيفات المغطاة")}</dt><dd className="text-text">{t(`Up to ${rec.acCovers}`, `حتى ${rec.acCovers}`)}</dd></>)}
            {rec.addedServices.length > 0 && (<><dt>{t("You also get", "ستحصل أيضاً على")}</dt><dd className="text-text">{rec.addedServices.map((s) => pick(s.en, s.ar)).join("، ")}</dd></>)}
          </dl>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setChosenId(rec.packageId)} className="osta-btn-primary rounded-lg px-4 py-2 text-xs font-semibold text-white">{t("Upgrade Package", "ترقية الباقة")}</button>
            <button type="button" onClick={() => setDismissed((d) => [...d, `${selectedId}:rec`, ...(ev.notices.map((n) => `${selectedId}:${n.kind}:${n.optionId ?? ""}`))])} className="rounded-lg border border-card-border px-4 py-2 text-xs font-semibold text-text">{t("Continue with Current Package", "الاستمرار بالباقة الحالية")}</button>
          </div>
        </div>
      )}
    </div>
  );

  const b = ev?.breakdown;
  const summary = cfg.calculator && (
    <aside className="rounded-xl border border-card-border bg-bg-elevated p-4 text-sm" aria-label={t("Price summary", "ملخص السعر")}>
      <p className="mb-2 font-bold text-text">{t("Price summary", "ملخص السعر")}</p>
      <dl className="flex flex-col gap-1.5">
        <div className="flex justify-between gap-3"><dt className="text-text-muted">{t("Selected package", "الباقة المختارة")}</dt><dd className="text-end font-medium text-text">{chosen ? nameOf(chosen) : "—"}</dd></div>
        {b?.lines.map((l) => (
          <div key={l.key} className="flex justify-between gap-3">
            <dt className="text-text-muted">{l.key === "base" ? t("Base annual price", "السعر السنوي الأساسي") : `${pick(l.labelEn, l.labelAr)}${l.qty > 1 ? ` × ${l.qty}` : ""}`}</dt>
            <dd className="text-end text-text">{l.note === "included" ? <span className="text-emerald-400">{t("Included", "مشمول")}</span> : l.amount == null ? <span className="text-amber-300">{t("Quotation", "عرض سعر")}</span> : money(l.amount, lang)}</dd>
          </div>
        ))}
        {b && (
          <>
            <div className="mt-1 flex justify-between gap-3 border-t border-card-border pt-2"><dt className="text-text-muted">{t("Subtotal", "المجموع الفرعي")}</dt><dd className="text-text">{money(b.subtotal, lang)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-text-muted">{b.pricesIncludeVat ? t(`VAT ${b.vatPercent}% (included)`, `ضريبة القيمة المضافة ${b.vatPercent}% (مشمولة)`) : t(`VAT ${b.vatPercent}%`, `ضريبة القيمة المضافة ${b.vatPercent}%`)}</dt><dd className="text-text">{money(b.vat, lang)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-card-border pt-2 text-base font-extrabold"><dt className="text-text">{b.quote ? t("Estimated total*", "الإجمالي التقديري*") : t("Total", "الإجمالي")}</dt><dd className="text-text">{money(b.total, lang)}</dd></div>
          </>
        )}
      </dl>
      {b?.quote && <p className="mt-2 text-xs text-amber-200">{t("* Items with no fixed price are not included. They will be sent to us as a quotation request.", "* البنود التي ليس لها سعر ثابت غير مشمولة، وسترسل إلينا كطلب عرض سعر.")}</p>}
      {!b && <p className="text-xs text-text-muted">{t("Calculating…", "جارٍ الحساب…")}</p>}
    </aside>
  );

  if (done) {
    return (
      <Shell title={t("Choose Package", "اختر الباقة")} onClose={onClose} topRef={top}>
        <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
          <CheckCircle2 size={48} className="text-emerald-500" aria-hidden />
          <p className="text-xl font-bold text-text">{t("Thank you! We received your request.", "شكراً لك! استلمنا طلبك.")}</p>
          <p className="max-w-md text-sm text-text-muted">{done.quote ? t("Our team will review your requirements and send you a quotation.", "سيراجع فريقنا احتياجاتك ويرسل لك عرض السعر.") : done.contract ? t("Your agreement is pending approval. We emailed you the draft agreement. Once our team approves it, you will receive a secure payment link to activate your package.", "اتفاقيتك بانتظار الاعتماد. أرسلنا لك مسودة الاتفاقية بالبريد الإلكتروني. بعد اعتماد فريقنا لها ستصلك رسالة برابط دفع آمن لتفعيل باقتك.") : t("Our team will contact you soon to confirm the details and activate your package.", "سيتواصل معك فريقنا قريباً لتأكيد التفاصيل وتفعيل باقتك.")}</p>
          {done.contract && (
            <div className="osta-card w-full max-w-sm p-4 text-sm">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-start">
                <dt className="text-text-muted">{t("Agreement No.", "رقم الاتفاقية")}</dt><dd className="font-semibold text-text" dir="ltr">{done.contract.number}</dd>
                <dt className="text-text-muted">{t("Request No.", "رقم الطلب")}</dt><dd className="font-semibold text-text" dir="ltr">{done.contract.requestNumber}</dd>
                <dt className="text-text-muted">{t("Status", "الحالة")}</dt><dd className="text-amber-300">{t("Pending approval", "بانتظار الاعتماد")}</dd>
              </dl>
              <button type="button" disabled={pdfBusy} onClick={() => { setPdfBusy(true); downloadAgreementPdf(agreementPdfPath(done.contract!.url.split("/").pop() ?? ""), null, `${done.contract!.number}.pdf`).catch(() => setError(t("The PDF could not be prepared. Please try again.", "تعذر تجهيز ملف PDF. حاول مرة أخرى."))).finally(() => setPdfBusy(false)); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-card-border px-4 py-2 text-xs font-semibold text-text disabled:opacity-60"><Download size={14} aria-hidden />{pdfBusy ? t("Preparing…", "جارٍ التجهيز…") : t("Download draft agreement (PDF)", "تنزيل مسودة الاتفاقية (PDF)")}</button>
              <a href={`/agreement/${done.contract.url.split("/").pop()}`} className="mt-2 block text-center text-xs font-semibold text-accent-2 underline">{t("Track your agreement", "تابع اتفاقيتك")}</a>
              {error && <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}
            </div>
          )}
          <button type="button" onClick={onClose} className="osta-btn-primary mt-2 rounded-xl px-8 py-3 text-sm font-semibold text-white">{t("Close", "إغلاق")}</button>
        </div>
      </Shell>
    );
  }

  const byCategory = cfg.categories.map((c) => ({ c, items: options.filter((o) => o.category === c.key) })).filter((x) => x.items.length > 0);
  const extraKinds = cfg.extras.filter((x) => x.enabled);
  const selectedOptionNames = options.filter((o) => needs.optionIds.includes(o.id)).map((o) => pick(o.nameEn, o.nameAr));
  const propertyName = (() => { const p = cfg.propertyTypes.find((x) => x.key === f.type); return p ? pick(p.en, p.ar) : ""; })();

  return (
    <Shell title={t("Choose Package", "اختر الباقة")} onClose={onClose} topRef={top}>
      <ol className="mb-5 flex items-center gap-2 text-xs" aria-label={t("Steps", "الخطوات")}>
        {steps.map((s, i) => (
          <li key={s} className={`flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 ${step === i + 1 ? "bg-accent/20 font-bold text-text" : i + 1 < step ? "text-emerald-400" : "text-text-faint"}`} aria-current={step === i + 1 ? "step" : undefined}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${i + 1 < step ? "bg-emerald-500 text-white" : "bg-card-border text-text"}`}>{i + 1 < step ? <Check size={12} aria-hidden /> : i + 1}</span>
            <span className="hidden sm:inline">{s}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`${lab} sm:col-span-2`}>{t("Selected Package", "الباقة المختارة")}
                <select className={input} value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setChosenId(e.target.value); setDismissed([]); }}>{packages.map((p) => <option key={p.id} value={p.id}>{nameOf(p)}</option>)}</select>
              </label>
              <p className="text-sm font-semibold text-text sm:col-span-2">{t("Customer Information", "بيانات العميل")}</p>
              <label className={lab}>{t("Full Name", "الاسم الكامل")}<input className={input} autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
              <label className={lab}>{t("Mobile Number", "رقم الهاتف")}<input className={input} type="tel" dir="ltr" autoComplete="tel" placeholder="+971 50 123 4567" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></label>
              {mode("whatsapp") !== "off" && <label className={lab}>{t("WhatsApp Number", "رقم الواتساب")}<input className={input} type="tel" dir="ltr" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></label>}
              <label className={lab}>{t("Email Address", "البريد الإلكتروني")}<input className={input} type="email" dir="ltr" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
              <label className={lab}>{t("Emirate", "الإمارة")}<select className={input} value={f.emirate} onChange={(e) => set("emirate", e.target.value)}>{EMIRATES.map(([en, ar]) => <option key={en} value={en}>{lang === "ar" ? ar : en}</option>)}</select></label>
              {mode("area") !== "off" && <label className={lab}>{t("Area", "المنطقة")}<input className={input} value={f.area} onChange={(e) => set("area", e.target.value)} /></label>}
              {mode("address") !== "off" && <label className={`${lab} sm:col-span-2`}>{t("Property Address", "عنوان العقار")}<input className={input} autoComplete="street-address" value={f.address} onChange={(e) => set("address", e.target.value)} /></label>}
              <p className="mt-2 text-sm font-semibold text-text sm:col-span-2">{t("Property Information", "بيانات العقار")}</p>
              <label className={lab}>{t("Property Type", "نوع العقار")}<select className={input} value={f.type} onChange={(e) => set("type", e.target.value)}>{cfg.propertyTypes.map((p) => <option key={p.key} value={p.key}>{pick(p.en, p.ar)}</option>)}</select></label>
              {mode("bedrooms") !== "off" && <label className={lab}>{t("Number of Bedrooms", "عدد غرف النوم")}<input className={input} type="number" inputMode="numeric" min={0} max={50} dir="ltr" value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} /></label>}
              {mode("bathrooms") !== "off" && <label className={lab}>{t("Number of Bathrooms", "عدد الحمامات")}<input className={input} type="number" inputMode="numeric" min={0} max={50} dir="ltr" value={f.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} /></label>}
              {mode("floors") !== "off" && <label className={lab}>{t("Number of Floors", "عدد الطوابق")}<input className={input} type="number" inputMode="numeric" min={0} max={200} dir="ltr" value={f.floors} onChange={(e) => set("floors", e.target.value)} /></label>}
              {mode("size") !== "off" && <label className={lab}>{t("Property Size (sqm)", "مساحة العقار (م²)")}<input className={input} type="number" inputMode="decimal" min={0} dir="ltr" value={f.size} onChange={(e) => set("size", e.target.value)} /></label>}
              {mode("acUnits") !== "off" && <label className={lab}>{t("Number of AC Units", "عدد المكيفات")}<input className={input} type="number" inputMode="numeric" min={0} max={500} dir="ltr" value={acText} onChange={(e) => { setAcText(e.target.value); setNeeds((n) => ({ ...n, acUnits: num(e.target.value) })); }} /></label>}
              <label className={`${lab} sm:col-span-2`}>{t("Preferred Activation Date (optional)", "تاريخ التفعيل المفضل (اختياري)")}<input className={input} type="date" min={today} dir="ltr" value={f.activationDate} onChange={(e) => set("activationDate", e.target.value)} /></label>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-text-muted">{t("Tick the services you need. We compare them with what each package includes.", "حدد الخدمات التي تحتاجها، وسنقارنها بما تشمله كل باقة.")}</p>
              {byCategory.map(({ c, items }) => (
                <fieldset key={c.key} className="rounded-xl border border-card-border p-4">
                  <legend className="px-2 text-sm font-bold text-text">{pick(c.en, c.ar)}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((o) => (
                      <label key={o.id} className="flex cursor-pointer items-start gap-2.5 text-sm text-text">
                        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#087bff]" checked={needs.optionIds.includes(o.id)} onChange={(e) => setNeeds((n) => ({ ...n, optionIds: e.target.checked ? [...n.optionIds, o.id] : n.optionIds.filter((x) => x !== o.id) }))} />
                        {pick(o.nameEn, o.nameAr)}
                      </label>
                    ))}
                  </div>
                  {c.key === "handyman" && (
                    <label className={`${lab} mt-4 max-w-xs`}>{t("Handyman hours you need", "ساعات الهاندي مان التي تحتاجها")}<input className={input} type="number" inputMode="numeric" min={0} max={500} dir="ltr" value={needs.handymanHours || ""} onChange={(e) => setNeeds((n) => ({ ...n, handymanHours: num(e.target.value) }))} /></label>
                  )}
                </fieldset>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-bold text-text">{t("Customize Your Package", "خصص باقتك")}</p>
              <p className="text-xs text-text-muted">{t("Add things your package does not include. Only approved prices are added to the total; anything else is sent to us as a quotation request.", "أضف ما لا تشمله باقتك. تُضاف إلى الإجمالي الأسعار المعتمدة فقط، وأي شيء آخر يُرسل إلينا كطلب عرض سعر.")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {extraKinds.filter((x) => x.key !== "other").map((x) => (
                  <label key={x.key} className={lab}>{pick(x.nameEn, x.nameAr)}{x.unitPrice != null ? <span className="font-normal text-text-faint"> · {money(x.unitPrice, lang)} {pick(x.unitEn, x.unitAr)}</span> : <span className="font-normal text-text-faint"> · {t("by quotation", "حسب عرض السعر")}</span>}
                    <input className={input} type="number" inputMode="numeric" min={0} max={500} dir="ltr" value={needs.extras[x.key] || ""} onChange={(e) => setNeeds((n) => ({ ...n, extras: { ...n.extras, [x.key]: num(e.target.value) } }))} />
                  </label>
                ))}
              </div>
              <label className={lab}>{t("Other Requirements", "متطلبات أخرى")}<textarea className={`${input} resize-y`} rows={3} maxLength={1000} placeholder={t("Tell us what else your property needs...", "أخبرنا ما المتطلبات الإضافية التي تحتاج إليها في عقارك...")} value={needs.otherText} onChange={(e) => setNeeds((n) => ({ ...n, otherText: e.target.value }))} /></label>
              <label className={lab}>{t("Notes (optional)", "ملاحظات (اختياري)")}<textarea className={`${input} resize-y`} rows={2} maxLength={1000} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4 text-sm">
              <p className="text-base font-bold text-text">{t("Review your request", "راجع طلبك")}</p>
              <Section title={t("Customer Information", "بيانات العميل")} rows={[[t("Name", "الاسم"), f.name], [t("Mobile", "الجوال"), f.phone], [t("WhatsApp", "الواتساب"), f.whatsapp], [t("Email", "البريد"), f.email], [t("Emirate / Area", "الإمارة / المنطقة"), [f.emirate, f.area].filter(Boolean).join(" / ")], [t("Address", "العنوان"), f.address]]} />
              <Section title={t("Property Information", "بيانات العقار")} rows={[[t("Type", "النوع"), propertyName], [t("Bedrooms / Bathrooms / Floors", "الغرف / الحمامات / الطوابق"), [f.bedrooms, f.bathrooms, f.floors].map((x) => x || "—").join(" / ")], [t("Size", "المساحة"), f.size ? `${f.size} m²` : ""], [t("AC Units", "المكيفات"), String(needs.acUnits || "")]]} />
              <Section title={t("Selected Package", "الباقة المختارة")} rows={[[t("Package", "الباقة"), chosen ? nameOf(chosen) : ""], ...(upgraded ? ([[t("Upgraded from", "تمت الترقية من"), nameOf(selected)]] as [string, string][]) : [])]} />
              <Section title={t("Selected Services", "الخدمات المختارة")} rows={[[t("Services", "الخدمات"), selectedOptionNames.join("، ")], [t("Handyman hours", "ساعات الهاندي مان"), needs.handymanHours ? String(needs.handymanHours) : ""]]} />
              <Section title={t("Additional Requirements", "المتطلبات الإضافية")} rows={[...extraKinds.filter((x) => (needs.extras[x.key] ?? 0) > 0).map((x) => [pick(x.nameEn, x.nameAr), String(needs.extras[x.key])] as [string, string]), [t("Other", "أخرى"), needs.otherText], [t("Notes", "ملاحظات"), f.notes]]} />
              {(ev?.notices.length ?? 0) > 0 && !upgraded && (
                <Section title={t("Upgrade Recommendations", "اقتراحات الترقية")} rows={ev!.notices.map((n, i) => [String(i + 1), lang === "ar" ? n.ar : n.en] as [string, string])} />
              )}
              {!b?.quote && (
                <section className="rounded-xl border border-accent/40 bg-accent/5 p-4" aria-label={t("Maintenance Service Agreement", "اتفاقية خدمات الصيانة")}>
                  <h4 className="mb-1 flex items-center gap-2 text-base font-bold text-text"><FileText size={18} className="text-accent-2" aria-hidden />{t("Maintenance Service Agreement", "اتفاقية خدمات الصيانة")}</h4>
                  <p className="mb-3 text-xs text-text-muted">{t("Please read the agreement before you confirm. Once our team approves it you receive a payment link, and the agreement is activated after your payment.", "يرجى قراءة الاتفاقية قبل التأكيد. بعد اعتماد فريقنا لها يصلك رابط الدفع، وتُفعَّل الاتفاقية بعد سدادك.")}</p>
                  <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                    <dt className="text-text-muted">{t("Package", "الباقة")}</dt><dd className="text-text">{chosen ? nameOf(chosen) : ""}</dd>
                    <dt className="text-text-muted">{t("Term", "المدة")}</dt><dd className="text-text">{t(`${terms?.durationMonths ?? 12} months from activation`, `${terms?.durationMonths ?? 12} شهراً من تاريخ التفعيل`)}</dd>
                    {b && <><dt className="text-text-muted">{t("Total contract value", "إجمالي قيمة العقد")}</dt><dd className="font-semibold text-text">{money(b.total, lang)} <span className="font-normal text-text-muted">({b.pricesIncludeVat ? t(`includes ${b.vatPercent}% VAT`, `شامل ضريبة ${b.vatPercent}%`) : t(`plus ${b.vatPercent}% VAT`, `بالإضافة إلى ضريبة ${b.vatPercent}%`)})</span></dd></>}
                    <dt className="text-text-muted">{t("Property", "العقار")}</dt><dd className="text-text">{[propertyName, f.area, f.address].filter(Boolean).join("، ")}</dd>
                    <dt className="text-text-muted">{t("Services outside the package", "خدمات خارج الباقة")}</dt><dd className="text-text">{t("Charged separately, after your approval of a quotation", "تُحتسب برسوم منفصلة بعد موافقتك على عرض السعر")}</dd>
                  </dl>
                  <button type="button" onClick={() => setTermsOpen((v) => !v)} aria-expanded={termsOpen} className="mb-2 rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold text-text">{termsOpen ? t("Hide the agreement", "إخفاء الاتفاقية") : t("Read the full agreement", "قراءة الاتفاقية كاملة")}</button>
                  {termsOpen && (
                    <div className="mb-3 max-h-72 overflow-y-auto rounded-lg border border-card-border bg-bg p-3 text-xs leading-relaxed text-text-muted" tabIndex={0}>
                      {!terms ? <p>{t("Loading…", "جارٍ التحميل…")}</p> : (
                        <>
                          <p className="mb-2 text-[11px] text-text-faint">{terms.company.name} · {terms.company.website} · <span dir="ltr">{terms.company.phone}</span> · {t(`Terms version ${terms.version}`, `إصدار الشروط ${terms.version}`)}</p>
                          {terms.clauses.map((c, i) => (
                            <div key={c.key} className="mb-3">
                              <p className="font-bold text-text">{i + 1}. {pick(c.titleEn, c.titleAr)}</p>
                              {pick(c.bodyEn, c.bodyAr).split(/\n{2,}/).map((blk, bi) => {
                                const lines = blk.split("\n");
                                const bullets = lines.filter((l) => l.startsWith("- "));
                                const rest = lines.filter((l) => !l.startsWith("- ")).join(" ");
                                return (<div key={bi}>{rest && <p className="mt-1">{rest}</p>}{bullets.length > 0 && <ul className="mt-1 list-disc ps-5">{bullets.map((l, li) => <li key={li}>{l.slice(2)}</li>)}</ul>}</div>);
                              })}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {(terms?.checks ?? []).map((c, i) => (
                      <label key={i} className="flex cursor-pointer items-start gap-2.5 text-xs text-text">
                        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#087bff]" checked={checks[i] ?? false} onChange={(e) => setChecks((x) => x.map((v, j) => (j === i ? e.target.checked : v)))} />
                        <span>{pick(c.en, c.ar)}</span>
                      </label>
                    ))}
                    {!terms && <p className="text-xs text-text-muted">{t("Loading the agreement…", "جارٍ تحميل الاتفاقية…")}</p>}
                  </div>
                </section>
              )}
              {b?.quote && <p className="rounded-xl border border-card-border p-3 text-xs text-text-muted">{t("A quotation request does not commit you to anything. When we send you the final price you will be asked to read and accept the agreement.", "طلب عرض السعر لا يلزمك بشيء. عند إرسال السعر النهائي إليك سيُطلب منك قراءة الاتفاقية والموافقة عليها.")}</p>}
              <div className="lg:hidden">{summary}</div>
            </div>
          )}

          {step >= 2 && step <= 3 && advice}
          {step === 4 && !upgraded && advice}
          {step === 1 && ev && mode("acUnits") !== "off" && needs.acUnits > 0 && advice}

          {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            {step > 1 && <button type="button" onClick={() => goto(step - 1)} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text">{step === 4 ? t("Edit My Selection", "تعديل اختياراتي") : t("Back", "رجوع")}</button>}
            {step < 4 && <button type="button" onClick={next} className="osta-btn-primary ms-auto flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white">{t("Continue", "متابعة")}<ArrowRight size={16} className="rtl:rotate-180" aria-hidden /></button>}
            {step === 4 && (
              <div className="ms-auto flex flex-wrap gap-2">
                {!b?.quote && <button type="button" disabled={busy || !allChecked || !terms} aria-busy={busy} title={!allChecked ? t("Tick every statement of the agreement first", "وافق على جميع إقرارات الاتفاقية أولاً") : undefined} onClick={() => void submit(false)} className="osta-btn-primary rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? t("Sending…", "جارٍ الإرسال…") : t("Confirm Subscription", "تأكيد الاشتراك")}</button>}
                <button type="button" disabled={busy} aria-busy={busy} onClick={() => void submit(true)} className={`rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-60 ${b?.quote ? "osta-btn-primary text-white" : "border border-card-border text-text"}`}>{busy ? t("Sending…", "جارٍ الإرسال…") : t("Request a Custom Quotation", "طلب عرض سعر مخصص")}</button>
              </div>
            )}
          </div>
        </div>
        <div className={`${step === 4 ? "hidden lg:block" : ""}`}><div className="lg:sticky lg:top-2">{summary}</div></div>
      </div>
    </Shell>
  );
}

function Section({ title, rows }: { title: string; rows: [string, string][] }) {
  const shown = rows.filter(([, v]) => v && v.trim());
  if (shown.length === 0) return null;
  return (
    <section className="rounded-xl border border-card-border p-3">
      <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">{title}</h4>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {shown.map(([k, v]) => (<div key={k} className="contents"><dt className="text-text-muted">{k}</dt><dd className="text-text">{v}</dd></div>))}
      </dl>
    </section>
  );
}

function Shell({ title, onClose, topRef, children }: { title: string; onClose: () => void; topRef: React.RefObject<HTMLDivElement | null>; children: React.ReactNode }) {
  const { lang } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="osta-card max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-b-none p-5 sm:rounded-b-2xl sm:p-7">
        <div ref={topRef} />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-text">{title}</h3>
          <button type="button" onClick={onClose} aria-label={lang === "ar" ? "إغلاق" : "Close"} className="rounded-lg p-1.5 text-text-muted hover:text-text"><X size={20} aria-hidden /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
