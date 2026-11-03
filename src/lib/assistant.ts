import { API_BASE } from "@/lib/cms";

export type AssistantMatch = { bookSlug: string; nameEn: string; nameAr: string; category: string; categoryAr: string; priceText: string };
export type AssistantLink = { label: string; href: string };
export type AssistantReply = { answer: string; matches: AssistantMatch[]; links: AssistantLink[]; suggestions: string[] };
export type AssistantFailure = "rate_limited" | "unavailable" | "invalid";

export const MAX_QUESTION = 300;

// Links the assistant may show: pages of this site, WhatsApp, a phone call or an email. Anything else is dropped.
export const safeHref = (h: unknown): h is string => typeof h === "string" && /^(\/(?!\/)|https:\/\/wa\.me\/|tel:|mailto:)/.test(h);

// Reads the API's answer; anything that does not look right is refused (null), never shown.
export function parseReply(json: unknown): AssistantReply | null {
  const d = (json as { data?: Record<string, unknown> } | null)?.data;
  if (!d || typeof d.answer !== "string" || !Array.isArray(d.matches) || !Array.isArray(d.links) || !Array.isArray(d.suggestions)) return null;
  const matches: AssistantMatch[] = [];
  for (const m of d.matches as Record<string, unknown>[]) {
    if (typeof m?.bookSlug !== "string" || typeof m.nameEn !== "string" || typeof m.nameAr !== "string" || typeof m.priceText !== "string") return null;
    matches.push({ bookSlug: m.bookSlug, nameEn: m.nameEn, nameAr: m.nameAr, category: typeof m.category === "string" ? m.category : "", categoryAr: typeof m.categoryAr === "string" ? m.categoryAr : "", priceText: m.priceText });
  }
  const links = (d.links as Record<string, unknown>[]).flatMap((l) => (typeof l?.label === "string" && safeHref(l.href) ? [{ label: l.label, href: l.href }] : []));
  return { answer: d.answer, matches: matches.slice(0, 3), links: links.slice(0, 4), suggestions: (d.suggestions as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 6) };
}

export async function askAssistant(text: string, lang: "en" | "ar", signal?: AbortSignal): Promise<{ ok: true; reply: AssistantReply } | { ok: false; reason: AssistantFailure }> {
  try {
    const res = await fetch(`${API_BASE}/assistant/ask`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang }), signal });
    if (res.status === 429) return { ok: false, reason: "rate_limited" };
    if (res.status === 400) return { ok: false, reason: "invalid" };
    if (!res.ok) return { ok: false, reason: "unavailable" };
    const reply = parseReply(await res.json());
    return reply ? { ok: true, reply } : { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
