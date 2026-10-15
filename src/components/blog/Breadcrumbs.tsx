"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export type Crumb = { label: string; href?: string };

// Home › Blog › Category › Article. The last item is the current page (not a link).
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { t } = useLanguage();
  return (
    <nav aria-label={t("blog.breadcrumb")} className="text-xs text-text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="osta-flip-rtl text-text-faint" aria-hidden />}
            {c.href && i < items.length - 1 ? <Link href={c.href} className="hover:text-text">{c.label}</Link> : <span aria-current={i === items.length - 1 ? "page" : undefined} className="text-text">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
