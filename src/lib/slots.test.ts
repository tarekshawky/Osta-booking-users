import { describe, expect, it } from "vitest";
import { availableTimes, localDateStr, slotTimes, withinHours } from "./slots";

describe("withinHours", () => {
  it("handles normal hours", () => {
    expect(withinHours("10:00", "08:00", "18:00")).toBe(true);
    expect(withinHours("18:00", "08:00", "18:00")).toBe(true);
    expect(withinHours("18:30", "08:00", "18:00")).toBe(false);
    expect(withinHours("07:59", "08:00", "18:00")).toBe(false);
  });
  it("handles hours that cross midnight (10:00–01:00)", () => {
    for (const t of ["10:00", "15:00", "23:59", "00:00", "01:00"]) expect(withinHours(t, "10:00", "01:00")).toBe(true);
    for (const t of ["01:01", "05:00", "09:59"]) expect(withinHours(t, "10:00", "01:00")).toBe(false);
  });
  it("allows anything when no hours are set", () => {
    expect(withinHours("03:00", null, null)).toBe(true);
    expect(withinHours("03:00", "00:00", "00:00")).toBe(true);
  });
});

describe("slotTimes", () => {
  it("lists half hours across midnight", () => {
    const t = slotTimes("10:00", "01:00");
    expect(t[0]).toBe("10:00");
    expect(t).toContain("23:30");
    expect(t).toContain("00:00");
    expect(t[t.length - 1]).toBe("01:00");
    expect(t).toHaveLength(31);
  });
  it("lists a normal day", () => {
    expect(slotTimes("08:00", "10:00")).toEqual(["08:00", "08:30", "09:00", "09:30", "10:00"]);
  });
  it("offers the whole day when no hours are set", () => {
    expect(slotTimes(null, null)).toHaveLength(48);
  });
});

describe("availableTimes", () => {
  it("only offers later times today", () => {
    const now = new Date(2026, 9, 26, 15, 10);
    const today = localDateStr(now);
    const t = availableTimes(today, "10:00", "01:00", now);
    expect(t[0]).toBe("15:30");
    expect(availableTimes("2026-10-27", "10:00", "01:00", now)[0]).toBe("10:00");
  });
});
