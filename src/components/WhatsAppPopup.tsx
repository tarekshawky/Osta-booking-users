"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { whatsappHref } from "@/lib/site";
import { autoOpenDelayMs, mayAutoOpen, popupText, popupVisible, WA_STORE } from "@/lib/waPopup";

// A floating WhatsApp button. Pressing it opens a small card ("available 24/7") with a button that starts the chat.
// The card can also open by itself once after a few seconds; a visitor who has seen it is left alone for a week.
export function WhatsAppPopup() {
  const { settings } = useSite();
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const visible = popupVisible(settings);
  const autoOpen = settings.waPopupAutoOpen !== false;
  const delay = autoOpenDelayMs(settings);

  const remember = () => {
    try {
      window.localStorage.setItem(WA_STORE, String(Date.now()));
    } catch {
      // Storage blocked: the card may open by itself again on the next page, which is harmless.
    }
  };

  useEffect(() => {
    if (!visible || !autoOpen) return;
    let last: number | null = null;
    try {
      const raw = window.localStorage.getItem(WA_STORE);
      last = raw ? Number(raw) : null;
      if (last !== null && !Number.isFinite(last)) last = null;
    } catch {
      last = null;
    }
    if (!mayAutoOpen(settings, last, Date.now())) return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      remember();
    }, delay);
    return () => window.clearTimeout(timer);
    // The decision is made once per page load, from the settings at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, autoOpen, delay]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!visible) return null;
  const txt = popupText(settings, lang);

  return (
    <div className="osta-wa fixed bottom-5 end-5 z-40 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div role="dialog" aria-labelledby="osta-wa-title" className="w-[min(20rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-card-border bg-bg-elevated shadow-2xl">
          <div className="flex items-start justify-between gap-3 bg-[#128c7e] px-4 py-3 text-white">
            <div>
              <p id="osta-wa-title" className="text-sm font-semibold">{txt.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/85">
                <span aria-hidden className="h-2 w-2 rounded-full bg-[#7CFC9A]" /> {t("whatsappPopup.online")}
              </p>
            </div>
            <button type="button" onClick={() => { setOpen(false); remember(); buttonRef.current?.focus(); }} aria-label={t("whatsappPopup.close")} className="rounded-full p-1 text-white/90 hover:bg-white/15">
              <X size={16} />
            </button>
          </div>
          <div className="px-4 py-4">
            <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">{txt.text}</p>
            <a href={whatsappHref(settings, lang)} target="_blank" rel="noopener noreferrer" onClick={remember} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-[#06361b] transition-[filter] hover:brightness-110">
              <MessageCircle size={18} aria-hidden /> {txt.button}
            </a>
          </div>
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => { setOpen((o) => !o); remember(); }}
        aria-expanded={open}
        aria-label={t("whatsappPopup.open")}
        title={t("whatsappPopup.open")}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {!open && <span aria-hidden className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40 motion-reduce:hidden" />}
        {open ? <X size={26} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
}
