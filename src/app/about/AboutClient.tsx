"use client";

import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useLanguage } from "@/lib/language-context";

export function AboutClient() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main>

      <section className="mx-auto w-full max-w-2xl px-5 py-16">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">{t("about.pageTitle")}</h1>

        <div className="osta-card osta-glow-border mt-8 p-6">
          <p className="text-base font-medium leading-relaxed text-text">{t("about.heroText")}</p>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-text-muted">{t("about.bodyText")}</p>

        <Link
          href="/orders/new"
          className="osta-btn-primary mt-8 block rounded-xl px-6 py-3.5 text-center text-sm font-semibold text-white"
        >
          {t("home.bookService")}
        </Link>
      </section>

      </main>

      <MarketingFooter />
    </div>
  );
}
