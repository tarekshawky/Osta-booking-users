import { api, type BlogCategory, type BlogSummary } from "@/lib/api";
import { BLOG_PAGE_SIZE } from "@/lib/blogPaths";

export type BlogIndexData = {
  categories: BlogCategory[]; posts: BlogSummary[]; featured: BlogSummary[]; total: number; totalPages: number; page: number;
};

// Everything a blog list page needs, tolerating a briefly unavailable API (an empty blog instead of an error page).
export async function loadBlogIndex({ category, page, q }: { category?: string; page: number; q: string }): Promise<BlogIndexData> {
  const [categories, list, featured] = await Promise.all([
    api.blogCategories().catch(() => [] as BlogCategory[]),
    api.blogPosts({ page, pageSize: BLOG_PAGE_SIZE, category, q: q || undefined }).catch(() => ({ data: [] as BlogSummary[], total: 0 })),
    // The Featured section is only for the first page of the main blog, without a search.
    !category && !q && page === 1 ? api.blogPosts({ pageSize: 3, featured: true }).then((r) => r.data).catch(() => [] as BlogSummary[]) : Promise.resolve([] as BlogSummary[]),
  ]);
  return { categories, posts: list.data, featured, total: list.total, totalPages: Math.max(1, Math.ceil(list.total / BLOG_PAGE_SIZE)), page };
}
