import { parseBody, parseInline } from "@/lib/legal";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Text with the searched words highlighted (the visitor's own search inside the document).
function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${esc(q)})`, "gi"));
  return <>{parts.map((p, i) => (i % 2 === 1 ? <mark key={i} className="rounded bg-yellow-300/70 px-0.5 text-inherit">{p}</mark> : <span key={i}>{p}</span>))}</>;
}

function Inline({ text, q }: { text: string; q: string }) {
  return (
    <>
      {parseInline(text).map((s, i) =>
        s.t === "bold" ? <strong key={i}><Hl text={s.text} q={q} /></strong>
        : s.t === "link" ? <a key={i} href={s.href} className="font-medium text-accent-2 underline">{s.text}</a>
        : <Hl key={i} text={s.text} q={q} />)}
    </>
  );
}

export function PolicyBody({ text, q = "" }: { text: string; q?: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-text-muted">
      {parseBody(text).map((b, i) =>
        b.t === "p" ? <p key={i}><Inline text={b.text} q={q} /></p>
        : b.t === "h" ? <h4 key={i} className="pt-1 font-semibold text-text"><Inline text={b.text} q={q} /></h4>
        : b.t === "notice" ? <p key={i} className="rounded-lg border-s-4 border-amber-400 bg-amber-400/10 p-3 text-text"><Inline text={b.text} q={q} /></p>
        : b.t === "ul" ? <ul key={i} className="list-disc space-y-1 ps-5">{b.items.map((it, j) => <li key={j}><Inline text={it} q={q} /></li>)}</ul>
        : b.t === "ol" ? <ol key={i} className="list-decimal space-y-1 ps-5">{b.items.map((it, j) => <li key={j}><Inline text={it} q={q} /></li>)}</ol>
        : (
          <div key={i} className="overflow-x-auto">
            <table className="w-full border border-card-border text-start text-sm">
              <thead className="bg-card"><tr>{b.rows[0].map((c, j) => <th key={j} className="border border-card-border px-3 py-2 text-start font-semibold text-text">{c}</th>)}</tr></thead>
              <tbody>{b.rows.slice(1).map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j} className="border border-card-border px-3 py-2">{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
