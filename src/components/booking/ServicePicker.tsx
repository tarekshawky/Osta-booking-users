"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { DynamicIcon } from "@/components/DynamicIcon";
import { useLanguage } from "@/lib/language-context";
import type { PricingConfig } from "@/lib/api";
import { fromPrice, isInspection, serviceNote } from "@/components/booking/shared";

type Service = PricingConfig["services"][number];
type Group = { key: string; en: string; ar: string; order: number; icon: string; items: Service[] };

const MAX_RESULTS = 40;

// Choosing a service. With a long list (hundreds of services) it works in three easy moves: type what you need, or tap a category,
// then tap the service. Once chosen it folds into one "your service" card with a Change button, so the page stays short.
export function ServicePicker({ services, regionId, selectedId, onPick, card, aed }: {
  services: Service[]; regionId: string; selectedId: string; onPick: (s: Service) => void;
  card: (selected: boolean, disabled?: boolean) => string; aed: (fils: number) => string;
}) {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const name = (x: { nameEn: string; nameAr: string }) => (ar ? x.nameAr || x.nameEn : x.nameEn || x.nameAr);
  const [q, setQ] = useState("");
  const [catKey, setCatKey] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const needle = q.trim().toLowerCase();
  const long = services.length > 12;
  const selected = services.find((s) => s.id === selectedId);

  const priced = useMemo(() => services.filter((s) => !isInspection(s)), [services]);
  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const s of services.filter(isInspection)) {
      const g = s.group;
      const key = g?.en ?? "";
      const entry = map.get(key) ?? { key, en: g?.en ?? t("booking.otherServices"), ar: g?.ar ?? t("booking.otherServices"), order: g?.order ?? 999, icon: g?.icon ?? "", items: [] };
      entry.items.push(s);
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [services, t]);
  const groupName = (g: { en: string; ar: string }) => (ar ? g.ar || g.en : g.en);

  const label = (s: Service) => {
    const p = fromPrice(s, regionId);
    if (p === null) return t("booking.notAvailable");
    return isInspection(s) ? t("booking.afterInspection") : `${t("booking.from")} ${aed(p)}`;
  };
  const pick = (s: Service) => { onPick(s); setChanging(false); setQ(""); setCatKey(null); };

  const row = (s: Service, showGroup = false) => {
    const ok = fromPrice(s, regionId) !== null;
    const desc = ar ? s.descriptionAr : s.descriptionEn;
    return (
      <button key={s.id} type="button" disabled={!ok} aria-pressed={selectedId === s.id} onClick={() => pick(s)} className={card(selectedId === s.id, !ok)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">{name(s)}</p>
            {showGroup && s.group && <p className="mt-0.5 text-[11px] text-text-faint">{groupName(s.group)}</p>}
            {desc && <p className="mt-1 text-xs text-text-muted">{desc}</p>}
            {serviceNote(s, ar) && <p className="mt-1 text-xs text-amber-200">ⓘ {serviceNote(s, ar)}</p>}
          </div>
          <p className="shrink-0 text-xs text-accent-2">{label(s)}</p>
        </div>
      </button>
    );
  };

  // A short list stays a plain list.
  if (!long) return <div className="flex flex-col gap-3">{services.map((s) => row(s))}</div>;

  // The chosen service folds into one card.
  if (selected && !changing) {
    return (
      <div className="osta-card osta-glow-border flex items-center gap-3 p-4">
        {selected.group?.icon ? <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-2"><DynamicIcon name={selected.group.icon} size={20} /></span> : null}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-text-faint">{t("booking.selectedService")}</p>
          <p className="truncate text-sm font-semibold text-text">{name(selected)}</p>
          <p className="text-xs text-accent-2">{label(selected)}</p>
        </div>
        <button type="button" onClick={() => setChanging(true)} className="shrink-0 rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-text hover:border-accent">{t("booking.change")}</button>
      </div>
    );
  }

  const search = (
    <label className="relative block">
      <Search size={16} aria-hidden className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-text-faint" />
      <input value={q} onChange={(e) => { setQ(e.target.value); setCatKey(null); }} placeholder={t("booking.searchServices")} aria-label={t("booking.searchServices")} className="osta-input w-full rounded-xl py-3.5 pe-4 ps-11 text-sm" />
    </label>
  );

  if (needle) {
    const hits = services.filter((s) => `${s.nameEn} ${s.nameAr} ${s.slug} ${s.descriptionEn ?? ""} ${s.descriptionAr ?? ""}`.toLowerCase().includes(needle));
    return (
      <div className="flex flex-col gap-3">
        {search}
        {hits.length === 0 && <p className="text-sm text-text-muted">{t("booking.noMatches")}</p>}
        {hits.slice(0, MAX_RESULTS).map((s) => row(s, true))}
        {hits.length > MAX_RESULTS && <p className="text-center text-xs text-text-faint">{t("booking.refineSearch")}</p>}
      </div>
    );
  }

  const open = catKey !== null ? groups.find((g) => g.key === catKey) : null;
  if (open) {
    return (
      <div className="flex flex-col gap-3">
        {search}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setCatKey(null)} className="flex items-center gap-1 rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-text hover:border-accent">
            <ChevronLeft size={14} aria-hidden className="rtl:rotate-180" /> {t("booking.allCategories")}
          </button>
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{groupName(open)} <span className="text-xs font-normal text-text-faint">({open.items.length})</span></h3>
        </div>
        {open.items.map((s) => row(s))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {search}
      {priced.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-faint">{t("booking.pricedNow")}</p>
          {priced.map((s) => row(s))}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-faint">{t("booking.browseCategories")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {groups.map((g) => (
            <button key={g.key} type="button" onClick={() => setCatKey(g.key)} className="osta-card osta-pick flex flex-col items-start gap-2 p-4 text-start">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-2"><DynamicIcon name={g.icon || "Wrench"} size={20} /></span>
              <span className="text-sm font-semibold leading-snug text-text">{groupName(g)}</span>
              <span className="text-[11px] text-text-faint">{g.items.length} {t("booking.servicesWord")}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
