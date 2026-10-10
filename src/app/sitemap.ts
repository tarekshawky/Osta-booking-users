import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

const BASE_URL = "https://www.ostaservices.com";

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

  return [...staticRoutes, ...serviceRoutes, ...blogRoutes];
}
