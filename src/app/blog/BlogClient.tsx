"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useLanguage } from "@/lib/language-context";
import type { BlogSummary } from "@/lib/api";

export function BlogClient({ posts }: { posts: BlogSummary[] }) {
  const { t, lang } = useLanguage();

  function formatDate(iso: string | null) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <section className="mx-auto w-full max-w-6xl px-5 py-14 text-center">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">{t("blog.pageTitle")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">{t("blog.pageSubtitle")}</p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20">
        {posts.length === 0 ? (
          <p className="osta-card p-8 text-center text-sm text-text-muted">{t("blog.noPosts")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="osta-card flex flex-col p-6">
                {post.publishedAt && (
                  <p className="text-xs text-text-faint">{formatDate(post.publishedAt)}</p>
                )}
                <h2 className="mt-1.5 text-lg font-semibold text-text">
                  {lang === "ar" ? post.titleAr : post.titleEn}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-text-muted">
                  {lang === "ar" ? post.excerptAr : post.excerptEn}
                </p>
                <span className="mt-4 flex items-center gap-0.5 text-xs font-medium text-accent-2">
                  {t("blog.readMore")} <ChevronRight size={14} className="osta-flip-rtl" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <MarketingFooter />
    </div>
  );
}
