"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Send, User } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { RichLine } from "@/components/cms/RichInline";
import { track } from "@/lib/analytics";
import { askAssistant, MAX_QUESTION, type AssistantFailure, type AssistantReply } from "@/lib/assistant";

type Bi = { en: string; ar: string };
type P = Record<string, unknown>;
type Message = { id: number; from: "you" | "bot"; text: string; reply?: AssistantReply };

// A small chat: the visitor asks about services, prices, areas, hours or booking and gets an answer from the website's own data (free: no AI service).
export function AssistantBlock({ p }: { p: P }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const bi = (v: Bi | undefined) => (v ? (ar ? v.ar || v.en : v.en || v.ar) : "");
  const own = Array.isArray(p.suggestions) ? (p.suggestions as { text?: Bi }[]).map((s) => bi(s.text)).filter(Boolean) : [];
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [chips, setChips] = useState<string[] | null>(null); // after the first answer: the assistant's own suggestions
  const next = useRef(1);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [messages, busy]);

  const welcome = bi(p.welcome as Bi) || (ar ? "أهلاً بك! اسألني عن خدماتنا." : "Hello! Ask me about our services.");
  const startChips = own.length ? own : ar ? ["المكيف لا يبرد", "كم سعر تنظيف المكيف؟", "ما الإمارات التي تخدمونها؟", "كيف أحجز؟"] : ["My AC is not cooling", "How much is AC cleaning?", "Which emirates do you serve?", "How do I book?"];
  const shown = chips ?? startChips;

  const failure: Record<AssistantFailure, string> = {
    rate_limited: ar ? "أسئلة كثيرة. حاول مرة أخرى بعد بضع دقائق." : "Too many questions. Please try again in a few minutes.",
    invalid: ar ? "اكتب سؤالك في جملة قصيرة." : "Please ask your question in a short sentence.",
    unavailable: ar ? "المساعد غير متاح الآن. يمكنك تصفح خدماتنا أو التواصل معنا." : "The assistant is not available right now. You can browse our services or contact us.",
  };

  async function send(raw: string) {
    const q = raw.trim();
    if (!q || busy) return;
    setText("");
    setBusy(true);
    setMessages((m) => [...m, { id: next.current++, from: "you", text: q }]);
    track("assistant_question");
    const res = await askAssistant(q, lang);
    setMessages((m) => [...m, res.ok ? { id: next.current++, from: "bot", text: res.reply.answer, reply: res.reply } : { id: next.current++, from: "bot", text: failure[res.reason] }]);
    if (res.ok) setChips(res.reply.suggestions);
    setBusy(false);
  }

  const bubble = "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed";
  const link = (l: { label: string; href: string }) => l.href.startsWith("/")
    ? <Link key={l.href + l.label} href={l.href} className="osta-btn-primary rounded-lg px-4 py-2 text-xs font-semibold text-white">{l.label}</Link>
    : <a key={l.href + l.label} href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="rounded-lg border border-card-border px-4 py-2 text-xs font-semibold text-text hover:border-accent">{l.label}</a>;

  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-12 text-center">
      {bi(p.heading as Bi) && <h2 className="text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
      {bi(p.subtitle as Bi) && <RichLine className="mx-auto mt-3 max-w-md text-sm text-text-muted" text={bi(p.subtitle as Bi)} />}

      <div className="osta-card mt-8 overflow-hidden text-start">
        <div ref={list} className="flex max-h-[28rem] min-h-[14rem] flex-col gap-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-label={ar ? "المحادثة" : "Conversation"}>
          <div className="flex items-start gap-2">
            <Bot size={18} className="mt-2 shrink-0 text-accent-2" aria-hidden />
            <p className={`${bubble} bg-card-border/40 text-text`}>{welcome}</p>
          </div>
          {messages.map((m) => m.from === "you" ? (
            <div key={m.id} className="flex items-start justify-end gap-2">
              <p className={`${bubble} bg-accent/20 text-text`}>{m.text}</p>
              <User size={18} className="mt-2 shrink-0 text-text-muted" aria-hidden />
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-2">
              <Bot size={18} className="mt-2 shrink-0 text-accent-2" aria-hidden />
              <div className="flex max-w-[85%] flex-col gap-2">
                <p className={`${bubble} max-w-full bg-card-border/40 text-text`}>{m.text}</p>
                {m.reply && m.reply.matches.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {m.reply.matches.map((x) => (
                      <div key={x.bookSlug} className="rounded-xl border border-card-border p-3">
                        {(ar ? x.categoryAr || x.category : x.category) && <p className="text-[11px] text-text-faint">{ar ? x.categoryAr || x.category : x.category}</p>}
                        <p className="text-sm font-semibold text-text">{ar ? x.nameAr : x.nameEn}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{x.priceText}</p>
                        <Link href={`/pricing?service=${encodeURIComponent(x.bookSlug)}`} className="osta-btn-primary mt-2 inline-block rounded-lg px-4 py-1.5 text-xs font-semibold text-white">{ar ? "احجز" : "Book"}</Link>
                      </div>
                    ))}
                  </div>
                )}
                {m.reply && m.reply.links.length > 0 && <div className="flex flex-wrap gap-2">{m.reply.links.map(link)}</div>}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2" aria-label={ar ? "جارٍ الكتابة" : "Typing"}>
              <Bot size={18} className="shrink-0 text-accent-2" aria-hidden />
              <span className="flex gap-1 rounded-2xl bg-card-border/40 px-4 py-3" aria-hidden><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:120ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:240ms]" /></span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-card-border px-4 py-3">
          {shown.map((s, i) => <button key={`${i}-${s}`} type="button" disabled={busy} onClick={() => void send(s)} className="rounded-full border border-card-border px-3 py-1 text-xs text-text-muted hover:border-accent hover:text-text disabled:opacity-50">{s}</button>)}
        </div>

        <form className="flex items-center gap-2 border-t border-card-border p-3" onSubmit={(e) => { e.preventDefault(); void send(text); }}>
          <label htmlFor="osta-assistant-input" className="sr-only">{bi(p.placeholder as Bi) || (ar ? "اكتب سؤالك" : "Type your question")}</label>
          <input id="osta-assistant-input" value={text} maxLength={MAX_QUESTION} onChange={(e) => setText(e.target.value)} placeholder={bi(p.placeholder as Bi)} className="min-w-0 flex-1 rounded-xl border border-card-border bg-transparent px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none" />
          <button type="submit" disabled={busy || !text.trim()} aria-label={ar ? "إرسال" : "Send"} className="osta-btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-50"><Send size={16} aria-hidden className="rtl:-scale-x-100" /></button>
        </form>
      </div>
      <p className="mt-3 text-[11px] text-text-faint">{ar ? "إجابات تلقائية من قائمة خدماتنا. يُؤكَّد السعر النهائي عند الحجز." : "Automatic answers from our service list. The final price is confirmed when you book."}</p>
    </section>
  );
}
