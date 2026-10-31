import type { Metadata } from "next";
import { ServicesClient } from "./ServicesClient";
import { api, type CatalogCategory, type ServiceSummary } from "@/lib/api";
import { CmsRouteView } from "@/components/cms/CmsRouteView";
import { overrideMetadata, publishedOverride } from "@/lib/builtInPage";

export const revalidate = 60;

const BUILT_IN: Metadata = {
  title: "Our Services",
  description: "AC repair, cleaning, installation, electrical, and home maintenance services across the UAE.",
  alternates: { canonical: "/services" },
};

export const generateMetadata = () => overrideMetadata("services", BUILT_IN);

export default async function ServicesPage() {
  const cms = await publishedOverride("services");
  if (cms) return <CmsRouteView page={cms} />;
  let services: ServiceSummary[] = [];
  let catalog: CatalogCategory[] = [];
  try {
    services = await api.services();
  } catch {
    // Render an empty state rather than crash the page.
  }
  try {
    catalog = (await api.catalog()).categories;
  } catch {
    // The catalogue section is simply left out when the API is briefly unavailable.
  }
  return <ServicesClient services={services} catalog={catalog} />;
}
