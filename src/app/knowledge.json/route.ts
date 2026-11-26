import { fetchKnowledge } from "@/lib/knowledge";
import { SITE_URL } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

// The Knowledge Center as data, for assistants and other software. "Not found" while the public page is switched off.
export async function GET() {
  const data = await fetchKnowledge();
  if (!data) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const body = {
    name: "Osta Services Knowledge Center",
    page: `${SITE_URL}/knowledge-center`,
    latestCheck: data.latestCheck,
    sections: data.sections.map((s) => ({
      title: { en: s.titleEn, ar: s.titleAr },
      entries: s.items.map((i) => ({ type: i.type, title: { en: i.titleEn, ar: i.titleAr }, text: { en: i.bodyEn, ar: i.bodyAr }, source: i.sourceUrl.startsWith("/") ? `${SITE_URL}${i.sourceUrl}` : i.sourceUrl || null, verifiedAt: i.verifiedAt, updatedAutomatically: i.automatic })),
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Access-Control-Allow-Origin": "*", ...(data.indexable ? {} : { "X-Robots-Tag": "noindex, nofollow" }) },
  });
}
