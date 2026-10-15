import Link from "next/link";
import { parseInline } from "@/lib/inlineLinks";
import { isRichHtml, richToText } from "@/lib/richText";

// Text with optional [words](address){flags} links, drawn as real links. Same tab unless the link was set to open in a
// new tab. Only site paths, https://, tel: and mailto: are ever linked (the parser refuses anything else).
export function RichInline({ text }: { text: string }) {
  const parts = parseInline(text);
  if (parts.length === 1 && parts[0].kind === "text") return <>{text}</>;
  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === "text") return <span key={i}>{p.text}</span>;
        const cls = [
          "text-accent-2 transition-colors hover:text-text",
          p.bold ? "font-bold" : p.thin ? "font-light" : "",
          p.underline ? "underline underline-offset-4" : "",
        ].filter(Boolean).join(" ");
        if (p.url.startsWith("/") && !p.newTab) return <Link key={i} href={p.url} className={cls}>{p.text}</Link>;
        return (
          <a key={i} href={p.url} className={cls} {...(p.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {p.text}
          </a>
        );
      })}
    </>
  );
}

// HTML written in the admin's visual editor. The admin rebuilds it through an allow-list on every save; this is a second,
// cheap guard so something unexpected is shown as plain words instead of being run.
const UNEXPECTED = /<\s*(script|iframe|object|embed|style|svg|math|form|input|link|meta|base)|\son[a-z]+\s*=|javascript:|data:text/i;

export function isRichText(text: string) {
  return isRichHtml(text);
}

export function RichHtml({ html, className = "" }: { html: string; className?: string }) {
  if (UNEXPECTED.test(html)) return <div className={className}><p>{richToText(html)}</p></div>;
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

// One piece of block text: a paragraph of plain text (with [link](url) markup) or rich HTML from the visual editor.
export function RichLine({ text, className = "", plainClassName = "" }: { text: string; className?: string; plainClassName?: string }) {
  if (isRichHtml(text)) return <RichHtml html={text} className={className} />;
  return <p className={`${className} ${plainClassName}`.trim()}><RichInline text={text} /></p>;
}

// A whole body of text: rich HTML from the visual editor, or plain text kept as written (line breaks preserved).
export function RichBody({ text, className = "" }: { text: string; className?: string }) {
  if (isRichHtml(text)) return <RichHtml html={text} className={className} />;
  return <p className={`whitespace-pre-line ${className}`.trim()}>{text}</p>;
}
