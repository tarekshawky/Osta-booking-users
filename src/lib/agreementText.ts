import type { AgreementStatus } from "@/lib/api";

export const STATUS_TEXT: Record<AgreementStatus, { en: string; ar: string }> = {
  DRAFT: { en: "Waiting for your acceptance", ar: "بانتظار موافقتك" },
  PENDING_APPROVAL: { en: "Pending approval", ar: "بانتظار الاعتماد" },
  CHANGES_REQUESTED: { en: "Changes requested", ar: "مطلوب تعديل" },
  AWAITING_PAYMENT: { en: "Approved – awaiting payment", ar: "معتمدة – بانتظار الدفع" },
  ACTIVE: { en: "Active", ar: "مفعّلة" },
  EXPIRED: { en: "Expired", ar: "منتهية" },
  CANCELLED: { en: "Cancelled", ar: "ملغاة" },
  REJECTED: { en: "Rejected", ar: "مرفوضة" },
};

export const STATUS_TONE: Record<AgreementStatus, string> = {
  DRAFT: "bg-slate-500/20 text-slate-200", PENDING_APPROVAL: "bg-amber-400/20 text-amber-200", CHANGES_REQUESTED: "bg-orange-400/20 text-orange-200",
  AWAITING_PAYMENT: "bg-sky-400/20 text-sky-200", ACTIVE: "bg-emerald-400/20 text-emerald-200", EXPIRED: "bg-zinc-500/20 text-zinc-300", CANCELLED: "bg-zinc-500/20 text-zinc-300", REJECTED: "bg-rose-400/20 text-rose-200",
};

export const money = (n: number | null | undefined, lang: "en" | "ar") => {
  if (n == null) return lang === "ar" ? "عرض سعر مخصص" : "Custom quotation";
  const v = n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return lang === "ar" ? `${v} د.إ` : `AED ${v}`;
};

export const dateText = (iso: string | null, lang: "en" | "ar") => (iso ? new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Dubai" }) : "—");

// A clause body is paragraphs separated by a blank line; a line starting with "- " is a bullet.
export function clauseBlocks(body: string): { text: string; bullets: string[] }[] {
  return body.split(/\n{2,}/).map((blk) => {
    const lines = blk.split("\n");
    return { text: lines.filter((l) => !l.startsWith("- ")).join(" "), bullets: lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2)) };
  });
}
