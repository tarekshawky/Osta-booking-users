"use client";

import Link from "next/link";
import { RichHtml, RichInline, isRichText } from "@/components/cms/RichInline";
import { useLanguage } from "@/lib/language-context";
import type { Bi } from "@/lib/cms";

// Small pieces every block shares (kept apart from BlockRenderer so the block files can import them without a cycle).

// Images from the admin media library come in several WebP widths; let the browser pick the smallest that fits.
export function imgProps(url: string, sizes: string) {
  if (/\/api\/media\/[^/?]+$/.test(url)) {
    return { src: url, srcSet: `${url}?w=480 480w, ${url}?w=960 960w, ${url}?w=1600 1600w`, sizes, width: 1200, height: 800, loading: "lazy" as const, decoding: "async" as const };
  }
  return { src: url, width: 1200, height: 800, loading: "lazy" as const, decoding: "async" as const };
}

export function SmartLink({ href, className, style, children }: { href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  if (href.startsWith("/")) return <Link href={href} className={className} style={style}>{children}</Link>;
  return (
    <a href={href} className={className} style={style} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

export function useBi() {
  const { lang } = useLanguage();
  // Falls back to the other language so a half-translated block never renders empty.
  return (v: Bi | undefined) => (v ? (lang === "ar" ? v.ar || v.en : v.en || v.ar) : "");
}

export function Paragraphs({ text, className }: { text: string; className?: string }) {
  if (isRichText(text)) return <RichHtml html={text} className={className} />;
  return (
    <>
      {text.split(/\n\s*\n/).filter(Boolean).map((para, i) => (
        <p key={i} className={className}><RichInline text={para} /></p>
      ))}
    </>
  );
}

export const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
export const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
