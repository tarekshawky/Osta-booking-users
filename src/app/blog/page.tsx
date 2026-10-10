import type { Metadata } from "next";
import { BlogClient } from "./BlogClient";
import { api, BlogSummary } from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips, guides, and news on AC maintenance and home care from the OSTA Services team.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  let posts: BlogSummary[] = [];
  try {
    const res = await api.blogPosts({ pageSize: 50 });
    posts = res.data;
  } catch {
    // Render an empty state rather than crash the page.
  }
  return <BlogClient posts={posts} />;
}
