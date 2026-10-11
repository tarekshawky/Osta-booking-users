"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useLanguage } from "@/lib/language-context";
import type { BlogDetail } from "@/lib/api";

export function BlogDetailClient({ post }: { post: BlogDetail }) {
  const { t, lang } = useLanguage();

  function formatDate(iso: string | null) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const title = lang === "ar" ? post.titleAr : post.titleEn;
  const content = lang === "ar" ? post.contentAr : post.contentEn;

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main>

      <article className="mx-auto w-full max-w-2xl px-5 py-14">
        <Link href="/blog" className="flex items-center gap-1 text-sm text-text-muted hover:text-text">
          <ChevronLeft size={16} className="osta-flip-rtl" /> {t("blog.backToBlog")}
        </Link>

        <h1 className="mt-5 text-3xl font-extrabold leading-tight text-text sm:text-4xl">{title}</h1>

        <p className="mt-3 text-xs text-text-faint">
          {post.authorName ? `${post.authorName} · ` : ""}
          {formatDate(post.publishedAt)}
        </p>

        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt={title}
            className="osta-card mt-6 h-56 w-full object-cover sm:h-72"
          />
        )}

        <div className="osta-card mt-8 p-6">
          <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">{content}</p>
        </div>

        <Link
          href="/orders/new"
          className="osta-btn-primary mt-8 block rounded-xl px-6 py-3.5 text-center text-sm font-semibold text-white"
        >
          {t("home.bookService")}
        </Link>
      </article>

      </main>

      <MarketingFooter />
    </div>
  );
}
