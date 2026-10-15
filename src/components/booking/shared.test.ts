import { describe, it, expect } from "vitest";
import { fromPrice, hasOptions, optionsIn, unitPriceFor } from "./shared";
import type { PricingConfig } from "@/lib/api";

const base = { id: "s", slug: "s", nameEn: "Gas", nameAr: "غاز", descriptionEn: null, descriptionAr: null, imageUrl: null, pricingUnit: "UNIT", minQuantity: 1, pricesIncludeVat: null, tiers: [], addOns: [] };
const plain = { ...base, prices: [{ regionId: "dxb", unitPriceFils: 15000 }] } as unknown as PricingConfig["services"][number];
const gas = {
  ...base,
  prices: [],
  options: [
    { id: "q", nameEn: "¼ kg", nameAr: "ربع", prices: [{ regionId: "dxb", unitPriceFils: 5000 }, { regionId: "auh", unitPriceFils: 5500 }] },
    { id: "h", nameEn: "½ kg", nameAr: "نص", prices: [{ regionId: "dxb", unitPriceFils: 9000 }] },
    { id: "k", nameEn: "1 kg", nameAr: "كيلو", prices: [{ regionId: "dxb", unitPriceFils: 16000 }] },
  ],
} as unknown as PricingConfig["services"][number];

describe("service options on the booking pages", () => {
  it("a plain service is priced by its own price", () => {
    expect(hasOptions(plain)).toBe(false);
    expect(fromPrice(plain, "dxb")).toBe(15000);
    expect(unitPriceFor(plain, "dxb", "")).toBe(15000);
    expect(fromPrice(plain, "auh")).toBeNull();
  });
  it("a service with options uses the chosen option's price", () => {
    expect(hasOptions(gas)).toBe(true);
    expect(unitPriceFor(gas, "dxb", "h")).toBe(9000);
    expect(unitPriceFor(gas, "dxb", "")).toBeNull(); // nothing chosen yet
  });
  it("only options priced in the emirate are offered, and 'from' is the lowest", () => {
    expect(optionsIn(gas, "dxb").map((o) => o.id)).toEqual(["q", "h", "k"]);
    expect(optionsIn(gas, "auh").map((o) => o.id)).toEqual(["q"]);
    expect(fromPrice(gas, "dxb")).toBe(5000);
    expect(fromPrice(gas, "auh")).toBe(5500);
    expect(fromPrice(gas, "ajm")).toBeNull(); // not bookable where no option has a price
    expect(unitPriceFor(gas, "auh", "h")).toBeNull();
  });
});
