// Rules for the customer sign-in pages. They match what the server enforces (see the admin app's /auth routes), so a problem is
// caught on the page before the request is sent; the server still checks everything again.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v: string) => EMAIL_PATTERN.test(v.trim());

export type PasswordRules = { length: boolean; capital: boolean; number: boolean };
export const passwordRules = (p: string): PasswordRules => ({ length: p.length >= 8, capital: /^[A-Z]/.test(p), number: /[0-9]/.test(p) });
export const isValidPassword = (p: string) => Object.values(passwordRules(p)).every(Boolean);

export type Country = { dial: string; name: { en: string; ar: string } };
// +971 first: it is the default for customers in the UAE.
export const COUNTRIES: Country[] = [
  { dial: "971", name: { en: "UAE", ar: "الإمارات" } },
  { dial: "966", name: { en: "Saudi Arabia", ar: "السعودية" } },
  { dial: "965", name: { en: "Kuwait", ar: "الكويت" } },
  { dial: "974", name: { en: "Qatar", ar: "قطر" } },
  { dial: "973", name: { en: "Bahrain", ar: "البحرين" } },
  { dial: "968", name: { en: "Oman", ar: "عُمان" } },
  { dial: "20", name: { en: "Egypt", ar: "مصر" } },
  { dial: "962", name: { en: "Jordan", ar: "الأردن" } },
  { dial: "961", name: { en: "Lebanon", ar: "لبنان" } },
  { dial: "91", name: { en: "India", ar: "الهند" } },
  { dial: "92", name: { en: "Pakistan", ar: "باكستان" } },
  { dial: "63", name: { en: "Philippines", ar: "الفلبين" } },
  { dial: "44", name: { en: "United Kingdom", ar: "المملكة المتحدة" } },
  { dial: "1", name: { en: "USA / Canada", ar: "أمريكا / كندا" } },
];

// A mobile number typed next to a country code. Returns the digits the app stores and signs in with: for the UAE the national
// number without the leading 0 (as customers have always been saved), for other countries the country code plus the number.
export function mobileDigits(dial: string, input: string): { ok: true; digits: string; full: string } | { ok: false } {
  let d = input.replace(/\D/g, "");
  // Someone pastes the whole number ("+971 56…" or "00971…") into the box: drop the code they already included.
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith(dial) && d.length > dial.length + 6) d = d.slice(dial.length);
  d = d.replace(/^0+/, "");
  if (d.length < 7 || d.length > 12) return { ok: false };
  // UAE mobiles are 9 digits (5X XXX XXXX); landlines are not accepted for sign-in.
  if (dial === "971" && !/^5\d{8}$/.test(d)) return { ok: false };
  return { ok: true, digits: dial === "971" ? d : `${dial}${d}`, full: `+${dial}${d}` };
}

// What the "forgot password" box holds: an email, or a mobile number (with or without a country code). Returns the text to send to
// the server, or null when it is neither.
export function classifyContact(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (v.includes("@")) return isEmail(v) ? v : null;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? v : null;
}
