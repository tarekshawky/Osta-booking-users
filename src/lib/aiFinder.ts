import { API_BASE } from "@/lib/cms";

export type FinderMatch = { bookSlug: string; nameEn: string; nameAr: string; category: string; categoryAr: string; reason: string };
export type FinderAnswer = { matches: FinderMatch[]; note: string };
export type FinderFailure = "rate_limited" | "unavailable" | "invalid";

export const MAX_TEXT = 400;

// The booking link for the suggested services: one opens that service, several open one booking with all of them.
export const bookHref = (slugs: string[]) =>
  slugs.length === 1 ? `/pricing?service=${encodeURIComponent(slugs[0])}` : `/pricing?services=${slugs.map(encodeURIComponent).join(",")}`;

// Reads the API's answer; anything that does not look right is treated as "unavailable" rather than shown.
export function parseFinder(json: unknown): FinderAnswer | null {
  const d = (json as { data?: { matches?: unknown; note?: unknown } } | null)?.data;
  if (!d || !Array.isArray(d.matches) || typeof d.note !== "string") return null;
  const matches: FinderMatch[] = [];
  for (const m of d.matches as Record<string, unknown>[]) {
    if (typeof m?.bookSlug !== "string" || typeof m.nameEn !== "string" || typeof m.nameAr !== "string" || typeof m.reason !== "string") return null;
    matches.push({ bookSlug: m.bookSlug, nameEn: m.nameEn, nameAr: m.nameAr, category: typeof m.category === "string" ? m.category : "", categoryAr: typeof m.categoryAr === "string" ? m.categoryAr : "", reason: m.reason });
  }
  return { matches: matches.slice(0, 3), note: d.note };
}

export async function askFinder(text: string, lang: "en" | "ar", signal?: AbortSignal): Promise<{ ok: true; answer: FinderAnswer } | { ok: false; reason: FinderFailure }> {
  try {
    const res = await fetch(`${API_BASE}/ai/recommend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang }), signal });
    if (res.status === 429) return { ok: false, reason: "rate_limited" };
    if (res.status === 400) return { ok: false, reason: "invalid" };
    if (!res.ok) return { ok: false, reason: "unavailable" };
    const answer = parseFinder(await res.json());
    return answer ? { ok: true, answer } : { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
