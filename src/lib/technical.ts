import { API_BASE } from "@/lib/cms";
import type { AiPolicy } from "@/lib/technicalFiles";

export type TechnicalFiles = { aiPolicy: AiPolicy; robotsExtra: string; llms: string | null; ads: string | null; security: string | null };

const NONE: TechnicalFiles = { aiPolicy: "allow", robotsExtra: "", llms: null, ads: null, security: null };

// What the admin configured for robots.txt, llms.txt, ads.txt and security.txt. If the admin is briefly unreachable the
// safe defaults apply (standard robots.txt, no optional files).
export async function fetchTechnical(): Promise<TechnicalFiles> {
  try {
    const res = await fetch(`${API_BASE}/cms/technical`, { next: { revalidate: 60, tags: ["site"] } });
    if (!res.ok) return NONE;
    const d = (await res.json())?.data as Partial<TechnicalFiles> | undefined;
    return d ? { ...NONE, ...d } : NONE;
  } catch {
    return NONE;
  }
}

export function textResponse(body: string | null) {
  if (!body) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(body.endsWith("\n") ? body : `${body}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=60, s-maxage=60" },
  });
}
