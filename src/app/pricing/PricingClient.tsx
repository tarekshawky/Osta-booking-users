"use client";

import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useLanguage } from "@/lib/language-context";
import type { ServiceSummary } from "@/lib/api";

export function PricingClient({ services }: { services: ServiceSummary[] }) {
  const { t, lang } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <section className="mx-auto w-full max-w-4xl px-5 py-14 text-center">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">{t("pricing.pageTitle")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">{t("pricing.pageSubtitle")}</p>
      </section>

      <section className="mx-auto w-full max-w-4xl px-5 pb-20">
        <div className="osta-card overflow-hidden">
          {services.map((service, i) => (
            <div
              key={service.slug}
              className={`flex items-center justify-between gap-4 px-5 py-4 ${
                i > 0 ? "border-t border-card-border" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-text">
                  {lang === "ar" ? service.nameAr : service.nameEn}
                </p>
                {service.priceNote && <p className="text-xs text-text-faint">{service.priceNote}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-accent-2">
                  {service.priceFrom != null ? `${t("common.aed")} ${service.priceFrom}` : "—"}
                </span>
                <Link
                  href="/orders/new"
                  className="rounded-full border border-card-border px-3 py-1.5 text-xs font-medium text-text"
                >
                  {t("pricing.book")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
