const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://osta-invoices.vercel.app/api/v1";

export type Bi = { en: string; ar: string };
export type Cta = { label: Bi; url: string };

export type CmsBlock = {
  id: string;
  type: "hero" | "servicesGrid" | "richText" | "imageText" | "faq" | "stats" | "cta";
  props: Record<string, unknown>;
  hidden: boolean;
  visibility: { desktop: boolean; mobile: boolean };
};

export type CmsSeo = {
  titleEn?: string; titleAr?: string; descriptionEn?: string; descriptionAr?: string;
  canonical?: string; noindex?: boolean; ogImage?: string;
};

export type CmsPage = {
  id: string;
  slug: string;
  type: string;
  titleEn: string;
  titleAr: string;
  blocks: CmsBlock[];
  seo: CmsSeo;
  jsonLd?: Record<string, unknown>[];
  updatedAt: string;
};

export type CmsLookup = { page: CmsPage } | { redirect: string } | null;

// Server-side fetch of a published page (cached ~60s; the admin also pings /api/revalidate on publish).
export async function fetchPublishedPage(slug: string): Promise<CmsLookup> {
  try {
    const res = await fetch(`${API_BASE}/cms/pages/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.data?.redirect) return { redirect: json.data.redirect as string };
    return json?.data ? { page: json.data as CmsPage } : null;
  } catch {
    return null;
  }
}

export async function fetchPreviewPage(id: string, token: string): Promise<CmsPage | null> {
  try {
    const res = await fetch(`${API_BASE}/cms/preview/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json())?.data as CmsPage) ?? null;
  } catch {
    return null;
  }
}

export async function fetchPublishedList(): Promise<{ slug: string; showInSitemap: boolean; updatedAt: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/cms/pages`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return (await res.json()).data ?? [];
  } catch {
    return [];
  }
}
