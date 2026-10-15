import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogDetailClient } from "./BlogDetailClient";
import { api, ApiError } from "@/lib/api";
import { loadBlockData } from "@/lib/cms-data";
import { pick, serverLang } from "@/lib/serverLang";
import { keywordList } from "@/lib/keywords";
import { SITE_URL } from "@/lib/siteUrl";

export const revalidate = 300;

async function getPost(slug: string) {
  try {
    return await api.blogPost(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [post, lang] = await Promise.all([getPost(slug), serverLang()]);
  if (!post) return {};

  const title = pick(lang, post.seoTitleEn || post.titleEn, post.seoTitleAr || post.titleAr);
  const description = pick(lang, post.seoDescriptionEn || post.excerptEn, post.seoDescriptionAr || post.excerptAr);
  return {
    title,
    description,
    keywords: keywordList(pick(lang, post.seoKeywordsEn, post.seoKeywordsAr)),
    // One address per article: the plain /blog/<slug>, whatever category the visitor came from.
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      ...(post.category ? { section: pick(lang, post.category.nameEn, post.category.nameAr) } : {}),
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const [lang, services] = await Promise.all([serverLang(), api.services().catch(() => [])]);
  const catName = post.category ? pick(lang, post.category.nameEn, post.category.nameAr) : "";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: pick(lang, post.titleEn, post.titleAr),
      description: pick(lang, post.excerptEn, post.excerptAr),
      datePublished: post.publishedAt,
      inLanguage: lang,
      mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
      author: { "@type": "Organization", name: post.authorName || "OSTA Services" },
      publisher: { "@type": "Organization", name: "OSTA Services" },
      ...(catName ? { articleSection: catName } : {}),
      ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: pick(lang, "Home", "الرئيسية"), item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: pick(lang, "Blog", "المدونة"), item: `${SITE_URL}/blog` },
        ...(post.category ? [{ "@type": "ListItem", position: 3, name: catName, item: `${SITE_URL}/blog/category/${post.category.slug}` }] : []),
        { "@type": "ListItem", position: post.category ? 4 : 3, name: pick(lang, post.titleEn, post.titleAr), item: `${SITE_URL}/blog/${slug}` },
      ],
    },
  ];

  return (
    <>
      {jsonLd.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x).replace(/</g, "\\u003c") }} />)}
      <BlogDetailClient post={post} blockData={post.blocks?.length ? await loadBlockData(post.blocks) : null} services={services.slice(0, 8).map((s) => ({ slug: s.slug, nameEn: s.nameEn, nameAr: s.nameAr }))} />
    </>
  );
}
