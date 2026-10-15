import type { Metadata } from "next";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { CmsRouteView } from "@/components/cms/CmsRouteView";
import { overrideMetadata, publishedOverride } from "@/lib/builtInPage";
import { loadBlogIndex } from "@/lib/blogData";
import { blogListPath, parsePage } from "@/lib/blogPaths";
import { pick, serverLang } from "@/lib/serverLang";

export const revalidate = 60;

type Search = Promise<{ page?: string; q?: string }>;

const TITLE = { en: "Blog", ar: "المدونة" };
const DESCRIPTION = {
  en: "Tips, guides, and news on AC maintenance and home care from the OSTA Services team.",
  ar: "نصائح وأدلة وأخبار عن صيانة المكيفات والعناية بالمنزل من فريق خدمات أسطا.",
};

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { page: p, q } = await searchParams;
  const lang = await serverLang();
  const page = parsePage(p);
  const built: Metadata = {
    title: pick(lang, TITLE.en, TITLE.ar),
    description: pick(lang, DESCRIPTION.en, DESCRIPTION.ar),
    // One address per page: ?page=1 is the same page as /blog, and search results are not offered to search engines.
    alternates: { canonical: blogListPath("/blog", page) },
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
  return overrideMetadata("blog", built);
}

export default async function BlogPage({ searchParams }: { searchParams: Search }) {
  const cms = await publishedOverride("blog");
  if (cms) return <CmsRouteView page={cms} />;
  const { page: p, q = "" } = await searchParams;
  const data = await loadBlogIndex({ page: parsePage(p), q: q.trim().slice(0, 100) });
  return <BlogIndex categories={data.categories} active={null} posts={data.posts} featured={data.featured} page={data.page} totalPages={data.totalPages} total={data.total} q={q.trim().slice(0, 100)} basePath="/blog" />;
}
