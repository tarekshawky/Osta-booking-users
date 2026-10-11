import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CmsPageView } from "@/components/cms/CmsPageView";
import { fetchPublishedPage, type CmsPage } from "@/lib/cms";
import { api, type ServiceSummary } from "@/lib/api";

export const revalidate = 60;

async function load(slug: string): Promise<CmsPage> {
  const found = await fetchPublishedPage(slug);
  if (!found) notFound();
  if ("redirect" in found) permanentRedirect(found.redirect);
  return found.page;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = await fetchPublishedPage(slug);
  if (!found || "redirect" in found) return {};
  const { page } = found;
  const title = page.seo.titleEn || page.titleEn;
  const description = page.seo.descriptionEn || undefined;
  return {
    title,
    description,
    alternates: { canonical: page.seo.canonical || `/${page.slug}` },
    robots: page.seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, type: "website", ...(page.seo.ogImage && /^https?:/.test(page.seo.ogImage) ? { images: [page.seo.ogImage] } : {}) },
  };
}

export default async function CmsRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await load(slug);
  let services: ServiceSummary[] = [];
  if (page.blocks.some((b) => b.type === "servicesGrid")) {
    try {
      services = await api.services();
    } catch {
      // The grid just hides itself if services are briefly unavailable.
    }
  }
  return <CmsPageView page={page} services={services} />;
}
