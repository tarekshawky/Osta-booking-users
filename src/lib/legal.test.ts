import { describe, expect, it } from "vitest";
import { numberSections, parseBody, parseInline, policyPath, readingMinutes, safeHref } from "./legal";

describe("legal text on the public site", () => {
  it("numbers clauses and sub-clauses and leaves part headings unnumbered", () => {
    expect(numberSections([{ level: 1 }, { level: 2 }, { level: 2 }, { level: 3 }, { level: 2 }])).toEqual(["", "1", "2", "2.1", "3"]);
  });
  it("reads the writing format", () => {
    expect(parseBody("One\ntwo\n\n- a\n- b\n\n> Notice\n\n| H1 | H2 |\n|---|---|\n| x | y |")).toEqual([
      { t: "p", text: "One two" }, { t: "ul", items: ["a", "b"] }, { t: "notice", text: "Notice" }, { t: "table", rows: [["H1", "H2"], ["x", "y"]] },
    ]);
  });
  it("only keeps safe links", () => {
    expect(safeHref("/policies/x")).toBe(true);
    expect(safeHref("//evil.com")).toBe(false);
    expect(safeHref("javascript:x")).toBe(false);
    expect(parseInline("[a](javascript:x) **b**")).toEqual([{ t: "text", text: "a" }, { t: "text", text: " " }, { t: "bold", text: "b" }]);
  });
  it("builds addresses and reading time", () => {
    expect(policyPath("privacy-policy")).toBe("/policies/privacy-policy");
    expect(policyPath("privacy-policy", { lang: "ar", version: 2 })).toBe("/policies/privacy-policy?lang=ar&version=2");
    expect(readingMinutes("w ".repeat(420))).toBe(2);
  });
});
