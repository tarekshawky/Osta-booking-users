"use client";

import Link from "next/link";
import { ChevronDown, Clock, MapPin, MessageCircle, Navigation, Phone, Star } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { branchHeading, isSafeEmbed, reviewsLink, safeLink, whatsappWithText, type PublicBranch } from "@/lib/locations";

// The branch(es) of an emirate, shown automatically under the page's content. Everything visible here is also what the page's
// structured data says (address, phone, coordinates, hours, areas served, questions): both come from Website → Locations.
export function LocationSection({ branches }: { branches: PublicBranch[] }) {
  return <>{branches.map((b, i) => <BranchCard key={b.slug} branch={b} first={i === 0} map />)}</>;
}

export function BranchCard({ branch: b, first = false, map = true, heading = true }: { branch: PublicBranch; first?: boolean; map?: boolean; heading?: boolean }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const name = ar ? b.nameAr || b.nameEn : b.nameEn;
  const address = ar ? b.addressAr || b.addressEn : b.addressEn || b.addressAr;
  const hours = ar ? b.hoursSummary.ar : b.hoursSummary.en;
  const wa = whatsappWithText(b, ar);
  const reviews = reviewsLink(b);
  const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold";
  const H = first ? "h2" : "h3";

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-10" aria-labelledby={`branch-${b.slug}`} id={`branch-${b.slug}`}>
      {heading && <H id={`branch-${b.slug}`} className="text-2xl font-bold text-text sm:text-3xl">{branchHeading(b, ar)}</H>}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="osta-card flex flex-col gap-4 p-5">
          <address className="flex gap-3 text-sm not-italic text-text">
            <MapPin size={18} className="mt-0.5 shrink-0 text-accent-2" aria-hidden />
            <span><span className="block font-semibold">{name}</span>{address}</span>
          </address>
          {b.phone && b.telHref && (
            <p className="flex gap-3 text-sm text-text"><Phone size={18} className="shrink-0 text-accent-2" aria-hidden /><a href={safeLink(b.telHref)} dir="ltr" className="hover:underline">{b.phone}</a></p>
          )}
          {hours && <p className="flex gap-3 text-sm text-text"><Clock size={18} className="shrink-0 text-accent-2" aria-hidden /><span><span className="text-text-muted">{ar ? "ساعات العمل: " : "Hours: "}</span><span dir="ltr">{hours}</span></span></p>}
          {b.rating && (
            <p className="flex gap-3 text-sm text-text">
              <Star size={18} className="shrink-0 text-accent-2" aria-hidden />
              <span>{b.rating.value.toFixed(1)} / 5 · {b.rating.count} {ar ? "تقييم على Google" : "Google reviews"}{reviews && <> · <a href={reviews} target="_blank" rel="noopener noreferrer" className="underline">{ar ? "اقرأ التقييمات" : "Read the reviews"}</a></>}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            <a href={safeLink(b.directionsUrl)} target="_blank" rel="noopener noreferrer" className={`${btn} osta-btn-primary text-white`}><Navigation size={16} aria-hidden />{ar ? `الاتجاهات إلى ${name}` : `Get Directions to ${name}`}</a>
            {b.phone && b.telHref && <a href={safeLink(b.telHref)} className={`${btn} border border-card-border text-text hover:border-accent`}><Phone size={16} aria-hidden />{ar ? "اتصل بنا" : "Call us"}</a>}
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn} border border-card-border text-text hover:border-accent`}><MessageCircle size={16} aria-hidden />{ar ? "احجز عبر واتساب" : "Book on WhatsApp"}</a>}
          </div>
          {(b.appleMapsUrl || b.businessProfileUrl) && (
            <p className="text-xs text-text-faint">
              {b.appleMapsUrl && <a href={safeLink(b.appleMapsUrl)} target="_blank" rel="noopener noreferrer" className="underline">{ar ? "افتح في خرائط Apple" : "Open in Apple Maps"}</a>}
              {b.appleMapsUrl && b.businessProfileUrl && " · "}
              {b.businessProfileUrl && <a href={safeLink(b.businessProfileUrl)} target="_blank" rel="noopener noreferrer" className="underline">Google Business Profile</a>}
            </p>
          )}
        </div>
        {map && isSafeEmbed(b.embedUrl) ? (
          <iframe
            title={ar ? `خريطة ${name}` : `Map of ${name}`}
            src={b.embedUrl}
            className="h-72 w-full rounded-2xl border border-card-border md:h-full md:min-h-72"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : null}
      </div>

      {b.categories.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-text">{ar ? `الخدمات المتاحة في ${b.areaNameAr}` : `Services available in ${b.areaNameEn}`}</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {b.categories.map((c) => {
              const label = ar ? c.nameAr || c.nameEn : c.nameEn;
              return <li key={c.nameEn}>{c.href ? <Link href={c.href} className="inline-block rounded-full border border-card-border px-3 py-1.5 text-sm text-text hover:border-accent">{label}</Link> : <span className="inline-block rounded-full border border-card-border px-3 py-1.5 text-sm text-text-muted">{label}</span>}</li>;
            })}
          </ul>
        </div>
      )}

      {b.coverage.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-text">{ar ? `مناطق التغطية في ${b.areaNameAr}` : `Verified coverage areas in ${b.areaNameEn}`}</h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-text-muted sm:grid-cols-3">
            {b.coverage.map((c) => <li key={c.nameEn} className="flex items-center gap-2"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-2" aria-hidden />{ar ? c.nameAr || c.nameEn : c.nameEn}</li>)}
          </ul>
        </div>
      )}

      {b.faqs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-text">{ar ? `أسئلة شائعة عن ${b.areaNameAr}` : `Questions about our ${b.areaNameEn} service`}</h3>
          <div className="mt-3 flex flex-col gap-2">
            {b.faqs.map((f) => (
              <details key={f.question.en} className="osta-card group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-text">
                  {ar ? f.question.ar || f.question.en : f.question.en}
                  <ChevronDown size={16} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-3 whitespace-pre-line text-sm text-text-muted">{ar ? f.answer.ar || f.answer.en : f.answer.en}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
