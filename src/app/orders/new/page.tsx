"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, ApiError } from "@/lib/api";

const ORDER_TYPES = ["New Order", "Revisit", "Inspection"];
const LANGUAGES = ["English", "Arabic"];

export default function NewOrderPage() {
  const { ready } = useRequireAuth();
  const { token } = useAuth();
  const router = useRouter();

  const [orderType, setOrderType] = useState("New Order");
  const [scheduledAt, setScheduledAt] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [customerLanguage, setCustomerLanguage] = useState("English");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!ready) return <FullPageSpinner />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setBusy(true);
    try {
      const order = await api.createOrder(token, {
        orderType,
        scheduledAt: scheduledAt || undefined,
        locationUrl: locationUrl || undefined,
        customerLanguage,
        notes: notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.replace(`/orders/${order.id}`), 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not book this order. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <TopBar title="Book a Service" back />

      {success ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <CheckCircle2 size={48} className="text-emerald-400" />
          <p className="text-base font-semibold text-text">Booking requested!</p>
          <p className="text-sm text-text-muted">We&apos;ll assign a team to your order shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-5 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Service type</span>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="osta-input rounded-xl px-3 py-3 text-sm"
            >
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Preferred date &amp; time</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="osta-input rounded-xl px-3 py-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Location (address or map link)</span>
            <input
              type="text"
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
              placeholder="Dubai, UAE"
              className="osta-input rounded-xl px-3 py-3 text-sm placeholder:text-text-faint"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Preferred language</span>
            <select
              value={customerLanguage}
              onChange={(e) => setCustomerLanguage(e.target.value)}
              className="osta-input rounded-xl px-3 py-3 text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Tell us more about what you need…"
              className="osta-input rounded-xl px-3 py-3 text-sm placeholder:text-text-faint"
            />
          </label>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="osta-btn-primary mt-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Booking…" : "Confirm Booking"}
          </button>
        </form>
      )}
    </AppShell>
  );
}
