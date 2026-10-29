"use client";

import Link from "next/link";
import { jobPath } from "@/lib/jobsPaths";
import { tx } from "@/lib/jobsText";
import { useLanguage } from "@/lib/language-context";
import type { OpenJobListItem } from "@/lib/api";

export function JobCard({ job }: { job: OpenJobListItem }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const pick = <T,>(en: T, a: T) => (ar ? a : en);
  const daily = job.type === "DAILY";
  const duration = pick(job.durationEn, job.durationAr);
  const wage = pick(job.wageEn, job.wageAr);
  const start = pick(job.startEn, job.startAr);
  const deadline = pick(job.deadlineEn, job.deadlineAr);
  const property = pick(job.propertyEn, job.propertyAr);
  const href = jobPath(job.slug);
  return (
    <article className="osta-card flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        <span className={`rounded-full px-2.5 py-1 ${daily ? "bg-amber-400/15 text-amber-300" : "bg-accent/15 text-accent-2"}`}>{tx(lang, daily ? "daily" : "permanent")}</span>
        <span className="rounded-full border border-card-border px-2.5 py-1 text-text-muted">{pick(job.categoryEn, job.categoryAr)}</span>
      </div>
      <h2 className="text-base font-semibold leading-snug text-text"><Link href={href} className="hover:text-accent-2">{pick(job.titleEn, job.titleAr)}</Link></h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-text-muted">
        <div><dt className="sr-only">{tx(lang, "location")}</dt><dd>📍 {pick(job.emirateEn, job.emirateAr)}{job.area ? ` – ${job.area}` : ""}</dd></div>
        {property && <div><dt className="sr-only">{tx(lang, "propertyType")}</dt><dd>🏠 {property}</dd></div>}
        <div><dt className="sr-only">{tx(lang, "workersNeeded")}</dt><dd>👷 {tx(lang, "workersNeeded")}: {pick(job.workersEn, job.workersAr)}</dd></div>
        {daily && duration && <div><dt className="sr-only">{tx(lang, "duration")}</dt><dd>📅 {tx(lang, "duration")}: {duration}</dd></div>}
        {wage && <div className="col-span-2"><dt className="sr-only">{tx(lang, daily ? "dailyWage" : "monthlySalary")}</dt><dd>💰 {wage}</dd></div>}
        {start && <div><dt className="sr-only">{tx(lang, "startDate")}</dt><dd>🗓️ {start}</dd></div>}
        {deadline && <div><dt className="sr-only">{tx(lang, "deadline")}</dt><dd>⏰ {deadline}</dd></div>}
      </dl>
      <Link href={href} className="osta-btn-primary mt-auto rounded-xl px-5 py-2.5 text-center text-sm font-semibold text-white">{tx(lang, "applyNow")}</Link>
    </article>
  );
}
