import { describe, it, expect, vi, afterEach } from "vitest";
import { askFinder, bookHref, parseFinder } from "./aiFinder";

const m = { bookSlug: "gas-refill", nameEn: "AC Gas Refilling", nameAr: "تعبئة غاز", category: "AC Services", categoryAr: "خدمات التكييف", reason: "Low gas." };

describe("bookHref", () => {
  it("opens one service, or one booking with several", () => {
    expect(bookHref(["gas-refill"])).toBe("/pricing?service=gas-refill");
    expect(bookHref(["a", "b c"])).toBe("/pricing?services=a,b%20c");
  });
});

describe("parseFinder", () => {
  it("reads a good answer", () => {
    expect(parseFinder({ data: { matches: [m], note: "" } })).toEqual({ matches: [m], note: "" });
  });
  it("refuses anything that does not look right", () => {
    expect(parseFinder(null)).toBeNull();
    expect(parseFinder({ error: {} })).toBeNull();
    expect(parseFinder({ data: { matches: [{ ...m, bookSlug: 5 }], note: "" } })).toBeNull();
    expect(parseFinder({ data: { matches: [m], note: 3 } })).toBeNull();
  });
  it("shows at most three suggestions", () => {
    expect(parseFinder({ data: { matches: [m, m, m, m, m], note: "" } })?.matches).toHaveLength(3);
  });
});

describe("askFinder", () => {
  afterEach(() => vi.unstubAllGlobals());
  const reply = (status: number, body: unknown = {}) => vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }));
  it("returns the answer", async () => {
    reply(200, { data: { matches: [m], note: "n" } });
    expect(await askFinder("AC not cooling", "en")).toEqual({ ok: true, answer: { matches: [m], note: "n" } });
  });
  it("tells too many requests, bad input, and everything else apart", async () => {
    reply(429); expect(await askFinder("x", "en")).toEqual({ ok: false, reason: "rate_limited" });
    reply(400); expect(await askFinder("x", "en")).toEqual({ ok: false, reason: "invalid" });
    reply(503); expect(await askFinder("x", "en")).toEqual({ ok: false, reason: "unavailable" });
    reply(200, { data: "garbage" }); expect(await askFinder("x", "en")).toEqual({ ok: false, reason: "unavailable" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await askFinder("x", "en")).toEqual({ ok: false, reason: "unavailable" });
  });
});
