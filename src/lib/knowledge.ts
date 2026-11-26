// The Knowledge Center on the public site. The facts come from the ERP (/api/v1/knowledge), which sends only what the owner has
// checked plus the lines read from its own screens (contact, packages, areas, profiles). `null` = the page is switched off.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://osta-invoices.vercel.app/api/v1";

export type KnowledgeItem = { id: string; type: string; titleEn: string; titleAr: string; bodyEn: string; bodyAr: string; sourceUrl: string; verifiedAt: string | null; automatic: boolean; schema: boolean };
export type KnowledgeSection = { key: string; titleEn: string; titleAr: string; items: KnowledgeItem[] };
export type Knowledge = { indexable: boolean; llms: boolean; latestCheck: string | null; sections: KnowledgeSection[] };
export type Lang = "en" | "ar";

// Never cached, so switching the page off or changing a fact in the admin shows at once. (The sitemap may pass a revalidate time.)
export async function fetchKnowledge(revalidate?: number): Promise<Knowledge | null> {
  try {
    const res = await fetch(`${API_BASE}/knowledge`, revalidate ? { next: { revalidate } } : { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { data: Knowledge | null }).data ?? null;
  } catch {
    return null;
  }
}

export const titleOf = (i: { titleEn: string; titleAr: string }, lang: Lang) => (lang === "ar" ? i.titleAr || i.titleEn : i.titleEn || i.titleAr);
export const bodyOf = (i: { bodyEn: string; bodyAr: string }, lang: Lang) => (lang === "ar" ? i.bodyAr || i.bodyEn : i.bodyEn || i.bodyAr);
export const allItems = (k: Knowledge) => k.sections.flatMap((s) => s.items);

// Short company lines make the "at a glance" table; longer texts are listed with their section.
export const GLANCE_MAX = 220;
export const glanceItems = (k: Knowledge, lang: Lang) => (k.sections.find((s) => s.key === "company")?.items ?? []).filter((i) => bodyOf(i, lang).length <= GLANCE_MAX);
export const factsText = (items: KnowledgeItem[], lang: Lang) => items.map((i) => `${titleOf(i, lang)}: ${bodyOf(i, lang).replace(/\s*\n\s*/g, " ")}`).join("\n");

// Questions typed by visitors rarely match letter for letter, in Arabic especially.
export function normalizeText(v: string): string {
  return v.toLowerCase().replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

const SKIP = new Set(["the", "a", "an", "is", "are", "do", "does", "did", "you", "your", "i", "my", "how", "what", "which", "can", "in", "of", "to", "for", "and", "or", "much", "it", "we", "with", "on", "osta", "هل", "ما", "ماهي", "هي", "هو", "في", "من", "على", "كم", "كيف", "او", "و", "عن", "الي", "اسطا", "خدمات"]);

// The checked answers that best match a question, from their own words only: nothing is written or guessed here.
export function searchKnowledge(items: KnowledgeItem[], query: string, lang: Lang, limit = 5): KnowledgeItem[] {
  const all = normalizeText(query).split(" ").filter(Boolean);
  const words = all.filter((w) => w.length > 1 && !SKIP.has(w));
  if (!words.length) return [];
  // In English a word has to begin a word ("ac" is not "contact"); Arabic words carry prefixes such as "ال", so any part may match.
  const has = (text: string, word: string) => (lang === "ar" ? text.includes(word) : ` ${text}`.includes(` ${word}`));
  return items
    .map((item) => {
      const title = normalizeText(titleOf(item, lang));
      const body = normalizeText(bodyOf(item, lang));
      const found = words.filter((w) => has(title, w) || has(body, w));
      return { item, found: found.length, score: found.reduce((n, w) => n + (has(title, w) ? 3 : 1), 0) };
    })
    // At least half of the meaningful words, so one shared word does not look like an answer.
    .filter((r) => r.found * 2 >= words.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}

export function faqJsonLd(k: Knowledge, lang: Lang) {
  const questions = allItems(k).filter((i) => i.type === "FAQ" && i.schema && !i.automatic);
  if (!questions.length) return null;
  return { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: lang, mainEntity: questions.map((i) => ({ "@type": "Question", name: titleOf(i, lang), acceptedAnswer: { "@type": "Answer", text: bodyOf(i, lang) } })) };
}

// A phone number written with spaces turns around inside Arabic text unless it is kept left to right. Splits a text so that
// the numbers can be drawn that way; the odd positions of the result are the numbers.
export const splitPhones = (text: string) => text.split(/(\+\d[\d ()-]{5,}\d)/);

export const safeSource = (v: string) => /^(https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/.test(v);
export const sectionAnchor = (key: string) => `topic-${key.replace(/[^a-z0-9-]/gi, "")}`;
