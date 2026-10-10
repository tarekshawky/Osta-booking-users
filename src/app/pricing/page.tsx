import type { Metadata } from "next";
import { PricingClient } from "./PricingClient";
import { api, ServiceSummary } from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pricing",
  description: "Transparent, upfront pricing for AC repair, cleaning, installation, and home maintenance in the UAE.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  let services: ServiceSummary[] = [];
  try {
    services = await api.services();
  } catch {
    // Render an empty state rather than crash the page.
  }
  return <PricingClient services={services} />;
}
