import type { MetadataRoute } from "next";
import { fetchSite } from "@/lib/site";
import { SITE_URL } from "@/lib/siteUrl";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await fetchSite();
  // Admin switch: while the site is being rebuilt, tell every crawler to stay out.
  if (!settings.allowIndexing) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The customer portal is behind login anyway, but keep crawlers out of
        // it and the raw API routes rather than relying on auth alone.
        disallow: ["/dashboard", "/orders", "/invoices", "/profile", "/more", "/preview"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
