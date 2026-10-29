import type { Metadata } from "next";
import { JobsListView } from "@/components/jobs/JobsListView";
import { api, type OpenJobs } from "@/lib/api";
import { JOBS_PATH } from "@/lib/jobsPaths";
import { tx } from "@/lib/jobsText";
import { serverLang } from "@/lib/serverLang";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await serverLang();
  const title = tx(lang, "jobsTitle");
  return {
    title,
    description: tx(lang, "jobsSubtitle"),
    alternates: { canonical: JOBS_PATH },
    openGraph: { title, description: tx(lang, "jobsSubtitle"), type: "website" },
  };
}

export default async function JobsPage() {
  const jobs = await api.openJobs({ limit: 100 }).catch(() => ({ listUrl: "", items: [] }) as OpenJobs);
  return <JobsListView jobs={jobs} />;
}
