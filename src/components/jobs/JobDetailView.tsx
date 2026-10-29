"use client";

import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ApplyForm } from "@/components/jobs/ApplyForm";
import { JOBS_PATH } from "@/lib/jobsPaths";
import { tx } from "@/lib/jobsText";
import { useLanguage } from "@/lib/language-context";
import type { JobDetail } from "@/lib/api";

// One job: the details, then (depending on its state) the application form or a closed / completed / cancelled message.
// Never shows applicant data, counts or internal notes (the API doesn't send them).
export function JobDetailView({ detail }: { detail: JobDetail }) {
  const { lang, t } = useLanguage();
  const ar = lang === "ar";
  const job = ar ? detail.ar : detail.en;
  const daily = job.type === "DAILY";
  const rows: [string, string | null][] = [
    [tx(lang, "location"), `${job.emirate}${job.area ? ` – ${job.area}` : ""}`],
    [tx(lang, "propertyType"), job.property],
    [tx(lang, "workersNeeded"), job.workersText],
    ...(daily
      ? ([[tx(lang, "duration"), job.durationText], [tx(lang, "dailyWage"), job.wage?.text ?? null], [tx(lang, "materials"), job.materials]] as [string, string | null][])
      : ([[tx(lang, "monthlySalary"), job.wage?.text ?? null], [tx(lang, "workingDaysWeek"), job.daysPerWeek ? String(job.daysPerWeek) : null]] as [string, string | null][])),
    [tx(lang, "workingHours"), job.hours],
    ...job.fields.map((f): [string, string] => [f.label, f.value]),
    [tx(lang, "startDate"), job.startDate],
    [tx(lang, "deadline"), job.deadline],
  ];
  const stateBox = (title: string | null, body: string, tone: string) => (
    <div className={`osta-card p-6 text-center ${tone}`} role="status">
      {title && <h2 className="text-2xl font-extrabold text-text">{title}</h2>}
      <p className={`mx-auto max-w-2xl leading-relaxed text-text-muted ${title ? "mt-3" : ""}`}>{body}</p>
      <Link href={JOBS_PATH} className="osta-btn-primary mt-5 inline-block rounded-xl px-6 py-3 font-semibold text-white">{tx(lang, "viewJobs")}</Link>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-4xl px-5 pt-8">
          <Breadcrumbs items={[{ label: t("blog.home"), href: "/" }, { label: ar ? "انضم إلى فريقنا" : "Join OSTA Team", href: "/join-osta-team" }, { label: tx(lang, "jobsTitle"), href: JOBS_PATH }, { label: job.title }]} />
        </section>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 pb-16 pt-6">
          <section className="osta-card p-5 sm:p-7">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className={`rounded-full px-3 py-1 ${daily ? "bg-amber-400/15 text-amber-300" : "bg-accent/15 text-accent-2"}`}>{tx(lang, daily ? "daily" : "permanent")}</span>
              <span className="rounded-full border border-card-border px-3 py-1 text-text-muted">{job.category}</span>
            </div>
            <h1 className="text-2xl font-extrabold leading-snug text-text sm:text-3xl">{job.title}</h1>
            {job.fallbackNote && <p className="mt-2 rounded-lg border border-card-border px-3 py-2 text-sm text-text-muted">{tx(lang, job.fallbackNote === "ar-only" ? "onlyArabic" : "onlyEnglish")}</p>}
            <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {rows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-card-border pb-2 text-sm"><dt className="text-text-muted">{k}</dt><dd className="font-semibold text-text">{v}</dd></div>
              ))}
            </dl>
            {job.descriptionHtml && (
              <div className="mt-6">
                <h2 className="mb-2 text-lg font-bold text-text">{tx(lang, "description")}</h2>
                {/* The description was rebuilt through the HTML allow-list when it was saved. */}
                <div className="rich-text leading-relaxed text-text-muted" dangerouslySetInnerHTML={{ __html: job.descriptionHtml }} />
              </div>
            )}
            {job.requirements && (
              <div className="mt-6"><h2 className="mb-2 text-lg font-bold text-text">{tx(lang, "requirements")}</h2><p className="whitespace-pre-line leading-relaxed text-text-muted">{job.requirements}</p></div>
            )}
          </section>

          {job.state === "open" ? (
            <ApplyForm
              key={lang}
              slug={detail.slug} lang={lang}
              skills={detail.form.skills.map((s) => ({ key: s.key, label: ar ? s.labelAr : s.labelEn }))}
              emirates={detail.form.emirates.map((e) => ({ key: e.key, label: ar ? e.ar : e.en }))}
              minPhotos={detail.form.minPhotos} maxPhotos={detail.form.maxPhotos} maxFileMb={detail.form.maxFileMb}
              privacyUrl={detail.form.privacyUrl} turnstileSiteKey={detail.form.turnstileSiteKey}
            />
          ) : job.state === "completed" ? (
            stateBox(tx(lang, "completedTitle"), tx(lang, "completedBody"), "border-violet-400/40")
          ) : job.state === "cancelled" ? (
            stateBox(tx(lang, "cancelledTitle"), tx(lang, "cancelledBody"), "border-red-400/40")
          ) : (
            stateBox(null, tx(lang, "closedBody"), "border-amber-400/40")
          )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
