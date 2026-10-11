"use client";

import { useEffect, useState } from "react";
import { FullPageSpinner } from "@/components/Spinner";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, type PricingConfig } from "@/lib/api";
import { PricedBookingFlow } from "@/components/booking/PricedBookingFlow";
import { LegacyBookingForm } from "@/components/booking/LegacyBookingForm";

// Priced booking is used once the admin has set at least one emirate price; until then
// (or if the pricing API is unreachable) the original request form keeps working.
export default function NewOrderPage() {
  const { ready } = useRequireAuth();
  const [config, setConfig] = useState<PricingConfig | null | undefined>(undefined);

  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        setConfig(await api.pricingConfig());
      } catch {
        setConfig(null);
      }
    });
  }, []);

  if (!ready || config === undefined) return <FullPageSpinner />;

  const hasPrices = !!config && config.services.some((s) => s.prices.length > 0) && config.bookingTypes.length > 0;
  return hasPrices ? <PricedBookingFlow config={config} /> : <LegacyBookingForm />;
}
