import { describe, expect, it } from "vitest";
import { keywordList } from "./keywords";

describe("keywordList", () => {
  it("splits English and Arabic separators", () => {
    expect(keywordList("ac repair, ajman")).toEqual(["ac repair", "ajman"]);
    expect(keywordList("صيانة مكيفات، دهانات")).toEqual(["صيانة مكيفات", "دهانات"]);
  });
  it("is undefined when empty", () => {
    expect(keywordList("")).toBeUndefined();
    expect(keywordList(null)).toBeUndefined();
    expect(keywordList(" , ")).toBeUndefined();
  });
});
