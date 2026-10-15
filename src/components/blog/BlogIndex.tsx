"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { BlogCard } from "@/components/blog/BlogCard";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { useLanguage } from "@/lib/language-context";
import { blogListPath, categoryPath } from "@/lib/blogPaths";
import type { BlogCategory, BlogSummary } from "@/lib/api";

// The blog index and the category pages share this layout: heading, search, category navigation, an optional featured
// section, the article cards and pagination. Categories, search and pages are real links, so crawlers can follow them.
export function BlogIndex({
  categories, active, posts, featured, page, totalPages, total, q, basePath,
}: {
  categories: BlogCategory[]; active: BlogCategory | null; posts: BlogSummary[]; featured: BlogSummary[];
  page: number; totalPages: number; total: number; q: string; basePath: string;
}) {
  const { t, lang } = useLanguage();
  const name = (c: { nameEn: string; nameAr: string }) => (lang === "ar" ? c.nameAr : c.nameEn);
  const heading = active ? name(active) : t("blog.pageTitle");
  const description = active ? (lang === "ar" ? active.descriptionAr || active.descriptionEn : active.descriptionEn || active.descriptionAr) : t("blog.pageSubtitle");
  const crumbs = active
    ? [{ label: t("blog.home"), href: "/" }, { label: t("blog.pageTitle"), href: "/blog" }, { label: name(active) }]
    : [{ label: t("blog.home"), href: "/" }, { label: t("blog.pageTitle") }];

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-5 pt-8">
          <Breadcrumbs items={crumbs} />
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-6 pt-6 text-center">
          <h1 className="text-3xl font-extrabold text-text sm:text-4xl">{heading}</h1>
          {description && <p className="mx-auto mt-3 max-w-2xl text-sm text-text-muted">{description}</p>}

          <form action={basePath} method="get" role="search" className="mx-auto mt-6 flex max-w-md items-center gap-2">
            <div className="osta-input relative flex flex-1 items-center gap-2 rounded-xl px-4 py-3">
              <Search size={16} className="shrink-0 text-text-faint" aria-hidden />
              <input type="search" name="q" defaultValue={q} placeholder={t("blog.searchPlaceholder")} aria-label={t("blog.searchPlaceholder")} className="w-full bg-transparent text-sm text-text placeholder:text-text-faint focus:outline-none" />
            </div>
            <button type="submit" className="osta-btn-primary rounded-xl px-4 py-3 text-sm font-semibold text-white">{t("blog.search")}</button>
          </form>
        </section>

        {categories.length > 0 && (
          <nav aria-label={t("blog.categoriesNav")} className="mx-auto w-full max-w-6xl px-5">
            <ul className="flex flex-wrap justify-center gap-2">
              <li>
                <Link href="/blog" aria-current={!active ? "page" : undefined} className={`inline-block rounded-full border px-4 py-1.5 text-sm transition-colors ${!active ? "border-accent bg-accent/15 font-semibold text-text" : "border-card-border text-text-muted hover:border-accent hover:text-text"}`}>
                  {t("blog.allArticles")}
                </Link>
              </li>
              {categories.map((c) => {
                const on = active?.slug === c.slug;
                return (
                  <li key={c.slug}>
                    <Link href={categoryPath(c.slug)} aria-current={on ? "page" : undefined} className={`inline-block rounded-full border px-4 py-1.5 text-sm transition-colors ${on ? "border-accent bg-accent/15 font-semibold text-text" : "border-card-border text-text-muted hover:border-accent hover:text-text"}`}>
                      {name(c)} <span className="text-xs text-text-faint">({c.count})</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {featured.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 pt-12" aria-labelledby="blog-featured">
            <h2 id="blog-featured" className="mb-5 text-xl font-bold text-text">{t("blog.featured")}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => <BlogCard key={p.slug} post={p} featured />)}
            </div>
          </section>
        )}

        <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-12">
          {q && (
            <p className="mb-5 text-sm text-text-muted">
              {t("blog.searchResultsFor")} “{q}” · {total}{" "}
              <Link href={basePath} className="font-medium text-accent-2 hover:underline">{t("blog.clearSearch")}</Link>
            </p>
          )}
          {posts.length === 0 ? (
            <p className="osta-card p-8 text-center text-sm text-text-muted">{q ? t("blog.noSearchResults") : t("blog.noPosts")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => <BlogCard key={p.slug} post={p} />)}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label={t("blog.pagination")} className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {page > 1 && <Link href={blogListPath(basePath, page - 1, q)} rel="prev" className="rounded-full border border-card-border px-4 py-1.5 text-sm text-text-muted hover:border-accent hover:text-text">{t("blog.previous")}</Link>}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={blogListPath(basePath, n, q)} aria-current={n === page ? "page" : undefined} aria-label={`${t("blog.pageOf")} ${n}`} className={`h-9 min-w-9 rounded-full border px-3 text-center text-sm leading-9 ${n === page ? "border-accent bg-accent/15 font-semibold text-text" : "border-card-border text-text-muted hover:border-accent hover:text-text"}`}>
                  {n}
                </Link>
              ))}
              {page < totalPages && <Link href={blogListPath(basePath, page + 1, q)} rel="next" className="rounded-full border border-card-border px-4 py-1.5 text-sm text-text-muted hover:border-accent hover:text-text">{t("blog.nextPage")}</Link>}
            </nav>
          )}
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
