"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2, MessageCircle } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { Calculator } from "@/components/cms/SplitCalculator";
import { api, ApiError, downloadAgreementPdf, splitQuotePdfPath, type DuctQuoteStatus, type SplitConfig, type SplitQuoteView } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { whatsappHref } from "@/lib/site";

const STATUS: Partial<Record<DuctQuoteStatus, { en: string; ar: string; tone: string }>> = {
  Draft: { en: "Draft", ar: "مسودة", tone: "bg-slate-500/20 text-slate-200" }, Generated: { en: "Generated", ar: "تم الإنشاء", tone: "bg-sky-400/20 text-sky-200" },
  Submitted: { en: "Booking requested", ar: "تم طلب الحجز", tone: "bg-amber-400/20 text-amber-200" }, Revised: { en: "Revised", ar: "نسخة معدّلة", tone: "bg-indigo-400/20 text-indigo-200" },
  Sent: { en: "Sent to you", ar: "تم إرساله إليك", tone: "bg-blue-400/20 text-blue-200" }, Accepted: { en: "Approved", ar: "تم الاعتماد", tone: "bg-emerald-400/20 text-emerald-200" },
  Rejected: { en: "Not approved", ar: "غير معتمد", tone: "bg-rose-400/20 text-rose-200" }, Expired: { en: "Expired", ar: "منتهي الصلاحية", tone: "bg-zinc-500/20 text-zinc-300" },
  "Converted to Order": { en: "Booked as a service order", ar: "تم تحويله إلى طلب خدمة", tone: "bg-teal-400/20 text-teal-200" },
};

const money = (n: number | null, lang: "en" | "ar") => (n == null ? (lang === "ar" ? "عرض سعر" : "Quotation") : lang === "ar" ? `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} د.إ` : `AED ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
const date = (iso: string, lang: "en" | "ar") => new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Dubai" });

export function SplitQuoteClient({ token }: { token: string }) {
  const { lang } = useLanguage();
  const { settings } = useSite();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const [v, setV] = useState<SplitQuoteView | null>(null);
  const [config, setConfig] = useState<SplitConfig | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "error" | "ok">("loading");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    Promise.all([api.splitQuoteView(token), api.splitQuoteConfig().catch(() => null)])
      .then(([view, cfg]) => { if (live) { setV(view); setConfig(cfg); setState("ok"); } })
      .catch((e) => { if (live) setState(e instanceof ApiError && e.status === 404 ? "missing" : "error"); });
    return () => { live = false; };
  }, [token, reload]);

  async function pdf(l: "en" | "ar" | "both") {
    if (!v) return;
    setBusy(true); setMsg(null);
    try { await downloadAgreementPdf(splitQuotePdfPath(token, l), null, `${v.number}.pdf`); } catch { setMsg(t("The PDF could not be prepared. Please try again.", "تعذر تجهيز ملف PDF. حاول مرة أخرى.")); } finally { setBusy(false); }
  }
  async function book() {
    setBusy(true); setMsg(null); setNote(null);
    try { await api.splitQuoteBook(token); setNote(t("We received your booking request. This does not confirm an appointment: our team will review it and confirm the date with you.", "استلمنا طلب الحجز. هذا لا يعني تأكيد الموعد: سيراجعه فريقنا ويؤكد التاريخ معك.")); setReload((n) => n + 1); }
    catch (e) { setMsg(e instanceof ApiError ? e.message : t("Something went wrong. Please try again.", "حدث خطأ ما. حاول مرة أخرى.")); }
    finally { setBusy(false); }
  }

  const label = (l: { labelEn: string; labelAr: string }) => (lang === "ar" ? l.labelAr || l.labelEn : l.labelEn);
  const st = v ? STATUS[v.status] ?? { en: v.status, ar: v.status, tone: "bg-slate-500/20 text-slate-200" } : null;
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        {state === "loading" && <p className="flex items-center justify-center gap-2 py-20 text-text-muted"><Loader2 className="animate-spin" size={18} aria-hidden />{t("Loading your quotation…", "جارٍ تحميل عرض السعر…")}</p>}
        {state === "missing" && <p className="osta-card p-8 text-center text-text-muted">{t("This link is not valid. Please use the link you saved, or contact us.", "هذا الرابط غير صالح. يرجى استخدام الرابط الذي حفظته أو التواصل معنا.")}</p>}
        {state === "error" && <p className="osta-card p-8 text-center text-text-muted">{t("We could not load your quotation. Please try again in a moment.", "تعذر تحميل عرض السعر. حاول مرة أخرى بعد قليل.")}</p>}
        {state === "ok" && v && editing && config && <Calculator config={config} defaultLang={v.lang} heading={{ en: "Edit your quotation", ar: "تعديل عرض السعر" }} subtitle={{ en: "", ar: "" }} edit={{ token, view: v }} />}
        {state === "ok" && v && st && !editing && (
          <div className="flex flex-col gap-5">
            <div className="osta-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="flex items-center gap-2 text-xl font-extrabold text-text"><FileText size={20} className="text-accent-2" aria-hidden />{t("Split AC Installation Quotation", "عرض سعر تركيب مكيف سبليت")}</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.tone}`}>{lang === "ar" ? st.ar : st.en}</span>
              </div>
              <p className="mt-1 text-xs text-text-muted"><span dir="ltr">{v.number}</span> · v{v.version} · {t("valid until", "صالح حتى")} {date(v.expiresAt, lang)}</p>
              <p className="mt-2 text-sm text-text">{v.project.address}</p>
            </div>
            {v.status === "Rejected" && v.rejectionReason && <p className="osta-card p-4 text-sm text-text">{v.rejectionReason}</p>}
            {v.status === "Accepted" && <p className="osta-card border-emerald-400/40 p-4 text-sm text-text">{t("Your quotation has been approved. Our team will contact you to confirm the installation appointment.", "تم اعتماد عرض السعر. سيتواصل معك فريقنا لتأكيد موعد التركيب.")}</p>}
            {v.status === "Expired" && <p className="osta-card border-amber-400/40 p-4 text-sm text-text">{t("This quotation has expired. Edit it to get a new one with today's prices, or contact us.", "انتهت صلاحية عرض السعر. عدّله للحصول على عرض جديد بأسعار اليوم أو تواصل معنا.")}</p>}

            <div className="osta-card overflow-x-auto p-4">
              <table className="w-full min-w-[620px] text-sm">
                <thead><tr className="border-b border-card-border text-xs text-text-muted"><th className="py-2 text-start">{t("Description", "الوصف")}</th><th className="py-2 text-start">{t("Package", "الباقة")}</th><th className="py-2 text-start">{t("AC Capacity", "السعة")}</th><th className="py-2 text-start">{t("Qty", "الكمية")}</th><th className="py-2 text-end">{t("Unit price", "سعر الوحدة")}</th><th className="py-2 text-end">{t("Total", "الإجمالي")}</th></tr></thead>
                <tbody>{v.lines.map((l) => <tr key={l.id} className="border-b border-card-border/60"><td className="py-2 text-text">{label(l)}{l.kind !== "unit" && (lang === "ar" ? l.detailAr || l.detailEn : l.detailEn) && <div className="text-xs text-text-muted">{lang === "ar" ? l.detailAr || l.detailEn : l.detailEn}</div>}</td><td className="py-2 text-text-muted">{l.kind === "unit" ? (lang === "ar" ? l.packageAr : l.packageEn) : "—"}</td><td className="py-2 text-text-muted">{l.kind === "unit" ? (lang === "ar" ? l.capacityAr : l.capacityEn) : "—"}</td><td className="py-2 text-text" dir="ltr">{l.qty}</td><td className="py-2 text-end text-text">{l.unitPrice == null ? <span className="text-amber-300">{t("Quotation", "عرض سعر")}</span> : money(l.unitPrice, lang)}</td><td className="py-2 text-end font-medium text-text">{l.amount == null ? <span className="text-amber-300">{t("Quotation", "عرض سعر")}</span> : `${l.kind === "discount" ? "− " : ""}${money(l.amount, lang)}`}</td></tr>)}</tbody>
              </table>
              <dl className="ms-auto mt-4 grid max-w-sm grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                <dt className="text-text-muted">{t("AC installation", "تركيب المكيفات")}</dt><dd className="text-text">{money(v.totals.unitsTotal, lang)}</dd>
                <dt className="text-text-muted">{t("Additional services", "الخدمات الإضافية")}</dt><dd className="text-text">{money(v.totals.servicesTotal, lang)}</dd>
                {v.totals.discount > 0 && <><dt className="text-text-muted">{t("Discount", "الخصم")}</dt><dd className="text-text">− {money(v.totals.discount, lang)}</dd></>}
                <dt className="text-text-muted">{t("Total before VAT", "الإجمالي قبل الضريبة")}</dt><dd className="text-text">{money(v.totals.subtotal, lang)}</dd>
                <dt className="text-text-muted">{t(`VAT ${v.totals.vatPercent}%`, `ضريبة القيمة المضافة ${v.totals.vatPercent}%`)}</dt><dd className="text-text">{money(v.totals.vat, lang)}</dd>
                <dt className="font-bold text-text">{t("Grand Total", "الإجمالي الكلي")}</dt><dd className="text-lg font-extrabold text-text">{money(v.totals.total, lang)}</dd>
              </dl>
              {v.totals.rfq && <p className="mt-3 text-xs text-amber-200">{t("Items marked “Quotation” are not in the total and will be priced after review.", "البنود المعلّمة «عرض سعر» غير مشمولة في الإجمالي وسيتم تسعيرها بعد المراجعة.")}</p>}
            </div>
            <p className="text-xs text-text-muted">{lang === "ar" ? v.disclaimer.ar : v.disclaimer.en}</p>

            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={() => void pdf(lang)} className="osta-btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Download size={16} aria-hidden />{t("Download PDF", "تحميل PDF")}</button>
              <button type="button" disabled={busy} onClick={() => void pdf(lang === "ar" ? "en" : "ar")} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text disabled:opacity-60">{lang === "ar" ? "PDF (English)" : "PDF (العربية)"}</button>
              <button type="button" disabled={busy} onClick={() => void pdf("both")} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text disabled:opacity-60">{t("PDF (English + Arabic)", "PDF (إنجليزي + عربي)")}</button>
              {v.canEdit && config && <button type="button" onClick={() => setEditing(true)} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text">{t("Edit Quotation", "تعديل عرض السعر")}</button>}
              {v.canBook && <button type="button" disabled={busy} onClick={() => void book()} className="rounded-xl border border-accent px-5 py-2.5 text-sm font-semibold text-accent-2 disabled:opacity-60">{t("Request Booking", "طلب الحجز")}</button>}
              <a href={whatsappHref(settings, lang, t(`Hello Osta, about split AC quotation ${v.number}.`, `مرحباً اسطا، بخصوص عرض سعر تركيب مكيف سبليت ${v.number}.`))} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text"><MessageCircle size={16} aria-hidden />{t("Contact via WhatsApp", "التواصل عبر واتساب")}</a>
            </div>
            {!v.canEdit && v.manual && <p className="text-xs text-text-muted">{t("Our team has revised this quotation, so it can only be changed by contacting us.", "قام فريقنا بتعديل عرض السعر، لذلك لا يمكن تغييره إلا بالتواصل معنا.")}</p>}
            {(note || v.bookRequested) && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{note ?? t("We have your booking request. Our team will review it and confirm the date with you.", "لدينا طلب الحجز. سيراجعه فريقنا ويؤكد التاريخ معك.")}</p>}
            {msg && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{msg}</p>}
          </div>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
