"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/lib/nav";
import { ChevronDown, Menu, X } from "lucide-react";
import { SiteLogo } from "./SiteLogo";
import { LanguageToggle } from "./LanguageToggle";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import type { SiteMenuItem } from "@/lib/site";

function NavLink({ item, className, activeClass = "", onClick, label }: { item: SiteMenuItem; className: string; activeClass?: string; onClick?: () => void; label: string }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.url);
  className = active ? `${className} ${activeClass}` : className;
  const current = active ? ({ "aria-current": "page" } as const) : {};
  // No URL: a label only (a dropdown heading, or an area that has no page yet).
  if (!item.url) return <span className={className}>{label}</span>;
  const external = !item.url.startsWith("/");
  if (!external && !item.newTab) {
    return <Link href={item.url} className={className} onClick={onClick} {...current}>{label}</Link>;
  }
  return (
    <a href={item.url} className={className} onClick={onClick} {...current} {...(item.newTab || item.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {label}
    </a>
  );
}

// Top-bar links: colour change plus an underline that grows on hover and stays on the page you are on.
const BAR_LINK = "relative whitespace-nowrap py-1 text-sm text-text-muted transition-colors hover:text-accent-2 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:scale-x-0 after:rounded after:bg-accent-2 after:transition-transform hover:after:scale-x-100";
const BAR_ACTIVE = "!text-text font-semibold after:!scale-x-100";
const DROP_LINK = "block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-card hover:text-accent-2";
const DROP_ACTIVE = "bg-card !text-accent-2 font-medium";
const MOBILE_LINK = "block rounded-lg px-2 py-2.5 text-sm text-text-muted transition-colors hover:bg-card hover:text-accent-2";
const MOBILE_SUB = "block rounded-lg px-2 py-2 ps-6 text-sm text-text-faint transition-colors hover:bg-card hover:text-accent-2";
const MOBILE_ACTIVE = "bg-card !text-accent-2 font-semibold";

function BarItem({ item, label }: { item: SiteMenuItem; label: (m: SiteMenuItem) => string }) {
  const pathname = usePathname();
  if (!item.children.length) return <NavLink item={item} label={label(item)} className={BAR_LINK} activeClass={BAR_ACTIVE} />;
  return (
    <div className="group relative">
      <button type="button" className={`flex items-center gap-1 ${BAR_LINK} ${item.children.some((c) => isActivePath(pathname, c.url)) ? BAR_ACTIVE : ""}`}>
        {label(item)} <ChevronDown size={14} />
      </button>
      <div className="invisible absolute start-0 top-full z-40 min-w-44 rounded-xl border border-card-border bg-bg-elevated p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        {item.children.filter((c) => c.showDesktop).map((c) => (
          <NavLink key={c.url + c.labelEn} item={c} label={label(c)} className={DROP_LINK} activeClass={DROP_ACTIVE} />
        ))}
      </div>
    </div>
  );
}

// A mobile menu entry with sub-links: closed by default, the arrow opens and closes it. The link itself (when it has an
// address) still navigates; an entry without an address toggles as a whole.
function MobileGroup({ item, subs, label, onNavigate }: { item: SiteMenuItem; subs: SiteMenuItem[]; label: (m: SiteMenuItem) => string; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const id = `sub-${(item.url || item.labelEn).replace(/[^a-z0-9]/gi, "")}`;
  return (
    <>
      <div className="flex items-center">
        {item.url ? (
          <div className="min-w-0 flex-1"><NavLink item={item} label={label(item)} onClick={onNavigate} className={MOBILE_LINK} activeClass={MOBILE_ACTIVE} /></div>
        ) : (
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls={id} className={`${MOBILE_LINK} min-w-0 flex-1 text-start`}>
            {label(item)}
          </button>
        )}
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls={id} aria-label={label(item)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card hover:text-accent-2">
          <ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>
      {expanded && (
        <div id={id}>
          {subs.map((c) => (
            <NavLink key={c.url + c.labelEn} item={c} label={label(c)} onClick={onNavigate} className={MOBILE_SUB} activeClass={MOBILE_ACTIVE} />
          ))}
        </div>
      )}
    </>
  );
}

export function MarketingNav() {
  const { t, lang } = useLanguage();
  const { token } = useAuth();
  const pathname = usePathname();
  const { settings, menus } = useSite();
  const [open, setOpen] = useState(false);
  const label = (m: SiteMenuItem) => (lang === "ar" ? m.labelAr || m.labelEn : m.labelEn || m.labelAr);
  const desktop = menus.header.filter((m) => m.showDesktop);
  // The phone menu is its own menu when the admin filled it in; otherwise it follows the header menu.
  const mobile = (menus.mobile?.length ? menus.mobile : menus.header).filter((m) => m.showMobile);
  // "Book" always starts at the price calculator; only signed-in screens link straight to the booking form.
  // Desktop bar: every link stays on one line. Links that do not fit move into a "More" menu (measured, so it adapts to the screen and language).
  const navRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<number | null>(null);
  const shown = fit === null ? desktop : desktop.slice(0, fit);
  const hidden = fit === null ? [] : desktop.slice(fit);
  const signature = desktop.map((m) => m.url + m.labelEn + m.labelAr).join("|") + lang;
  useLayoutEffect(() => {
    const nav = navRef.current;
    const measure = measureRef.current;
    if (!nav || !measure) return;
    const compute = () => {
      const widths = [...measure.children].map((c) => (c as HTMLElement).offsetWidth);
      const moreW = widths.pop() ?? 0;
      const gap = parseFloat(getComputedStyle(measure).columnGap) || 20;
      const room = nav.clientWidth;
      const total = widths.reduce((a, w) => a + w, 0) + gap * Math.max(widths.length - 1, 0);
      if (total <= room) return setFit(widths.length);
      let used = moreW;
      let count = 0;
      for (const w of widths) {
        if (used + gap + w > room) break;
        used += gap + w;
        count++;
      }
      setFit(Math.max(count, 0));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(nav);
    void document.fonts?.ready.then(compute);
    return () => ro.disconnect();
  }, [signature]);
  const cta = { label: lang === "ar" ? settings.headerCtaLabelAr : settings.headerCtaLabelEn, url: settings.headerCtaUrl === "/orders/new" ? "/pricing" : settings.headerCtaUrl };

  return (
    <header className="sticky top-0 z-30 border-b border-card-border bg-bg-elevated/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2">
        <Link href="/" className="shrink-0">
          <SiteLogo size="xl" />
        </Link>

        <nav ref={navRef} className="relative mx-4 hidden min-w-0 flex-1 items-center gap-5 overflow-visible whitespace-nowrap lg:flex xl:gap-6">
          {/* Hidden copy used only to measure each link, so the bar can show as many as fit on ONE line each. */}
          <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute -z-10 flex h-0 items-center gap-5 overflow-hidden whitespace-nowrap xl:gap-6">
            {desktop.map((item) => (
              <span key={item.url + item.labelEn} className={`flex items-center gap-1 ${BAR_LINK}`}>
                {label(item)} {item.children.length > 0 && <ChevronDown size={14} />}
              </span>
            ))}
            <span className={`flex items-center gap-1 ${BAR_LINK}`}>{t("nav.more")} <ChevronDown size={14} /></span>
          </div>
          {shown.map((item) => (
            <BarItem key={item.url + item.labelEn} item={item} label={label} />
          ))}
          {hidden.length > 0 && (
            <div className="group relative">
              <button type="button" className={`flex items-center gap-1 ${BAR_LINK} ${hidden.some((m) => isActivePath(pathname, m.url) || m.children.some((c) => isActivePath(pathname, c.url))) ? BAR_ACTIVE : ""}`}>
                {t("nav.more")} <ChevronDown size={14} />
              </button>
              <div className="invisible absolute end-0 top-full z-40 min-w-52 rounded-xl border border-card-border bg-bg-elevated p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                {hidden.map((item) => (
                  <div key={item.url + item.labelEn}>
                    <NavLink item={item} label={label(item)} className={DROP_LINK} activeClass={DROP_ACTIVE} />
                    {item.children.filter((c) => c.showDesktop).map((c) => (
                      <NavLink key={c.url + c.labelEn} item={c} label={label(c)} className={`${DROP_LINK} ps-7 text-text-faint`} activeClass={DROP_ACTIVE} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 whitespace-nowrap lg:flex">
          <LanguageToggle />
          <Link href={token ? "/dashboard" : "/login"} className="whitespace-nowrap rounded-full border border-card-border px-4 py-2 text-sm font-medium text-text">
            {token ? t("nav.dashboard") : t("nav.logIn")}
          </Link>
          {cta.label && cta.url && (
            <NavLink item={{ url: cta.url, labelEn: cta.label, labelAr: cta.label, newTab: false, showDesktop: true, showMobile: true, children: [] }} label={cta.label} className="osta-btn-primary whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-white" />
          )}
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu" className="text-text lg:hidden">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-card-border px-5 py-4 lg:hidden">
          {mobile.map((item) => {
            const subs = item.children.filter((c) => c.showMobile);
            return (
              <div key={item.url + item.labelEn}>
                {subs.length ? (
                  <MobileGroup item={item} subs={subs} label={label} onNavigate={() => setOpen(false)} />
                ) : (
                  <NavLink item={item} label={label(item)} onClick={() => setOpen(false)} className={MOBILE_LINK} activeClass={MOBILE_ACTIVE} />
                )}
              </div>
            );
          })}
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
