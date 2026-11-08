"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, FileText, Loader2 } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { agreementPdfPath, api, ApiError, downloadAgreementPdf, type AgreementView } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { whatsappHref } from "@/lib/site";
import { STATUS_TEXT, STATUS_TONE, clauseBlocks, dateText, money } from "@/lib/agreementText";

// The customer's own agreement page (opened from the email or WhatsApp link, no sign-in): what they agreed to, where it stands, and the
// one thing that is waiting for them (accepting a new version, or paying).
export function AgreementClient({ token }: { token: string }) {
  const { lang } = useLanguage();
  const { settings } = useSite();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const [v, setV] = useState<AgreementView | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "error" | "ok">("loading");
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false, false]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    api.agreement(token).then((r) => { if (live) { setV(r); setState("ok"); } }).catch((e) => { if (live) setState(e instanceof ApiError && e.status === 404 ? "missing" : "error"); });
    return () => { live = false; };
  }, [token, reload]);

  const pick = (en: string, ar: string) => (lang === "ar" ? ar || en : en || ar);
  const wa = whatsappHref(settings, lang);

  async function accept() {
    if (busy || !checks.every(Boolean)) return;
    setBusy(true); setMsg(null);
    try { await api.acceptAgreement(token, checks); setChecks([false, false, false, false, false]); setReload((n) => n + 1); }
    catch (e) { setMsg(e instanceof ApiError ? e.message : t("Something went wrong. Please try again.", "حدث خطأ ما. حاول مرة أخرى.")); }
    finally { setBusy(false); }
  }
  async function pdf() {
    if (!v) return;
    setBusy(true); setMsg(null);
    try { await downloadAgreementPdf(agreementPdfPath(token), null, `${v.number}.pdf`); }
    catch (e) { setMsg(e instanceof Error ? e.message : t("The PDF could not be prepared.", "تعذر تجهيز الملف.")); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        {state === "loading" && <p className="flex items-center justify-center gap-2 py-20 text-text-muted"><Loader2 className="animate-spin" size={18} aria-hidden />{t("Loading your agreement…", "جارٍ تحميل اتفاقيتك…")}</p>}
        {state === "missing" && <p className="osta-card p-8 text-center text-text-muted">{t("This link is not valid. Please use the link from your latest message, or contact us.", "هذا الرابط غير صالح. يرجى استخدام الرابط من آخر رسالة وصلتك أو التواصل معنا.")}</p>}
        {state === "error" && <p className="osta-card p-8 text-center text-text-muted">{t("We could not load your agreement. Please try again in a moment.", "تعذر تحميل اتفاقيتك. حاول مرة أخرى بعد قليل.")}</p>}
        {state === "ok" && v && (
          <div className="flex flex-col gap-5">
            <div className="osta-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="flex items-center gap-2 text-xl font-extrabold text-text"><FileText size={20} className="text-accent-2" aria-hidden />{t("Maintenance Service Agreement", "اتفاقية خدمات الصيانة")}</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[v.status]}`}>{pick(STATUS_TEXT[v.status].en, STATUS_TEXT[v.status].ar)}</span>
              </div>
              <p className="mt-1 text-xs text-text-muted" dir="ltr" style={{ textAlign: lang === "ar" ? "right" : "left" }}>{v.number} · {v.requestNumber}{v.version > 1 ? ` · v${v.version}` : ""}</p>
            </div>

            {v.needsAcceptance && (
              <div className="osta-card border-accent/50 p-5">
                <p className="mb-1 font-bold text-text">{t("Please review and accept this agreement", "يرجى مراجعة هذه الاتفاقية والموافقة عليها")}</p>
                {v.note && <p className="mb-3 rounded-lg bg-accent/10 p-3 text-sm text-text">{v.note}</p>}
                <p className="mb-3 text-xs text-text-muted">{t("Nothing changes until you accept. Read the agreement below, tick each statement and press Accept.", "لن يتغير شيء قبل موافقتك. اقرأ الاتفاقية أدناه، ووافق على كل إقرار ثم اضغط موافقة.")}</p>
                <div className="flex flex-col gap-2">
                  {v.checks.map((c, i) => (
                    <label key={i} className="flex cursor-pointer items-start gap-2.5 text-xs text-text">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#087bff]" checked={checks[i]} onChange={(e) => setChecks((x) => x.map((y, j) => (j === i ? e.target.checked : y)))} />
                      <span>{pick(c.en, c.ar)}</span>
                    </label>
                  ))}
                </div>
                <button type="button" onClick={() => void accept()} disabled={busy || !checks.every(Boolean)} className="osta-btn-primary mt-4 rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? t("Please wait…", "يرجى الانتظار…") : t("Accept the agreement", "الموافقة على الاتفاقية")}</button>
              </div>
            )}
            {v.status === "PENDING_APPROVAL" && <p className="osta-card p-4 text-sm text-text"><CheckCircle2 size={16} className="me-2 inline text-emerald-400" aria-hidden />{t("Thank you. Your agreement is with our team for approval. We will send you a secure payment link as soon as it is approved.", "شكراً لك. اتفاقيتك لدى فريقنا للاعتماد. سنرسل لك رابط دفع آمن فور اعتمادها.")}</p>}
            {v.status === "CHANGES_REQUESTED" && <div className="osta-card border-orange-400/40 p-4 text-sm text-text"><p className="font-bold">{t("We need a change before we can approve this agreement:", "نحتاج إلى تعديل قبل اعتماد هذه الاتفاقية:")}</p><p className="mt-1">{v.note}</p>{wa && <a href={wa} className="mt-2 inline-block text-xs font-semibold text-accent-2 underline">{t("Reply on WhatsApp", "الرد عبر واتساب")}</a>}</div>}
            {v.awaitingPayment && (
              <div className="osta-card border-sky-400/40 p-5">
                <p className="font-bold text-text">{t("Approved – please complete your payment", "تم الاعتماد – يرجى إتمام الدفع")}</p>
                <p className="mt-1 text-2xl font-extrabold text-accent-2">{money(v.pricing.total, lang)}</p>
                <p className="mt-2 text-sm text-text-muted">{t("Your agreement is activated once our team confirms your payment.", "تُفعَّل اتفاقيتك بعد أن يؤكد فريقنا استلام دفعتك.")}</p>
                {v.paymentInstructions && pick(v.paymentInstructions.en, v.paymentInstructions.ar) && <p className="mt-3 whitespace-pre-line rounded-lg bg-bg p-3 text-sm text-text">{pick(v.paymentInstructions.en, v.paymentInstructions.ar)}</p>}
                {wa && <a href={wa} className="mt-3 inline-block text-xs font-semibold text-accent-2 underline">{t("Questions about payment? WhatsApp us", "أسئلة عن الدفع؟ راسلنا على واتساب")}</a>}
              </div>
            )}
            {(v.status === "ACTIVE" || v.status === "EXPIRED") && (
              <div className="osta-card border-emerald-400/40 p-5 text-sm text-text">
                <p className="font-bold"><CheckCircle2 size={16} className="me-2 inline text-emerald-400" aria-hidden />{v.status === "ACTIVE" ? t("Your agreement is active", "اتفاقيتك مفعّلة") : t("This agreement has expired", "انتهت صلاحية هذه الاتفاقية")}</p>
                <p className="mt-1 text-text-muted">{t(`Valid from ${dateText(v.activationDate, lang)} to ${dateText(v.expiryDate, lang)}.`, `سارية من ${dateText(v.activationDate, lang)} إلى ${dateText(v.expiryDate, lang)}.`)}</p>
                <Link href="/agreements" className="mt-2 inline-block text-xs font-semibold text-accent-2 underline">{t("Sign in to download your final agreement (PDF)", "سجّل الدخول لتنزيل اتفاقيتك النهائية (PDF)")}</Link>
              </div>
            )}
            {v.status === "SUSPENDED" && (
              <div className="osta-card border-orange-400/40 p-5 text-sm text-text">
                <p className="font-bold">{t("This agreement is on hold (not active)", "هذه الاتفاقية موقوفة مؤقتاً (غير مفعّلة)")}</p>
                {v.note && <p className="mt-1 text-text-muted">{v.note}</p>}
                <p className="mt-1 text-text-muted">{t("Services not yet carried out are on hold until it is reactivated. Please contact us to resolve it.", "الخدمات التي لم تُنفَّذ بعد معلّقة إلى حين إعادة تفعيلها. يرجى التواصل معنا لحل الأمر.")}</p>
                {wa && <a href={wa} className="mt-2 inline-block text-xs font-semibold text-accent-2 underline">{t("Contact us on WhatsApp", "تواصل معنا عبر واتساب")}</a>}
              </div>
            )}
            {(v.status === "REJECTED" || v.status === "CANCELLED") && <p className="osta-card p-4 text-sm text-text">{v.status === "REJECTED" ? t("We could not approve this request.", "لم نتمكن من اعتماد هذا الطلب.") : t("This agreement was cancelled.", "تم إلغاء هذه الاتفاقية.")}{v.rejectionReason ? ` ${v.rejectionReason}` : ""}</p>}

            <div className="osta-card p-5 text-sm">
              <h2 className="mb-2 font-bold text-text">{t("Your package", "باقتك")}</h2>
              <p className="font-semibold text-text">{pick(v.packageEn, v.packageAr)}</p>
              <ul className="mt-2 list-disc ps-5 text-text-muted">{v.lines.map((l, i) => <li key={i}>{pick(l.serviceEn, l.serviceAr)}: <b className="text-text">{pick(l.quantityEn, l.quantityAr)}</b></li>)}</ul>
              {v.extras.length > 0 && <><h3 className="mb-1 mt-3 font-semibold text-text">{t("Additional services", "الخدمات الإضافية")}</h3><ul className="list-disc ps-5 text-text-muted">{v.extras.map((e, i) => <li key={i}>{pick(e.labelEn, e.labelAr)} × {e.qty}: <b className="text-text">{e.included ? t("Included", "مشمول") : e.amount == null ? t("Quotation", "عرض سعر") : money(e.amount, lang)}</b></li>)}</ul></>}
              <p className="mt-3 text-text-muted">{t("Property", "العقار")}: <span className="text-text">{[v.property.type, v.property.emirate, v.property.area, v.property.address].filter(Boolean).join("، ")}</span></p>
              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-card-border pt-3">
                <dt className="text-text-muted">{t("Package price", "سعر الباقة")}</dt><dd className="text-text">{money(v.pricing.packagePrice, lang)}</dd>
                <dt className="text-text-muted">{t("Additional services", "الخدمات الإضافية")}</dt><dd className="text-text">{money(v.pricing.additional, lang)}</dd>
                {v.pricing.discount > 0 && <><dt className="text-text-muted">{t("Discounts", "الخصومات")}</dt><dd className="text-text">- {money(v.pricing.discount, lang)}</dd></>}
                <dt className="text-text-muted">{v.pricing.pricesIncludeVat ? t(`VAT ${v.pricing.vatPercent}% (included)`, `ضريبة القيمة المضافة ${v.pricing.vatPercent}% (مشمولة)`) : t(`VAT ${v.pricing.vatPercent}%`, `ضريبة القيمة المضافة ${v.pricing.vatPercent}%`)}</dt><dd className="text-text">{money(v.pricing.vat, lang)}</dd>
                <dt className="font-bold text-text">{t("Total", "الإجمالي")}</dt><dd className="text-lg font-extrabold text-text">{v.pricing.quote ? t("To be quoted", "بعرض سعر") : money(v.pricing.total, lang)}</dd>
              </dl>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={() => void pdf()} className="flex items-center gap-2 rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text disabled:opacity-60"><Download size={16} aria-hidden />{t("Download the agreement (PDF)", "تنزيل الاتفاقية (PDF)")}</button>
              <button type="button" onClick={() => setOpen((x) => !x)} aria-expanded={open} className="rounded-xl border border-card-border px-5 py-2.5 text-sm font-semibold text-text">{open ? t("Hide terms & conditions", "إخفاء الشروط والأحكام") : t("Read the terms & conditions", "قراءة الشروط والأحكام")}</button>
            </div>
            {msg && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{msg}</p>}
            {open && (
              <div className="osta-card p-5 text-sm leading-relaxed text-text-muted">
                <p className="mb-3 text-xs text-text-faint">{t(`Terms version ${v.termsVersion}`, `إصدار الشروط ${v.termsVersion}`)}</p>
                {v.clauses.map((c, i) => (
                  <div key={c.key} className="mb-4">
                    <p className="font-bold text-text">{i + 1}. {pick(c.titleEn, c.titleAr)}</p>
                    {clauseBlocks(pick(c.bodyEn, c.bodyAr)).map((b, bi) => (<div key={bi}>{b.text && <p className="mt-1">{b.text}</p>}{b.bullets.length > 0 && <ul className="mt-1 list-disc ps-5">{b.bullets.map((x, xi) => <li key={xi}>{x}</li>)}</ul>}</div>))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
