import type { Metadata } from "next";
import { PricingClient } from "./PricingClient";
import { api, ServiceSummary, type PricingConfig } from "@/lib/api";

export const revalidate = 60;

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
  // Once the admin has entered prices, the page becomes the live calculator; until then the old list stays.
  let config: PricingConfig | null = null;
  try {
    const c = await api.pricingConfig();
    if (c.services.some((s) => s.prices.length > 0) && c.bookingTypes.length > 0) config = c;
  } catch {
    // Pricing API unreachable: fall back to the list.
  }
  return <PricingClient services={services} config={config} />;
}
