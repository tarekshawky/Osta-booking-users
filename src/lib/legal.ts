// The Legal Center on the public site: published documents come from the ERP (/api/v1/legal). Text is the frozen published version.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://osta-invoices.vercel.app/api/v1";

export type LegalSection = { id: string; level: 1 | 2 | 3; headingEn: string; headingAr: string; bodyEn: string; bodyAr: string };
export type LegalSummary = { number: number; code: string; slug: string; kind: string; countries: string[]; titleEn: string; titleAr: string; summaryEn: string; summaryAr: string; version: number; effectiveDate: string | null; publishedAt: string };
export type LegalCategory = { key: string; slug: string; nameEn: string; nameAr: string; documents: LegalSummary[] };
export type LegalDoc = {
  code: string; number: number; slug: string; kind: string; countries: string[]; category: { key: string; nameEn: string; nameAr: string };
  version: number; isLatest: boolean; titleEn: string; titleAr: string; summaryEn: string; summaryAr: string; introEn: string; introAr: string; sections: LegalSection[];
  seo: { titleEn?: string; titleAr?: string; descriptionEn?: string; descriptionAr?: string }; effectiveDate: string | null; publishedAt: string;
  versions: { version: number; publishedAt: string; effectiveDate: string | null; changeNote: string }[];
  related: { slug: string; titleEn: string; titleAr: string }[]; previous: { slug: string; titleEn: string; titleAr: string } | null; next: { slug: string; titleEn: string; titleAr: string } | null;
};
export type LegalHit = { slug: string; titleEn: string; titleAr: string; categoryKey: string; sectionId: string; number: string; headingEn: string; headingAr: string; snippet: string; score: number };

async function get<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate, tags: ["legal"] } });
    if (!res.ok) return null;
    return ((await res.json()) as { data: T }).data;
  } catch {
    return null;
  }
}

export const legalIndex = async () => (await get<{ categories: LegalCategory[] }>("/legal"))?.categories ?? [];
export const legalDoc = (slug: string, version?: number) => get<LegalDoc>(`/legal/${encodeURIComponent(slug)}${version ? `?version=${version}` : ""}`);

// ---- numbering and the small writing format (same rules as the admin) ----
export function numberSections(sections: Pick<LegalSection, "level">[]): string[] {
  let major = 0, minor = 0;
  return sections.map((s) => {
    if (s.level === 1) return "";
    if (s.level === 2) { major += 1; minor = 0; return String(major); }
    minor += 1;
    return `${major || 1}.${minor}`;
  });
}

export type Block = { t: "p"; text: string } | { t: "h"; text: string } | { t: "ul"; items: string[] } | { t: "ol"; items: string[] } | { t: "notice"; text: string } | { t: "table"; rows: string[][] };

export function parseBody(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) { blocks.push({ t: "p", text: para.join(" ").trim() }); para = []; } };
  const last = () => blocks[blocks.length - 1];
  for (const raw of (text ?? "").replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^###\s+(.*)$/))) { flush(); blocks.push({ t: "h", text: m[1] }); }
    else if ((m = line.match(/^>\s?(.*)$/))) { flush(); const l = last(); if (l?.t === "notice") l.text += " " + m[1]; else blocks.push({ t: "notice", text: m[1] }); }
    else if ((m = line.match(/^[-*•]\s+(.*)$/))) { flush(); const l = last(); if (l?.t === "ul") l.items.push(m[1]); else blocks.push({ t: "ul", items: [m[1]] }); }
    else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) { flush(); const l = last(); if (l?.t === "ol") l.items.push(m[1]); else blocks.push({ t: "ol", items: [m[1]] }); }
    else if (line.startsWith("|")) {
      flush();
      const cells = line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      const l = last(); if (l?.t === "table") l.rows.push(cells); else blocks.push({ t: "table", rows: [cells] });
    } else para.push(line);
  }
  flush();
  return blocks;
}

export type Inline = { t: "text"; text: string } | { t: "bold"; text: string } | { t: "link"; text: string; href: string };
export const safeHref = (h: string) => /^(\/(?!\/)|https:\/\/|mailto:|tel:)/i.test(h.trim());

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let i = 0, m: RegExpExecArray | null;
  const s = text ?? "";
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({ t: "text", text: s.slice(i, m.index) });
    if (m[1] !== undefined) out.push({ t: "bold", text: m[1] });
    else if (safeHref(m[3])) out.push({ t: "link", text: m[2], href: m[3] });
    else out.push({ t: "text", text: m[2] });
    i = m.index + m[0].length;
  }
  if (i < s.length) out.push({ t: "text", text: s.slice(i) });
  return out;
}

export const readingMinutes = (text: string) => Math.max(1, Math.round((text ?? "").split(/\s+/).filter(Boolean).length / 200));

export const policyPath = (slug: string, o: { lang?: "en" | "ar" | null; version?: number | null } = {}) => {
  const q = new URLSearchParams();
  if (o.lang) q.set("lang", o.lang);
  if (o.version) q.set("version", String(o.version));
  const s = q.toString();
  return `/policies/${slug}${s ? `?${s}` : ""}`;
};
