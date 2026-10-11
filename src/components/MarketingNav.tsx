"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { SiteLogo } from "./SiteLogo";
import { LanguageToggle } from "./LanguageToggle";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import type { SiteMenuItem } from "@/lib/site";

function NavLink({ item, className, onClick, label }: { item: SiteMenuItem; className: string; onClick?: () => void; label: string }) {
  const external = !item.url.startsWith("/");
  if (!external && !item.newTab) {
    return <Link href={item.url} className={className} onClick={onClick}>{label}</Link>;
  }
  return (
    <a href={item.url} className={className} onClick={onClick} {...(item.newTab || item.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {label}
    </a>
  );
}

export function MarketingNav() {
  const { t, lang } = useLanguage();
  const { token } = useAuth();
  const { settings, menus } = useSite();
  const [open, setOpen] = useState(false);
  const label = (m: SiteMenuItem) => (lang === "ar" ? m.labelAr || m.labelEn : m.labelEn || m.labelAr);
  const desktop = menus.header.filter((m) => m.showDesktop);
  const mobile = menus.header.filter((m) => m.showMobile);
  // "Book" always starts at the price calculator; only signed-in screens link straight to the booking form.
  const cta = { label: lang === "ar" ? settings.headerCtaLabelAr : settings.headerCtaLabelEn, url: settings.headerCtaUrl === "/orders/new" ? "/pricing" : settings.headerCtaUrl };

  return (
    <header className="sticky top-0 z-30 border-b border-card-border bg-bg-elevated/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/">
          <SiteLogo size="md" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {desktop.map((item) =>
            item.children.length ? (
              <div key={item.url + item.labelEn} className="group relative">
                <button type="button" className="flex items-center gap-1 text-sm text-text-muted hover:text-text">
                  {label(item)} <ChevronDown size={14} />
                </button>
                <div className="invisible absolute start-0 top-full z-40 min-w-44 rounded-xl border border-card-border bg-bg-elevated p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {item.children.filter((c) => c.showDesktop).map((c) => (
                    <NavLink key={c.url + c.labelEn} item={c} label={label(c)} className="block rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-card hover:text-text" />
                  ))}
                </div>
              </div>
            ) : (
              <NavLink key={item.url + item.labelEn} item={item} label={label(item)} className="text-sm text-text-muted hover:text-text" />
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageToggle />
          <Link href={token ? "/dashboard" : "/login"} className="rounded-full border border-card-border px-4 py-2 text-sm font-medium text-text">
            {token ? t("nav.dashboard") : t("nav.logIn")}
          </Link>
          {cta.label && cta.url && (
            <NavLink item={{ url: cta.url, labelEn: cta.label, labelAr: cta.label, newTab: false, showDesktop: true, showMobile: true, children: [] }} label={cta.label} className="osta-btn-primary rounded-full px-4 py-2 text-sm font-semibold text-white" />
          )}
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu" className="text-text lg:hidden">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-card-border px-5 py-4 lg:hidden">
          {mobile.map((item) => (
            <div key={item.url + item.labelEn}>
              <NavLink item={item} label={label(item)} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 text-sm text-text-muted hover:bg-card hover:text-text" />
              {item.children.filter((c) => c.showMobile).map((c) => (
                <NavLink key={c.url + c.labelEn} item={c} label={label(c)} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 ps-6 text-sm text-text-faint hover:bg-card hover:text-text" />
              ))}
            </div>
          ))}
          <div className="mt-2 flex items-center gap-3">
            <LanguageToggle />
            <Link href={token ? "/dashboard" : "/login"} onClick={() => setOpen(false)} className="flex-1 rounded-full border border-card-border px-4 py-2 text-center text-sm font-medium text-text">
              {token ? t("nav.dashboard") : t("nav.logIn")}
            </Link>
          </div>
          {cta.label && cta.url && (
            <NavLink item={{ url: cta.url, labelEn: cta.label, labelAr: cta.label, newTab: false, showDesktop: true, showMobile: true, children: [] }} label={cta.label} onClick={() => setOpen(false)} className="osta-btn-primary mt-2 rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white" />
          )}
        </div>
      )}
    </header>
  );
}
