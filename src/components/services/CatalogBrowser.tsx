"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { DynamicIcon } from "@/components/DynamicIcon";
import { useLanguage } from "@/lib/language-context";
import type { CatalogCategory } from "@/lib/api";

const MAX_RESULTS = 60;

// Every service of the Service Catalogue on the Services page: search, or pick a category, then Book (opens the booking page with
// that service already chosen) or read about it.
export function CatalogBrowser({ categories }: { categories: CatalogCategory[] }) {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const name = (x: { nameEn: string; nameAr: string }) => (ar ? x.nameAr || x.nameEn : x.nameEn || x.nameAr);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const needle = q.trim().toLowerCase();

  const hits = useMemo(() => {
    if (!needle) return [];
    const seen = new Set<string>();
    const out: { s: CatalogCategory["services"][number]; category: CatalogCategory }[] = [];
    for (const c of categories) for (const s of c.services) {
      const key = s.bookSlug ?? s.slug ?? s.nameEn;
      if (seen.has(key) || !`${s.nameEn} ${s.nameAr}`.toLowerCase().includes(needle)) continue;
      seen.add(key);
      out.push({ s, category: c });
    }
    return out;
  }, [categories, needle]);

  if (categories.length === 0) return null;

  const row = (s: CatalogCategory["services"][number], category: CatalogCategory, key: string) => (
    <div key={key} className="osta-card flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        {s.slug ? <Link href={`/${s.slug}`} className="text-sm font-semibold text-text hover:text-accent-2">{name(s)}</Link> : <p className="text-sm font-semibold text-text">{name(s)}</p>}
        {needle && <p className="mt-0.5 text-[11px] text-text-faint">{name(category)}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {s.slug && <Link href={`/${s.slug}`} className="hidden text-xs text-text-muted hover:text-text sm:block">{t("services.details")}</Link>}
        {s.bookSlug && <Link href={`/pricing?service=${encodeURIComponent(s.bookSlug)}`} className="osta-btn-primary rounded-lg px-4 py-2 text-xs font-semibold text-white">{t("services.book")}</Link>}
      </div>
    </div>
  );

  const current = open !== null ? categories[open] : null;
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-20">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold text-text sm:text-3xl">{t("services.allTitle")}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-text-muted">{t("services.allSubtitle")}</p>
      </div>

      <label className="relative mx-auto mb-6 block max-w-xl">
        <Search size={16} aria-hidden className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-text-faint" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(null); }} placeholder={t("services.searchAll")} aria-label={t("services.searchAll")} className="osta-input w-full rounded-xl py-3.5 pe-4 ps-11 text-sm" />
      </label>

      {needle ? (
        <div className="mx-auto flex max-w-3xl flex-col gap-2.5">
          {hits.length === 0 && <p className="text-center text-sm text-text-muted">{t("services.noResults")}</p>}
          {hits.slice(0, MAX_RESULTS).map(({ s, category }, i) => row(s, category, `${i}-${s.nameEn}`))}
        </div>
      ) : current ? (
        <div className="mx-auto flex max-w-3xl flex-col gap-2.5">
          <div className="mb-1 flex items-center gap-3">
            <button type="button" onClick={() => setOpen(null)} className="flex items-center gap-1 rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-text hover:border-accent">
              <ChevronLeft size={14} aria-hidden className="rtl:rotate-180" /> {t("services.allCategories")}
            </button>
            <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-text">{name(current)} <span className="text-xs font-normal text-text-faint">({current.services.length})</span></h3>
            {current.slug && <Link href={`/${current.slug}`} className="shrink-0 text-xs text-accent-2">{t("services.viewCategory")}</Link>}
          </div>
          {current.services.map((s, i) => row(s, current, `${i}-${s.nameEn}`))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c, i) => (
            <button key={c.nameEn} type="button" onClick={() => setOpen(i)} className="osta-card osta-pick flex flex-col items-start gap-3 p-5 text-start">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent-2"><DynamicIcon name={c.icon || "Wrench"} size={22} /></span>
              <span className="text-sm font-semibold leading-snug text-text">{name(c)}</span>
              <span className="flex items-center gap-1 text-[11px] text-text-faint">{c.services.length} {t("services.servicesCount")} <ChevronRight size={12} aria-hidden className="rtl:rotate-180" /></span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
