import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { fetchPublishedList } from "@/lib/cms";
import { jobPath, JOBS_PATH } from "@/lib/jobsPaths";
import { SITE_URL } from "@/lib/siteUrl";

const BASE_URL = SITE_URL;

// Rebuilt every 5 minutes, so pages, jobs and articles published later reach the sitemap without a new deployment.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/signup`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let serviceRoutes: MetadataRoute.Sitemap = [];
  let blogRoutes: MetadataRoute.Sitemap = [];

  try {
    const services = await api.services();
    serviceRoutes = services.map((s) => ({
      url: `${BASE_URL}/services/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    // Sitemap must still build if the content API is briefly unavailable.
  }

  try {
    const res = await api.blogPosts({ pageSize: 50 });
    blogRoutes = res.data.map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // Same as above.
  }

  // The jobs list and every job that is open for applications.
  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    const jobs = await api.openJobs({ limit: 100 });
    jobRoutes = [
      { url: `${BASE_URL}${JOBS_PATH}`, changeFrequency: "daily" as const, priority: 0.7 },
      ...jobs.items.map((j) => ({ url: `${BASE_URL}${jobPath(j.slug)}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ];
  } catch {
    // Same as above.
  }

  // Category pages with enough articles to stand on their own (thin ones stay out of the index and the sitemap).
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    categoryRoutes = (await api.blogCategories())
      .filter((c) => c.indexable)
      .map((c) => ({ url: `${BASE_URL}/blog/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 }));
  } catch {
    // Same as above.
  }

  // Published CMS pages that opted in to the sitemap.
  const cmsRoutes: MetadataRoute.Sitemap = (await fetchPublishedList())
    // A page hidden from search engines must not be advertised in the sitemap.
    .filter((p) => p.showInSitemap && !p.noindex)
    .map((p) => ({ url: `${BASE_URL}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 }));

  return [...staticRoutes, ...serviceRoutes, ...blogRoutes, ...jobRoutes, ...categoryRoutes, ...cmsRoutes];
}
