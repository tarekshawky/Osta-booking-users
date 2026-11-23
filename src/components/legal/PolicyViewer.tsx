"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { numberSections, policyPath, readingMinutes, type LegalCategory, type LegalDoc } from "@/lib/legal";
import { PolicyBody } from "./PolicyBody";
import { SiteLogo } from "@/components/SiteLogo";

const T = {
  en: { contents: "Contents", search: "Search in this document", noMatch: "No matching clause.", home: "Legal Center", effective: "Effective", updated: "Last updated", version: "Version", read: "min read", country: "Country", language: "Language", tools: "Document tools", pdf: "Download PDF", print: "Print", share: "Share", copy: "Copy link", history: "Version history", copied: "Link copied.", pdfHint: "In the print window, choose “Save as PDF” as the destination.", uae: "United Arab Emirates", soon: "soon", older: "You are reading an earlier version", current: "Read the current version", related: "Related documents", prev: "Previous", next: "Next", close: "Close", live: "Current", docNo: "Document ID", hide: "Hide contents", show: "Show contents", noHistory: "No earlier versions.", company: "Ostaa Technical Services CO. L.L.C S.O.C · Licence no. 1601375" },
  ar: { contents: "المحتويات", search: "ابحث في هذه الوثيقة", noMatch: "لا يوجد بند مطابق.", home: "المركز القانوني", effective: "تاريخ السريان", updated: "آخر تحديث", version: "الإصدار", read: "دقيقة قراءة", country: "الدولة", language: "اللغة", tools: "أدوات الوثيقة", pdf: "تنزيل PDF", print: "طباعة", share: "مشاركة", copy: "نسخ الرابط", history: "سجل الإصدارات", copied: "تم نسخ الرابط.", pdfHint: "في نافذة الطباعة اختر «حفظ كملف PDF» كوجهة.", uae: "الإمارات العربية المتحدة", soon: "قريبًا", older: "أنت تقرأ إصدارًا سابقًا", current: "اقرأ الإصدار الحالي", related: "وثائق ذات صلة", prev: "السابق", next: "التالي", close: "إغلاق", live: "الحالي", docNo: "رقم الوثيقة", hide: "إخفاء المحتويات", show: "إظهار المحتويات", noHistory: "لا توجد إصدارات سابقة.", company: "شركة أسطا للخدمات الفنية ذ.م.م – ش.ش.و. · رخصة رقم 1601375" },
} as const;

const fmt = (iso: string | null, lang: "en" | "ar") => (iso ? new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");

export function PolicyViewer({ doc, index, lang, requestedVersion }: { doc: LegalDoc; index: LegalCategory[]; lang: "en" | "ar"; requestedVersion: number | null }) {
  const t = T[lang];
  const ar = lang === "ar";
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({ [doc.category.key]: true });
  const [openParts, setOpenParts] = useState<Record<string, boolean>>({});
  const [sidebar, setSidebar] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [history, setHistory] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("");
  const article = useRef<HTMLElement | null>(null);

  const numbers = useMemo(() => numberSections(doc.sections), [doc.sections]);
  const nq = q.trim().toLowerCase();
  const heading = (s: LegalDoc["sections"][number]) => (ar ? s.headingAr : s.headingEn);
  const body = (s: LegalDoc["sections"][number]) => (ar ? s.bodyAr : s.bodyEn);
  const intro = ar ? doc.introAr : doc.introEn;
  const title = ar ? doc.titleAr : doc.titleEn;
  const matches = (i: number) => !nq || `${heading(doc.sections[i])} ${body(doc.sections[i])}`.toLowerCase().includes(nq);
  const shown = doc.sections.map((_, i) => i).filter(matches);
  const minutes = readingMinutes(`${intro} ${doc.sections.map(body).join(" ")}`);

  // Parts (level 1) group the clauses in the contents list.
  const groups = useMemo(() => {
    const out: { part: number | null; items: number[] }[] = [];
    doc.sections.forEach((s, i) => {
      if (s.level === 1) out.push({ part: i, items: [] });
      else { if (!out.length) out.push({ part: null, items: [] }); out[out.length - 1].items.push(i); }
    });
    return out;
  }, [doc.sections]);

  useEffect(() => {
    const onScroll = () => {
      const el = article.current; if (!el) return;
      const r = el.getBoundingClientRect(); const total = r.height - window.innerHeight * 0.6;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (-r.top / total) * 100)) : 0);
      let cur = ""; for (const s of doc.sections) { const n = document.getElementById(`sec-${s.id}`); if (n && n.getBoundingClientRect().top < 140) cur = s.id; } setActive(cur);
    };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll);
  }, [doc.sections]);

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 3500); };
  const go = (id: string) => { document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); history_replace(`#sec-${id}`); setDrawer(false); };
  const history_replace = (hash: string) => { try { window.history.replaceState(null, "", hash); } catch { /* not important */ } };
  const copy = async () => { try { await navigator.clipboard.writeText(window.location.origin + window.location.pathname + window.location.search); flash(t.copied); } catch { flash(window.location.href); } };
  const share = async () => { if (typeof navigator.share === "function") { try { await navigator.share({ title, url: window.location.href }); return; } catch { /* cancelled */ } } await copy(); };
  const printIt = (hint: boolean) => { if (hint) flash(t.pdfHint); window.setTimeout(() => window.print(), hint ? 600 : 0); };

  const sidebarEl = (
    <div className="space-y-4">
      <div>
        <label htmlFor="policy-search" className="sr-only">{t.search}</label>
        <input id="policy-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted" />
      </div>
      {nq ? (
        <ul className="space-y-1 text-sm">
          {shown.filter((i) => doc.sections[i].level !== 1).length === 0 && <li className="text-text-muted">{t.noMatch}</li>}
          {shown.filter((i) => doc.sections[i].level !== 1).map((i) => (
            <li key={doc.sections[i].id}><button type="button" onClick={() => go(doc.sections[i].id)} className="w-full text-start text-text-muted hover:text-text"><span className="text-accent-2">{numbers[i]}.</span> {heading(doc.sections[i])}</button></li>
          ))}
        </ul>
      ) : (
        <nav aria-label={t.contents} className="space-y-1 text-sm">
          {index.map((c) => {
            const isOpen = open[c.key] ?? false;
            return (
              <div key={c.key}>
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [c.key]: !isOpen }))} className="flex w-full items-center justify-between gap-2 py-1.5 text-start font-semibold text-text">
                  <span>{ar ? c.nameAr : c.nameEn}</span><span aria-hidden className="text-xs text-text-muted">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <ul className="mb-2 space-y-0.5 border-s border-card-border ps-3">
                    {c.documents.map((d) => {
                      const current = d.slug === doc.slug;
                      return (
                        <li key={d.slug}>
                          <Link href={policyPath(d.slug, { lang })} className={`block rounded px-2 py-1 ${current ? "bg-accent/15 font-semibold text-text" : "text-text-muted hover:text-text"}`}>{d.number}. {ar ? d.titleAr : d.titleEn}</Link>
                          {current && (
                            <ul className="mt-1 space-y-0.5 ps-2">
                              {groups.map((g, gi) => {
                                const key = `${gi}`; const list = g.items.filter((i) => doc.sections[i].level === 2);
                                const expanded = g.part === null || (openParts[key] ?? gi === 0);
                                return (
                                  <li key={key}>
                                    {g.part !== null && <button type="button" aria-expanded={expanded} onClick={() => setOpenParts((o) => ({ ...o, [key]: !expanded }))} className="flex w-full items-center justify-between gap-2 py-1 text-start text-xs font-semibold uppercase tracking-wide text-text-muted"><span>{heading(doc.sections[g.part])}</span><span aria-hidden>{expanded ? "−" : "+"}</span></button>}
                                    {expanded && <ul className="space-y-0.5">{list.map((i) => <li key={doc.sections[i].id}><button type="button" onClick={() => go(doc.sections[i].id)} className={`w-full rounded px-1.5 py-0.5 text-start text-[13px] ${active === doc.sections[i].id ? "text-accent-2" : "text-text-muted hover:text-text"}`}>{numbers[i]}. {heading(doc.sections[i])}</button></li>)}</ul>}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      )}
    </div>
  );

  return (
    <div dir={ar ? "rtl" : "ltr"} lang={lang} className="legal-root">
      <style>{`
        @media print {
          header, footer, nav, .fixed, .legal-noprint { display: none !important; }
          .legal-print { display: block !important; }
          .legal-root { color: #000; background: #fff; }
          .legal-root * { color: #000 !important; background: transparent !important; box-shadow: none !important; }
          .legal-grid { display: block !important; }
          .legal-article { border: 0 !important; padding: 0 !important; }
          @page { margin: 18mm 15mm; @bottom-center { content: counter(page) " / " counter(pages); font-size: 9pt; } }
        }
        .legal-print { display: none; }
      `}</style>

      <div className="legal-noprint fixed inset-x-0 top-0 z-50 h-1 bg-transparent" aria-hidden><div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} /></div>

      <div className="legal-print mb-6 border-b border-black pb-3">
        <SiteLogo size="md" />
        <p className="mt-2 text-sm font-semibold">{t.company}</p>
        <p className="text-xs">{t.docNo}: {doc.code} · {t.version} {doc.version} · {t.effective}: {fmt(doc.effectiveDate, lang)} · {t.updated}: {fmt(doc.publishedAt, lang)}</p>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="legal-noprint mb-4 text-xs text-text-muted"><Link href="/policies" className="hover:text-text">{t.home}</Link> <span aria-hidden>›</span> {ar ? doc.category.nameAr : doc.category.nameEn}</nav>

        <div className="legal-noprint mb-4 flex items-center gap-2 lg:hidden">
          <button type="button" onClick={() => setDrawer(true)} className="rounded-lg border border-card-border bg-card px-3 py-2 text-sm font-medium text-text">☰ {t.contents}</button>
        </div>

        <div className={`legal-grid grid gap-8 ${sidebar ? "lg:grid-cols-[280px_minmax(0,1fr)_240px]" : "lg:grid-cols-[minmax(0,1fr)_240px]"}`}>
          {sidebar && <aside className="legal-noprint hidden lg:block"><div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pe-2">{sidebarEl}</div></aside>}

          <main>
            {requestedVersion && !doc.isLatest && (
              <div role="status" className="legal-noprint mb-4 rounded-lg border border-amber-400 bg-amber-400/10 p-3 text-sm text-text">{t.older} ({t.version} {doc.version}). <Link href={policyPath(doc.slug, { lang })} className="font-semibold text-accent-2 underline">{t.current}</Link></div>
            )}
            <article ref={article} className="legal-article osta-card p-6 sm:p-8">
              <h1 className="text-3xl font-extrabold leading-tight text-text">{title}</h1>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted"><span>{t.docNo}: {doc.code}</span><span>{t.version} {doc.version}</span>{doc.effectiveDate && <span>{t.effective}: {fmt(doc.effectiveDate, lang)}</span>}<span>{t.updated}: {fmt(doc.publishedAt, lang)}</span><span>{minutes} {t.read}</span></p>
              {intro && <div className="mt-5 border-b border-card-border pb-5"><PolicyBody text={intro} q={nq} /></div>}
              <div className="mt-6 space-y-7">
                {doc.sections.map((s, i) => {
                  if (nq && !matches(i)) return null;
                  const h = heading(s), b = body(s);
                  return s.level === 1 ? (
                    <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-24 border-t border-card-border pt-6"><h2 className="text-xl font-bold text-text">{h}</h2>{b && <div className="mt-2"><PolicyBody text={b} q={nq} /></div>}</section>
                  ) : (
                    <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-24">
                      {s.level === 2 ? <h3 className="font-semibold text-text"><span className="text-accent-2">{numbers[i]}.</span> {h}</h3> : <h4 className="text-sm font-semibold text-text"><span className="text-accent-2">{numbers[i]}</span> {h}</h4>}
                      <div className="mt-1"><PolicyBody text={b} q={nq} /></div>
                    </section>
                  );
                })}
                {nq && shown.length === 0 && <p className="text-text-muted">{t.noMatch}</p>}
              </div>
            </article>

            {doc.related.length > 0 && (
              <div className="legal-noprint mt-6"><h2 className="mb-2 text-sm font-bold text-text">{t.related}</h2><ul className="flex flex-wrap gap-2">{doc.related.map((r) => <li key={r.slug}><Link href={policyPath(r.slug, { lang })} className="rounded-full border border-card-border px-3 py-1 text-sm text-text-muted hover:text-text">{ar ? r.titleAr : r.titleEn}</Link></li>)}</ul></div>
            )}
            <div className="legal-noprint mt-6 flex justify-between gap-3 text-sm">
              {doc.previous ? <Link href={policyPath(doc.previous.slug, { lang })} className="osta-card px-4 py-3 text-text-muted hover:text-text">{ar ? "→" : "←"} {t.prev}: {ar ? doc.previous.titleAr : doc.previous.titleEn}</Link> : <span />}
              {doc.next ? <Link href={policyPath(doc.next.slug, { lang })} className="osta-card px-4 py-3 text-text-muted hover:text-text">{t.next}: {ar ? doc.next.titleAr : doc.next.titleEn} {ar ? "←" : "→"}</Link> : <span />}
            </div>
          </main>

          <aside className="legal-noprint">
            <div className="space-y-5 lg:sticky lg:top-24">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">{t.country}</p>
                <select aria-label={t.country} defaultValue="AE" className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-text">
                  <option value="AE">{t.uae}</option>
                  <option value="SA" disabled>{ar ? "المملكة العربية السعودية" : "Saudi Arabia"} ({t.soon})</option>
                  <option value="GCC" disabled>{ar ? "دول الخليج الأخرى" : "Other GCC countries"} ({t.soon})</option>
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">{t.language}</p>
                <div className="flex gap-2">
                  {(["en", "ar"] as const).map((l) => (
                    <Link key={l} href={policyPath(doc.slug, { lang: l, version: requestedVersion })} hrefLang={l} aria-current={lang === l ? "true" : undefined} className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold ${lang === l ? "bg-accent text-white" : "border border-card-border text-text-muted hover:text-text"}`}>{l === "en" ? "English" : "العربية"}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">{t.tools}</p>
                <div className="grid gap-2">
                  <button type="button" onClick={() => printIt(true)} className="rounded-lg border border-card-border bg-card px-3 py-2 text-start text-sm font-medium text-text">⬇ {t.pdf}</button>
                  <button type="button" onClick={() => printIt(false)} className="rounded-lg border border-card-border bg-card px-3 py-2 text-start text-sm font-medium text-text">🖨 {t.print}</button>
                  <button type="button" onClick={share} className="rounded-lg border border-card-border bg-card px-3 py-2 text-start text-sm font-medium text-text">↗ {t.share}</button>
                  <button type="button" onClick={copy} className="rounded-lg border border-card-border bg-card px-3 py-2 text-start text-sm font-medium text-text">⧉ {t.copy}</button>
                  <button type="button" onClick={() => setHistory(true)} className="rounded-lg border border-card-border bg-card px-3 py-2 text-start text-sm font-medium text-text">⟲ {t.history}</button>
                  <button type="button" onClick={() => setSidebar((v) => !v)} className="hidden rounded-lg border border-card-border bg-card px-3 py-2 text-start text-sm font-medium text-text lg:block">{sidebar ? t.hide : t.show}</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {drawer && (
        <div className="legal-noprint fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={t.contents}>
          <button type="button" aria-label={t.close} onClick={() => setDrawer(false)} className="absolute inset-0 bg-black/60" />
          <div className={`absolute inset-y-0 ${ar ? "right-0" : "left-0"} w-[85%] max-w-sm overflow-y-auto bg-bg p-5`}>
            <div className="mb-3 flex items-center justify-between"><p className="font-bold text-text">{t.contents}</p><button type="button" onClick={() => setDrawer(false)} className="text-sm text-text-muted">{t.close}</button></div>
            {sidebarEl}
          </div>
        </div>
      )}

      {history && (
        <div className="legal-noprint fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t.history}>
          <button type="button" aria-label={t.close} onClick={() => setHistory(false)} className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md rounded-xl border border-card-border bg-bg p-5">
            <div className="mb-3 flex items-center justify-between"><p className="font-bold text-text">{t.history}</p><button type="button" onClick={() => setHistory(false)} className="text-sm text-text-muted">{t.close}</button></div>
            <ul className="divide-y divide-card-border text-sm">
              {doc.versions.map((v, k) => (
                <li key={v.version} className="py-2"><Link href={policyPath(doc.slug, { lang, version: k === 0 ? null : v.version })} onClick={() => setHistory(false)} className="font-semibold text-accent-2">{t.version} {v.version}{k === 0 ? ` · ${t.live}` : ""}</Link> <span className="text-text-muted">· {fmt(v.publishedAt, lang)}</span>{v.changeNote && <p className="text-text-muted">{v.changeNote}</p>}</li>
              ))}
              {doc.versions.length === 0 && <li className="py-2 text-text-muted">{t.noHistory}</li>}
            </ul>
          </div>
        </div>
      )}

      {toast && <div role="status" className="legal-noprint fixed bottom-6 start-1/2 z-[70] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}
