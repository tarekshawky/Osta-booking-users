export const BLOG_PAGE_SIZE = 9;

// Address of a blog list page. Page 1 never carries ?page=, so there is one address per page (no duplicate URLs).
export function blogListPath(basePath: string, page: number, q?: string): string {
  const qs = new URLSearchParams();
  if (page > 1) qs.set("page", String(page));
  if (q) qs.set("q", q);
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export const categoryPath = (slug: string) => `/blog/category/${slug}`;

// "?page=" from the address: a positive whole number, otherwise 1.
export function parsePage(value: string | string[] | undefined): number {
  const n = parseInt(Array.isArray(value) ? value[0] : (value ?? "1"), 10);
  return Number.isFinite(n) && n > 0 && n < 10_000 ? n : 1;
}
