"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { crumbs } from "@/lib/locations";
import type { CmsPage } from "@/lib/cms";

// Home › (parent page) › this page. The same trail the page's BreadcrumbList structured data describes.
export function Breadcrumbs({ page }: { page: CmsPage }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const trail = crumbs(page, ar);
  return (
    <nav aria-label={ar ? "مسار التنقل" : "Breadcrumb"} className="mx-auto w-full max-w-5xl px-5 pt-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
        {trail.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} className="rtl:rotate-180" aria-hidden />}
            {i === trail.length - 1 ? <span aria-current="page" className="text-text">{c.label}</span> : <Link href={c.href} className="hover:text-text hover:underline">{c.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
