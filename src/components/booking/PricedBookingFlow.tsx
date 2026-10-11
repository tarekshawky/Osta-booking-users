"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, MapPin, Minus, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import type { TranslationKey } from "@/lib/i18n";
import { api, ApiError, type PricingConfig } from "@/lib/api";
import { track } from "@/lib/analytics";
import { priceQuote, QuoteError, type Quote } from "@/lib/priceQuote";
import { bookingFee, PriceLines } from "@/components/booking/shared";
import { loadDraft, clearDraft } from "@/lib/bookingDraft";

const STEPS = ["emirate", "service", "type", "details", "when", "contact", "review"] as const;

type Service = PricingConfig["services"][number];
export function PricedBookingFlow({ config }: { config: PricingConfig }) {
  const { token, customer } = useAuth();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { settings: site } = useSite();
  const ar = lang === "ar";
  const idempotencyKey = useRef(crypto.randomUUID());

  // A choice made on the public price page arrives as a draft; a stale or invalid one is ignored.
  const [draft] = useState(() => {
    const d = loadDraft();
    const svc = d && config.services.find((s) => s.id === d.serviceId);
    const ok =
      !!d && !!svc && svc.prices.some((p) => p.regionId === d.regionId) &&
      config.bookingTypes.some((b) => b.id === d.typeId) && d.qty >= svc.minQuantity;
    return ok ? d : null;
  });
  const [step, setStep] = useState(draft ? STEPS.indexOf("when") : 0);
  const [regionId, setRegionId] = useState(draft?.regionId ?? "");
  const [serviceId, setServiceId] = useState(draft?.serviceId ?? "");
  const [typeId, setTypeId] = useState(draft?.typeId ?? "");
  const [qty, setQty] = useState(draft?.qty ?? 1);
  const [addOnIds, setAddOnIds] = useState<string[]>(draft?.addOnIds ?? []);
  const [scheduledAt, setScheduledAt] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [customerLanguage, setCustomerLanguage] = useState(ar ? "Arabic" : "English");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(draft?.consent ?? false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const name = (x: { nameEn: string; nameAr: string }) => (ar ? x.nameAr : x.nameEn);
  const aed = (fils: number) => `${(fils / 100).toFixed(2)} ${t("common.aed")}`;

  const region = config.regions.find((r) => r.id === regionId);
  const service = config.services.find((s) => s.id === serviceId);
  const type = config.bookingTypes.find((b) => b.id === typeId);
  const policy = config.visitFeePolicy;
  const policyAmount = policy ? String(policy.amountFils / 100) : "";
  const fill = (text: string) => text.replaceAll("{amount}", policyAmount);

  const unitFils = (s: Service) => s.prices.find((p) => p.regionId === regionId)?.unitPriceFils ?? null;
  const availableAddOns = service ? service.addOns.filter((a) => a.prices.some((p) => p.regionId === regionId)) : [];

  const { quote, quoteError } = useMemo((): { quote: Quote | null; quoteError: boolean } => {
    if (!service || !type || !regionId) return { quote: null, quoteError: false };
    try {
      const q = priceQuote({
        unitPriceFils: service.prices.find((p) => p.regionId === regionId)?.unitPriceFils ?? null,
        quantity: qty,
        minQuantity: service.minQuantity,
        tiers: service.tiers.map((x) => ({
          ...x,
          startsAt: x.startsAt ? new Date(x.startsAt) : null,
          endsAt: x.endsAt ? new Date(x.endsAt) : null,
        })),
        bookingFeeFils: bookingFee(type, service.id, regionId),
        addOns: availableAddOns
          .filter((a) => addOnIds.includes(a.id))
          .map((a) => ({ id: a.id, priceFils: a.prices.find((p) => p.regionId === regionId)!.priceFils })),
        vat: {
          ratePercent: config.tax.vatRatePercent,
          pricesIncludeVat: service.pricesIncludeVat ?? config.tax.pricesIncludeVat,
        },
      });
      return { quote: q, quoteError: false };
    } catch (e) {
      return { quote: null, quoteError: e instanceof QuoteError };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, type, regionId, qty, addOnIds, config.tax]);

  function slotProblem(): string | null {
    if (!scheduledAt || !type) return t("booking.pastDate");
    const when = new Date(scheduledAt);
    if (isNaN(+when) || when <= new Date()) return t("booking.pastDate");
    if (!type.sameDayAllowed && when.toDateString() === new Date().toDateString()) return t("booking.sameDayNotAllowed");
    if (type.hoursStart && type.hoursEnd) {
      const hhmm = scheduledAt.slice(11, 16);
      if (hhmm < type.hoursStart || hhmm > type.hoursEnd) return `${t("booking.hours")}: ${type.hoursStart}–${type.hoursEnd}`;
    }
    return null;
  }

  function stepProblem(): string | null {
    switch (STEPS[step]) {
      case "emirate": return regionId ? null : t("booking.chooseEmirate");
      case "service": return service && unitFils(service) !== null ? null : t("booking.chooseService");
      case "type": return typeId ? null : t("booking.chooseType");
      case "details": return qty >= (service?.minQuantity ?? 1) && quote ? null : t("booking.priceError");
      case "when": return slotProblem();
      case "contact": return locationUrl.trim() ? null : t("booking.addressRequired");
      case "review": return consent ? null : t("booking.consentRequired");
    }
  }

  function next() {
    const problem = stepProblem();
    setError(problem);
    if (!problem) {
      if (step === 0) track("booking_started");
      setSummaryOpen(false);
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }

  function back() {
    setError(null);
    setSummaryOpen(false);
    setStep((s) => Math.max(0, s - 1));
  }

  function shareLocation() {
    if (!navigator.geolocation) return setError(t("newOrder.locationUnsupported"));
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationUrl(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`);
        setLocating(false);
      },
      () => {
        setError(t("newOrder.locationFailed"));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit() {
    const problem = stepProblem();
    if (problem || !token || !service || !type || !quote) return setError(problem);
    setError(null);

    // Opened synchronously from the click so the browser doesn't block it after the await.
    const whatsappTab = window.open("", "_blank");
    setBusy(true);
    try {
      // Only choices are sent. The server prices the order itself and ignores any total.
      const order = await api.createPricedOrder(token, {
        serviceId,
        regionId,
        bookingTypeId: typeId,
        quantity: qty,
        addOnIds,
        scheduledAt: scheduledAt || undefined,
        locationUrl: locationUrl.trim(),
        customerLanguage,
        notes: notes.trim() || undefined,
        consent: true,
        idempotencyKey: idempotencyKey.current,
      });
      const lines = [
        "New OSTA booking request",
        `Order: ${order.number}`,
        `Service: ${service.nameEn} x ${qty} (${region?.nameEn})`,
        `Type: ${type.nameEn}`,
        `Total: ${(order.totalFils / 100).toFixed(2)} AED`,
        `Requested time: ${scheduledAt.replace("T", " ")}`,
        `Location: ${locationUrl}`,
        notes ? `Notes: ${notes}` : null,
        customer ? `Customer: ${customer.name} (${customer.phone})` : null,
      ].filter(Boolean);
      if (whatsappTab) whatsappTab.location.href = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
      track("booking_completed", { value: order.totalFils / 100, currency: "AED" });
      clearDraft();
      setSuccess(true);
      setTimeout(() => router.replace(`/orders/${order.id}`), 1200);
    } catch (err) {
      whatsappTab?.close();
      setError(err instanceof ApiError ? err.message : t("newOrder.genericError"));
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <AppShell>
        <TopBar title={t("newOrder.title")} back />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <CheckCircle2 size={48} className="text-emerald-400" />
          <p className="text-base font-semibold text-text">{t("booking.successTitle")}</p>
          <p className="text-sm text-text-muted">{t("booking.successSubtitle")}</p>
        </div>
      </AppShell>
    );
  }

  const pickCard = (selected: boolean, disabled = false) =>
    `osta-card osta-pick w-full p-4 text-start ${selected ? "osta-glow-border" : ""} ${disabled ? "opacity-45" : ""}`;
  const stepKey = STEPS[step];

  return (
    <AppShell>
      <TopBar title={t("newOrder.title")} back />

      <div className="px-5 pt-4">
        <p className="text-xs text-text-muted" aria-live="polite">
          {t("booking.stepOf")} {step + 1} {t("booking.of")} {STEPS.length} · {t(`booking.steps.${stepKey}` as TranslationKey)}
        </p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-card-border"}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 py-5">
        {stepKey === "emirate" && (
          <>
            <h2 className="text-base font-semibold text-text">{t("booking.chooseEmirate")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {config.regions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRegionId(r.id);
                    setServiceId("");
                    setAddOnIds([]);
                    setError(null);
                  }}
                  className={pickCard(regionId === r.id)}
                >
                  <span className="text-sm font-medium text-text">{name(r)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {stepKey === "service" && (
          <>
            <h2 className="text-base font-semibold text-text">{t("booking.chooseService")}</h2>
            {config.services.length === 0 && <p className="text-sm text-text-muted">{t("booking.noServices")}</p>}
            {config.services.map((s) => {
              const price = unitFils(s);
              const ok = price !== null;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!ok}
                  onClick={() => {
                    setServiceId(s.id);
                    setQty(s.minQuantity);
                    setAddOnIds([]);
                    setError(null);
                  }}
                  className={pickCard(serviceId === s.id, !ok)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{name(s)}</p>
                      {(ar ? s.descriptionAr : s.descriptionEn) && (
                        <p className="mt-1 text-xs text-text-muted">{ar ? s.descriptionAr : s.descriptionEn}</p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-accent-2">
                      {ok ? `${t("booking.from")} ${aed(price)}` : t("booking.notAvailable")}
                    </p>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {stepKey === "type" && (
          <>
            <h2 className="text-base font-semibold text-text">{t("booking.chooseType")}</h2>
            {config.bookingTypes.map((b) => {
              const fee = service ? bookingFee(b, service.id, regionId) : b.defaultFeeFils;
              return (
                <button key={b.id} type="button" onClick={() => { setTypeId(b.id); setError(null); }} className={pickCard(typeId === b.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{name(b)}</p>
                      {(ar ? b.descriptionAr : b.descriptionEn) && (
                        <p className="mt-1 text-xs text-text-muted">{ar ? b.descriptionAr : b.descriptionEn}</p>
                      )}
                      {b.hoursStart && b.hoursEnd && (
                        <p className="mt-1 text-[11px] text-text-faint">{t("booking.hours")}: {b.hoursStart}–{b.hoursEnd}</p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-accent-2">{fee === 0 ? t("booking.noFee") : `${t("booking.fee")} ${aed(fee)}`}</p>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {stepKey === "details" && service && (
          <>
            <h2 className="text-base font-semibold text-text">{name(service)}</h2>
            <div className="osta-card flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-text">{t("booking.quantity")}</p>
                {service.minQuantity > 1 && <p className="text-[11px] text-text-faint">{t("booking.minQty")}: {service.minQuantity}</p>}
              </div>
              <div className="flex items-center gap-4">
                <button type="button" aria-label="-" onClick={() => setQty((q) => Math.max(service.minQuantity, q - 1))} className="rounded-full border border-card-border p-2 text-text">
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-lg font-bold text-text" aria-live="polite">{qty}</span>
                <button type="button" aria-label="+" onClick={() => setQty((q) => Math.min(500, q + 1))} className="rounded-full border border-card-border p-2 text-text">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            {availableAddOns.length > 0 && (
              <div className="osta-card p-4">
                <p className="mb-2 text-sm font-medium text-text">{t("booking.addOns")}</p>
                {availableAddOns.map((a) => (
                  <label key={a.id} className="flex items-center justify-between py-1.5 text-sm text-text">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={addOnIds.includes(a.id)}
                        onChange={(e) => setAddOnIds((ids) => (e.target.checked ? [...ids, a.id] : ids.filter((x) => x !== a.id)))}
                      />
                      {name(a)}
                    </span>
                    <span className="text-xs text-text-muted">{aed(a.prices.find((p) => p.regionId === regionId)!.priceFils)}</span>
                  </label>
                ))}
              </div>
            )}
            {quoteError && <p className="text-xs text-rose-400">{t("booking.priceError")}</p>}
          </>
        )}

        {stepKey === "when" && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text">{t("booking.whenTitle")}</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => { setScheduledAt(e.target.value); setError(null); }}
                className="osta-input rounded-xl px-3 py-3 text-sm"
              />
            </label>
            {type?.hoursStart && type.hoursEnd && (
              <p className="text-xs text-text-muted">{t("booking.hours")}: {type.hoursStart}–{type.hoursEnd}</p>
            )}
            <p className="rounded-xl border border-card-border p-3 text-xs text-text-muted">{t("booking.slotNote")}</p>
          </>
        )}

        {stepKey === "contact" && (
          <>
            <h2 className="text-base font-semibold text-text">{t("booking.yourInfo")}</h2>
            <div className="osta-card p-4 text-sm">
              <p className="text-text-muted">{t("booking.name")}</p>
              <p className="font-medium text-text">{customer?.name}</p>
              <p className="mt-2 text-text-muted">{t("booking.phone")}</p>
              <p className="font-medium text-text" dir="ltr">{customer?.phone}</p>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">{t("booking.address")}</span>
              <div className="flex gap-2">
                <input
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  placeholder={t("newOrder.locationPlaceholder")}
                  className="osta-input flex-1 rounded-xl px-3 py-3 text-sm placeholder:text-text-faint"
                />
                <button type="button" onClick={shareLocation} disabled={locating} aria-label={t("newOrder.shareLocation")} className="flex shrink-0 items-center rounded-xl border border-card-border px-3 text-accent-2 disabled:opacity-60">
                  <MapPin size={18} />
                </button>
              </div>
              {locating && <span className="text-[11px] text-text-faint">{t("newOrder.gettingLocation")}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">{t("newOrder.language")}</span>
              <select value={customerLanguage} onChange={(e) => setCustomerLanguage(e.target.value)} className="osta-input rounded-xl px-3 py-3 text-sm">
                <option value="English">{t("newOrder.languages.English")}</option>
                <option value="Arabic">{t("newOrder.languages.Arabic")}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">{t("newOrder.notes")}</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t("newOrder.notesPlaceholder")} className="osta-input rounded-xl px-3 py-3 text-sm placeholder:text-text-faint" />
            </label>
          </>
        )}

        {stepKey === "review" && service && type && (
          <>
            <h2 className="text-base font-semibold text-text">{t("booking.reviewTitle")}</h2>
            <div className="osta-card p-4 text-sm text-text">
              <p className="font-semibold">{name(service)} × {qty}</p>
              <p className="text-text-muted">{region && name(region)} · {name(type)}</p>
              <p className="mt-1 text-text-muted" dir="ltr">{scheduledAt.replace("T", " ")}</p>
              <p className="mt-1 break-all text-text-muted">{locationUrl}</p>
            </div>
            {quote && <PriceLines quote={quote} aed={aed} t={t} />}
            {policy && (
              <div className="osta-card p-4">
                <p className="whitespace-pre-line text-xs leading-relaxed text-text-muted">{fill(ar ? policy.textAr : policy.textEn)}</p>
                <label className="mt-3 flex items-start gap-2 text-sm text-text">
                  <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => { setConsent(e.target.checked); setError(null); }} />
                  <span>{fill(ar ? policy.consentLabelAr : policy.consentLabelEn)}</span>
                </label>
              </div>
            )}
            <p className="text-[11px] text-text-faint">{t("booking.previewNote")}</p>
            <p className="text-[11px] text-text-faint">{t("newOrder.whatsappNote")}</p>
          </>
        )}

        {error && <p className="text-xs text-rose-400" role="alert">{error}</p>}
      </div>

      <div className="sticky bottom-[60px] z-10 border-t border-card-border bg-bg-elevated px-5 py-3">
        {quote && stepKey !== "review" && step >= 3 && (
          <div className="mb-3">
            <button type="button" onClick={() => setSummaryOpen((o) => !o)} className="flex w-full items-center justify-between text-sm" aria-expanded={summaryOpen}>
              <span className="text-text-muted">{t("booking.total")}</span>
              <span className="flex items-center gap-1 font-bold text-accent-2" aria-live="polite">
                {aed(quote.totalFils)} <ChevronDown size={14} className={summaryOpen ? "rotate-180" : ""} />
              </span>
            </button>
            {summaryOpen && <div className="mt-2"><PriceLines quote={quote} aed={aed} t={t} compact /></div>}
          </div>
        )}
        <div className="flex gap-3">
          {step > 0 && (
            <button type="button" onClick={back} className="rounded-xl border border-card-border px-5 py-3 text-sm font-medium text-text">
              {t("booking.back")}
            </button>
          )}
          {stepKey === "review" ? (
            <button type="button" onClick={submit} disabled={busy || !consent} className="osta-btn-primary flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? t("newOrder.submitting") : t("booking.confirm")}
            </button>
          ) : (
            <button type="button" onClick={next} className="osta-btn-primary flex-1 rounded-xl py-3 text-sm font-semibold text-white">
              {t("booking.next")}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
