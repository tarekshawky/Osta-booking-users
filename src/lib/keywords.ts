// The admin stores SEO keywords as a clean comma-separated line per language; Next's metadata wants a list.
export function keywordList(raw: string | null | undefined): string[] | undefined {
  const list = (raw ?? "").split(/[,،;\n]+/).map((k) => k.trim()).filter(Boolean);
  return list.length ? list : undefined;
}
