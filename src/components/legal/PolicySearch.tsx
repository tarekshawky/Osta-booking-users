"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { policyPath, type LegalCategory, type LegalHit } from "@/lib/legal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://osta-invoices.vercel.app/api/v1";
const T = {
  en: { ph: "Search the policies, e.g. “Can I cancel my AC booking?”", all: "All categories", none: "No matching clause. Try other words, or contact us.", searching: "Searching…", clause: "Clause", error: "Search is not available right now." },
  ar: { ph: "ابحث في السياسات، مثال: «هل يمكنني إلغاء حجز المكيف؟»", all: "كل التصنيفات", none: "لا يوجد بند مطابق. جرّب كلمات أخرى أو تواصل معنا.", searching: "جارٍ البحث…", clause: "البند", error: "البحث غير متاح حاليًا." },
} as const;

export function PolicySearch({ categories, lang }: { categories: LegalCategory[]; lang: "en" | "ar" }) {
  const t = T[lang];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [state, setState] = useState<{ q: string; hits: LegalHit[]; error?: boolean } | null>(null);
  const trimmed = q.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const ctl = new AbortController();
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/legal/search?${new URLSearchParams({ q: trimmed, lang, ...(cat ? { category: cat } : {}), country: "AE" })}`, { signal: ctl.signal });
        const json = (await res.json()) as { data?: { hits: LegalHit[] } };
        setState({ q: trimmed, hits: json.data?.hits ?? [] });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setState({ q: trimmed, hits: [], error: true });
      }
    }, 250);
    return () => { window.clearTimeout(id); ctl.abort(); };
  }, [trimmed, cat, lang]);

  const current = trimmed.length >= 2 ? state : null;
  const loading = trimmed.length >= 2 && (!state || state.q !== trimmed);
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} aria-label={t.ph} className="w-full flex-1 rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-text placeholder:text-text-muted" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t.all} className="rounded-xl border border-card-border bg-card px-3 py-3 text-sm text-text">
          <option value="">{t.all}</option>
          {categories.map((c) => <option key={c.key} value={c.key}>{lang === "ar" ? c.nameAr : c.nameEn}</option>)}
        </select>
      </div>
      {loading && <p className="text-sm text-text-muted">{t.searching}</p>}
      {!loading && current?.error && <p className="text-sm text-red-400">{t.error}</p>}
      {!loading && current && !current.error && (
        current.hits.length === 0 ? <p className="text-sm text-text-muted">{t.none}</p> : (
          <ul className="space-y-2">
            {current.hits.map((h) => (
              <li key={`${h.slug}-${h.sectionId}`} className="osta-card p-4">
                <Link href={`${policyPath(h.slug, { lang })}#sec-${h.sectionId}`} className="font-semibold text-accent-2">{lang === "ar" ? h.titleAr : h.titleEn}{h.number ? ` · ${t.clause} ${h.number}` : ""}</Link>
                <p className="mt-0.5 text-sm font-medium text-text">{lang === "ar" ? h.headingAr : h.headingEn}</p>
                <p className="mt-1 text-sm text-text-muted">{h.snippet}</p>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
