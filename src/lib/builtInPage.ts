import type { Metadata } from "next";
import { fetchPublishedPage, type CmsPage } from "@/lib/cms";

// About, Contact, Services, Blog and Pricing are built into the site. If the owner has published an editable page with
// the same address in the admin, that page is shown instead; otherwise (or after unpublishing) the built-in one is.
export async function publishedOverride(slug: string): Promise<CmsPage | null> {
  const found = await fetchPublishedPage(slug);
  return found && "page" in found ? found.page : null;
}

export async function overrideMetadata(slug: string, fallback: Metadata): Promise<Metadata> {
  const page = await publishedOverride(slug);
  if (!page) return fallback;
  const title = page.seo.titleEn || page.titleEn;
  const description = page.seo.descriptionEn || undefined;
  return {
    title,
    description,
    alternates: { canonical: page.seo.canonical || `/${slug}` },
    robots: page.seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, type: "website", ...(page.seo.ogImage && /^https?:/.test(page.seo.ogImage) ? { images: [page.seo.ogImage] } : {}) },
  };
}
