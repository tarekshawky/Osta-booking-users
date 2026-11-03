"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { RichLine } from "@/components/cms/RichInline";
import { track } from "@/lib/analytics";
import { askFinder, bookHref, MAX_TEXT, type FinderAnswer, type FinderFailure } from "@/lib/aiFinder";

type Bi = { en: string; ar: string };
type P = Record<string, unknown>;

// "Find my service": describe the problem, get the matching services of the catalogue with Book buttons (AI, via the admin app's API).
export function AiServiceFinderBlock({ p }: { p: P }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const bi = (v: Bi | undefined) => (v ? (ar ? v.ar || v.en : v.en || v.ar) : "");
  const [text, setText] = useState("");
  const [state, setState] = useState<{ kind: "idle" } | { kind: "loading" } | { kind: "done"; answer: FinderAnswer } | { kind: "failed"; reason: FinderFailure }>({ kind: "idle" });
  const box = useRef<HTMLTextAreaElement>(null);
  const examples = Array.isArray(p.examples) ? (p.examples as { text?: Bi }[]).map((e) => bi(e.text)).filter(Boolean) : [];
  const busy = state.kind === "loading";
  const ready = text.trim().length >= 3 && !busy;

  async function submit() {
    if (!ready) return;
    setState({ kind: "loading" });
    track("ai_finder_used");
    const res = await askFinder(text.trim(), lang);
    setState(res.ok ? { kind: "done", answer: res.answer } : { kind: "failed", reason: res.reason });
  }

  const failure: Record<FinderFailure, string> = {
    rate_limited: ar ? "طلبات كثيرة. حاول مرة أخرى بعد بضع دقائق." : "Too many requests. Please try again in a few minutes.",
    invalid: ar ? "صف ما تحتاجه بجملة أو جملتين." : "Describe what you need in a sentence or two.",
    unavailable: ar ? "الاقتراح الذكي غير متاح الآن. يمكنك تصفح كل خدماتنا." : "The smart suggestion is not available right now. You can browse all our services.",
  };

  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-12 text-center">
      {bi(p.heading as Bi) && <h2 className="text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
      {bi(p.subtitle as Bi) && <RichLine className="mx-auto mt-3 max-w-md text-sm text-text-muted" text={bi(p.subtitle as Bi)} />}

      <div className="osta-card mt-8 p-4 text-start">
        <label htmlFor="osta-ai-finder" className="sr-only">{bi(p.placeholder as Bi) || (ar ? "صف المشكلة" : "Describe the problem")}</label>
        <textarea
          id="osta-ai-finder"
          ref={box}
          value={text}
          maxLength={MAX_TEXT}
          rows={3}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit(); }}
          placeholder={bi(p.placeholder as Bi)}
          className="w-full resize-none rounded-xl border border-card-border bg-transparent p-3 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button key={ex} type="button" onClick={() => { setText(ex); box.current?.focus(); }} className="rounded-full border border-card-border px-3 py-1 text-xs text-text-muted hover:border-accent hover:text-text">{ex}</button>
            ))}
          </div>
          <button type="button" onClick={() => void submit()} disabled={!ready} className="osta-btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            <Sparkles size={16} aria-hidden />{busy ? (ar ? "جارٍ البحث…" : "Finding…") : bi(p.button as Bi) || (ar ? "اعثر على خدمتي" : "Find my service")}
          </button>
        </div>
      </div>

      <div className="mt-5 text-start" aria-live="polite">
        {state.kind === "failed" && (
          <div className="osta-card p-5 text-center text-sm text-text-muted">
            <p>{failure[state.reason]}</p>
            {state.reason === "unavailable" && <Link href="/services" className="osta-btn-primary mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white">{ar ? "كل الخدمات" : "All services"}</Link>}
          </div>
        )}
        {state.kind === "done" && state.answer.matches.length === 0 && (
          <div className="osta-card p-5 text-center text-sm text-text-muted">
            <p>{state.answer.note || (ar ? "لم نجد خدمة مطابقة. جرّب وصفاً آخر أو تصفح كل الخدمات." : "We could not find a matching service. Try describing it differently, or browse all services.")}</p>
            <Link href="/services" className="osta-btn-primary mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white">{ar ? "كل الخدمات" : "All services"}</Link>
          </div>
        )}
        {state.kind === "done" && state.answer.matches.length > 0 && (
          <div className="flex flex-col gap-3">
            {state.answer.matches.map((m) => (
              <div key={m.bookSlug} className="osta-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {m.category && <p className="text-[11px] text-text-faint">{m.category}</p>}
                  <p className="text-sm font-semibold text-text">{ar ? m.nameAr : m.nameEn}</p>
                  {m.reason && <p className="mt-1 text-xs text-text-muted">{m.reason}</p>}
                </div>
                <Link href={bookHref([m.bookSlug])} className="osta-btn-primary shrink-0 rounded-lg px-4 py-2 text-center text-xs font-semibold text-white">{ar ? "احجز" : "Book"}</Link>
              </div>
            ))}
            {state.answer.matches.length > 1 && (
              <Link href={bookHref(state.answer.matches.map((m) => m.bookSlug))} className="rounded-xl border border-card-border px-5 py-2.5 text-center text-sm font-semibold text-text hover:border-accent">{ar ? "احجز كل هذه الخدمات معاً" : "Book all of these together"}</Link>
            )}
            {state.answer.note && <p className="text-xs text-text-muted">{state.answer.note}</p>}
            <p className="text-[11px] text-text-faint">{ar ? "اقتراح بالذكاء الاصطناعي. يؤكد الفني العمل والسعر قبل البدء." : "AI suggestion. A technician confirms the work and price before starting."}</p>
          </div>
        )}
      </div>
    </section>
  );
}
