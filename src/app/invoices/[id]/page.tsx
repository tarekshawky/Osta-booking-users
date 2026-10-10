"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { StatusBadge } from "@/components/StatusBadge";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useLanguage } from "@/lib/language-context";
import { api, InvoiceDetail } from "@/lib/api";

export default function InvoiceDetailPage() {
  const { ready } = useRequireAuth();
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payNote, setPayNote] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    api
      .invoice(token, params.id)
      .then(setInvoice)
      .catch((err) => setError(err instanceof Error ? err.message : t("invoiceDetail.failedToLoad")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, params.id]);

  if (!ready) return <FullPageSpinner />;

  const subtotal = invoice?.items?.length
    ? invoice.items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
    : invoice?.amount ?? 0;
  const vat = invoice ? invoice.amount - subtotal : 0;
  const aed = t("common.aed");

  return (
    <AppShell>
      <TopBar title={t("invoiceDetail.title")} back />

      {error && (
        <p className="mx-5 mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      {!invoice ? (
        <FullPageSpinner />
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-5 py-5" id="invoice-print">
          <div className="osta-card flex items-start justify-between p-4">
            <div>
              <p className="text-lg font-bold text-text">{invoice.number}</p>
              <p className="text-xs text-text-muted">{formatDate(invoice.date)}</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="osta-card p-4">
            <p className="mb-2 text-xs font-semibold text-text-muted">{t("invoiceDetail.services")}</p>
            <div className="divide-y divide-card-border">
              {(invoice.items?.length
                ? invoice.items
                : [{ serviceName: invoice.serviceType, description: null, qty: 1, unitPrice: subtotal }]
              ).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="text-text">
                      {item.qty} × {item.serviceName}
                    </p>
                    {item.description && <p className="text-xs text-text-faint">{item.description}</p>}
                  </div>
                  <p className="text-text-muted">
                    {aed} {(item.qty * item.unitPrice).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="osta-card p-4">
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-text-muted">{t("invoiceDetail.subtotal")}</span>
              <span className="text-text">
                {aed} {subtotal.toFixed(2)}
              </span>
            </div>
            {vat > 0 && (
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-text-muted">{t("invoiceDetail.vat")}</span>
                <span className="text-text">
                  {aed} {vat.toFixed(2)}
                </span>
              </div>
            )}
            {invoice.refundedAmount > 0 && (
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-text-muted">{t("invoiceDetail.refunded")}</span>
                <span className="text-emerald-400">
                  - {aed} {invoice.refundedAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-card-border pt-2">
              <span className="text-sm font-semibold text-text">{t("invoiceDetail.totalDue")}</span>
              <span className="text-base font-bold text-accent-2">
                {aed} {invoice.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {invoice.warrantyUntil && (
            <p className="text-center text-xs text-text-faint">
              {t("invoiceDetail.warrantyUntil")} {formatDate(invoice.warrantyUntil)}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2 print:hidden">
            {invoice.status !== "Paid" && invoice.status !== "Refunded" && (
              <>
                <button
                  onClick={() => setPayNote(true)}
                  className="osta-btn-primary rounded-xl py-3 text-sm font-semibold text-white"
                >
                  {t("invoiceDetail.payInvoice")}
                </button>
                {payNote && <p className="text-center text-xs text-text-muted">{t("invoiceDetail.payNote")}</p>}
              </>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 rounded-xl border border-card-border py-3 text-sm font-medium text-text"
            >
              <Download size={16} /> {t("invoiceDetail.download")}
            </button>
          </div>

          <div className="osta-invoice-print-logo hidden print:block">
            <Logo size="lg" />
          </div>
        </div>
      )}
    </AppShell>
  );
}
