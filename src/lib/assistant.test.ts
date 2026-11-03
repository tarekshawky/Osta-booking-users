import { describe, it, expect, vi, afterEach } from "vitest";
import { askAssistant, parseReply, safeHref } from "./assistant";

const good = { answer: "Hi", matches: [{ bookSlug: "ac-cleaning", nameEn: "AC Cleaning", nameAr: "تنظيف", category: "AC", categoryAr: "تكييف", priceText: "120 AED" }], links: [{ label: "Book now", href: "/pricing?service=ac-cleaning" }], suggestions: ["How do I book?"] };

describe("safeHref", () => {
  it("allows this site, WhatsApp, calls and email, and nothing else", () => {
    for (const h of ["/pricing", "/pricing?service=a", "https://wa.me/971500000000", "tel:+971500000000", "mailto:hi@osta.test"]) expect(safeHref(h)).toBe(true);
    for (const h of ["//evil.example", "https://evil.example", "javascript:alert(1)", "data:text/html,x", "", 5, null]) expect(safeHref(h)).toBe(false);
  });
});

describe("parseReply", () => {
  it("reads a good answer", () => {
    expect(parseReply({ data: good })).toEqual(good);
  });
  it("drops unsafe links but keeps the answer", () => {
    const r = parseReply({ data: { ...good, links: [...good.links, { label: "x", href: "javascript:alert(1)" }, { label: "y", href: "https://evil.example" }] } });
    expect(r?.links).toEqual(good.links);
  });
  it("refuses anything that does not look right", () => {
    expect(parseReply(null)).toBeNull();
    expect(parseReply({ error: {} })).toBeNull();
    expect(parseReply({ data: { ...good, answer: 5 } })).toBeNull();
    expect(parseReply({ data: { ...good, matches: [{ bookSlug: 1 }] } })).toBeNull();
    expect(parseReply({ data: { answer: "x" } })).toBeNull();
  });
  it("shows at most three suggestions and four links", () => {
    const r = parseReply({ data: { ...good, matches: Array(5).fill(good.matches[0]), links: Array(9).fill(good.links[0]) } });
    expect(r?.matches).toHaveLength(3);
    expect(r?.links).toHaveLength(4);
  });
});

describe("askAssistant", () => {
  afterEach(() => vi.unstubAllGlobals());
  const reply = (status: number, body: unknown = {}) => vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }));
  it("returns the reply, and tells too many questions, bad input and everything else apart", async () => {
    reply(200, { data: good });
    expect(await askAssistant("hi", "en")).toEqual({ ok: true, reply: good });
    reply(429); expect(await askAssistant("x", "en")).toEqual({ ok: false, reason: "rate_limited" });
    reply(400); expect(await askAssistant("x", "en")).toEqual({ ok: false, reason: "invalid" });
    reply(503); expect(await askAssistant("x", "en")).toEqual({ ok: false, reason: "unavailable" });
    reply(200, { data: "garbage" }); expect(await askAssistant("x", "en")).toEqual({ ok: false, reason: "unavailable" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await askAssistant("x", "en")).toEqual({ ok: false, reason: "unavailable" });
  });
});
