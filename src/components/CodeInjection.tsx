"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { allowed, CONSENT_CHANGED_EVENT, CONSENT_KEY, parseConsent, type Consent } from "@/lib/consent";
import { useSite } from "@/lib/site-context";

type Code = { headCode?: string; headCodeConsent?: string; bodyCode?: string; bodyCodeConsent?: string };

const done = new Set<string>();

// Visible markup of the "body" code (a custom footer block, a banner…) is not appended to <body>: that put it after the
// site footer on a fresh load but before the navigation bar after clicking a link (the page is rebuilt around it). It
// is drawn in a slot that the site footer renders, so it always sits right after the footer. Scripts still run once.
const slotMarkup = new Map<string, string>();
const slotListeners = new Set<() => void>();
let slotVersion = 0;
function setSlotMarkup(key: string, html: string | null) {
  if (html === null ? !slotMarkup.delete(key) : slotMarkup.get(key) === html) return;
  if (html !== null) slotMarkup.set(key, html);
  slotVersion++;
  slotListeners.forEach((l) => l());
}
const subscribeSlot = (l: () => void) => {
  slotListeners.add(l);
  return () => void slotListeners.delete(l);
};

// Rendered by the site footer, right after it.
export function BodyCodeSlot() {
  useSyncExternalStore(subscribeSlot, () => slotVersion, () => 0);
  const html = [...slotMarkup.values()].join("\n");
  if (!html) return null;
  return <div data-osta-body-slot dangerouslySetInnerHTML={{ __html: html }} />;
}

// Splits a snippet into its scripts (run once) and its visible markup (drawn in the slot).
function splitSnippet(html: string): { scripts: string; markup: string } {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  let scripts = "";
  const markup: string[] = [];
  for (const node of Array.from(tpl.content.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "SCRIPT") scripts += (node as HTMLElement).outerHTML;
    else markup.push(node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement).outerHTML : node.nodeType === Node.COMMENT_NODE ? "" : node.textContent ?? "");
  }
  return { scripts, markup: markup.join("\n").trim() };
}

// Adds an HTML snippet to <head> or <body>. Scripts inserted as text would not run, so each one is rebuilt as a real
// script element; other tags are copied as they are. Everything is marked so it can be removed again.
function inject(html: string, where: "head" | "body", tag: string): HTMLElement[] {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const added: HTMLElement[] = [];
  for (const node of Array.from(tpl.content.childNodes)) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    let out: HTMLElement;
    if (el.tagName === "SCRIPT") {
      out = document.createElement("script");
      for (const a of Array.from(el.attributes)) out.setAttribute(a.name, a.value);
      out.textContent = el.textContent;
    } else {
      out = document.importNode(el, true) as HTMLElement;
    }
    out.setAttribute("data-osta-code", tag);
    document[where].appendChild(out);
    added.push(out);
  }
  return added;
}

// The visitor's current cookie choice, kept up to date when they change it in the banner.
function useConsent(): { ready: boolean; consent: Consent | null } {
  const [state, setState] = useState<{ ready: boolean; consent: Consent | null }>({ ready: false, consent: null });
  useEffect(() => {
    const read = () => {
      try {
        setState({ ready: true, consent: parseConsent(window.localStorage.getItem(CONSENT_KEY), Date.now()) });
      } catch {
        setState({ ready: true, consent: null });
      }
    };
    void Promise.resolve().then(read);
    window.addEventListener(CONSENT_CHANGED_EVENT, read);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, read);
  }, []);
  return state;
}

const mayRun = (mode: string | undefined, perms: { analytics: boolean; marketing: boolean }) =>
  mode === "always" || (mode === "marketing" ? perms.marketing : perms.analytics);

// Custom code from the admin: the global code (every page) or one page's code. Runs only after the visitor has allowed
// what the snippet needs (or immediately for "always"). Page-level code is removed again when leaving the page.
export function CodeInjection({ code, scope }: { code: Code | null | undefined; scope: string }) {
  const { integrations } = useSite();
  const { ready, consent } = useConsent();
  const requireConsent = integrations?.requireConsent ?? true;
  const perms = allowed(consent, requireConsent);
  const head = code?.headCode ?? "";
  const body = code?.bodyCode ?? "";
  const headOk = ready && !!head && mayRun(code?.headCodeConsent, perms);
  const bodyOk = ready && !!body && mayRun(code?.bodyCodeConsent, perms);

  useEffect(() => {
    const added: HTMLElement[] = [];
    const slotKeys: string[] = [];
    const run = (html: string, where: "head" | "body", ok: boolean) => {
      if (!ok) return;
      const key = `${scope}:${where}:${html.length}:${html.slice(0, 40)}`;
      // Global code stays for the whole visit; it is added only once however often this component re-renders.
      if (scope === "global") {
        if (where === "body") {
          // The markup is re-drawn by the slot on every page; only its scripts must not run twice.
          const { scripts, markup } = splitSnippet(html);
          setSlotMarkup("global:body", markup || null);
          if (scripts && !done.has(key)) {
            done.add(key);
            added.push(...inject(scripts, "body", scope));
          }
          return;
        }
        if (done.has(key)) return;
        done.add(key);
      }
      if (where === "body") {
        const { scripts, markup } = splitSnippet(html);
        slotKeys.push(`${scope}:body`);
        setSlotMarkup(`${scope}:body`, markup || null);
        if (scripts) added.push(...inject(scripts, "body", scope));
        return;
      }
      added.push(...inject(html, where, scope));
    };
    run(head, "head", headOk);
    run(body, "body", bodyOk);
    return () => {
      if (scope !== "global") {
        for (const el of added) el.remove();
        for (const k of slotKeys) setSlotMarkup(k, null);
      }
    };
  }, [head, body, headOk, bodyOk, scope]);

  return null;
}

// Global custom code, from Website → Header & Footer Code.
export function GlobalCode() {
  const { integrations } = useSite();
  return <CodeInjection scope="global" code={integrations} />;
}
