import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The customer portal is behind login anyway, but keep crawlers out of
        // it and the raw API routes rather than relying on auth alone.
        disallow: ["/dashboard", "/orders", "/invoices", "/profile", "/more"],
      },
    ],
    sitemap: "https://www.ostaservices.com/sitemap.xml",
  };
}
