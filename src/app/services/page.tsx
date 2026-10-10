import type { Metadata } from "next";
import { ServicesClient } from "./ServicesClient";
import { api, ServiceSummary } from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Services",
  description: "AC repair, cleaning, installation, electrical, and home maintenance services across the UAE.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  let services: ServiceSummary[] = [];
  try {
    services = await api.services();
  } catch {
    // Render an empty state rather than crash the page.
  }
  return <ServicesClient services={services} />;
}
