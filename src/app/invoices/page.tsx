"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useLanguage } from "@/lib/language-context";
import { api, Invoice } from "@/lib/api";

export default function InvoicesPage() {
  const { ready } = useRequireAuth();
  const { token } = useAuth();
  const { t, lang } = useLanguage();

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    api
      .invoices(token, { pageSize: 50 })
      .then((res) => setInvoices(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : t("invoices.failedToLoad")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  if (!ready) return <FullPageSpinner />;

  return (
    <AppShell>
      <TopBar title={t("invoices.title")} />

      {error && (
        <p className="mx-5 mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="flex flex-1 flex-col gap-3 px-5 py-5">
        {invoices === null ? (
          <FullPageSpinner />
        ) : invoices.length === 0 ? (
          <p className="osta-card p-6 text-center text-sm text-text-muted">{t("invoices.noInvoices")}</p>
        ) : (
          invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="osta-card flex flex-col gap-1.5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text">{inv.number}</span>
                <StatusBadge status={inv.status} />
              </div>
              <p className="text-xs text-text-muted">{formatDate(inv.date)}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-faint">{inv.serviceType}</p>
                <p className="text-sm font-semibold text-accent-2">
                  {t("common.aed")} {inv.amount.toFixed(2)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
