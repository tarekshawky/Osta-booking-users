"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Building2, Check, Code2, Copy, Database, FileText, Globe, HelpCircle, Layers, MapPin, Plus, RefreshCw, Search, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import { useSite } from "@/lib/site-context";
import { allItems, bodyOf, factsText, glanceItems, safeSource, searchKnowledge, sectionAnchor, splitPhones, titleOf, type Knowledge, type KnowledgeItem, type Lang } from "@/lib/knowledge";

const T = {
  en: {
    checked: "Verified facts · latest check", title: "Osta Knowledge Center", intro: "Verified information about Osta Services, for customers, search engines and AI assistants. Ask in your own words, or browse by topic.",
    ph: "Ask about our services, areas or plans", ask: "Ask", none: "No verified answer yet. Message us and we will help.", whatsapp: "Ask on WhatsApp", results: "Verified answers",
    glance: "Osta Services at a glance", copy: "Copy facts", copied: "Copied", topics: "Browse by topic", topicsHint: "Answers show where they come from", entries: "entries", entry: "entry",
    questions: "Questions people ask", source: "Source", auto: "Updated automatically", verified: "Verified", ai: "For AI assistants", aiFacts: "These facts as data (knowledge.json)", aiAuto: "Contact details, prices and areas come straight from our system", aiDates: "Written answers carry a source page and a check date", aiSchema: "Structured data (JSON-LD) for the questions", cite: "Cite as: Osta Services", empty: "Verified information is being prepared.",
  },
  ar: {
    checked: "معلومات موثقة · آخر مراجعة", title: "مركز معرفة آسطا", intro: "معلومات موثقة عن خدمات آسطا للعملاء ومحركات البحث ومساعدات الذكاء الاصطناعي. اسأل بكلماتك أو تصفح حسب الموضوع.",
    ph: "اسأل عن خدماتنا أو المناطق أو الباقات", ask: "اسأل", none: "لا توجد إجابة موثقة بعد. راسلنا وسنساعدك.", whatsapp: "اسأل على واتساب", results: "إجابات موثقة",
    glance: "خدمات آسطا في لمحة", copy: "نسخ البيانات", copied: "تم النسخ", topics: "تصفح حسب الموضوع", topicsHint: "الإجابات توضح مصدرها", entries: "عنصر", entry: "عنصر",
    questions: "أسئلة يطرحها العملاء", source: "المصدر", auto: "يتحدث تلقائياً", verified: "تمت المراجعة", ai: "لمساعدات الذكاء الاصطناعي", aiFacts: "هذه المعلومات كبيانات (knowledge.json)", aiAuto: "بيانات التواصل والأسعار والمناطق تأتي من نظامنا مباشرة", aiDates: "الإجابات المكتوبة لها صفحة مصدر وتاريخ مراجعة", aiSchema: "بيانات منظمة (JSON-LD) للأسئلة", cite: "الإشارة: خدمات آسطا", empty: "يجري إعداد المعلومات الموثقة.",
  },
} as const;

const TOPIC_LOOK: Record<string, { icon: LucideIcon; gradient: string }> = {
  company: { icon: Building2, gradient: "from-[#6d9bff] to-[#2a50c8]" }, services: { icon: Wrench, gradient: "from-[#ffcb47] to-[#e08a00]" }, pricing: { icon: Database, gradient: "from-[#40e0a4] to-[#0d9a6c]" },
  areas: { icon: MapPin, gradient: "from-[#ff7ab8] to-[#c02686]" }, policies: { icon: ShieldCheck, gradient: "from-[#4fb4ff] to-[#1262d6]" }, faq: { icon: HelpCircle, gradient: "from-[#b08cff] to-[#6b3fe4]" },
  guides: { icon: FileText, gradient: "from-[#ff9f5f] to-[#ea5420]" }, comparisons: { icon: Layers, gradient: "from-[#34d6cf] to-[#0e8f96]" }, profiles: { icon: Globe, gradient: "from-[#9edb35] to-[#198a3c]" },
};

const date = (iso: string, lang: Lang) => new Intl.DateTimeFormat(lang === "ar" ? "ar-AE" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" }).format(new Date(iso));

// Text that is only a web address is shown as a link.
function Body({ text, className }: { text: string; className: string }) {
  return /^https:\/\/\S+$/.test(text) ? <a dir="ltr" href={text} target="_blank" rel="noopener noreferrer" className={`${className} break-all underline decoration-accent-2/50 underline-offset-2 hover:text-accent-2`}>{text}</a> : <p className={`${className} whitespace-pre-line break-words`}>{splitPhones(text).map((part, i) => (i % 2 ? <bdi key={i} dir="ltr">{part}</bdi> : part))}</p>;
}

function Origin({ item, lang }: { item: KnowledgeItem; lang: Lang }) {
  const t = T[lang];
  const link = item.sourceUrl && safeSource(item.sourceUrl) && item.sourceUrl !== bodyOf(item, lang) ? item.sourceUrl : null;
  const style = "inline-flex items-center gap-1 font-semibold text-accent-2 hover:underline";
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-faint">
      {item.automatic ? <span className="inline-flex items-center gap-1"><RefreshCw size={12} aria-hidden /> {t.auto}</span> : item.verifiedAt && <span className="inline-flex items-center gap-1"><BadgeCheck size={13} aria-hidden /> {t.verified} {date(item.verifiedAt, lang)}</span>}
      {link && (link.startsWith("/") ? <Link href={link} className={style}>{t.source} <ArrowUpRight size={12} aria-hidden /></Link> : <a href={link} target="_blank" rel="noopener noreferrer" className={style}>{t.source} <ArrowUpRight size={12} aria-hidden /></a>)}
    </p>
  );
}

function Card({ item, lang }: { item: KnowledgeItem; lang: Lang }) {
  return (
    <li className="osta-card p-4">
      <h3 className="font-semibold text-text">{titleOf(item, lang)}</h3>
      <Body text={bodyOf(item, lang)} className="mt-1 text-sm text-text-muted" />
      <Origin item={item} lang={lang} />
    </li>
  );
}

export function KnowledgeView({ data, lang }: { data: Knowledge; lang: Lang }) {
  const t = T[lang];
  const { settings } = useSite();
  const [typed, setTyped] = useState("");
  const [asked, setAsked] = useState("");
  const [copied, setCopied] = useState(false);

  const items = allItems(data);
  const glance = glanceItems(data, lang);
  const inGlance = new Set(glance.map((i) => i.id));
  const questions = items.filter((i) => i.type === "FAQ");
  const listed = data.sections.map((s) => ({ ...s, rest: s.items.filter((i) => i.type !== "FAQ" && !inGlance.has(i.id)) }));
  const hits = asked ? searchKnowledge(items, asked, lang) : [];
  const ask = (q: string) => { setTyped(q); setAsked(q.trim()); };
  const anchorOf = (s: (typeof listed)[number]) => (s.rest.length ? sectionAnchor(s.key) : s.items.some((i) => i.type === "FAQ") ? "questions" : "facts");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid items-start gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {data.latestCheck && <p className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success"><Check size={13} aria-hidden /> {t.checked} {date(data.latestCheck, lang)}</p>}
          <h1 className="mt-4 text-4xl font-extrabold text-text sm:text-5xl">{t.title}</h1>
          <p className="mt-4 max-w-xl text-text-muted">{t.intro}</p>
          <form role="search" onSubmit={(e) => { e.preventDefault(); setAsked(typed.trim()); }} className="osta-glow-border mt-6 flex items-center gap-2 rounded-full bg-card/70 py-2 pe-2 ps-5">
            <Search size={17} className="shrink-0 text-text-faint" aria-hidden />
            <input type="search" value={typed} onChange={(e) => { setTyped(e.target.value); if (!e.target.value) setAsked(""); }} placeholder={t.ph} aria-label={t.ph} className="min-w-0 flex-1 bg-transparent py-2 text-sm text-text outline-none placeholder:text-text-faint" />
            <button type="submit" className="osta-btn-primary rounded-full px-5 py-2.5 text-sm font-semibold text-white">{t.ask}</button>
          </form>
          {questions.length > 0 && !asked && (
            <div className="mt-3 flex flex-wrap gap-2">
              {questions.slice(0, 4).map((q) => <button key={q.id} type="button" onClick={() => ask(titleOf(q, lang))} className="rounded-full border border-card-border bg-card/60 px-3.5 py-2 text-xs font-semibold text-text-muted transition-colors hover:border-accent hover:text-text">{titleOf(q, lang)}</button>)}
            </div>
          )}
          <div aria-live="polite">
            {asked && (hits.length ? (
              <section className="mt-5" aria-label={t.results}>
                <h2 className="mb-2 text-sm font-bold text-text">{t.results}</h2>
                <ul className="space-y-2">{hits.map((h) => <Card key={h.id} item={h} lang={lang} />)}</ul>
              </section>
            ) : (
              <p className="mt-5 text-sm text-text-muted">{t.none} {settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(asked)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-2 underline">{t.whatsapp}</a>}</p>
            ))}
          </div>
        </div>

        {glance.length > 0 && (
          <section id="facts" aria-label={t.glance} className="osta-card scroll-mt-28 p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-text">{t.glance}</h2>
              <button type="button" onClick={() => navigator.clipboard.writeText(factsText(glance, lang)).then(() => setCopied(true)).catch(() => setCopied(false))} className="flex shrink-0 items-center gap-1.5 rounded-full border border-card-border px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text"><Copy size={13} aria-hidden /> {copied ? t.copied : t.copy}</button>
            </div>
            <dl className="mt-3 divide-y divide-card-border">
              {glance.map((i) => (
                <div key={i.id} className="grid grid-cols-3 gap-3 py-2.5">
                  <dt className="text-sm text-text-faint">{titleOf(i, lang)}</dt>
                  <dd className="col-span-2 min-w-0"><Body text={bodyOf(i, lang)} className="text-sm font-semibold text-text" /></dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {data.sections.length === 0 ? <p className="mt-12 text-text-muted">{t.empty}</p> : (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-text">{t.topics}</h2>
          <p className="text-sm text-text-faint">{t.topicsHint}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {listed.map((s) => {
              const { icon: Icon, gradient } = TOPIC_LOOK[s.key] ?? { icon: FileText, gradient: "from-[#7586a6] to-[#1e293f]" };
              return (
                <li key={s.key}>
                  <a href={`#${anchorOf(s)}`} className="osta-card block h-full p-4 transition hover:border-accent">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white ${gradient}`}><Icon size={20} aria-hidden /></span>
                    <span className="mt-3 block font-bold text-text">{lang === "ar" ? s.titleAr || s.titleEn : s.titleEn}</span>
                    <span className="mt-1 line-clamp-2 block text-xs text-text-muted">{s.items.slice(0, 3).map((i) => titleOf(i, lang)).join(lang === "ar" ? "، " : ", ")}</span>
                    <span className="mt-3 inline-block rounded-full border border-card-border px-3 py-1 text-xs font-semibold text-text-muted">{s.items.length} {s.items.length === 1 ? t.entry : t.entries}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-5">
        <div className="space-y-10 lg:col-span-3">
          {questions.length > 0 && (
            <section id="questions" className="scroll-mt-28">
              <h2 className="mb-3 text-2xl font-bold text-text">{t.questions}</h2>
              <div className="space-y-2">
                {/* Every answer is in the page itself, so search engines and assistants can read it while it is closed. */}
                {questions.map((q, n) => (
                  <details key={q.id} open={n < 3} className="osta-card group p-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-semibold text-text [&::-webkit-details-marker]:hidden">
                      <span>{titleOf(q, lang)}</span><Plus size={17} className="mt-0.5 shrink-0 text-accent-2 transition-transform group-open:rotate-45" aria-hidden />
                    </summary>
                    <Body text={bodyOf(q, lang)} className="mt-2 text-sm text-text-muted" />
                    <Origin item={q} lang={lang} />
                  </details>
                ))}
              </div>
            </section>
          )}
          {listed.filter((s) => s.rest.length).map((s) => (
            <section key={s.key} id={sectionAnchor(s.key)} className="scroll-mt-28">
              <h2 className="mb-3 text-xl font-bold text-text">{lang === "ar" ? s.titleAr || s.titleEn : s.titleEn}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">{s.rest.map((i) => <Card key={i.id} item={i} lang={lang} />)}</ul>
            </section>
          ))}
        </div>

        <aside className="osta-card osta-glow-border p-5 lg:sticky lg:top-28 lg:col-span-2">
          <h2 className="flex items-center gap-3 font-bold text-text"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b6cff] to-[#2bc8d8] text-white"><Code2 size={20} aria-hidden /></span>{t.ai}</h2>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {[t.aiFacts, t.aiAuto, t.aiDates, t.aiSchema].map((x) => <li key={x} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-success" aria-hidden />{x}</li>)}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <a href="/knowledge.json" className="rounded-full border border-card-border px-3.5 py-2 text-text hover:border-accent" dir="ltr">/knowledge.json</a>
            {data.llms && <a href="/llms.txt" className="rounded-full border border-card-border px-3.5 py-2 text-text hover:border-accent" dir="ltr">/llms.txt</a>}
            <span className="rounded-full border border-card-border px-3.5 py-2 text-text-muted">{t.cite}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
