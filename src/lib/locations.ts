import { API_BASE } from "@/lib/cms";

// A real branch (office) as the admin API sends it. The website only shows it: every address, link and map comes from Website → Locations.
export type PublicBranch = {
  slug: string; areaSlug: string; areaNameEn: string; areaNameAr: string;
  nameEn: string; nameAr: string; branchNameEn: string; branchNameAr: string;
  addressEn: string; addressAr: string;
  latitude: number; longitude: number;
  mapsUrl: string; embedUrl: string; directionsUrl: string; appleMapsUrl: string; businessProfileUrl: string; reviewsUrl: string;
  phone: string; telHref: string; whatsappUrl: string; email: string;
  hoursSummary: { en: string; ar: string };
  images: string[]; rating: { value: number; count: number } | null;
  coverage: { nameEn: string; nameAr: string }[];
  faqs: { question: { en: string; ar: string }; answer: { en: string; ar: string } }[];
  categories: { nameEn: string; nameAr: string; href: string | null }[];
};

// Defence in depth: whatever the API sends, only Google's embeddable map addresses go into an iframe, and only safe links into a link.
export const isSafeEmbed = (u: string) => /^https:\/\/www\.google\.com\/maps\/embed(?:[/?]|$)/i.test(u) || /^https:\/\/(www|maps)\.google\.com\/maps\?[^#]*\boutput=embed\b/i.test(u);
export const safeLink = (u: string) => (/^(https:\/\/|tel:|mailto:|\/(?!\/))/i.test(u) ? u : "");

// "Osta Services – Home Maintenance Company in Ajman": the heading of a branch section.
export const branchHeading = (b: PublicBranch, ar: boolean) => (ar ? `${b.nameAr} – شركة صيانة منزلية في ${b.areaNameAr}` : `${b.nameEn} – Home Maintenance Company in ${b.areaNameEn}`);

// The WhatsApp link opens the chat with a ready message naming the branch.
export const whatsappWithText = (b: PublicBranch, ar: boolean) =>
  b.whatsappUrl ? `${b.whatsappUrl}?text=${encodeURIComponent(ar ? `مرحباً ${b.nameAr}، أريد حجز خدمة.` : `Hello ${b.nameEn}, I would like to book a service.`)}` : "";

// Where "Read our reviews" goes: the reviews link, else the Business Profile, else the map page.
export const reviewsLink = (b: PublicBranch) => safeLink(b.reviewsUrl || b.businessProfileUrl || b.mapsUrl);

// The pages' breadcrumb trail: Home › (parent) › this page.
export function crumbs(page: { slug: string; titleEn: string; titleAr: string; parent?: { slug: string; titleEn: string; titleAr: string } | null }, ar: boolean) {
  return [
    { label: ar ? "الرئيسية" : "Home", href: "/" },
    ...(page.parent ? [{ label: ar ? page.parent.titleAr || page.parent.titleEn : page.parent.titleEn, href: `/${page.parent.slug}` }] : []),
    { label: ar ? page.titleAr || page.titleEn : page.titleEn, href: `/${page.slug}` },
  ];
}

export async function fetchLocations(): Promise<PublicBranch[]> {
  try {
    const res = await fetch(`${API_BASE}/locations`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { locations?: PublicBranch[] } };
    return Array.isArray(json.data?.locations) ? json.data.locations : [];
  } catch {
    return [];
  }
}
