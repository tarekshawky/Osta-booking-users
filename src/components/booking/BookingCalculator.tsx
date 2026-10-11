"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";
import type { PricingConfig } from "@/lib/api";
import { priceQuote, type Quote } from "@/lib/priceQuote";
import { saveDraft } from "@/lib/bookingDraft";
import { track } from "@/lib/analytics";
import { bookingFee, PriceLines } from "@/components/booking/shared";

// Public, no-login price calculator: emirate -> service -> quantity -> booking type -> summary -> consent -> book.
// Prices here are a preview; the server prices the order again when it is placed.
export function BookingCalculator({ config }: { config: PricingConfig }) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const ar = lang === "ar";

  const [regionId, setRegionId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [qty, setQty] = useState(1);
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);

  const name = (x: { nameEn: string; nameAr: string }) => (ar ? x.nameAr : x.nameEn);
  const aed = (fils: number) => `${(fils / 100).toFixed(2)} ${t("common.aed")}`;
  const priceIn = (s: PricingConfig["services"][number]) => s.prices.find((p) => p.regionId === regionId)?.unitPriceFils ?? null;

  const service = config.services.find((s) => s.id === serviceId);
  const type = config.bookingTypes.find((b) => b.id === typeId);
  const policy = config.visitFeePolicy;
  const fill = (text: string) => text.replaceAll("{amount}", policy ? String(policy.amountFils / 100) : "");
  const addOns = service ? service.addOns.filter((a) => a.prices.some((p) => p.regionId === regionId)) : [];

  const quote = useMemo((): Quote | null => {
    if (!service || !type || !regionId) return null;
    try {
      return priceQuote({
        unitPriceFils: priceIn(service),
        quantity: qty,
        minQuantity: service.minQuantity,
        tiers: service.tiers.map((x) => ({
          ...x,
          startsAt: x.startsAt ? new Date(x.startsAt) : null,
          endsAt: x.endsAt ? new Date(x.endsAt) : null,
        })),
        bookingFeeFils: bookingFee(type, service.id, regionId),
        addOns: addOns
          .filter((a) => addOnIds.includes(a.id))
          .map((a) => ({ id: a.id, priceFils: a.prices.find((p) => p.regionId === regionId)!.priceFils })),
        vat: { ratePercent: config.tax.vatRatePercent, pricesIncludeVat: service.pricesIncludeVat ?? config.tax.pricesIncludeVat },
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, type, regionId, qty, addOnIds, config.tax]);

  const qtyLabel = service?.pricingUnit === "AC_UNIT" ? t("booking.qtyAc") : service?.pricingUnit === "ROOM" ? t("booking.qtyRoom") : t("booking.qtyUnit");
  const card = (selected: boolean, disabled = false) =>
    `osta-card osta-pick w-full p-4 text-start ${selected ? "osta-glow-border" : ""} ${disabled ? "opacity-45" : ""}`;
  const heading = (n: number, text: string) => (
    <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{n}</span>
      {text}
    </h2>
  );

  function book() {
    if (!service || !type || !quote || !consent) return;
    saveDraft({ regionId, serviceId, typeId, qty, addOnIds, consent });
    track("booking_started");
    router.push("/orders/new");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 pb-20">
      <section>
        {heading(1, t("booking.chooseEmirate"))}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {config.regions.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={regionId === r.id}
              onClick={() => { setRegionId(r.id); setServiceId(""); setAddOnIds([]); setConsent(false); }}
              className={card(regionId === r.id)}
            >
              <span className="text-sm font-medium text-text">{name(r)}</span>
            </button>
          ))}
        </div>
      </section>

      {regionId && (
        <section>
          {heading(2, t("booking.chooseService"))}
          <div className="flex flex-col gap-3">
            {config.services.map((s) => {
              const price = priceIn(s);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={price === null}
                  aria-pressed={serviceId === s.id}
                  onClick={() => { setServiceId(s.id); setQty(s.minQuantity); setAddOnIds([]); setConsent(false); }}
                  className={card(serviceId === s.id, price === null)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{name(s)}</p>
                      {(ar ? s.descriptionAr : s.descriptionEn) && <p className="mt-1 text-xs text-text-muted">{ar ? s.descriptionAr : s.descriptionEn}</p>}
                    </div>
                    <p className="shrink-0 text-xs text-accent-2">{price === null ? t("booking.notAvailable") : `${t("booking.from")} ${aed(price)}`}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {service && (
        <section>
          {heading(3, qtyLabel)}
          <div className="osta-card flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-text">{qtyLabel}</p>
              {service.minQuantity > 1 && <p className="text-[11px] text-text-faint">{t("booking.minQty")}: {service.minQuantity}</p>}
            </div>
            <div className="flex items-center gap-4">
              <button type="button" aria-label="-" onClick={() => { setQty((q) => Math.max(service.minQuantity, q - 1)); setConsent(false); }} className="rounded-full border border-card-border p-2 text-text transition-colors hover:border-accent hover:bg-card">
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-lg font-bold text-text" aria-live="polite">{qty}</span>
              <button type="button" aria-label="+" onClick={() => { setQty((q) => Math.min(500, q + 1)); setConsent(false); }} className="rounded-full border border-card-border p-2 text-text transition-colors hover:border-accent hover:bg-card">
                <Plus size={16} />
              </button>
            </div>
          </div>
          {addOns.length > 0 && (
            <div className="osta-card mt-3 p-4">
              <p className="mb-2 text-sm font-medium text-text">{t("booking.addOns")}</p>
              {addOns.map((a) => (
                <label key={a.id} className="flex items-center justify-between py-1.5 text-sm text-text">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={addOnIds.includes(a.id)} onChange={(e) => { setAddOnIds((ids) => (e.target.checked ? [...ids, a.id] : ids.filter((x) => x !== a.id))); setConsent(false); }} />
                    {name(a)}
                  </span>
                  <span className="text-xs text-text-muted">{aed(a.prices.find((p) => p.regionId === regionId)!.priceFils)}</span>
                </label>
              ))}
            </div>
          )}
        </section>
      )}

      {service && (
        <section>
          {heading(4, t("booking.steps.type"))}
          <div className="flex flex-col gap-3">
            {config.bookingTypes.map((b) => {
              const fee = bookingFee(b, service.id, regionId);
              return (
                <button key={b.id} type="button" aria-pressed={typeId === b.id} onClick={() => { setTypeId(b.id); setConsent(false); }} className={card(typeId === b.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{name(b)}</p>
                      {(ar ? b.descriptionAr : b.descriptionEn) && <p className="mt-1 text-xs text-text-muted">{ar ? b.descriptionAr : b.descriptionEn}</p>}
                    </div>
                    <p className="shrink-0 text-xs text-accent-2">{fee === 0 ? t("booking.noFee") : `${t("booking.fee")} ${aed(fee)}`}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {service && type && quote && (
        <section>
          {heading(5, t("booking.summaryTitle"))}
          <div className="osta-card mb-3 p-4 text-sm text-text">
            <p className="font-semibold">{name(service)} × {qty}</p>
            <p className="text-text-muted">{name(config.regions.find((r) => r.id === regionId)!)} · {name(type)}</p>
          </div>
          <PriceLines quote={quote} aed={aed} t={t as (k: TranslationKey) => string} />
          {policy && (
            <div className="osta-card mt-3 p-4">
              <p className="whitespace-pre-line text-xs leading-relaxed text-text-muted">{fill(ar ? policy.textAr : policy.textEn)}</p>
              <label className="mt-3 flex items-start gap-2 text-sm text-text">
                <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>{fill(ar ? policy.consentLabelAr : policy.consentLabelEn)}</span>
              </label>
            </div>
          )}
          <p className="mt-3 text-[11px] text-text-faint">{t("booking.previewNote")}</p>
          <button type="button" onClick={book} disabled={!consent} className="osta-btn-primary mt-4 w-full rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-50">
            {t("booking.bookNow")}
          </button>
          <p className="mt-2 text-center text-[11px] text-text-faint">{t("booking.loginNote")}</p>
        </section>
      )}
    </div>
  );
}
