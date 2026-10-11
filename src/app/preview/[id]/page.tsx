import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPageView } from "@/components/cms/CmsPageView";
import { fetchPreviewPage } from "@/lib/cms";
import { loadBlockData } from "@/lib/cms-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

export default async function PreviewRoute({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) {
  const { id } = await params;
  const { token } = await searchParams;
  const page = token ? await fetchPreviewPage(id, token) : null;
  if (!page) notFound();

  const data = await loadBlockData(page.blocks);
  return <CmsPageView page={page} data={data} banner="Draft preview — not visible to visitors" />;
}
