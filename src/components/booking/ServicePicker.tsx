"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { PricingConfig } from "@/lib/api";
import { fromPrice, isInspection, serviceNote } from "@/components/booking/shared";

type Service = PricingConfig["services"][number];

// The list of bookable services. A short list is shown as before; a long one (hundreds of services) gets a search box and is
// grouped by service category, with the groups folded until opened (or while searching).
export function ServicePicker({ services, regionId, selectedId, onPick, card, aed }: {
  services: Service[]; regionId: string; selectedId: string; onPick: (s: Service) => void;
  card: (selected: boolean, disabled?: boolean) => string; aed: (fils: number) => string;
}) {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const name = (x: { nameEn: string; nameAr: string }) => (ar ? x.nameAr || x.nameEn : x.nameEn || x.nameAr);
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const long = services.length > 12;
  const selected = services.find((s) => s.id === selectedId);
  const [open, setOpen] = useState<Set<string>>(() => new Set(selected?.group ? [selected.group.en] : []));

  const groups = useMemo(() => {
    const matches = needle ? services.filter((s) => `${s.nameEn} ${s.nameAr} ${s.slug} ${s.descriptionEn ?? ""} ${s.descriptionAr ?? ""}`.toLowerCase().includes(needle)) : services;
    const map = new Map<string, { key: string; en: string; ar: string; order: number; items: Service[] }>();
    for (const s of matches) {
      const g = s.group;
      const key = g?.en ?? "";
      const entry = map.get(key) ?? { key, en: g?.en ?? "", ar: g?.ar ?? "", order: g?.order ?? -1, items: [] };
      entry.items.push(s);
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [services, needle]);

  const label = (s: Service) => {
    if (fromPrice(s, regionId) === null) return t("booking.notAvailable");
    return isInspection(s) ? t("booking.afterInspection") : `${t("booking.from")} ${aed(fromPrice(s, regionId)!)}`;
  };
  const row = (s: Service) => {
    const ok = fromPrice(s, regionId) !== null;
    const desc = ar ? s.descriptionAr : s.descriptionEn;
    return (
      <button key={s.id} type="button" disabled={!ok} aria-pressed={selectedId === s.id} onClick={() => onPick(s)} className={card(selectedId === s.id, !ok)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text">{name(s)}</p>
            {desc && <p className="mt-1 text-xs text-text-muted">{desc}</p>}
            {serviceNote(s, ar) && <p className="mt-1 text-xs text-amber-200">ⓘ {serviceNote(s, ar)}</p>}
          </div>
          <p className="shrink-0 text-xs text-accent-2">{label(s)}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {long && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("booking.searchServices")} aria-label={t("booking.searchServices")} className="osta-input w-full rounded-xl px-4 py-3 text-sm" />}
      {groups.length === 0 && <p className="text-sm text-text-muted">{t("booking.noMatches")}</p>}
      {groups.map((g) => {
        // Ungrouped services (the ones priced in Dynamic Pricing) and short lists are shown straight away.
        if (!long || !g.key) return <div key={g.key || "ungrouped"} className="flex flex-col gap-3">{g.items.map(row)}</div>;
        const isOpen = !!needle || open.has(g.key);
        return (
          <div key={g.key} className="flex flex-col gap-3">
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen((o) => { const n = new Set(o); if (n.has(g.key)) n.delete(g.key); else n.add(g.key); return n; })} className="osta-card flex items-center justify-between px-4 py-3 text-start">
              <span className="text-sm font-semibold text-text">{ar ? g.ar || g.en : g.en} <span className="text-xs font-normal text-text-faint">({g.items.length})</span></span>
              <ChevronDown size={16} className={`shrink-0 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && <div className="flex flex-col gap-3 ps-3">{g.items.map(row)}</div>}
          </div>
        );
      })}
    </div>
  );
}
