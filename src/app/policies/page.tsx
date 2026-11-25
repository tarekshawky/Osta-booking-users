import type { Metadata } from "next";
import Link from "next/link";
import { legalIndex, policyPath } from "@/lib/legal";
import { PolicySearch } from "@/components/legal/PolicySearch";
import { pick, serverLang } from "@/lib/serverLang";
import { SITE_URL } from "@/lib/siteUrl";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

export const dynamic = "force-dynamic";

type Search = Promise<{ lang?: string }>;
const pageLang = async (sp: Search) => { const l = (await sp).lang; return l === "ar" || l === "en" ? l : await serverLang(); };

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const lang = await pageLang(searchParams);
  return {
    title: pick(lang, "Policies & Legal | OSTA Services UAE", "السياسات والشؤون القانونية | خدمات أسطا الإمارات"),
    description: pick(lang, "OSTA Services legal center: terms, booking, cancellation, refund, warranty, privacy and more, in English and Arabic.", "المركز القانوني لخدمات أسطا: الشروط والحجز والإلغاء والاسترداد والضمان والخصوصية وغيرها، بالعربية والإنجليزية."),
    alternates: { canonical: "/policies", languages: { en: `${SITE_URL}/policies?lang=en`, ar: `${SITE_URL}/policies?lang=ar` } },
  };
}

export default async function PoliciesPage({ searchParams }: { searchParams: Search }) {
  const lang = await pageLang(searchParams);
  const ar = lang === "ar";
  const categories = await legalIndex();
  return (
    <div className="flex min-h-screen flex-col">
    <div className="print:hidden"><MarketingNav /></div>
    <main className="flex-1">
    <div dir={ar ? "rtl" : "ltr"} lang={lang} className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">{ar ? "المركز القانوني" : "Legal Center"}</h1>
          <p className="mt-2 max-w-2xl text-text-muted">{ar ? "كل سياساتنا وشروطنا في مكان واحد: الحجز والإلغاء والاسترداد والضمان والخصوصية وغيرها. ابحث بكلماتك أو تصفح التصنيفات." : "All our policies and terms in one place: booking, cancellation, refunds, warranty, privacy and more. Search in your own words or browse the categories."}</p>
        </div>
        <div className="flex gap-2">
          {(["en", "ar"] as const).map((l) => <Link key={l} href={`/policies?lang=${l}`} hrefLang={l} className={`rounded-lg px-3 py-2 text-sm font-semibold ${lang === l ? "bg-accent text-white" : "border border-card-border text-text-muted hover:text-text"}`}>{l === "en" ? "English" : "العربية"}</Link>)}
        </div>
      </div>
      <PolicySearch categories={categories} lang={lang} />
      {categories.length === 0 ? (
        <p className="mt-10 text-text-muted">{ar ? "لا توجد وثائق منشورة بعد." : "No documents have been published yet."}</p>
      ) : (
        <div className="mt-10 space-y-8">
          {categories.map((c) => (
            <section key={c.key}>
              <h2 className="mb-3 text-lg font-bold text-text">{ar ? c.nameAr : c.nameEn}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {c.documents.map((d) => (
                  <li key={d.slug}>
                    <Link href={policyPath(d.slug, { lang })} className="osta-card block h-full p-4 transition hover:border-accent">
                      <span className="text-xs text-text-muted">{d.number}</span>
                      <span className="block font-semibold text-text">{ar ? d.titleAr : d.titleEn}</span>
                      <span className="mt-1 block text-sm text-text-muted">{ar ? d.summaryAr : d.summaryEn}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
    </main>
    <div className="print:hidden"><MarketingFooter /></div>
    </div>
  );
}
