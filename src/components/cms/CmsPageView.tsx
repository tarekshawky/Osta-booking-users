"use client";

import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { CmsPage } from "@/lib/cms";
import type { BlockData } from "@/lib/cms-data";
import { useLanguage } from "@/lib/language-context";
import { CodeInjection } from "@/components/CodeInjection";
import { Breadcrumbs } from "@/components/cms/Breadcrumbs";
import { LocationSection } from "@/components/cms/LocationSection";
import Link from "next/link";

export function CmsPageView({ page, data, banner }: { page: CmsPage; data: BlockData; banner?: string }) {
  const { lang } = useLanguage();
  const updated = new Date(page.updatedAt).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", { day: "2-digit", month: "long", year: "numeric" });
  return (
    <div className="flex min-h-screen flex-col">
      {/* Custom code for this page: never in the admin preview (the banner marks a preview). */}
      {!banner && <CodeInjection scope={`page:${page.id}`} code={page.code} />}
      {banner && <div className="bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-black">{banner}</div>}
      <MarketingNav />
      <main className="flex-1">
        {(page.type === "area" || page.parent) && <Breadcrumbs page={page} />}
        <BlockRenderer blocks={page.blocks} data={{ ...data, subPages: page.subPages ?? [] }} />
        {/* An emirate page shows its real branch(es) automatically: address, map, directions, call / WhatsApp, services, coverage, questions. */}
        {page.type === "area" && page.locations && page.locations.length > 0 && <LocationSection branches={page.locations} />}
        {/* The pages under an emirate page (its services there), linked so the emirate and its service pages reinforce each other. */}
        {page.type === "area" && !page.blocks.some((b) => b.type === "subPages" && !b.hidden) && page.subPages && page.subPages.length > 0 && (
          <section className="mx-auto w-full max-w-5xl px-5 pb-10" aria-label={lang === "ar" ? "المزيد في هذه الإمارة" : "More in this emirate"}>
            <h2 className="text-xl font-bold text-text">{lang === "ar" ? `خدماتنا في ${page.titleAr || page.titleEn}` : `Our services in ${page.titleEn}`}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {page.subPages.map((s) => <li key={s.slug}><Link href={`/${s.slug}`} className="inline-block rounded-full border border-card-border px-3 py-1.5 text-sm text-text hover:border-accent">{lang === "ar" ? s.titleAr || s.titleEn : s.titleEn}</Link></li>)}
            </ul>
          </section>
        )}
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
