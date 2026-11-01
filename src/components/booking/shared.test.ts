import { describe, it, expect } from "vitest";
import { fromPrice, hasOptions, isSingleUnit, optionsIn, ruleInputs, typeText, unitLabel, unitPriceFor } from "./shared";
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

describe("unit labels and one-off prices", () => {
  const svc = (over: object) => ({ ...plain, ...over }) as unknown as PricingConfig["services"][number];
  it("shows the label in the visitor's language and falls back to the other one", () => {
    expect(unitLabel(svc({ unitLabelEn: "per sqm", unitLabelAr: "للمتر المربع" }), true)).toBe("للمتر المربع");
    expect(unitLabel(svc({ unitLabelEn: "per sqm", unitLabelAr: "" }), true)).toBe("per sqm");
    expect(unitLabel(plain, false)).toBe("");
  });
  it("has no quantity for per-visit / project / site / month / year prices", () => {
    for (const u of ["FIXED", "VISIT", "MONTH", "YEAR"]) expect(isSingleUnit(svc({ pricingUnit: u }))).toBe(true);
    for (const u of ["UNIT", "AC_UNIT", "AREA_SQM", "HOUR", "KG", "LINEAR_METER", "ROOM"]) expect(isSingleUnit(svc({ pricingUnit: u }))).toBe(false);
    expect(isSingleUnit(svc({ pricingUnit: "VISIT", addOns: [{ id: "a" }] }))).toBe(false);
    expect(isSingleUnit(svc({ pricingUnit: "VISIT", priceMode: "INSPECTION" }))).toBe(false);
  });
});

describe("pricing rules in the preview", () => {
  const config = { rules: { minimumOrderFils: 10000, offHoursPercent: 50, holidayPercent: 25, normalStart: "08:00", normalEnd: "18:00", holidays: ["2026-12-02"] } } as unknown as PricingConfig;
  it("adds the surcharge for the chosen time and the minimum order", () => {
    expect(ruleInputs(config, "EMERGENCY", "2026-11-03T22:30")).toEqual({ minimumOrderFils: 10000, surcharge: { percent: 50, kind: "OFF_HOURS" } });
    expect(ruleInputs(config, "STANDARD", "2026-12-02T11:00").surcharge).toEqual({ percent: 25, kind: "HOLIDAY" });
    expect(ruleInputs(config, "STANDARD", "2026-11-03T22:30").surcharge).toBeNull();
    expect(ruleInputs(config, "EMERGENCY", undefined).surcharge).toBeNull();
  });
  it("applies nothing when the API sends no rules", () => {
    expect(ruleInputs({} as PricingConfig, "EMERGENCY", "2026-11-03T22:30")).toEqual({ minimumOrderFils: 0, surcharge: null });
  });
});

describe("booking type text", () => {
  it("names the service being booked", () => {
    expect(typeText("Book a regular {service} appointment.", "Flea Control", "service")).toBe("Book a regular Flea Control appointment.");
    expect(typeText("Book a regular {service} appointment.", undefined, "service")).toBe("Book a regular service appointment.");
    expect(typeText(null, "X", "service")).toBe("");
  });
});
