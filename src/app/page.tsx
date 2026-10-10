import type { Metadata } from "next";
import { HomeClient } from "./HomeClient";
import { api, ServiceSummary, BlogSummary } from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "OSTA Services — AC Repair & Home Maintenance in the UAE",
  description:
    "Trusted AC repair, cleaning, installation, and home maintenance services across the UAE. Transparent pricing, certified technicians, same-day service, and a 14-day warranty.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "OSTA Services — AC Repair & Home Maintenance in the UAE",
    description: "Trusted AC repair, cleaning, installation, and home maintenance services across the UAE.",
    type: "website",
  },
};

export default async function HomePage() {
  let services: ServiceSummary[] = [];
  let posts: BlogSummary[] = [];
  try {
    services = await api.services();
  } catch {
    // Marketing homepage must still render if the content API is briefly down.
  }
  try {
    const res = await api.blogPosts({ pageSize: 3 });
    posts = res.data;
  } catch {
    // Same as above -- blog preview is optional, never blocks the page.
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "OSTA Services",
    description: "AC repair, cleaning, installation, and home maintenance services across the UAE.",
    url: "https://www.ostaservices.com",
    telephone: "+971568676036",
    areaServed: [
      "Dubai",
      "Abu Dhabi",
      "Sharjah",
      "Ajman",
      "Al Ain",
      "Ras Al Khaimah",
      "Umm Al Quwain",
      "Fujairah",
    ],
    aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "197" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeClient services={services} posts={posts} />
    </>
  );
}
