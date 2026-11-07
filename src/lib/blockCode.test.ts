import { describe, it, expect } from "vitest";
import { blockJs, isBlockId, scopedCss } from "./blockCode";

describe("block custom code on the site", () => {
  it("scopes CSS to the block", () => {
    expect(scopedCss("blk_abc123", "h2 { color: red; }")).toBe('[data-blk="blk_abc123"]{h2 { color: red; }}');
    expect(scopedCss("blk_abc123", "padding: 2rem; & a { color: blue; }")).toContain("padding: 2rem;");
  });
  it("drops anything unsafe or broken instead of rendering it", () => {
    for (const css of ["</style><script>x</script>", "@import url(//x.test/a.css);", "a{background:url(javascript:1)}", "color: red; } body { display: none; } .x {", "a { color: red;", ""]) expect(scopedCss("blk_a", css), css).toBeNull();
    expect(scopedCss("bad id\"]{}", "color: red;")).toBeNull();
    expect(scopedCss("blk_a", 42)).toBeNull();
    expect(scopedCss("blk_a", "a{}".repeat(5000))).toBeNull();
  });
  it("accepts only well-formed block ids and non-empty JavaScript", () => {
    expect(isBlockId("blk_a1b2")).toBe(true);
    expect(isBlockId('x"]')).toBe(false);
    expect(blockJs("blk_a", "go();")).toBe("go();");
    expect(blockJs("blk_a", "   ")).toBeNull();
    expect(blockJs('a"b', "go();")).toBeNull();
  });
});
