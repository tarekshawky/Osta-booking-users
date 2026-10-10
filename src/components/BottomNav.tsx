"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Receipt, User, Menu } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";

const items: { href: string; labelKey: TranslationKey; icon: typeof Home }[] = [
  { href: "/dashboard", labelKey: "common.home", icon: Home },
  { href: "/orders", labelKey: "common.orders", icon: ClipboardList },
  { href: "/invoices", labelKey: "common.invoices", icon: Receipt },
  { href: "/profile", labelKey: "common.profile", icon: User },
  { href: "/more", labelKey: "common.more", icon: Menu },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="sticky bottom-0 z-20 border-t border-card-border bg-bg-elevated/95 backdrop-blur print:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
        {items.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px]"
              >
                <Icon
                  size={20}
                  className={active ? "text-accent-2" : "text-text-faint"}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className={active ? "text-accent-2" : "text-text-faint"}>{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
