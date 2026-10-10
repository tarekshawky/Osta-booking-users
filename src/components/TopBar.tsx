"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";
import { LanguageToggle } from "./LanguageToggle";

export function TopBar({
  title,
  back,
  right,
}: {
  title: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-card-border bg-bg-elevated/95 px-4 py-3.5 backdrop-blur print:hidden">
      <div className="flex items-center gap-2">
        {back && (
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="rounded-full p-1 text-text-muted hover:text-text"
          >
            <ChevronLeft size={22} className="osta-flip-rtl" />
          </button>
        )}
        <h1 className="text-[15px] font-semibold text-text">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {right}
        <LanguageToggle />
      </div>
    </header>
  );
}
