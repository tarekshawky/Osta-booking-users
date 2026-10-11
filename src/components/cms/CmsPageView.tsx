"use client";

import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { CmsPage } from "@/lib/cms";
import type { BlockData } from "@/lib/cms-data";
import { useLanguage } from "@/lib/language-context";

export function CmsPageView({ page, data, banner }: { page: CmsPage; data: BlockData; banner?: string }) {
  const { lang } = useLanguage();
  const updated = new Date(page.updatedAt).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", { day: "2-digit", month: "long", year: "numeric" });
  return (
    <div className="flex min-h-screen flex-col">
      {banner && <div className="bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-black">{banner}</div>}
      <MarketingNav />
      <main className="flex-1">
        <BlockRenderer blocks={page.blocks} data={data} />
        {page.showLastUpdated && (
          <p className="mx-auto max-w-3xl px-5 pb-10 text-center text-xs text-text-faint">
            {lang === "ar" ? "آخر تحديث:" : "Last updated:"} <time dateTime={page.updatedAt}>{updated}</time>
          </p>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
