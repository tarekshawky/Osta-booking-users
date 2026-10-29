"use client";

import { useMemo, useState } from "react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { JobCard } from "@/components/jobs/JobCard";
import { tx } from "@/lib/jobsText";
import { useLanguage } from "@/lib/language-context";
import type { OpenJobs } from "@/lib/api";

const PAGE_SIZE = 12;

// The jobs list: every open job (both languages), filtered in the browser so the filters answer instantly.
export function JobsListView({ jobs }: { jobs: OpenJobs }) {
  const { lang, t } = useLanguage();
  const ar = lang === "ar";
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [emirate, setEmirate] = useState("");
  const [area, setArea] = useState("");
  const [property, setProperty] = useState("");
  const [page, setPage] = useState(1);

  const emirates = useMemo(() => [...new Map(jobs.items.map((j) => [j.emirateKey, ar ? j.emirateAr : j.emirateEn])).entries()], [jobs.items, ar]);
  const properties = useMemo(() => [...new Map(jobs.items.filter((j) => j.propertyKey).map((j) => [j.propertyKey!, ar ? j.propertyAr! : j.propertyEn!])).entries()], [jobs.items, ar]);
  const categories = useMemo(() => [...new Map(jobs.items.map((j) => [j.categoryKey, ar ? j.categoryAr : j.categoryEn])).entries()], [jobs.items, ar]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const a = area.trim().toLowerCase();
    return jobs.items.filter((j) =>
      (!type || j.type === type) && (!category || j.categoryKey === category) && (!emirate || j.emirateKey === emirate) && (!property || j.propertyKey === property) &&
      (!a || (j.area ?? "").toLowerCase().includes(a)) && (!needle || `${j.titleEn} ${j.titleAr}`.toLowerCase().includes(needle)),
    );
  }, [jobs.items, q, type, category, emirate, area, property]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const reset = () => { setQ(""); setType(""); setCategory(""); setEmirate(""); setArea(""); setProperty(""); setPage(1); };
  const field = "osta-input w-full rounded-xl px-3 py-3 text-sm";
  const on = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-5 pt-8">
          <Breadcrumbs items={[{ label: t("blog.home"), href: "/" }, { label: ar ? "انضم إلى فريقنا" : "Join OSTA Team", href: "/join-osta-team" }, { label: tx(lang, "jobsTitle") }]} />
        </section>
        <section className="mx-auto w-full max-w-6xl px-5 pb-6 pt-6 text-center">
          <h1 className="text-3xl font-extrabold text-text sm:text-4xl">{tx(lang, "jobsTitle")}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-text-muted">{tx(lang, "jobsSubtitle")}</p>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-16">
          <div className="osta-card grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <input value={q} onChange={(e) => on(setQ)(e.target.value)} placeholder={tx(lang, "search")} aria-label={tx(lang, "search")} className={`${field} lg:col-span-3`} />
            <select value={type} onChange={(e) => on(setType)(e.target.value)} className={field} aria-label={tx(lang, "allTypes")}>
              <option value="">{tx(lang, "allTypes")}</option><option value="DAILY">{tx(lang, "daily")}</option><option value="PERMANENT">{tx(lang, "permanent")}</option>
            </select>
            <select value={category} onChange={(e) => on(setCategory)(e.target.value)} className={field} aria-label={tx(lang, "allCategories")}>
              <option value="">{tx(lang, "allCategories")}</option>{categories.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <select value={emirate} onChange={(e) => on(setEmirate)(e.target.value)} className={field} aria-label={tx(lang, "allEmirates")}>
              <option value="">{tx(lang, "allEmirates")}</option>{emirates.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <input value={area} onChange={(e) => on(setArea)(e.target.value)} placeholder={tx(lang, "area")} aria-label={tx(lang, "area")} className={field} />
            <select value={property} onChange={(e) => on(setProperty)(e.target.value)} className={field} aria-label={tx(lang, "allProperty")}>
              <option value="">{tx(lang, "allProperty")}</option>{properties.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <button type="button" onClick={reset} className="rounded-xl border border-card-border px-5 py-3 text-sm text-text-muted hover:border-accent">{tx(lang, "reset")}</button>
          </div>

          {shown.length === 0 ? (
            <div className="osta-card mt-6 px-6 py-14 text-center">
              <p className="text-lg font-bold text-text">{tx(lang, "noJobs")}</p>
              <p className="mt-1 text-sm text-text-muted">{tx(lang, "noJobsHint")}</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((j) => <JobCard key={j.slug} job={j} />)}</div>
          )}

          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-4 text-sm" aria-label="Pagination">
              <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="rounded-lg border border-card-border px-4 py-2 text-text disabled:opacity-40">{tx(lang, "previous")}</button>
              <span className="text-text-muted">{tx(lang, "page")} {current} {tx(lang, "of")} {pages} · {filtered.length}</span>
              <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className="rounded-lg border border-card-border px-4 py-2 text-text disabled:opacity-40">{tx(lang, "next")}</button>
            </nav>
          )}
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
