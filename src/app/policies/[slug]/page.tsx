import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalDoc, legalIndex } from "@/lib/legal";
import { PolicyViewer } from "@/components/legal/PolicyViewer";
import { pick, serverLang } from "@/lib/serverLang";
import { SITE_URL } from "@/lib/siteUrl";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string; version?: string }> };

async function resolve({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang = sp.lang === "ar" || sp.lang === "en" ? sp.lang : await serverLang();
  const v = sp.version ? Number.parseInt(sp.version, 10) : NaN;
  const version = Number.isFinite(v) && v > 0 ? v : null;
  return { slug, lang, version, doc: await legalDoc(slug, version ?? undefined) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, lang, version, doc } = await resolve(props);
  if (!doc) return {};
  const title = pick(lang, doc.seo.titleEn || `${doc.titleEn} | OSTA Services UAE`, doc.seo.titleAr || `${doc.titleAr} | خدمات أسطا الإمارات`);
  const description = pick(lang, doc.seo.descriptionEn || doc.summaryEn, doc.seo.descriptionAr || doc.summaryAr);
  return {
    title, description,
    // Earlier versions are for reading, not for search results.
    ...(version && !doc.isLatest ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `/policies/${slug}`, languages: { en: `${SITE_URL}/policies/${slug}?lang=en`, ar: `${SITE_URL}/policies/${slug}?lang=ar`, "x-default": `${SITE_URL}/policies/${slug}` } },
    openGraph: { title, description, type: "article", url: `${SITE_URL}/policies/${slug}`, modifiedTime: doc.publishedAt, locale: lang === "ar" ? "ar_AE" : "en_AE" },
  };
}

export default async function PolicyPage(props: Props) {
  const { slug, lang, version, doc } = await resolve(props);
  if (!doc) notFound();
  const index = await legalIndex();
  const url = `${SITE_URL}/policies/${slug}`;
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "WebPage", name: pick(lang, doc.titleEn, doc.titleAr), description: pick(lang, doc.summaryEn, doc.summaryAr), url, inLanguage: lang, dateModified: doc.publishedAt, publisher: { "@type": "Organization", name: "OSTA Services", legalName: "ostaa Technical Services CO. L.L.C S.O.C" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: pick(lang, "Home", "الرئيسية"), item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: pick(lang, "Legal Center", "المركز القانوني"), item: `${SITE_URL}/policies` },
      { "@type": "ListItem", position: 3, name: pick(lang, doc.titleEn, doc.titleAr), item: url },
    ] },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="flex min-h-screen flex-col">
        <div className="print:hidden"><MarketingNav /></div>
        <main className="flex-1"><PolicyViewer doc={doc} index={index} lang={lang} requestedVersion={version} /></main>
        <div className="print:hidden"><MarketingFooter /></div>
      </div>
    </>
  );
}
