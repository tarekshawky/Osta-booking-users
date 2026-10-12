import type { Metadata } from "next";
import { BlogClient } from "./BlogClient";
import { api, BlogSummary } from "@/lib/api";
import { CmsRouteView } from "@/components/cms/CmsRouteView";
import { overrideMetadata, publishedOverride } from "@/lib/builtInPage";

export const revalidate = 60;

const BUILT_IN: Metadata = {
  title: "Blog",
  description: "Tips, guides, and news on AC maintenance and home care from the OSTA Services team.",
  alternates: { canonical: "/blog" },
};

export const generateMetadata = () => overrideMetadata("blog", BUILT_IN);

export default async function BlogPage() {
  const cms = await publishedOverride("blog");
  if (cms) return <CmsRouteView page={cms} />;
  let posts: BlogSummary[] = [];
  try {
    const res = await api.blogPosts({ pageSize: 50 });
    posts = res.data;
  } catch {
    // Render an empty state rather than crash the page.
  }
  return <BlogClient posts={posts} />;
}
