"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MessageCircle, Mail, MapPin, Building2, Globe, LogOut } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Customer } from "@/lib/api";

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon size={17} className="mt-0.5 text-text-faint" />
      <div>
        <p className="text-[11px] text-text-faint">{label}</p>
        <p className="text-sm text-text">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { ready } = useRequireAuth();
  const { customer, logout, refreshMe } = useAuth();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    refreshMe().finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready || !loaded) return <FullPageSpinner />;

  const full = customer as Customer | null;
  const address = [full?.buildingName, full?.flatNo, full?.area, full?.city, full?.emirate]
    .filter(Boolean)
    .join(", ");

  return (
    <AppShell>
      <TopBar title="My Profile" />

      <div className="flex flex-col items-center gap-2 px-5 pt-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full osta-glow-border bg-card">
          <User size={32} className="text-accent-2" />
        </div>
        <p className="text-base font-semibold text-text">{full?.name}</p>
        {full?.companyName && <p className="text-xs text-text-muted">{full.companyName}</p>}
        <p className="text-xs text-text-faint">Customer ID: {full?.code}</p>
      </div>

      <div className="osta-card mx-5 mt-6 divide-y divide-card-border px-4">
        <Row icon={Phone} label="Mobile Number" value={full?.phone ?? null} />
        <Row icon={MessageCircle} label="WhatsApp Number" value={full?.whatsapp ?? null} />
        <Row icon={Mail} label="Email" value={full?.email ?? null} />
        <Row icon={Building2} label="Address" value={address || null} />
        <Row icon={MapPin} label="Emirate" value={full?.emirate ?? null} />
        <Row icon={Globe} label="Language" value={full?.language ?? null} />
      </div>

      <p className="mx-5 mt-4 text-center text-[11px] text-text-faint">
        To update your profile details, please contact OSTA Services support.
      </p>

      <div className="mt-auto px-5 pb-6 pt-8">
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 py-3 text-sm font-medium text-rose-300"
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </AppShell>
  );
}
