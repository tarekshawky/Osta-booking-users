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
import { api, InvoiceDetail } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoiceDetailPage() {
  const { ready } = useRequireAuth();
  const { token } = useAuth();
  const params = useParams<{ id: string }>();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payNote, setPayNote] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    api
      .invoice(token, params.id)
      .then(setInvoice)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load invoice"));
  }, [ready, token, params.id]);

  if (!ready) return <FullPageSpinner />;

  const subtotal = invoice?.items?.length
    ? invoice.items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
    : invoice?.amount ?? 0;
  const vat = invoice ? invoice.amount - subtotal : 0;

  return (
    <AppShell>
      <TopBar title="Invoice Details" back />

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
            <p className="mb-2 text-xs font-semibold text-text-muted">Services</p>
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
                  <p className="text-text-muted">AED {(item.qty * item.unitPrice).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="osta-card p-4">
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-text-muted">Subtotal</span>
              <span className="text-text">AED {subtotal.toFixed(2)}</span>
            </div>
            {vat > 0 && (
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-text-muted">VAT</span>
                <span className="text-text">AED {vat.toFixed(2)}</span>
              </div>
            )}
            {invoice.refundedAmount > 0 && (
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-text-muted">Refunded</span>
                <span className="text-emerald-400">- AED {invoice.refundedAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-card-border pt-2">
              <span className="text-sm font-semibold text-text">Total Amount Due</span>
              <span className="text-base font-bold text-accent-2">AED {invoice.amount.toFixed(2)}</span>
            </div>
          </div>

          {invoice.warrantyUntil && (
            <p className="text-center text-xs text-text-faint">
              Warranty valid until {formatDate(invoice.warrantyUntil)}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2 print:hidden">
            {invoice.status !== "Paid" && invoice.status !== "Refunded" && (
              <>
                <button
                  onClick={() => setPayNote(true)}
                  className="osta-btn-primary rounded-xl py-3 text-sm font-semibold text-white"
                >
                  Pay Invoice
                </button>
                {payNote && (
                  <p className="text-center text-xs text-text-muted">
                    Online payment isn&apos;t available yet — please contact OSTA Services support to settle this
                    invoice.
                  </p>
                )}
              </>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 rounded-xl border border-card-border py-3 text-sm font-medium text-text"
            >
              <Download size={16} /> Download Invoice
            </button>
          </div>

          <div className="hidden print:block">
            <Logo size="lg" />
          </div>
        </div>
      )}
    </AppShell>
  );
}
