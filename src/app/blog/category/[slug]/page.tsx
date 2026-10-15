import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { api, ApiError, type BlogCategory } from "@/lib/api";
import { loadBlogIndex } from "@/lib/blogData";
import { blogListPath, categoryPath, parsePage } from "@/lib/blogPaths";
import { pick, serverLang } from "@/lib/serverLang";
import { SITE_URL } from "@/lib/siteUrl";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string; q?: string }> };

async function getCategory(slug: string): Promise<BlogCategory | null> {
  try {
    return await api.blogCategory(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page: p, q } = await searchParams;
  const [cat, lang] = await Promise.all([getCategory(slug), serverLang()]);
  if (!cat) return {};
  const name = pick(lang, cat.nameEn, cat.nameAr);
  const title = pick(lang, cat.seoTitleEn, cat.seoTitleAr) || name;
  const description = pick(lang, cat.seoDescriptionEn, cat.seoDescriptionAr) || pick(lang, cat.descriptionEn, cat.descriptionAr) || undefined;
  return {
    title,
    description,
    alternates: { canonical: blogListPath(categoryPath(slug), parsePage(p)) },
    // Thin-page protection: a category with only a few articles, and any search result, stays out of search engines.
    ...(!cat.indexable || q ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, type: "website", ...(cat.coverImageUrl ? { images: [cat.coverImageUrl] } : {}) },
  };
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: p, q = "" } = await searchParams;
  const cat = await getCategory(slug);
  if (!cat) notFound();
  const query = q.trim().slice(0, 100);
  const data = await loadBlogIndex({ category: slug, page: parsePage(p), q: query });
  const lang = await serverLang();
  const name = pick(lang, cat.nameEn, cat.nameAr);

  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: pick(lang, "Home", "الرئيسية"), item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: pick(lang, "Blog", "المدونة"), item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name, item: `${SITE_URL}${categoryPath(slug)}` },
      ],
    },
    { "@context": "https://schema.org", "@type": "CollectionPage", name, description: pick(lang, cat.descriptionEn, cat.descriptionAr) || undefined, url: `${SITE_URL}${categoryPath(slug)}`, inLanguage: lang },
  ];

  return (
    <>
      {jsonLd.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x).replace(/</g, "\\u003c") }} />)}
      <BlogIndex categories={data.categories} active={cat} posts={data.posts} featured={[]} page={data.page} totalPages={data.totalPages} total={data.total} q={query} basePath={categoryPath(slug)} />
    </>
  );
}
