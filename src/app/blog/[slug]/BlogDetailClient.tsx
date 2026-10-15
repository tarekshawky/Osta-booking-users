"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useLanguage } from "@/lib/language-context";
import type { BlogDetail } from "@/lib/api";
import type { BlockData } from "@/lib/cms-data";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { BlogCard } from "@/components/blog/BlogCard";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { useSite } from "@/lib/site-context";
import { categoryPath } from "@/lib/blogPaths";
import { RichBody } from "@/components/cms/RichInline";

export function BlogDetailClient({ post, blockData, services = [] }: { post: BlogDetail; blockData: BlockData | null; services?: { slug: string; nameEn: string; nameAr: string }[] }) {
  const { t, lang } = useLanguage();
  const { serviceAreas } = useSite();
  const cats = [post.category, ...(post.secondaryCategories ?? [])].filter((c): c is NonNullable<typeof c> => !!c);
  const areaLinks = serviceAreas.filter((a) => a.pageSlug);

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
        <Breadcrumbs
          items={[
            { label: t("blog.home"), href: "/" },
            { label: t("blog.pageTitle"), href: "/blog" },
            ...(post.category ? [{ label: lang === "ar" ? post.category.nameAr : post.category.nameEn, href: categoryPath(post.category.slug) }] : []),
            { label: title },
          ]}
        />
        <Link href="/blog" className="mt-4 flex items-center gap-1 text-sm text-text-muted hover:text-text">
          <ChevronLeft size={16} className="osta-flip-rtl" /> {t("blog.backToBlog")}
        </Link>

        {cats.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label={t("blog.inCategory")}>
            {cats.map((c) => (
              <li key={c.slug}>
                <Link href={categoryPath(c.slug)} className="inline-block rounded-full border border-card-border px-3 py-1 text-xs font-medium text-accent-2 transition-colors hover:border-accent">
                  {lang === "ar" ? c.nameAr : c.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        )}

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
            width={1024}
            height={288}
            className="osta-card mt-6 h-56 w-full object-cover sm:h-72"
          />
        )}

        {!blockData && (
          <div className="osta-card mt-8 p-6">
            <RichBody text={content} className="text-sm leading-relaxed text-text-muted" />
          </div>
        )}
      </article>

      {/* An article built from blocks in the admin shows them in place of the plain text. */}
      {blockData && post.blocks && <BlockRenderer blocks={post.blocks} data={blockData} />}

      {(post.related?.length ?? 0) > 0 && (
        <section className="mx-auto w-full max-w-6xl px-5 pb-12" aria-labelledby="related-articles">
          <h2 id="related-articles" className="mb-5 text-xl font-bold text-text">{t("blog.related")}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {post.related!.map((r) => <BlogCard key={r.slug} post={r} />)}
          </div>
        </section>
      )}

      {/* Internal links to the services and the places we actually serve (only areas with a published page). */}
      {(services.length > 0 || areaLinks.length > 0) && (
        <section className="mx-auto w-full max-w-2xl px-5 pb-10">
          {services.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-text">{t("blog.servicesWeOffer")}</h2>
              <ul className="flex flex-wrap gap-2">
                {services.map((s) => <li key={s.slug}><Link href={`/services/${s.slug}`} className="inline-block rounded-full border border-card-border px-3 py-1 text-xs text-text-muted hover:border-accent hover:text-text">{lang === "ar" ? s.nameAr : s.nameEn}</Link></li>)}
              </ul>
            </div>
          )}
          {areaLinks.length > 0 && (
            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold text-text">{t("blog.areasWeServe")}</h2>
              <ul className="flex flex-wrap gap-2">
                {areaLinks.map((a) => <li key={a.slug}><Link href={`/${a.pageSlug}`} className="inline-block rounded-full border border-card-border px-3 py-1 text-xs text-text-muted hover:border-accent hover:text-text">{lang === "ar" ? a.nameAr : a.nameEn}</Link></li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="mx-auto w-full max-w-2xl px-5 pb-14">
        <Link
          href="/pricing"
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
