"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "@/lib/nav";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { SiteLogo } from "./SiteLogo";
import { LanguageToggle } from "./LanguageToggle";
import { MenuBadge } from "./MenuBadge";
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
  const content = <>{label}<MenuBadge item={item} /></>;
  if (!item.url) return <span className={className}>{content}</span>;
  const external = !item.url.startsWith("/");
  if (!external && !item.newTab) {
    return <Link href={item.url} className={className} onClick={onClick} {...current}>{content}</Link>;
  }
  return (
    <a href={item.url} className={className} onClick={onClick} {...current} {...(item.newTab || item.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {content}
    </a>
  );
}

// Top-bar links: colour change plus an underline that grows on hover and stays on the page you are on.
const BAR_LINK = "relative whitespace-nowrap py-1 text-sm text-text-muted transition-colors hover:text-accent-2 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:scale-x-0 after:rounded after:bg-accent-2 after:transition-transform hover:after:scale-x-100";
// True when the item or any item below it is the page being viewed.
const anyActive = (pathname: string, m: SiteMenuItem): boolean => isActivePath(pathname, m.url) || m.children.some((c) => anyActive(pathname, c));

const BAR_ACTIVE = "!text-text font-semibold after:!scale-x-100";
// A menu item the admin made a "Button".
const BAR_BUTTON = "osta-btn-primary whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-white";
const MOBILE_BUTTON = "osta-btn-primary my-1 block rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white";
const DROP_LINK = "block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-card hover:text-accent-2";
const DROP_ACTIVE = "bg-card !text-accent-2 font-medium";
const MOBILE_LINK = "block rounded-lg px-2 py-2.5 text-sm text-text-muted transition-colors hover:bg-card hover:text-accent-2";
const MOBILE_SUB = "block rounded-lg px-2 py-2 text-sm text-text-faint transition-colors hover:bg-card hover:text-accent-2";
const MOBILE_ACTIVE = "bg-card !text-accent-2 font-semibold";

// A dropdown with more rows than this is laid out in four columns.
const ONE_COLUMN_MAX = 10;
const COLUMNS = 4;
const WIDE_WIDTH = "w-[min(64rem,calc(100vw-1rem))]";
// Long names wrap inside their column instead of pushing into the next one.
const WIDE_ROWS = "[&_a]:!whitespace-normal [&_a]:!py-1.5 [&_span.block]:!whitespace-normal [&_span.block]:!py-1.5";

// A four-column panel is much wider than the link it hangs from, so it is slid sideways to stay inside the window. It is placed
// while still invisible too, otherwise it would make the whole page scroll sideways.
function useKeepOnScreen(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const place = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.translate = "";
    if (!active) return;
    const box = el.getBoundingClientRect();
    const room = document.documentElement.clientWidth;
    const shift = box.right > room - 8 ? room - 8 - box.right : box.left < 8 ? 8 - box.left : 0;
    if (shift) el.style.translate = `${shift}px 0`;
  }, [active]);
  useLayoutEffect(() => {
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  });
  return { ref, place };
}

// One row of a desktop dropdown. A row with sub-items of its own opens a fly-out panel beside it (up to three levels in all). A
// fly-out whose rows have no sub-items of their own scrolls when it is long (a category can have dozens of services); rows in the
// lower half of a tall panel open their fly-out upwards so it stays on screen.
function DropItem({ item, label, up = false, back = false }: { item: SiteMenuItem; label: (m: SiteMenuItem) => string; up?: boolean; back?: boolean }) {
  const subs = item.children.filter((c) => c.showDesktop);
  if (!subs.length) return <NavLink item={item} label={label(item)} className={DROP_LINK} activeClass={DROP_ACTIVE} />;
  const leafPanel = subs.every((c) => !c.children.some((d) => d.showDesktop));
  return (
    <div className="group/sub relative">
      <div className="flex items-center">
        <div className="min-w-0 flex-1"><NavLink item={item} label={label(item)} className={DROP_LINK} activeClass={DROP_ACTIVE} /></div>
        <ChevronRight size={14} aria-hidden className={`me-2 shrink-0 text-text-faint ${back ? "rotate-180 rtl:rotate-0" : "rtl:rotate-180"}`} />
      </div>
      <div className={`invisible absolute ${back ? "end-full" : "start-full"} ${up ? "bottom-0" : "top-0"} z-40 min-w-44 rounded-xl border border-card-border bg-bg-elevated p-2 opacity-0 shadow-xl transition group-focus-within/sub:visible group-focus-within/sub:opacity-100 group-hover/sub:visible group-hover/sub:opacity-100 ${leafPanel ? "max-h-[min(60vh,24rem)] overflow-y-auto" : ""}`}>
        {subs.map((c, i) => <DropItem key={c.url + c.labelEn} item={c} label={label} up={!leafPanel && i >= subs.length / 2} back={back} />)}
      </div>
    </div>
  );
}

// The "More" menu is a plain list: an item and its direct sub-items (the item's own page lists anything deeper).
function MoreItems({ items, label, depth }: { items: SiteMenuItem[]; label: (m: SiteMenuItem) => string; depth: number }) {
  return (
    <>
      {items.filter((m) => m.showDesktop).map((m) => (
        <div key={m.url + m.labelEn}>
          <NavLink item={m} label={label(m)} className={depth === 0 ? DROP_LINK : `${DROP_LINK} ${depth === 1 ? "ps-7" : "ps-11"} text-text-faint`} activeClass={DROP_ACTIVE} />
          {depth < 1 && <MoreItems items={m.children} label={label} depth={depth + 1} />}
        </div>
      ))}
    </>
  );
}

function BarItem({ item, label }: { item: SiteMenuItem; label: (m: SiteMenuItem) => string }) {
  const pathname = usePathname();
  const subs = item.children.filter((c) => c.showDesktop);
  const wide = subs.length > ONE_COLUMN_MAX;
  const { ref, place } = useKeepOnScreen(wide);
  if (!item.children.length) return item.style === "button" ? <NavLink item={item} label={label(item)} className={BAR_BUTTON} /> : <NavLink item={item} label={label(item)} className={BAR_LINK} activeClass={BAR_ACTIVE} />;
  const rows = wide ? Math.ceil(subs.length / COLUMNS) : subs.length;
  // A very tall panel scrolls. Not when a row has a fly-out: a scrolling box would cut the fly-out off.
  const scrolls = wide && subs.every((c) => !c.children.some((d) => d.showDesktop));
  // Rows low in a tall panel open their fly-out upwards so it stays on screen.
  const opensUp = (i: number) => (wide ? rows >= 12 && i % rows >= rows / 2 : subs.length >= 6 && i >= subs.length / 2);
  return (
    <div className="group relative" onMouseEnter={place} onFocus={place}>
      <button type="button" className={`flex items-center gap-1 ${BAR_LINK} ${item.children.some((c) => anyActive(pathname, c)) ? BAR_ACTIVE : ""}`}>
        {label(item)}<MenuBadge item={item} /> <ChevronDown size={14} />
      </button>
      <div
        ref={ref}
        className={`invisible absolute start-0 top-full z-40 rounded-xl border border-card-border bg-bg-elevated p-2 opacity-0 shadow-xl transition-[opacity,visibility] group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${wide ? `grid content-start gap-x-1 ${WIDE_WIDTH} ${WIDE_ROWS} [&>*]:min-w-0 ${scrolls ? "max-h-[calc(100vh-7rem)] overflow-y-auto" : ""}` : "min-w-44"}`}
        style={wide ? { gridAutoFlow: "column", gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, auto)` } : undefined}
      >
        {subs.map((c, i) => (
          // In the last two columns a fly-out opens back toward the middle, so it does not leave the screen.
          <DropItem key={c.url + c.labelEn} item={c} label={label} up={opensUp(i)} back={wide && Math.floor(i / rows) >= COLUMNS / 2} />
        ))}
      </div>
    </div>
  );
}

// The links that do not fit on the bar. A long list is laid out in four columns too, and scrolls if it is taller than the window.
function MoreMenu({ items, label, text, active }: { items: SiteMenuItem[]; label: (m: SiteMenuItem) => string; text: string; active: boolean }) {
  const listed = items.filter((m) => m.showDesktop);
  const wide = listed.reduce((n, m) => n + 1 + m.children.filter((c) => c.showDesktop).length, 0) > ONE_COLUMN_MAX;
  const { ref, place } = useKeepOnScreen(wide);
  return (
    <div className="group relative" onMouseEnter={place} onFocus={place}>
      <button type="button" className={`flex items-center gap-1 ${BAR_LINK} ${active ? BAR_ACTIVE : ""}`}>
        {text} <ChevronDown size={14} />
      </button>
      <div ref={ref} className={`invisible absolute end-0 top-full z-40 rounded-xl border border-card-border bg-bg-elevated p-2 opacity-0 shadow-xl transition-[opacity,visibility] group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${wide ? `max-h-[calc(100vh-7rem)] overflow-y-auto ${WIDE_WIDTH}` : "min-w-52"}`}>
        {wide ? (
          <div className={`gap-x-1 [column-count:4] ${WIDE_ROWS}`}>
            {listed.map((m) => (
              <div key={m.url + m.labelEn} className="break-inside-avoid">
                <MoreItems items={[m]} label={label} depth={0} />
              </div>
            ))}
          </div>
        ) : (
          <MoreItems items={listed} label={label} depth={0} />
        )}
      </div>
    </div>
  );
}

// A mobile menu entry with sub-links: closed by default, the arrow opens and closes it. The link itself (when it has an
// address) still navigates; an entry without an address toggles as a whole.
function MobileGroup({ item, subs, label, onNavigate, level = 0 }: { item: SiteMenuItem; subs: SiteMenuItem[]; label: (m: SiteMenuItem) => string; onNavigate: () => void; level?: number }) {
  const [expanded, setExpanded] = useState(false);
  const id = `sub-${(item.url || item.labelEn).replace(/[^a-z0-9]/gi, "")}`;
  return (
    <>
      <div className="flex items-center">
        {item.url ? (
          <div className="min-w-0 flex-1"><NavLink item={item} label={label(item)} onClick={onNavigate} className={MOBILE_LINK} activeClass={MOBILE_ACTIVE} /></div>
        ) : (
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls={id} className={`${MOBILE_LINK} min-w-0 flex-1 text-start`}>
            {label(item)}<MenuBadge item={item} />
          </button>
        )}
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls={id} aria-label={label(item)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card hover:text-accent-2">
          <ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>
      {expanded && (
        <div id={id}>
          {subs.map((c) => {
            const deeper = c.children.filter((d) => d.showMobile);
            const indent = level === 0 ? "ps-6" : "ps-10";
            return deeper.length ? (
              <div key={c.url + c.labelEn} className={level === 0 ? "ps-4" : "ps-8"}>
                <MobileGroup item={c} subs={deeper} label={label} onNavigate={onNavigate} level={level + 1} />
              </div>
            ) : (
              <NavLink key={c.url + c.labelEn} item={c} label={label(c)} onClick={onNavigate} className={`${MOBILE_SUB} ${indent}`} activeClass={MOBILE_ACTIVE} />
            );
          })}
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
  const signature = desktop.map((m) => m.url + m.labelEn + m.labelAr + (m.style ?? "") + (m.badgeEn ?? "") + (m.badgeAr ?? "")).join("|") + lang;
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
              <span key={item.url + item.labelEn} className={item.style === "button" && !item.children.length ? BAR_BUTTON : `flex items-center gap-1 ${BAR_LINK}`}>
                {label(item)}<MenuBadge item={item} /> {item.children.length > 0 && <ChevronDown size={14} />}
              </span>
            ))}
            <span className={`flex items-center gap-1 ${BAR_LINK}`}>{t("nav.more")} <ChevronDown size={14} /></span>
          </div>
          {shown.map((item) => (
            <BarItem key={item.url + item.labelEn} item={item} label={label} />
          ))}
          {hidden.length > 0 && <MoreMenu items={hidden} label={label} text={t("nav.more")} active={hidden.some((m) => anyActive(pathname, m))} />}
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
        <div className="flex max-h-[calc(100dvh-6rem)] flex-col gap-1 overflow-y-auto overscroll-contain border-t border-card-border px-5 py-4 [&>*]:shrink-0 lg:hidden">
          {mobile.map((item) => {
            const subs = item.children.filter((c) => c.showMobile);
            return (
              <div key={item.url + item.labelEn}>
                {subs.length ? (
                  <MobileGroup item={item} subs={subs} label={label} onNavigate={() => setOpen(false)} />
                ) : (
                  <NavLink item={item} label={label(item)} onClick={() => setOpen(false)} className={item.style === "button" ? MOBILE_BUTTON : MOBILE_LINK} activeClass={item.style === "button" ? "" : MOBILE_ACTIVE} />
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
