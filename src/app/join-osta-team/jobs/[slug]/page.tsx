import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetailView } from "@/components/jobs/JobDetailView";
import { api, ApiError, type JobDetail } from "@/lib/api";
import { jobPath } from "@/lib/jobsPaths";
import { serverLang } from "@/lib/serverLang";

export const revalidate = 60;

async function getJob(slug: string): Promise<JobDetail | null> {
  try {
    return await api.jobDetail(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [detail, lang] = await Promise.all([getJob(slug), serverLang()]);
  // Drafts and unknown addresses are not found, so they get no metadata at all.
  if (!detail) return { robots: { index: false, follow: false } };
  const p = lang === "ar" ? detail.ar : detail.en;
  const emirate = lang === "ar" ? detail.emirateAr : detail.emirateEn;
  const title = `${p.title} – ${emirate}`;
  const plain = p.descriptionHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const description = [p.category, `${emirate}${p.area ? ` – ${p.area}` : ""}`, p.wage && p.wage.kind !== "agreed" ? p.wage.text : null, plain ? plain.slice(0, 140) : null].filter(Boolean).join(" · ");
  return {
    title,
    description,
    alternates: { canonical: jobPath(slug) },
    robots: detail.status === "CANCELLED" ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description, type: "website", locale: lang === "ar" ? "ar_AE" : "en_US" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getJob(slug);
  if (!detail) notFound();
  const lang = await serverLang();
  // JobPosting data only while the job is open, and only with what the admin really entered.
  const ld = detail.jsonLd?.[lang] ?? null;
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}
      <JobDetailView detail={detail} />
    </>
  );
}
