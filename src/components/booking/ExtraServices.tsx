"use client";

import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { ServicePicker } from "@/components/booking/ServicePicker";
import { extraQuote, hasOptions, isInspection, optionsIn, type ExtraLine } from "@/components/booking/shared";
import { useLanguage } from "@/lib/language-context";
import type { PricingConfig } from "@/lib/api";

// "Add more services to this visit": the customer can book several services together (same address and time, booking fee once).
// One order is created for each service.
export function ExtraServices({ config, regionId, primaryId, lines, onChange, aed }: {
  config: PricingConfig; regionId: string; primaryId: string; lines: ExtraLine[]; onChange: (lines: ExtraLine[]) => void; aed: (fils: number) => string;
}) {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const name = (x: { nameEn: string; nameAr: string }) => (ar ? x.nameAr || x.nameEn : x.nameEn || x.nameAr);
  const [adding, setAdding] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [optionId, setOptionId] = useState("");
  const [qty, setQty] = useState(1);

  const pending = config.services.find((s) => s.id === pendingId);
  const opts = pending ? optionsIn(pending, regionId) : [];
  const needsOption = !!pending && hasOptions(pending) && !isInspection(pending);
  const available = config.services.filter((s) => s.id !== primaryId && !lines.some((l) => l.serviceId === s.id));
  const close = () => { setAdding(false); setPendingId(""); setOptionId(""); setQty(1); };
  const canAdd = !!pending && (!needsOption || !!optionId);

  return (
    <div className="osta-card flex flex-col gap-3 p-4">
      <div>
        <h3 className="text-sm font-semibold text-text">{t("booking.moreServices")}</h3>
        <p className="text-[11px] text-text-faint">{t("booking.moreServicesNote")}</p>
      </div>

      {lines.map((l, i) => {
        const s = config.services.find((x) => x.id === l.serviceId);
        if (!s) return null;
        const q = extraQuote(config, regionId, l);
        const o = l.optionId ? optionsIn(s, regionId).find((x) => x.id === l.optionId) : undefined;
        return (
          <div key={l.serviceId} className="flex items-center justify-between gap-3 rounded-xl border border-card-border px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">{name(s)}{o ? ` — ${name(o)}` : ""}{isInspection(s) ? "" : ` × ${l.qty}`}</p>
              <p className="text-xs text-accent-2">{isInspection(s) ? t("booking.afterInspection") : q ? aed(q.totalFils) : t("booking.notAvailable")}</p>
            </div>
            <button type="button" aria-label={t("booking.remove")} onClick={() => onChange(lines.filter((_, n) => n !== i))} className="shrink-0 rounded-full border border-card-border p-1.5 text-text-muted hover:border-accent hover:text-text">
              <X size={14} />
            </button>
          </div>
        );
      })}

      {adding ? (
        <div className="flex flex-col gap-3 border-t border-card-border pt-3">
          <ServicePicker
            services={available}
            regionId={regionId}
            selectedId={pendingId}
            aed={aed}
            card={(sel, disabled) => `osta-card osta-pick w-full p-4 text-start ${sel ? "osta-glow-border" : ""} ${disabled ? "opacity-45" : ""}`}
            onPick={(s) => { setPendingId(s.id); setOptionId(""); setQty(s.minQuantity); }}
          />
          {pending && needsOption && (
            <select value={optionId} onChange={(e) => setOptionId(e.target.value)} className="osta-input rounded-xl px-3 py-3 text-sm" aria-label={t("booking.chooseOption")}>
              <option value="">{t("booking.chooseOption")}</option>
              {opts.map((o) => <option key={o.id} value={o.id}>{name(o)} — {aed(o.priceFils)}</option>)}
            </select>
          )}
          {pending && !isInspection(pending) && (
            <div className="flex items-center justify-between rounded-xl border border-card-border px-3 py-2">
              <span className="text-sm text-text">{t("booking.quantity")}</span>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="-" onClick={() => setQty((v) => Math.max(pending.minQuantity, v - 1))} className="rounded-full border border-card-border p-1.5 text-text"><Minus size={14} /></button>
                <span className="w-6 text-center font-bold text-text">{qty}</span>
                <button type="button" aria-label="+" onClick={() => setQty((v) => Math.min(500, v + 1))} className="rounded-full border border-card-border p-1.5 text-text"><Plus size={14} /></button>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" disabled={!canAdd} onClick={() => { onChange([...lines, { serviceId: pendingId, optionId: optionId || undefined, qty }]); close(); }} className="osta-btn-primary flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50">{t("booking.addToBooking")}</button>
            <button type="button" onClick={close} className="rounded-xl border border-card-border px-4 py-2.5 text-sm text-text">{t("booking.cancel")}</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="self-start text-sm font-semibold text-accent-2">{t("booking.addAnother")}</button>
      )}
    </div>
  );
}
