import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KnowledgeView } from "@/components/knowledge/KnowledgeView";
import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingNav } from "@/components/MarketingNav";
import { faqJsonLd, fetchKnowledge } from "@/lib/knowledge";
import { pick, serverLang } from "@/lib/serverLang";
import { SITE_URL } from "@/lib/siteUrl";

// Read on every request: the owner switches the page on and off, and changes facts, in the admin.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ lang?: string }> };
const pageLang = async ({ searchParams }: Props) => { const l = (await searchParams).lang; return l === "ar" || l === "en" ? l : await serverLang(); };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const [data, lang] = await Promise.all([fetchKnowledge(), pageLang(props)]);
  if (!data) return { robots: { index: false, follow: false } };
  return {
    title: pick(lang, "Knowledge Center | Verified facts about Osta Services", "مركز المعرفة | معلومات موثقة عن خدمات آسطا"),
    description: pick(lang, "Verified information about Osta Services: contact details, services, plans, areas, policies and answers to common questions.", "معلومات موثقة عن خدمات آسطا: بيانات التواصل والخدمات والباقات والمناطق والسياسات وإجابات الأسئلة الشائعة."),
    alternates: { canonical: "/knowledge-center", languages: { en: `${SITE_URL}/knowledge-center?lang=en`, ar: `${SITE_URL}/knowledge-center?lang=ar` } },
    // Until the owner allows it, search engines and assistants are asked to stay away.
    ...(data.indexable ? {} : { robots: { index: false, follow: false } }),
  };
}

export default async function KnowledgeCenterPage(props: Props) {
  const [data, lang] = await Promise.all([fetchKnowledge(), pageLang(props)]);
  if (!data) notFound();
  const jsonLd = faqJsonLd(data, lang);
  return (
    <div className="flex min-h-screen flex-col">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <MarketingNav />
      <main className="flex-1">
        <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
          <div className="mx-auto flex w-full max-w-6xl justify-end gap-2 px-4 pt-4 sm:px-6">
            {(["en", "ar"] as const).map((l) => <Link key={l} href={`/knowledge-center?lang=${l}`} hrefLang={l} className={`rounded-lg px-3 py-2 text-sm font-semibold ${lang === l ? "bg-accent text-white" : "border border-card-border text-text-muted hover:text-text"}`}>{l === "en" ? "English" : "العربية"}</Link>)}
          </div>
          <KnowledgeView data={data} lang={lang} />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
