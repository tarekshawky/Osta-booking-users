import type { PricingConfig } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n";
import type { Quote } from "@/lib/priceQuote";

type BookingType = PricingConfig["bookingTypes"][number];

export function bookingFee(type: BookingType, serviceId: string, regionId: string): number {
  const o = type.overrides;
  return (
    o.find((x) => x.serviceId === serviceId && x.regionId === regionId)?.feeFils ??
    o.find((x) => x.serviceId === serviceId && x.regionId === null)?.feeFils ??
    o.find((x) => x.serviceId === null && x.regionId === regionId)?.feeFils ??
    type.defaultFeeFils
  );
}

export function PriceLines({ quote, aed, t, compact }: { quote: Quote; aed: (f: number) => string; t: (k: TranslationKey) => string; compact?: boolean }) {
  const row = (label: string, value: string, strong = false) => (
    <div key={label} className={`flex justify-between py-0.5 ${strong ? "font-bold text-text" : "text-text-muted"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
  return (
    <div className={compact ? "text-xs" : "osta-card p-4 text-sm"}>
      {row(`${t("booking.unitPrice")} × ${quote.quantity}`, `${aed(quote.unitPriceFils)} × ${quote.quantity}`)}
      {row(t("booking.subtotal"), aed(quote.subtotalFils))}
      {quote.discountFils > 0 && row(`${t("booking.discount")} (${quote.discountPercent}%)`, `− ${aed(quote.discountFils)}`)}
      {quote.discountFils > 0 && row(t("booking.afterDiscount"), aed(quote.serviceNetFils))}
      {quote.bookingFeeFils > 0 && row(t("booking.bookingFee"), aed(quote.bookingFeeFils))}
      {quote.addOnsFils > 0 && row(t("booking.addOnsTotal"), aed(quote.addOnsFils))}
      {row(quote.pricesIncludeVat ? `${t("booking.vatIncluded")} (${quote.vatRatePercent}%)` : `${t("booking.vatAdded")} (${quote.vatRatePercent}%)`, aed(quote.vatFils))}
      <div className="mt-1 border-t border-card-border pt-1">{row(t("booking.total"), aed(quote.totalFils), true)}</div>
    </div>
  );
}

// The optional note an admin set on a service (what the price covers or leaves out). Falls back to the other language.
export const serviceNote = (s: { noteEn?: string; noteAr?: string }, ar: boolean) => ((ar ? s.noteAr || s.noteEn : s.noteEn || s.noteAr) ?? "").trim();

// Shown with the chosen service and again in the summary, so customers see it before they book.
export function ServiceNoteBox({ note }: { note: string }) {
  if (!note) return null;
  return (
    <p role="note" className="flex gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100">
      <span aria-hidden className="shrink-0">ⓘ</span>
      <span className="whitespace-pre-line">{note}</span>
    </p>
  );
}
