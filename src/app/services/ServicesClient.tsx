"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useLanguage } from "@/lib/language-context";
import { CatalogBrowser } from "@/components/services/CatalogBrowser";
import type { CatalogCategory, ServiceSummary } from "@/lib/api";

export function ServicesClient({ services, catalog = [] }: { services: ServiceSummary[]; catalog?: CatalogCategory[] }) {
  const { t, lang } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 text-center">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">{t("services.pageTitle")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">{t("services.pageSubtitle")}</p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20">
        {services.length === 0 ? (
          <p className="osta-card p-8 text-center text-sm text-text-muted">{t("services.noServices")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`} className="osta-card flex flex-col p-6">
                <h2 className="text-lg font-semibold text-text">
                  {lang === "ar" ? service.nameAr : service.nameEn}
                </h2>
                <p className="mt-2 flex-1 text-sm text-text-muted">
                  {lang === "ar" ? service.shortDescriptionAr : service.shortDescriptionEn}
                </p>
                {service.priceFrom != null && (
                  <p className="mt-3 text-sm font-semibold text-accent-2">
                    {t("services.startingFrom")} {t("common.aed")} {service.priceFrom}
                  </p>
                )}
                <span className="mt-4 flex items-center gap-0.5 text-xs font-medium text-accent-2">
                  {t("home.moreLink")} <ChevronRight size={14} className="osta-flip-rtl" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <CatalogBrowser categories={catalog} />

      </main>

      <MarketingFooter />
    </div>
  );
}
