"use client";

import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { CmsPage } from "@/lib/cms";
import type { ServiceSummary } from "@/lib/api";

export function CmsPageView({ page, services, banner }: { page: CmsPage; services: ServiceSummary[]; banner?: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      {banner && <div className="bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-black">{banner}</div>}
      <MarketingNav />
      <main className="flex-1">
        <BlockRenderer blocks={page.blocks} services={services} />
      </main>
      <MarketingFooter />
    </div>
  );
}
