import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogDetailClient } from "./BlogDetailClient";
import { api, ApiError } from "@/lib/api";

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
  const post = await getPost(slug);
  if (!post) return {};

  const title = post.seoTitleEn || post.titleEn;
  const description = post.seoDescriptionEn || post.excerptEn;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titleEn,
    description: post.excerptEn,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: post.authorName || "OSTA Services" },
    publisher: { "@type": "Organization", name: "OSTA Services" },
    ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogDetailClient post={post} />
    </>
  );
}
