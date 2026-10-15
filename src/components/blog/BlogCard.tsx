"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { categoryPath } from "@/lib/blogPaths";
import type { BlogSummary } from "@/lib/api";

export function formatBlogDate(iso: string | null | undefined, lang: "en" | "ar") {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", { day: "2-digit", month: "short", year: "numeric" });
}

// One article card: cover, category label (a link to the category page), date, title, short excerpt and Read more.
export function BlogCard({ post, featured = false }: { post: BlogSummary; featured?: boolean }) {
  const { t, lang } = useLanguage();
  const title = lang === "ar" ? post.titleAr : post.titleEn;
  const excerpt = lang === "ar" ? post.excerptAr : post.excerptEn;
  const cat = post.category;
  return (
    <article className="osta-card relative flex flex-col overflow-hidden">
      <Link href={`/blog/${post.slug}`} className="block" aria-label={title} tabIndex={-1}>
        {post.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt="" width={640} height={320} loading="lazy" className="h-44 w-full object-cover" />
        ) : (
          <div className="h-44 w-full bg-gradient-to-br from-card to-bg-elevated" />
        )}
      </Link>
      {featured && <span className="absolute start-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">{t("blog.featuredBadge")}</span>}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {cat && (
            <Link href={categoryPath(cat.slug)} className="font-semibold text-accent-2 hover:underline">
              {lang === "ar" ? cat.nameAr : cat.nameEn}
            </Link>
          )}
          {post.publishedAt && <time dateTime={post.publishedAt} className="text-text-faint">{formatBlogDate(post.publishedAt, lang)}</time>}
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-text">
          <Link href={`/blog/${post.slug}`} className="hover:text-accent-2">{title}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-text-muted">{excerpt}</p>
        <Link href={`/blog/${post.slug}`} className="mt-4 flex items-center gap-0.5 text-xs font-medium text-accent-2">
          {t("blog.readMore")} <ChevronRight size={14} className="osta-flip-rtl" />
        </Link>
      </div>
    </article>
  );
}
