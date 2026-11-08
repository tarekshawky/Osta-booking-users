"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Download, FileText, HardHat, ClipboardList, Loader2, MessageCircle } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { Calculator } from "@/components/cms/DuctCalculator";
import { api, ApiError, downloadAgreementPdf, ductQuotePdfPath, type DuctConfig, type DuctQuoteStatus, type DuctQuoteView, type DuctRequestType } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { whatsappHref } from "@/lib/site";

const STATUS: Record<DuctQuoteStatus, { en: string; ar: string; tone: string }> = {
  Draft: { en: "Draft", ar: "مسودة", tone: "bg-slate-500/20 text-slate-200" }, Generated: { en: "Generated", ar: "تم الإنشاء", tone: "bg-sky-400/20 text-sky-200" },
  Submitted: { en: "Sent to Osta", ar: "تم الإرسال إلى اسطا", tone: "bg-amber-400/20 text-amber-200" }, "Under Review": { en: "Under review", ar: "قيد المراجعة", tone: "bg-violet-400/20 text-violet-200" },
  "Under Technical Review": { en: "Under technical review", ar: "قيد المراجعة الفنية", tone: "bg-violet-400/20 text-violet-200" },
  "Site Inspection Required": { en: "Site inspection required", ar: "مطلوب معاينة الموقع", tone: "bg-orange-400/20 text-orange-200" }, Revised: { en: "Revised", ar: "نسخة معدّلة", tone: "bg-indigo-400/20 text-indigo-200" },
  Sent: { en: "Sent to you", ar: "تم إرساله إليك", tone: "bg-blue-400/20 text-blue-200" }, Accepted: { en: "Approved", ar: "تم الاعتماد", tone: "bg-emerald-400/20 text-emerald-200" },
  Rejected: { en: "Not approved", ar: "غير معتمد", tone: "bg-rose-400/20 text-rose-200" }, Expired: { en: "Expired", ar: "منتهي الصلاحية", tone: "bg-zinc-500/20 text-zinc-300" },
  "Converted to Order": { en: "Converted", ar: "تم التحويل", tone: "bg-teal-400/20 text-teal-200" }, "Converted to Project": { en: "Converted to a project", ar: "تم تحويله إلى مشروع", tone: "bg-teal-400/20 text-teal-200" },
};
const MODE: Record<string, { en: string; ar: string }> = {
  "supply-fabricate-install": { en: "Supply & Fabrication & Installation", ar: "توريد وتصنيع وتركيب" }, "fabricate-supply": { en: "Fabrication & Supply Only", ar: "تصنيع وتوريد فقط" },
  "install-only": { en: "Installation Only", ar: "تركيب فقط" }, custom: { en: "Custom Project Requirement", ar: "متطلبات مشروع خاصة" },
};
const REQUESTS: { type: DuctRequestType; en: string; ar: string; done: { en: string; ar: string }; icon: typeof HardHat }[] = [
  { type: "inspection", en: "Request Site Inspection", ar: "طلب معاينة الموقع", icon: HardHat, done: { en: "We received your request for a site inspection. Our team will contact you to arrange it. This does not confirm an appointment.", ar: "استلمنا طلب معاينة الموقع. سيتواصل معك فريقنا لترتيبها. هذا لا يعني تأكيد الموعد." } },
  { type: "final", en: "Request Final Quotation", ar: "طلب عرض السعر النهائي", icon: ClipboardList, done: { en: "We received your request for the final quotation. Our team will review the details and send it to you.", ar: "استلمنا طلب عرض السعر النهائي. سيراجع فريقنا التفاصيل ويرسله إليك." } },
  { type: "inquiry", en: "Submit Project Inquiry", ar: "إرسال استفسار عن المشروع", icon: FileText, done: { en: "Your project inquiry was sent to Osta. Our team will review it and contact you.", ar: "تم إرسال استفسارك عن المشروع إلى اسطا. سيراجعه فريقنا ويتواصل معك." } },
];

const money = (n: number | null, lang: "en" | "ar") => (n == null ? (lang === "ar" ? "عرض سعر" : "Quotation") : lang === "ar" ? `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} د.إ` : `AED ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
const date = (iso: string, lang: "en" | "ar") => new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Dubai" });

export function DuctQuoteClient({ token }: { token: string }) {
  const { lang } = useLanguage();
  const { settings } = useSite();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const [v, setV] = useState<DuctQuoteView | null>(null);
  const [config, setConfig] = useState<DuctConfig | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "error" | "ok">("loading");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    Promise.all([api.ductQuoteView(token), api.ductQuoteConfig().catch(() => null)])
      .then(([view, cfg]) => { if (live) { setV(view); setConfig(cfg); setState("ok"); } })
      .catch((e) => { if (live) setState(e instanceof ApiError && e.status === 404 ? "missing" : "error"); });
    return () => { live = false; };
  }, [token, reload]);

  async function pdf(l: "en" | "ar" | "both") {
    if (!v) return;
    setBusy(true); setMsg(null);
    try { await downloadAgreementPdf(ductQuotePdfPath(token, l), null, `${v.number}.pdf`); } catch { setMsg(t("The PDF could not be prepared. Please try again.", "تعذر تجهيز ملف PDF. حاول مرة أخرى.")); } finally { setBusy(false); }
  }
  async function request(type: DuctRequestType) {
    setBusy(true); setMsg(null); setNote(null);
    try { await api.ductQuoteSubmit(token, type); setNote((lang === "ar" ? REQUESTS.find((r) => r.type === type)!.done.ar : REQUESTS.find((r) => r.type === type)!.done.en)); setReload((n) => n + 1); }
    catch (e) { setMsg(e instanceof ApiError ? e.message : t("Something went wrong. Please try again.", "حدث خطأ ما. حاول مرة أخرى.")); }
    finally { setBusy(false); }
  }

  const label = (l: { labelEn: string; labelAr: string }) => (lang === "ar" ? l.labelAr || l.labelEn : l.labelEn);
  const detail = (l: { detailEn: string; detailAr: string }) => (lang === "ar" ? l.detailAr || l.detailEn : l.detailEn);
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        {state === "loading" && <p className="flex items-center justify-center gap-2 py-20 text-text-muted"><Loader2 className="animate-spin" size={18} aria-hidden />{t("Loading your quotation…", "جارٍ تحميل عرض السعر…")}</p>}
        {state === "missing" && <p className="osta-card p-8 text-center text-text-muted">{t("This link is not valid. Please use the link you saved, or contact us.", "هذا الرابط غير صالح. يرجى استخدام الرابط الذي حفظته أو التواصل معنا.")}</p>}
        {state === "error" && <p className="osta-card p-8 text-center text-text-muted">{t("We could not load your quotation. Please try again in a moment.", "تعذر تحميل عرض السعر. حاول مرة أخرى بعد قليل.")}</p>}
        {state === "ok" && v && editing && config && <Calculator config={config} defaultLang={v.lang} heading={{ en: "Edit your quotation", ar: "تعديل عرض السعر" }} subtitle={{ en: "", ar: "" }} edit={{ token, view: v }} />}
        {state === "ok" && v && !editing && (
          <div className="flex flex-col gap-5">
            <div className="osta-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="flex items-center gap-2 text-xl font-extrabold text-text"><FileText size={20} className="text-accent-2" aria-hidden />{t("HVAC Ductwork Quotation", "عرض سعر تصنيع وتركيب الدكت")}</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS[v.status].tone}`}>{lang === "ar" ? STATUS[v.status].ar : STATUS[v.status].en}</span>
              </div>
              <p className="mt-1 text-xs text-text-muted"><span dir="ltr">{v.number}</span> · v{v.version} · {t("valid until", "صالح حتى")} {date(v.expiresAt, lang)}</p>
              <p className="mt-2 text-sm text-text">{v.project.projectName ? `${v.project.projectName} · ` : ""}{v.project.siteAddress}</p>
            </div>
            {v.status === "Rejected" && v.rejectionReason && <p className="osta-card p-4 text-sm text-text">{v.rejectionReason}</p>}
            {v.status === "Accepted" && <p className="osta-card border-emerald-400/40 p-4 text-sm text-text">{t("Your quotation has been approved. Our team will contact you to agree the next steps.", "تم اعتماد عرض السعر. سيتواصل معك فريقنا للاتفاق على الخطوات التالية.")}</p>}
            {v.status === "Expired" && <p className="osta-card border-amber-400/40 p-4 text-sm text-text">{t("This quotation has expired. Edit it to get a new one with today's prices, or contact us.", "انتهت صلاحية عرض السعر. عدّله للحصول على عرض جديد بأسعار اليوم أو تواصل معنا.")}</p>}

            <div className="osta-card overflow-x-auto p-4">
              <h2 className="mb-2 text-sm font-bold text-text">{t("Duct sections", "مقاطع الدكت")} · <span dir="ltr">{v.totals.totalArea} m²</span></h2>
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="border-b border-card-border text-xs text-text-muted"><th className="py-2 text-start">{t("System", "النظام")}</th><th className="py-2 text-start">{t("Details", "التفاصيل")}</th><th className="py-2 text-end">{t("Area (m²)", "المساحة (م²)")}</th></tr></thead>
                <tbody>{v.sections.map((s) => {
                  const sys = v.systems.find((x) => x.key === s.system);
                  return <tr key={s.id} className="border-b border-card-border/60"><td className="py-2 text-text">{sys ? (lang === "ar" ? sys.nameAr : sys.nameEn) : s.system}<div className="text-xs text-text-muted">{(MODE[s.mode] ?? { en: s.mode, ar: s.mode })[lang]}</div></td>
                    <td className="py-2 text-xs text-text-muted" dir="ltr">{s.method === "area" ? `${s.sections ?? 1} section(s)` : s.method === "rect" ? `${s.widthMm}×${s.heightMm} mm · ${s.lengthM} m × ${s.qty}` : `Ø${s.diameterMm} mm · ${s.lengthM} m × ${s.qty}`}{s.description ? ` · ${s.description}` : ""}</td>
                    <td className="py-2 text-end font-medium text-text" dir="ltr">{s.areaM2}</td></tr>;
                })}</tbody>
              </table>
            </div>

            <div className="osta-card overflow-x-auto p-4">
              <table className="w-full min-w-[560px] text-sm">
                <thead><tr className="border-b border-card-border text-xs text-text-muted"><th className="py-2 text-start">{t("Description", "الوصف")}</th><th className="py-2 text-start">{t("Qty", "الكمية")}</th><th className="py-2 text-end">{t("Unit price", "سعر الوحدة")}</th><th className="py-2 text-end">{t("Amount", "المبلغ")}</th></tr></thead>
                <tbody>{v.lines.map((l) => <tr key={l.id} className="border-b border-card-border/60"><td className="py-2 text-text">{label(l)}{detail(l) && <div className="text-xs text-text-muted">{detail(l)}</div>}</td><td className="py-2 text-text" dir="ltr">{l.qty} {l.unit === "m2" ? "m²" : l.unit}</td><td className="py-2 text-end text-text">{l.unitPrice == null ? <span className="text-amber-300">{t("Quotation", "عرض سعر")}</span> : money(l.unitPrice, lang)}</td><td className="py-2 text-end font-medium text-text">{l.amount == null ? <span className="text-amber-300">{t("Quotation", "عرض سعر")}</span> : `${l.kind === "discount" ? "− " : ""}${money(l.amount, lang)}`}</td></tr>)}</tbody>
              </table>
              <dl className="ms-auto mt-4 grid max-w-sm grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                <dt className="text-text-muted">{t("Ductwork", "الدكت")}</dt><dd className="text-text">{money(v.totals.ductSubtotal, lang)}</dd>
                <dt className="text-text-muted">{t("Accessories", "الإكسسوارات")}</dt><dd className="text-text">{money(v.totals.accessoriesSubtotal, lang)}</dd>
                <dt className="text-text-muted">{t("Additional services", "الخدمات الإضافية")}</dt><dd className="text-text">{money(v.totals.servicesSubtotal, lang)}</dd>
                {v.totals.discount > 0 && <><dt className="text-text-muted">{t("Discount", "الخصم")}</dt><dd className="text-text">− {money(v.totals.discount, lang)}</dd></>}
                <dt className="text-text-muted">{t("Subtotal", "المجموع قبل الضريبة")}</dt><dd className="text-text">{money(v.totals.subtotal, lang)}</dd>
                <dt className="text-text-muted">{t(`VAT ${v.totals.vatPercent}%`, `ضريبة القيمة المضافة ${v.totals.vatPercent}%`)}</dt><dd className="text-text">{money(v.totals.vat, lang)}</dd>
                <dt className="font-bold text-text">{t("Grand total", "الإجمالي")}</dt><dd className="text-lg font-extrabold text-text">{money(v.totals.total, lang)}</dd>
              </dl>
              {v.totals.rfq && <p className="mt-3 text-xs text-amber-200">{t("Items marked “Quotation” are not in the total and will be priced after technical review.", "البنود المعلّمة «عرض سعر» غير مشمولة في الإجمالي وسيتم تسعيرها بعد المراجعة الفنية.")}</p>}
            </div>

            {v.specRows.length > 0 && (
              <div className="osta-card p-4"><h2 className="mb-2 text-sm font-bold text-text">{t("Technical specifications", "المواصفات الفنية")}</h2>
                <ul className="flex flex-col gap-1 text-sm">{v.specRows.map((r, i) => <li key={i} className="flex flex-wrap justify-between gap-2"><span className="text-text-muted">{lang === "ar" ? r.labelAr : r.labelEn}</span><span className={r.confirmed ? "text-text" : "text-violet-300"}>{lang === "ar" ? r.valueAr : r.valueEn}</span></li>)}</ul></div>
            )}
            <p className="flex items-start gap-2 text-xs text-amber-100"><AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />{lang === "ar" ? v.estimateNotice.ar : v.estimateNotice.en}</p>
            <p className="text-xs text-text-muted">{lang === "ar" ? v.straightDuctNote.ar : v.straightDuctNote.en}</p>

            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={() => void pdf(lang)} className="osta-btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Download size={16} aria-hidden />{t("Download PDF", "تحميل PDF")}</button>
              <button type="button" disabled={busy} onClick={() => void pdf(lang === "ar" ? "en" : "ar")} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text disabled:opacity-60">{lang === "ar" ? "PDF (English)" : "PDF (العربية)"}</button>
              <button type="button" disabled={busy} onClick={() => void pdf("both")} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text disabled:opacity-60">{t("PDF (English + Arabic)", "PDF (إنجليزي + عربي)")}</button>
              {v.canEdit && config && <button type="button" onClick={() => setEditing(true)} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text">{t("Edit Quotation", "تعديل عرض السعر")}</button>}
            </div>
            {(v.canSubmit || v.status === "Submitted") && (
              <div className="grid gap-2 sm:grid-cols-3">
                {REQUESTS.map((r) => { const Icon = r.icon; return <button key={r.type} type="button" disabled={busy || (v.status === "Submitted" && v.requestType === r.type)} onClick={() => void request(r.type)} className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text disabled:opacity-60"><Icon size={16} aria-hidden />{lang === "ar" ? r.ar : r.en}</button>; })}
              </div>
            )}
            <a href={whatsappHref(settings, lang, t(`Hello Osta, about ductwork quotation ${v.number}.`, `مرحباً اسطا، بخصوص عرض سعر الدكت ${v.number}.`))} target="_blank" rel="noreferrer" className="flex items-center gap-2 self-start rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text"><MessageCircle size={16} aria-hidden />{t("Contact via WhatsApp", "التواصل عبر واتساب")}</a>
            {!v.canEdit && v.manual && <p className="text-xs text-text-muted">{t("Our team has revised this quotation, so it can only be changed by contacting us.", "قام فريقنا بتعديل عرض السعر، لذلك لا يمكن تغييره إلا بالتواصل معنا.")}</p>}
            {note && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{note}</p>}
            {msg && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{msg}</p>}
          </div>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
