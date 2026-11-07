"use client";

import { useEffect } from "react";
import { allowed } from "@/lib/consent";
import { mayRun, useConsent } from "@/components/CodeInjection";
import { useSite } from "@/lib/site-context";

// A block's custom JavaScript (owner only, set in the admin). It runs after the page has loaded and the visitor has allowed what
// it needs (the same cookie choices as page-level code), with `block` set to the block's element, and is removed when the block
// leaves the page. Code with an error logs it to the console and cannot stop the rest of the page.
export function BlockScript({ id, js, consent }: { id: string; js: string; consent?: string }) {
  const { integrations } = useSite();
  const state = useConsent();
  const perms = allowed(state.consent, integrations?.requireConsent ?? true);
  const ok = state.ready && mayRun(consent, perms);

  useEffect(() => {
    if (!ok) return;
    const script = document.createElement("script");
    script.setAttribute("data-osta-block-code", id);
    script.textContent = `(function(block){try{\n${js}\n}catch(e){console.error("Custom block code error",e)}})(document.querySelector('[data-blk="${id}"]'));`;
    document.body.appendChild(script);
    return () => script.remove();
  }, [ok, id, js]);

  return null;
}
