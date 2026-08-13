"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, ApiError } from "@/lib/api";

const SERVICES = [
  "AC Services",
  "Cleaning Services",
  "Electrical Services",
  "Plumbing Services",
  "Pest Control Services",
  "Home Maintenance",
  "Emergency 24/7",
];
const LANGUAGES = ["English", "Arabic"];
const WHATSAPP_NUMBER = "971568676036";

function formatDateTime(value: string) {
  if (!value) return "Not specified";
  return new Date(value).toLocaleString("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NewOrderPage() {
  const { ready } = useRequireAuth();
  const { token, customer } = useAuth();
  const router = useRouter();

  const [service, setService] = useState(SERVICES[0]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [customerLanguage, setCustomerLanguage] = useState("English");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [locating, setLocating] = useState(false);

  if (!ready) return <FullPageSpinner />;

  function shareLocation() {
    if (!navigator.geolocation) {
      setError("Location sharing isn't supported on this device.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationUrl(`https://maps.google.com/?q=${latitude},${longitude}`);
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Please allow location access or type an address.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);

    // Open the WhatsApp tab synchronously (in direct response to the click)
    // so browsers don't block it once we're past the awaited API call below.
    const whatsappTab = window.open("", "_blank");

    setBusy(true);
    try {
      const order = await api.createOrder(token, {
        orderType: "New Order",
        scheduledAt: scheduledAt || undefined,
        locationUrl: locationUrl || undefined,
        customerLanguage,
        notes: `Service requested: ${service}${notes ? `\n\n${notes}` : ""}`,
      });

      const lines = [
        "New OSTA booking request",
        `Order: ${order.number}`,
        `Service: ${service}`,
        `Date & time: ${formatDateTime(scheduledAt)}`,
        `Location: ${locationUrl || "Not specified"}`,
        `Language: ${customerLanguage}`,
        notes ? `Notes: ${notes}` : null,
        customer ? `Customer: ${customer.name} (${customer.phone})` : null,
      ].filter(Boolean);
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
      if (whatsappTab) whatsappTab.location.href = waUrl;

      setSuccess(true);
      setTimeout(() => router.replace(`/orders/${order.id}`), 900);
    } catch (err) {
      whatsappTab?.close();
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
          <p className="text-sm text-text-muted">
            We&apos;ll assign a team shortly. We also opened WhatsApp with your details ready to send.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-5 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Service</span>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="osta-input rounded-xl px-3 py-3 text-sm"
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
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
            <span className="text-xs font-medium text-text-muted">Location</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="Type an address, or share your location"
                className="osta-input flex-1 rounded-xl px-3 py-3 text-sm placeholder:text-text-faint"
              />
              <button
                type="button"
                onClick={shareLocation}
                disabled={locating}
                aria-label="Share my current location"
                className="flex shrink-0 items-center justify-center rounded-xl border border-card-border px-3 text-accent-2 disabled:opacity-60"
              >
                <MapPin size={18} />
              </button>
            </div>
            {locating && <span className="text-[11px] text-text-faint">Getting your location…</span>}
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

          <p className="text-[11px] text-text-faint">
            After booking, we&apos;ll open WhatsApp with your details pre-filled to send to OSTA support — you
            confirm and send it yourself.
          </p>

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
