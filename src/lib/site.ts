const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://osta-invoices.vercel.app/api/v1";

export type SiteMenuItem = {
  labelEn: string;
  labelAr: string;
  url: string;
  newTab: boolean;
  showDesktop: boolean;
  showMobile: boolean;
  children: SiteMenuItem[];
};

export type SiteSettings = {
  siteNameEn: string; siteNameAr: string; taglineEn: string; taglineAr: string; descriptionEn: string; descriptionAr: string;
  logoUrl: string; faviconUrl: string; defaultLocale: "en" | "ar"; allowIndexing: boolean; copyrightEn: string; copyrightAr: string;
  phone: string; whatsapp: string; whatsappMessageEn: string; whatsappMessageAr: string; email: string;
  addressEn: string; addressAr: string; hoursEn: string; hoursAr: string; mapsUrl: string; businessProfileUrl: string;
  headerCtaLabelEn: string; headerCtaLabelAr: string; headerCtaUrl: string; footerAreas: { en: string; ar: string }[];
};

export type SiteData = {
  settings: SiteSettings;
  menus: { header: SiteMenuItem[]; footer: SiteMenuItem[] };
  social: { platform: string; label: string; url: string }[];
};

const item = (url: string, labelEn: string, labelAr: string): SiteMenuItem => ({ url, labelEn, labelAr, newTab: false, showDesktop: true, showMobile: true, children: [] });

// Exactly what the site showed before the CMS existed. Used if the API is unreachable or a menu is empty,
// so the header/footer can never disappear.
export const DEFAULT_SITE: SiteData = {
  settings: {
    siteNameEn: "OSTA Services", siteNameAr: "خدمات أسطا", taglineEn: "Your Comfort. Our Priority.", taglineAr: "راحتك. أولويتنا.",
    descriptionEn: "Your comfort. Our priority. Manage your OSTA orders and invoices.", descriptionAr: "",
    logoUrl: "", faviconUrl: "", defaultLocale: "en", allowIndexing: true,
    copyrightEn: "All rights reserved.", copyrightAr: "جميع الحقوق محفوظة.",
    phone: "+971 56 867 6036", whatsapp: "971568676036", whatsappMessageEn: "", whatsappMessageAr: "", email: "info@ostaservices.com",
    addressEn: "", addressAr: "", hoursEn: "", hoursAr: "", mapsUrl: "", businessProfileUrl: "",
    headerCtaLabelEn: "Book Now", headerCtaLabelAr: "احجز الآن", headerCtaUrl: "/orders/new",
    footerAreas: [
      ["Dubai", "دبي"], ["Abu Dhabi", "أبوظبي"], ["Sharjah", "الشارقة"], ["Ajman", "عجمان"],
      ["Al Ain", "العين"], ["Ras Al Khaimah", "رأس الخيمة"], ["Umm Al Quwain", "أم القيوين"], ["Fujairah", "الفجيرة"],
    ].map(([en, ar]) => ({ en, ar })),
  },
  menus: {
    header: [item("/", "Home", "الرئيسية"), item("/services", "Services", "الخدمات"), item("/pricing", "Pricing", "الأسعار"), item("/blog", "Blog", "المدونة"), item("/about", "About Us", "من نحن"), item("/contact", "Contact", "تواصل معنا")],
    footer: [item("/services", "Services", "الخدمات"), item("/pricing", "Pricing", "الأسعار"), item("/blog", "Blog", "المدونة"), item("/about", "About Us", "من نحن")],
  },
  social: [],
};

// Cached ~60s; the admin also pings /api/revalidate. Always resolves: falls back to DEFAULT_SITE.
export async function fetchSite(): Promise<SiteData> {
  try {
    const res = await fetch(`${API_BASE}/cms/site`, { next: { revalidate: 60 } });
    if (!res.ok) return DEFAULT_SITE;
    const data = (await res.json())?.data as SiteData | null;
    if (!data?.settings) return DEFAULT_SITE;
    return {
      settings: { ...DEFAULT_SITE.settings, ...data.settings },
      menus: {
        header: data.menus?.header?.length ? data.menus.header : DEFAULT_SITE.menus.header,
        footer: data.menus?.footer?.length ? data.menus.footer : DEFAULT_SITE.menus.footer,
      },
      social: data.social ?? [],
    };
  } catch {
    return DEFAULT_SITE;
  }
}

export function whatsappHref(settings: SiteSettings, lang: "en" | "ar", message?: string): string {
  const text = message ?? (lang === "ar" ? settings.whatsappMessageAr : settings.whatsappMessageEn);
  return `https://wa.me/${settings.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
