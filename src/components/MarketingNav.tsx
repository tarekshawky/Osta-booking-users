"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

const LINKS = [
  { href: "/", key: "nav.home" as const },
  { href: "/services", key: "nav.services" as const },
  { href: "/pricing", key: "nav.pricing" as const },
  { href: "/blog", key: "nav.blog" as const },
  { href: "/about", key: "nav.about" as const },
  { href: "/contact", key: "nav.contact" as const },
];

export function MarketingNav() {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-card-border bg-bg-elevated/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/">
          <Logo size="md" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {LINKS.map(({ href, key }) => (
            <Link key={href} href={href} className="text-sm text-text-muted hover:text-text">
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageToggle />
          <Link
            href={token ? "/dashboard" : "/login"}
            className="rounded-full border border-card-border px-4 py-2 text-sm font-medium text-text"
          >
            {token ? t("nav.dashboard") : t("nav.logIn")}
          </Link>
          <Link href="/orders/new" className="osta-btn-primary rounded-full px-4 py-2 text-sm font-semibold text-white">
            {t("nav.bookNow")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          className="text-text lg:hidden"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-card-border px-5 py-4 lg:hidden">
          {LINKS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm text-text-muted hover:bg-card hover:text-text"
            >
              {t(key)}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-3">
            <LanguageToggle />
            <Link
              href={token ? "/dashboard" : "/login"}
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full border border-card-border px-4 py-2 text-center text-sm font-medium text-text"
            >
              {token ? t("nav.dashboard") : t("nav.logIn")}
            </Link>
          </div>
          <Link
            href="/orders/new"
            onClick={() => setOpen(false)}
            className="osta-btn-primary mt-2 rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white"
          >
            {t("nav.bookNow")}
          </Link>
        </div>
      )}
    </header>
  );
}
