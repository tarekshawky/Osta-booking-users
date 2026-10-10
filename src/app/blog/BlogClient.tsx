"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useLanguage } from "@/lib/language-context";
import type { BlogSummary } from "@/lib/api";

export function BlogClient({ posts }: { posts: BlogSummary[] }) {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");

  function formatDate(iso: string | null) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((post) =>
      [post.titleEn, post.titleAr, post.excerptEn, post.excerptAr].some((field) =>
        field?.toLowerCase().includes(q)
      )
    );
  }, [posts, query]);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <section className="mx-auto w-full max-w-6xl px-5 py-14 text-center">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">{t("blog.pageTitle")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">{t("blog.pageSubtitle")}</p>

        {posts.length > 0 && (
          <div className="osta-input relative mx-auto mt-6 flex max-w-md items-center gap-2 rounded-xl px-4 py-3">
            <Search size={16} className="shrink-0 text-text-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("blog.searchPlaceholder")}
              className="w-full bg-transparent text-sm text-text placeholder:text-text-faint focus:outline-none"
            />
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20">
        {posts.length === 0 ? (
          <p className="osta-card p-8 text-center text-sm text-text-muted">{t("blog.noPosts")}</p>
        ) : filteredPosts.length === 0 ? (
          <p className="osta-card p-8 text-center text-sm text-text-muted">{t("blog.noSearchResults")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="osta-card flex flex-col overflow-hidden">
                {post.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImageUrl}
                    alt={lang === "ar" ? post.titleAr : post.titleEn}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 w-full bg-gradient-to-br from-card to-bg-elevated" />
                )}
                <div className="flex flex-1 flex-col p-6">
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <MarketingFooter />
    </div>
  );
}
