import { describe, it, expect } from "vitest";
import { blogListPath, categoryPath, parsePage } from "./blogPaths";

describe("blog addresses", () => {
  it("page 1 has no query, later pages and searches do", () => {
    expect(blogListPath("/blog", 1)).toBe("/blog");
    expect(blogListPath("/blog", 2)).toBe("/blog?page=2");
    expect(blogListPath("/blog", 1, "ac leak")).toBe("/blog?q=ac+leak");
    expect(blogListPath("/blog/category/ac-tips", 3, "x")).toBe("/blog/category/ac-tips?page=3&q=x");
    expect(categoryPath("ac-tips")).toBe("/blog/category/ac-tips");
  });
  it("reads ?page= safely", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("4")).toBe(4);
    expect(parsePage(["2", "9"])).toBe(2);
    for (const bad of ["0", "-3", "abc", "1e9", "99999999999"]) expect(parsePage(bad)).toBe(1);
  });
});
