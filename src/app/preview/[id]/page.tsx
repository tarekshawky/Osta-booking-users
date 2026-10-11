import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPageView } from "@/components/cms/CmsPageView";
import { fetchPreviewPage } from "@/lib/cms";
import { api, type ServiceSummary } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

export default async function PreviewRoute({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) {
  const { id } = await params;
  const { token } = await searchParams;
  const page = token ? await fetchPreviewPage(id, token) : null;
  if (!page) notFound();

  let services: ServiceSummary[] = [];
  if (page.blocks.some((b) => b.type === "servicesGrid")) {
    try {
      services = await api.services();
    } catch {}
  }
  return <CmsPageView page={page} services={services} banner="Draft preview — not visible to visitors" />;
}
