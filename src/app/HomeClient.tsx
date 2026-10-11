"use client";

import Link from "next/link";
import { ShieldCheck, Clock, BadgeCheck, Wrench, Star, Users, ThumbsUp, MapPin, ChevronRight } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { HomeSections } from "./HomeSections";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";
import type { ServiceSummary, BlogSummary, HomeSection } from "@/lib/api";

const TRUST_FEATURES: { icon: typeof ShieldCheck; key: TranslationKey }[] = [
  { icon: ShieldCheck, key: "home.trustTrusted" },
  { icon: Clock, key: "home.trustSameDay" },
  { icon: BadgeCheck, key: "home.trustWarranty" },
  { icon: Wrench, key: "home.trustPricing" },
];

const STATS = [
  { icon: Star, value: "5.0", key: "home.statRating" as TranslationKey },
  { icon: Users, value: "10K+", key: "home.statCustomers" as TranslationKey },
  { icon: ThumbsUp, value: "197+", key: "home.statReviews" as TranslationKey },
  { icon: MapPin, value: "7", key: "home.statEmirates" as TranslationKey },
];

export function HomeClient({
  services,
  posts,
  sections,
}: {
  services: ServiceSummary[];
  posts: BlogSummary[];
  sections: HomeSection[];
}) {
  const { t, lang } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 py-16 sm:py-24">
        <div
          className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent-2) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full border border-card-border px-4 py-1.5 text-xs text-accent-2">
            {t("home.heroEyebrow")}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-text sm:text-6xl">
            {t("home.heroTitleLine1")}{" "}
            <span className="bg-gradient-to-b from-accent-2 to-accent bg-clip-text text-transparent">
              {t("home.heroTitleLine2")}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-text-muted">{t("home.heroSubtitle")}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="osta-btn-primary w-full rounded-xl px-6 py-3.5 text-center text-sm font-semibold text-white sm:w-auto"
            >
              {t("home.bookService")}
            </Link>
            <Link
              href="/services"
              className="w-full rounded-xl border border-card-border px-6 py-3.5 text-center text-sm font-semibold text-text sm:w-auto"
            >
              {t("home.viewServices")}
            </Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {TRUST_FEATURES.map(({ icon: Icon, key }) => (
              <div key={key} className="osta-card flex flex-col items-center gap-2 px-3 py-4">
                <Icon size={20} className="text-accent-2" />
                <span className="text-xs text-text-muted">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-2">
            {t("home.servicesEyebrow")}
          </span>
          <h2 className="mt-2 text-2xl font-bold text-text sm:text-3xl">{t("home.servicesTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">{t("home.servicesSubtitle")}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <Link key={service.slug} href={`/services/${service.slug}`} className="osta-card group p-5">
              <h3 className="text-base font-semibold text-text">
                {lang === "ar" ? service.nameAr : service.nameEn}
              </h3>
              <p className="mt-1.5 text-sm text-text-muted">
                {lang === "ar" ? service.shortDescriptionAr : service.shortDescriptionEn}
              </p>
              <span className="mt-3 flex items-center gap-0.5 text-xs font-medium text-accent-2">
                {t("home.moreLink")} <ChevronRight size={14} className="osta-flip-rtl" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/services" className="text-sm font-semibold text-accent-2">
            {t("home.viewServices")}
          </Link>
        </div>
      </section>

      <HomeSections sections={sections} />

      {/* Stats */}
      <section className="border-y border-card-border bg-bg-elevated">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4">
          {STATS.map(({ icon: Icon, value, key }) => (
            <div key={key} className="flex flex-col items-center gap-2 text-center">
              <Icon size={20} className="text-accent-2" />
              <span className="text-xl font-bold text-text">{value}</span>
              <span className="text-xs text-text-muted">{t(key)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Blog preview */}
      {posts.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-accent-2">
              {t("home.blogEyebrow")}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-text sm:text-3xl">{t("home.blogTitle")}</h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {posts.slice(0, 3).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="osta-card flex flex-col overflow-hidden">
                {post.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverImageUrl} alt={lang === "ar" ? post.titleAr : post.titleEn} loading="lazy" className="h-40 w-full object-cover" />
                )}
                <div className="p-5">
                  <h3 className="text-base font-semibold text-text">
                    {lang === "ar" ? post.titleAr : post.titleEn}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-sm text-text-muted">
                    {lang === "ar" ? post.excerptAr : post.excerptEn}
                  </p>
                  <span className="mt-3 flex items-center gap-0.5 text-xs font-medium text-accent-2">
                    {t("blog.readMore")} <ChevronRight size={14} className="osta-flip-rtl" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/blog" className="text-sm font-semibold text-accent-2">
              {t("home.viewBlog")}
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto w-full max-w-4xl px-5 py-16 text-center">
        <div className="osta-card osta-glow-border px-6 py-12">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">{t("home.ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">{t("home.ctaSubtitle")}</p>
          <Link
            href="/pricing"
            className="osta-btn-primary mt-6 inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
          >
            {t("home.ctaButton")}
          </Link>
        </div>
      </section>

      </main>

      <MarketingFooter />
    </div>
  );
}
