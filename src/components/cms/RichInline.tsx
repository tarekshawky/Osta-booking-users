import Link from "next/link";
import { parseInline } from "@/lib/inlineLinks";

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
