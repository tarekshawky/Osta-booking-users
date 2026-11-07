"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useLanguage } from "@/lib/language-context";
import { api, downloadAgreementPdf, myContractPdfPath, type MyContract } from "@/lib/api";
import { STATUS_TEXT, STATUS_TONE, dateText, money } from "@/lib/agreementText";

// The signed-in customer's agreements: where each stands, and the PDF (the final one once it is paid and activated).
export default function AgreementsPage() {
  const { ready } = useRequireAuth();
  const { token } = useAuth();
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const [rows, setRows] = useState<MyContract[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    api.myContracts(token).then(setRows).catch((e) => setError(e instanceof Error ? e.message : t("Could not load your agreements.", "تعذر تحميل اتفاقياتك.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  async function download(c: MyContract) {
    setBusyId(c.id); setError(null);
    try { await downloadAgreementPdf(myContractPdfPath(c.id), token, `${c.number}.pdf`); }
    catch (e) { setError(e instanceof Error ? e.message : t("The PDF could not be prepared.", "تعذر تجهيز الملف.")); }
    finally { setBusyId(null); }
  }

  if (!ready) return <FullPageSpinner />;
  return (
    <AppShell>
      <TopBar title={t("My Agreements", "اتفاقياتي")} />
      {error && <p className="mx-5 mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">{error}</p>}
      <div className="flex flex-1 flex-col gap-3 px-5 py-5">
        {rows === null ? <FullPageSpinner /> : rows.length === 0 ? (
          <p className="osta-card p-6 text-center text-sm text-text-muted">{t("You have no agreements yet. When you subscribe to a maintenance package, your agreement appears here.", "ليس لديك اتفاقيات بعد. عند اشتراكك في باقة صيانة ستظهر اتفاقيتك هنا.")}</p>
        ) : rows.map((c) => (
          <div key={c.id} className="osta-card flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-text"><FileText size={16} className="text-accent-2" aria-hidden /><span dir="ltr">{c.number}</span></span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_TONE[c.status]}`}>{lang === "ar" ? STATUS_TEXT[c.status].ar : STATUS_TEXT[c.status].en}</span>
            </div>
            <p className="text-sm text-text">{lang === "ar" ? c.packageAr || c.packageEn : c.packageEn}</p>
            <div className="flex items-center justify-between text-xs text-text-muted"><span>{c.status === "ACTIVE" || c.status === "EXPIRED" ? `${dateText(c.activationDate, lang)} → ${dateText(c.expiryDate, lang)}` : dateText(c.createdAt, lang)}</span><span className="text-sm font-semibold text-accent-2">{money(c.total, lang)}</span></div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" disabled={busyId === c.id} onClick={() => void download(c)} className="flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold text-text disabled:opacity-60"><Download size={14} aria-hidden />{busyId === c.id ? t("Preparing…", "جارٍ التجهيز…") : c.status === "ACTIVE" || c.status === "EXPIRED" ? t("Download final agreement (PDF)", "تنزيل الاتفاقية النهائية (PDF)") : t("Download draft (PDF)", "تنزيل المسودة (PDF)")}</button>
              {c.accessToken && <Link href={`/agreement/${c.accessToken}`} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">{c.status === "DRAFT" ? t("Review & accept", "مراجعة وموافقة") : t("Payment details", "تفاصيل الدفع")}</Link>}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
