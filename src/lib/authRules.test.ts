import { describe, it, expect } from "vitest";
import { COUNTRIES, classifyContact, isEmail, isValidPassword, mobileDigits, passwordRules } from "./authRules";

describe("sign-in rules", () => {
  it("checks emails", () => {
    for (const ok of ["a@b.co", " sara@example.com "]) expect(isEmail(ok), ok).toBe(true);
    for (const bad of ["", "a@b", "a b@c.de", "@x.com", "plain"]) expect(isEmail(bad), bad).toBe(false);
  });
  it("matches the server's password rule: 8+ characters, capital first, a number", () => {
    expect(passwordRules("Osta1234")).toEqual({ length: true, capital: true, number: true });
    expect(passwordRules("osta1234").capital).toBe(false);
    expect(passwordRules("Ostaaaaa").number).toBe(false);
    expect(passwordRules("Os1").length).toBe(false);
    expect(isValidPassword("Osta1234")).toBe(true);
    expect(isValidPassword("osta1234")).toBe(false);
  });
  it("turns a UAE mobile typed any common way into the saved national form", () => {
    for (const v of ["56 867 6036", "056 867 6036", "0568676036", "+971 56 867 6036", "00971568676036", "971568676036"]) {
      const r = mobileDigits("971", v);
      expect(r.ok, v).toBe(true);
      if (r.ok) { expect(r.digits).toBe("568676036"); expect(r.full).toBe("+971568676036"); }
    }
  });
  it("refuses numbers that cannot be a UAE mobile, and keeps other countries' full number", () => {
    for (const bad of ["", "123", "4 123 4567", "56 867 603", "56 867 60366"]) expect(mobileDigits("971", bad).ok, bad).toBe(false);
    const eg = mobileDigits("20", "100 123 4567");
    expect(eg.ok && eg.digits).toBe("201001234567");
    expect(mobileDigits("966", "0501234567").ok).toBe(true);
  });
  it("starts the country list with the UAE", () => {
    expect(COUNTRIES[0].dial).toBe("971");
    expect(new Set(COUNTRIES.map((c) => c.dial)).size).toBe(COUNTRIES.length);
  });  it("accepts an email or a mobile number in the forgot-password box, and nothing else", () => {
    expect(classifyContact(" sara@example.com ")).toBe("sara@example.com");
    expect(classifyContact("+971 56 867 6036")).toBe("+971 56 867 6036");
    expect(classifyContact("0568676036")).toBe("0568676036");
    for (const bad of ["", "  ", "nonsense", "a@b", "123"]) expect(classifyContact(bad), bad).toBeNull();
  });
});
