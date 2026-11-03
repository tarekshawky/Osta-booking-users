// Security headers for the public website. Written to close the gaps a scanner reports (clickjacking, content-type sniffing, no
// content-security-policy) WITHOUT breaking what the site does: Next.js's own inline scripts, tracking scripts the owner adds in the
// admin (Google Tag Manager, Meta Pixel …), embedded Google Maps, the "use my location" button, and the admin's page preview.
//
// A strict nonce-based script policy is deliberately not used: it would switch every page to per-request rendering (no caching) and
// block the scripts the owner pastes into Website → Integrations. What is enforced instead is everything that is safe to enforce.

export type Header = { key: string; value: string };

export function securityHeaders(opts: { framedBy?: string[] } = {}): Header[] {
  // Who may show this page inside a frame: the site itself, and (for the preview route only) the admin that embeds it.
  const ancestors = ["'self'", ...(opts.framedBy ?? [])].join(" ");
  const csp = [
    "object-src 'none'", // no plug-ins (Flash, Java applets …)
    "base-uri 'self'", // an injected <base> tag cannot redirect relative links
    `frame-ancestors ${ancestors}`, // clickjacking protection (the modern X-Frame-Options)
    "script-src 'self' 'unsafe-inline' https:", // Next.js inline scripts + https tracking scripts; never http:, data: or blob:
    "frame-src https:", // embedded maps, video and the bot check: https only
  ].join("; ");
  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // geolocation stays on for this site: the booking form has a "use my location" button
    { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
  ];
}

// The origins of the admin app that may show the website's draft preview in a frame (the page editor does).
export function adminOrigins(env: { apiBase?: string; extra?: string }): string[] {
  const out = new Set<string>();
  const add = (v: string) => { try { const u = new URL(v.trim()); if (u.protocol === "https:" || u.hostname === "localhost") out.add(u.origin); } catch { /* ignore a bad value */ } };
  if (env.apiBase) add(env.apiBase);
  for (const v of (env.extra ?? "").split(",")) if (v.trim()) add(v);
  return [...out];
}
