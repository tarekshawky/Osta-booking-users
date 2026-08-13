"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, ClipboardList, Receipt, ChevronRight, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { FullPageSpinner } from "@/components/Spinner";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, Invoice, Order } from "@/lib/api";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const { ready } = useRequireAuth();
  const { token, customer } = useAuth();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [invoicesTotal, setInvoicesTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    Promise.all([api.orders(token, { pageSize: 5 }), api.invoices(token, { pageSize: 50 })])
      .then(([ordersRes, invoicesRes]) => {
        setOrders(ordersRes.data);
        setOrdersTotal(ordersRes.total);
        setInvoices(invoicesRes.data);
        setInvoicesTotal(invoicesRes.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [ready, token]);

  if (!ready) return <FullPageSpinner />;

  const amountDue = (invoices ?? [])
    .filter((i) => i.status !== "Paid" && i.status !== "Refunded")
    .reduce((sum, i) => sum + i.amount - i.refundedAmount, 0);

  const lastOrder = orders?.[0];
  const firstName = customer?.name?.split(" ")[0] ?? "there";

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pt-5">
        <Logo size="md" />
        <button aria-label="Notifications" className="relative rounded-full p-2 text-text-muted">
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-400" />
        </button>
      </header>

      <section className="px-5 pt-5">
        <p className="text-lg font-bold text-text">
          Hello, <span className="text-accent-2">{customer ? firstName : "…"}</span> 👋
        </p>
        <p className="mt-1 text-sm text-text-muted">
          We&apos;re glad to have you back! Manage your services with OSTA Services.
        </p>
      </section>

      {error && (
        <p className="mx-5 mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 px-5 pt-5">
        <Link href="/orders" className="osta-card p-4">
          <div className="flex items-center gap-2 text-text-muted">
            <ClipboardList size={16} />
            <span className="text-xs">My Orders</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">{orders === null ? "…" : ordersTotal}</p>
        </Link>
        <Link href="/invoices" className="osta-card p-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Receipt size={16} />
            <span className="text-xs">My Invoices</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">{invoices === null ? "…" : invoicesTotal}</p>
        </Link>
        <div className="osta-card col-span-2 p-4">
          <p className="text-xs text-text-muted">Total Amount Due</p>
          <p className="mt-2 text-2xl font-bold text-accent-2">
            {invoices === null ? "…" : `AED ${amountDue.toFixed(2)}`}
          </p>
        </div>
      </section>

      <section className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Recent Orders</h2>
          <Link href="/orders" className="flex items-center gap-0.5 text-xs text-accent-2">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {orders === null ? (
          <FullPageSpinner />
        ) : orders.length === 0 ? (
          <p className="osta-card p-4 text-center text-sm text-text-muted">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.slice(0, 3).map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="osta-card flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text">{order.number}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-xs text-text-muted">{order.orderType}</p>
                <p className="text-xs text-text-faint">{formatDate(order.scheduledAt ?? order.date)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="px-5 pb-8 pt-6">
        <Link
          href="/orders/new"
          className="osta-btn-primary flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
        >
          <Plus size={18} /> Book a Service
        </Link>
        {lastOrder && (
          <p className="mt-3 text-center text-xs text-text-faint">
            Last service: {lastOrder.orderType} on {formatDate(lastOrder.scheduledAt ?? lastOrder.date)}
          </p>
        )}
      </div>
    </AppShell>
  );
}
