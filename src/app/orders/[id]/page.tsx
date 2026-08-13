"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, FileText, Users, StickyNote } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, OrderDetail } from "@/lib/api";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" });
}

function Row({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon size={17} className="mt-0.5 text-text-faint" />
      <div>
        <p className="text-[11px] text-text-faint">{label}</p>
        <p className="text-sm text-text">{value}</p>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { ready } = useRequireAuth();
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    api
      .order(token, params.id)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load order"));
  }, [ready, token, params.id]);

  if (!ready) return <FullPageSpinner />;

  return (
    <AppShell>
      <TopBar title="Order Details" back />

      {error && (
        <p className="mx-5 mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      {!order ? (
        <FullPageSpinner />
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-5 py-5">
          <div className="osta-card p-4">
            <div className="mb-1 flex items-center justify-between">
              <StatusBadge status={order.status} />
            </div>
            <p className="text-lg font-bold text-text">{order.number}</p>
            <p className="text-xs text-text-muted">{order.orderType}</p>
          </div>

          <div className="osta-card divide-y divide-card-border px-4">
            <Row icon={FileText} label="Service" value={order.orderType} />
            <Row icon={Calendar} label="Date" value={formatDate(order.scheduledAt ?? order.date)} />
            {formatTime(order.scheduledAt) && (
              <Row icon={Clock} label="Time" value={formatTime(order.scheduledAt)!} />
            )}
            {order.locationUrl && <Row icon={MapPin} label="Location" value={order.locationUrl} />}
            <Row icon={FileText} label="Amount" value={`AED ${order.priceAgreed}`} />
            {order.team?.name && <Row icon={Users} label="Team" value={order.team.name} />}
            {order.assignedTo?.name && <Row icon={Users} label="Assigned To" value={order.assignedTo.name} />}
            {order.notes && <Row icon={StickyNote} label="Notes" value={order.notes} />}
          </div>

          {order.invoice && (
            <div className="osta-card flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-text-faint">Invoice</p>
                <p className="text-sm font-semibold text-text">{order.invoice.number}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.invoice.status} />
                <button
                  onClick={() => order.invoiceId && router.push(`/invoices/${order.invoiceId}`)}
                  className="text-xs font-medium text-accent-2"
                >
                  View
                </button>
              </div>
            </div>
          )}

          {order.cancellationReason && (
            <div className="osta-card border border-rose-400/30 p-4">
              <p className="text-xs font-medium text-rose-300">Cancellation reason</p>
              <p className="mt-1 text-sm text-text-muted">{order.cancellationReason}</p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
