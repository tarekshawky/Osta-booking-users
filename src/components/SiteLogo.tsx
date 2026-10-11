"use client";

import { Logo } from "./Logo";
import { useSite } from "@/lib/site-context";
import { useLanguage } from "@/lib/language-context";

// The admin-uploaded logo if there is one, otherwise the built-in OSTA wordmark.
export function SiteLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const { settings } = useSite();
  const { lang } = useLanguage();
  if (!settings.logoUrl) return <Logo size={size === "xl" ? "lg" : size} />;
  // xl is 10rem tall from tablet width up; phones get a smaller one so the sticky header doesn't fill the screen.
  const h = { sm: "h-6", md: "h-8", lg: "h-12", xl: "h-20 md:h-[10rem]" }[size];
  // Media-library logos come in several widths; the logo is at most 160px tall (320px on high-density screens), so ask for the small ones.
  const lib = /\/api\/media\/[^/?]+$/.test(settings.logoUrl);
  const src = lib ? `${settings.logoUrl}?w=480` : settings.logoUrl;
  const srcSet = lib ? `${settings.logoUrl}?w=480 480w, ${settings.logoUrl}?w=960 960w` : undefined;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} srcSet={srcSet} sizes={lib ? "160px" : undefined} alt={lang === "ar" ? settings.siteNameAr : settings.siteNameEn} width={160} height={160} className={`${h} w-auto max-w-[60vw] object-contain`} />;
}
