"use client";

import { useEffect, useState } from "react";
import { allowed, CONSENT_CHANGED_EVENT, CONSENT_KEY, parseConsent, type Consent } from "@/lib/consent";
import { useSite } from "@/lib/site-context";

type Code = { headCode?: string; headCodeConsent?: string; bodyCode?: string; bodyCodeConsent?: string };

const done = new Set<string>();

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
    const run = (html: string, where: "head" | "body", ok: boolean) => {
      if (!ok) return;
      const key = `${scope}:${where}:${html.length}:${html.slice(0, 40)}`;
      // Global code stays for the whole visit; it is added only once however often this component re-renders.
      if (scope === "global") {
        if (done.has(key)) return;
        done.add(key);
      }
      added.push(...inject(html, where, scope));
    };
    run(head, "head", headOk);
    run(body, "body", bodyOk);
    return () => {
      if (scope !== "global") for (const el of added) el.remove();
    };
  }, [head, body, headOk, bodyOk, scope]);

  return null;
}

// Global custom code, from Website → Header & Footer Code.
export function GlobalCode() {
  const { integrations } = useSite();
  return <CodeInjection scope="global" code={integrations} />;
}
