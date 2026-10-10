"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useLanguage } from "@/lib/language-context";
import type { ServiceDetail } from "@/lib/api";

export function ServiceDetailClient({ service }: { service: ServiceDetail }) {
  const { t, lang } = useLanguage();
  const name = lang === "ar" ? service.nameAr : service.nameEn;
  const content = lang === "ar" ? service.contentAr : service.contentEn;

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <section className="mx-auto w-full max-w-3xl px-5 py-14">
        <Link href="/services" className="flex items-center gap-1 text-sm text-text-muted hover:text-text">
          <ChevronLeft size={16} className="osta-flip-rtl" /> {t("services.backToServices")}
        </Link>

        <h1 className="mt-5 text-3xl font-extrabold text-text sm:text-4xl">{name}</h1>

        {service.priceFrom != null && (
          <p className="mt-3 text-sm font-semibold text-accent-2">
            {t("services.startingFrom")} {t("common.aed")} {service.priceFrom}
            {service.priceNote ? ` · ${service.priceNote}` : ""}
          </p>
        )}

        <div className="osta-card mt-8 p-6">
          <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">{content}</p>
        </div>

        <Link
          href="/orders/new"
          className="osta-btn-primary mt-8 block rounded-xl px-6 py-3.5 text-center text-sm font-semibold text-white"
        >
          {t("services.bookThisService")}
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
