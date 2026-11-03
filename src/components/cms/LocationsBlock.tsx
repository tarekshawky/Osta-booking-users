"use client";

import { useLanguage } from "@/lib/language-context";
import { RichLine } from "@/components/cms/RichInline";
import { BranchCard } from "@/components/cms/LocationSection";
import type { PublicBranch } from "@/lib/locations";

type Bi = { en: string; ar: string };

// "Our locations": every active branch with its address, phone, directions and (optionally) its map.
export function LocationsBlock({ p, branches }: { p: Record<string, unknown>; branches: PublicBranch[] }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const bi = (v: Bi | undefined) => (v ? (ar ? v.ar || v.en : v.en || v.ar) : "");
  if (branches.length === 0) return null;
  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-12">
      {bi(p.heading as Bi) && <h2 className="text-center text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
      {bi(p.subtitle as Bi) && <RichLine className="mx-auto mt-3 max-w-md text-center text-sm text-text-muted" text={bi(p.subtitle as Bi)} />}
      <div className="mt-2">
        {branches.map((b) => (
          <div key={b.slug} className="py-2">
            <h3 className="pt-6 text-xl font-semibold text-text">{ar ? b.nameAr || b.nameEn : b.nameEn}</h3>
            <BranchCard branch={b} map={p.showMap !== "no"} heading={false} />
          </div>
        ))}
      </div>
    </section>
  );
}
