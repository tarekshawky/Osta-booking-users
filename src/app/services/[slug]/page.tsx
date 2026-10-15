import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailClient } from "./ServiceDetailClient";
import { api, ApiError } from "@/lib/api";
import { loadBlockData } from "@/lib/cms-data";
import { keywordList } from "@/lib/keywords";
import { pick, serverLang } from "@/lib/serverLang";

export const revalidate = 300;

async function getService(slug: string) {
  try {
    return await api.service(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [service, lang] = await Promise.all([getService(slug), serverLang()]);
  if (!service) return {};

  const title = pick(lang, service.seoTitleEn || service.nameEn, service.seoTitleAr || service.nameAr);
  const description = pick(lang, service.seoDescriptionEn || service.shortDescriptionEn, service.seoDescriptionAr || service.shortDescriptionAr);
  return {
    title,
    description,
    keywords: keywordList(pick(lang, service.seoKeywordsEn, service.seoKeywordsAr)),
    alternates: { canonical: `/services/${slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.nameEn,
    description: service.shortDescriptionEn,
    provider: { "@type": "LocalBusiness", name: "OSTA Services" },
    areaServed: "United Arab Emirates",
    ...(service.priceFrom != null
      ? { offers: { "@type": "Offer", priceCurrency: "AED", price: service.priceFrom } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServiceDetailClient service={service} blockData={service.blocks?.length ? await loadBlockData(service.blocks) : null} />
    </>
  );
}
