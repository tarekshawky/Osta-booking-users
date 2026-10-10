"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";
import { api, Order } from "@/lib/api";

const FILTERS: { value: string; key: TranslationKey }[] = [
  { value: "All", key: "orders.filterAll" },
  { value: "Requested", key: "status.Requested" },
  { value: "Assigned", key: "status.Assigned" },
  { value: "On The Way", key: "status.On The Way" as TranslationKey },
  { value: "In Progress", key: "status.In Progress" as TranslationKey },
  { value: "Done", key: "status.Done" },
  { value: "Cancelled", key: "status.Cancelled" },
];

export default function OrdersPage() {
  const { ready } = useRequireAuth();
  const { token } = useAuth();
  const { t, lang } = useLanguage();

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(iso: string | null) {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-AE" : "en-AE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    Promise.resolve().then(async () => {
      setOrders(null);
      try {
        const res = await api.orders(token, { pageSize: 50, status: filter === "All" ? undefined : filter });
        setOrders(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("orders.failedToLoad"));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, filter]);

  if (!ready) return <FullPageSpinner />;

  return (
    <AppShell>
      <TopBar
        title={t("orders.title")}
        right={
          <Link href="/orders/new" aria-label={t("orders.bookService")} className="rounded-full p-1.5 text-accent-2">
            <Plus size={20} />
          </Link>
        }
      />

      <div className="osta-scrollbar-none flex gap-2 overflow-x-auto px-5 py-3">
        {FILTERS.map(({ value, key }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
              filter === value
                ? "border-accent bg-accent/15 text-accent-2"
                : "border-card-border text-text-muted"
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {error && (
        <p className="mx-5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="flex flex-1 flex-col gap-3 px-5 pb-6">
        {orders === null ? (
          <FullPageSpinner />
        ) : orders.length === 0 ? (
          <p className="osta-card p-6 text-center text-sm text-text-muted">{t("orders.noOrders")}</p>
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="osta-card flex flex-col gap-1.5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text">{order.number}</span>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-text-muted">{order.orderType}</p>
              <p className="text-xs text-text-faint">
                {formatDate(order.scheduledAt ?? order.date)}
                {formatTime(order.scheduledAt) ? ` · ${formatTime(order.scheduledAt)}` : ""}
              </p>
              {order.priceAgreed && order.priceAgreed !== "No" && (
                <p className="text-xs font-semibold text-accent-2">
                  {t("common.aed")} {order.priceAgreed}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
