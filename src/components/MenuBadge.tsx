"use client";

import { useLanguage } from "@/lib/language-context";

// The small tag the admin can put beside a menu item ("New").
export function MenuBadge({ item }: { item: { badgeEn?: string; badgeAr?: string } }) {
  const { lang } = useLanguage();
  const text = lang === "ar" ? item.badgeAr || item.badgeEn : item.badgeEn || item.badgeAr;
  return text ? <span className="ms-1.5 inline-block rounded-full bg-orange-500 px-1.5 py-0.5 align-middle text-[10px] font-bold leading-none text-white">{text}</span> : null;
}
