// Custom CSS for one block (set by the owner in the admin). The admin checks it when it is saved; the site checks it again, so a
// hand-edited or stale row can never break the page.

const FORBIDDEN: RegExp[] = [/</, /@import\b/i, /@charset\b/i, /javascript\s*:/i, /expression\s*\(/i, /behaviou?r\s*:|-moz-binding/i];
export const MAX_CODE_CHARS = 10_000;

export const isBlockId = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v);

function balanced(css: string): boolean {
  let depth = 0, paren = 0;
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, "")) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === "(") paren++;
    else if (ch === ")") paren--;
    if (depth < 0 || paren < 0) return false;
  }
  return depth === 0 && paren === 0;
}

// The stylesheet text for a block, or null when there is none or it is not safe. Native CSS nesting keeps every rule inside the
// block: plain declarations apply to the block itself, nested selectors only match elements within it.
export function scopedCss(blockId: unknown, css: unknown): string | null {
  if (!isBlockId(blockId) || typeof css !== "string" || !css.trim() || css.length > MAX_CODE_CHARS) return null;
  if (FORBIDDEN.some((re) => re.test(css)) || !balanced(css)) return null;
  return `[data-blk="${blockId}"]{${css}}`;
}

export function blockJs(blockId: unknown, js: unknown): string | null {
  if (!isBlockId(blockId) || typeof js !== "string" || !js.trim() || js.length > MAX_CODE_CHARS) return null;
  return js;
}
