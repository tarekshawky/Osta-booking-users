"use client";

import { Logo } from "./Logo";
import { useSite } from "@/lib/site-context";
import { useLanguage } from "@/lib/language-context";

// The admin-uploaded logo if there is one, otherwise the built-in OSTA wordmark.
export function SiteLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { settings } = useSite();
  const { lang } = useLanguage();
  if (!settings.logoUrl) return <Logo size={size} />;
  const h = { sm: "h-6", md: "h-8", lg: "h-12" }[size];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={settings.logoUrl} alt={lang === "ar" ? settings.siteNameAr : settings.siteNameEn} className={`${h} w-auto`} />;
}
