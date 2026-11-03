import { describe, it, expect } from "vitest";
import { adminOrigins, securityHeaders } from "./securityHeaders";

const get = (h: { key: string; value: string }[], k: string) => h.find((x) => x.key === k)?.value ?? "";

describe("securityHeaders", () => {
  it("covers what the scanner asks for: framing, content-type sniffing and a content-security-policy", () => {
    const h = securityHeaders();
    const csp = get(h, "Content-Security-Policy");
    for (const d of ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'", "script-src", "frame-src https:"]) expect(csp).toContain(d);
    expect(get(h, "X-Content-Type-Options")).toBe("nosniff");
    expect(get(h, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
  it("only lets the site itself frame its pages, unless an admin address is given", () => {
    expect(get(securityHeaders(), "Content-Security-Policy")).toMatch(/frame-ancestors 'self'(;|$)/);
    expect(get(securityHeaders({ framedBy: ["https://osta-invoices.vercel.app"] }), "Content-Security-Policy")).toContain("frame-ancestors 'self' https://osta-invoices.vercel.app");
  });
  it("keeps what the site needs working: inline and https scripts, and 'use my location'", () => {
    const h = securityHeaders();
    expect(get(h, "Content-Security-Policy")).toContain("script-src 'self' 'unsafe-inline' https:");
    expect(get(h, "Permissions-Policy")).toContain("geolocation=(self)");
    expect(get(h, "Permissions-Policy")).toContain("camera=()");
  });
  it("never allows plug-ins or http scripts", () => {
    const csp = get(securityHeaders(), "Content-Security-Policy");
    expect(csp).not.toMatch(/script-src[^;]*\bhttp:/);
    expect(csp).not.toMatch(/data:|blob:/);
  });
});

describe("adminOrigins", () => {
  it("takes the admin's address from the API address and an optional list", () => {
    expect(adminOrigins({ apiBase: "https://osta-invoices.vercel.app/api/v1" })).toEqual(["https://osta-invoices.vercel.app"]);
    expect(adminOrigins({ apiBase: "https://a.test/api/v1", extra: "https://b.test, https://a.test" })).toEqual(["https://a.test", "https://b.test"]);
  });
  it("ignores anything that is not an https address (or localhost for development)", () => {
    expect(adminOrigins({ apiBase: "http://evil.example/x", extra: "javascript:alert(1), not a url" })).toEqual([]);
    expect(adminOrigins({ apiBase: "http://localhost:3001/api/v1" })).toEqual(["http://localhost:3001"]);
    expect(adminOrigins({})).toEqual([]);
  });
});
