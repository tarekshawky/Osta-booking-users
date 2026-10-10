import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailClient } from "./ServiceDetailClient";
import { api, ApiError } from "@/lib/api";

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
  const service = await getService(slug);
  if (!service) return {};

  const title = service.seoTitleEn || service.nameEn;
  const description = service.seoDescriptionEn || service.shortDescriptionEn;
  return {
    title,
    description,
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
      <ServiceDetailClient service={service} />
    </>
  );
}
