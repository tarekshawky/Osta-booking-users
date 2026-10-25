"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Wrench, ClipboardList, Receipt, User, LogOut, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";

const links: { href: string; key: TranslationKey; icon: typeof Plus }[] = [
  { href: "/orders/new", key: "more.bookService", icon: Plus },
  { href: "/services", key: "more.browseServices", icon: Wrench },
  { href: "/orders", key: "more.myOrders", icon: ClipboardList },
  { href: "/invoices", key: "more.myInvoices", icon: Receipt },
  { href: "/profile", key: "more.myProfile", icon: User },
];

export default function MorePage() {
  const { ready } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  if (!ready) return <FullPageSpinner />;

  return (
    <AppShell>
      <TopBar title={t("more.title")} />

      <div className="flex flex-col gap-3 px-5 py-5">
        {links.map(({ href, key, icon: Icon }) => (
          <Link key={href} href={href} className="osta-card flex items-center justify-between p-4">
            <span className="flex items-center gap-3 text-sm text-text">
              <Icon size={18} className="text-accent-2" />
              {t(key)}
            </span>
            <ChevronRight size={16} className="text-text-faint osta-flip-rtl" />
          </Link>
        ))}

        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="osta-card mt-4 flex items-center justify-center gap-2 border-rose-400/30 p-4 text-sm font-medium text-rose-300"
        >
          <LogOut size={16} /> {t("common.logOut")}
        </button>
      </div>
    </AppShell>
  );
}
