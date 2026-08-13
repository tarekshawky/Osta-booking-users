"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList, Receipt, User, LogOut, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";

const links = [
  { href: "/orders/new", label: "Book a Service", icon: Plus },
  { href: "/orders", label: "My Orders", icon: ClipboardList },
  { href: "/invoices", label: "My Invoices", icon: Receipt },
  { href: "/profile", label: "My Profile", icon: User },
];

export default function MorePage() {
  const { ready } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();

  if (!ready) return <FullPageSpinner />;

  return (
    <AppShell>
      <TopBar title="More" />

      <div className="flex flex-col gap-3 px-5 py-5">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="osta-card flex items-center justify-between p-4">
            <span className="flex items-center gap-3 text-sm text-text">
              <Icon size={18} className="text-accent-2" />
              {label}
            </span>
            <ChevronRight size={16} className="text-text-faint" />
          </Link>
        ))}

        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="osta-card mt-4 flex items-center justify-center gap-2 border-rose-400/30 p-4 text-sm font-medium text-rose-300"
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </AppShell>
  );
}
