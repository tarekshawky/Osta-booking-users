"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { DynamicIcon } from "@/components/DynamicIcon";
import { useSite } from "@/lib/site-context";
import type { HomeSection } from "@/lib/api";

function find(sections: HomeSection[], key: string) {
  return sections.find((s) => s.key === key);
}

export function HomeSections({ sections }: { sections: HomeSection[] }) {
  const { lang } = useLanguage();
  const { serviceAreas } = useSite();

  const sustainability = find(sections, "sustainability");
  const booking = find(sections, "booking");
  const whyChooseAjman = find(sections, "why-choose-ajman");
  const whyChoose = find(sections, "why-choose");
  const areas = find(sections, "areas-we-cover");
  const brands = find(sections, "brands-we-service");
  const prime = find(sections, "prime-membership");
  const achievements = find(sections, "achievements");

  return (
    <>
      {/* Sustainability */}
      {sustainability && (
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="osta-card grid gap-8 overflow-hidden p-6 sm:grid-cols-2 sm:items-center sm:p-10">
            {sustainability.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sustainability.imageUrl}
                alt={lang === "ar" ? sustainability.headingAr : sustainability.headingEn}
                className="rounded-xl object-cover"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-text">
                {lang === "ar" ? sustainability.headingAr : sustainability.headingEn}
              </h2>
              {(sustainability.descriptionEn || sustainability.descriptionAr) && (
                <p className="mt-3 text-sm text-text-muted">
                  {lang === "ar" ? sustainability.descriptionAr : sustainability.descriptionEn}
                </p>
              )}
              {sustainability.ctaUrl && (sustainability.ctaLabelEn || sustainability.ctaLabelAr) && (
                <Link href={sustainability.ctaUrl} className="mt-4 inline-block text-sm font-semibold text-accent-2">
                  {lang === "ar" ? sustainability.ctaLabelAr : sustainability.ctaLabelEn}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Booking */}
      {booking && (
        <section className="mx-auto w-full max-w-4xl px-5 pb-16 text-center">
          <div className="osta-card osta-glow-border px-6 py-12">
            <h2 className="text-2xl font-bold text-text sm:text-3xl">
              {lang === "ar" ? booking.headingAr : booking.headingEn}
            </h2>
            {(booking.descriptionEn || booking.descriptionAr) && (
              <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">
                {lang === "ar" ? booking.descriptionAr : booking.descriptionEn}
              </p>
            )}
            {booking.ctaUrl && (
              <Link
                href={booking.ctaUrl}
                className="osta-btn-primary mt-6 inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
              >
                {lang === "ar" ? booking.ctaLabelAr : booking.ctaLabelEn}
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Why Choose (Ajman & Al Ain) */}
      {whyChooseAjman && whyChooseAjman.items.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2 className="mx-auto max-w-3xl text-center text-2xl font-bold text-text sm:text-3xl">
            {lang === "ar" ? whyChooseAjman.headingAr : whyChooseAjman.headingEn}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyChooseAjman.items.map((item, i) => (
              <div key={i} className="osta-card p-5">
                {item.iconName && <DynamicIcon name={item.iconName} size={22} className="text-accent-2" />}
                <h3 className="mt-3 text-sm font-semibold text-text">
                  {lang === "ar" ? item.titleAr : item.titleEn}
                </h3>
                {(item.descriptionEn || item.descriptionAr) && (
                  <p className="mt-1.5 text-xs text-text-muted">
                    {lang === "ar" ? item.descriptionAr : item.descriptionEn}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Why Choose OSTA (general) */}
      {whyChoose && (
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="osta-card grid gap-8 overflow-hidden p-6 sm:grid-cols-2 sm:items-center sm:p-10">
            <div className={whyChoose.imageUrl ? "sm:order-2" : ""}>
              <h2 className="text-2xl font-bold text-text">
                {lang === "ar" ? whyChoose.headingAr : whyChoose.headingEn}
              </h2>
              {(whyChoose.descriptionEn || whyChoose.descriptionAr) && (
                <p className="mt-3 text-sm text-text-muted">
                  {lang === "ar" ? whyChoose.descriptionAr : whyChoose.descriptionEn}
                </p>
              )}
            </div>
            {whyChoose.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={whyChoose.imageUrl}
                alt={lang === "ar" ? whyChoose.headingAr : whyChoose.headingEn}
                className="rounded-xl object-cover sm:order-1"
              />
            )}
          </div>
        </section>
      )}

      {/* Areas We Cover */}
      {areas && (serviceAreas.length > 0 || areas.items.length > 0) && (
        <section className="mx-auto w-full max-w-4xl px-5 py-16 text-center">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">
            {lang === "ar" ? areas.headingAr : areas.headingEn}
          </h2>
          {(areas.descriptionEn || areas.descriptionAr) && (
            <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">
              {lang === "ar" ? areas.descriptionAr : areas.descriptionEn}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {serviceAreas.length > 0
              ? serviceAreas.map((a) => {
                  const label = lang === "ar" ? a.nameAr : a.nameEn;
                  const chip = "rounded-full border border-card-border px-4 py-2 text-sm text-text";
                  return a.pageSlug ? (
                    <Link key={a.slug} href={`/${a.pageSlug}`} className={`${chip} hover:border-accent`}>{label}</Link>
                  ) : (
                    <span key={a.slug} className={chip}>{label}</span>
                  );
                })
              : areas.items.map((item, i) => (
                  <span key={i} className="rounded-full border border-card-border px-4 py-2 text-sm text-text">
                    {lang === "ar" ? item.titleAr : item.titleEn}
                  </span>
                ))}
          </div>
        </section>
      )}

      {/* Brands We Service */}
      {brands && brands.items.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-5 py-16 text-center">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">
            {lang === "ar" ? brands.headingAr : brands.headingEn}
          </h2>
          {(brands.descriptionEn || brands.descriptionAr) && (
            <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">
              {lang === "ar" ? brands.descriptionAr : brands.descriptionEn}
            </p>
          )}
          <div className="osta-marquee mt-8">
            <div className="osta-marquee-track gap-4">
              {[...brands.items, ...brands.items].map((item, i) => (
                <div key={i} className="osta-card flex w-28 shrink-0 flex-col items-center gap-2 p-4">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={lang === "ar" ? item.titleAr : item.titleEn}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-card-border" />
                  )}
                  <span className="text-[11px] text-text-muted">{lang === "ar" ? item.titleAr : item.titleEn}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OSTA Prime Membership */}
      {prime && (
        <section className="mx-auto w-full max-w-4xl px-5 py-16">
          <div className="osta-card osta-glow-border p-6 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-text sm:text-3xl">
              {lang === "ar" ? prime.headingAr : prime.headingEn}
            </h2>
            {(prime.descriptionEn || prime.descriptionAr) && (
              <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">
                {lang === "ar" ? prime.descriptionAr : prime.descriptionEn}
              </p>
            )}
            {prime.items.length > 0 && (
              <div className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {prime.items.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-card-border p-4">
                    {item.iconName && <DynamicIcon name={item.iconName} size={20} className="text-accent-2" />}
                    <span className="text-xs text-text-muted">{lang === "ar" ? item.titleAr : item.titleEn}</span>
                  </div>
                ))}
              </div>
            )}
            {prime.ctaUrl && (
              <Link
                href={prime.ctaUrl}
                className="osta-btn-primary mt-8 inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
              >
                {lang === "ar" ? prime.ctaLabelAr : prime.ctaLabelEn}
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Our Achievements */}
      {achievements && achievements.items.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2 className="text-center text-2xl font-bold text-text sm:text-3xl">
            {lang === "ar" ? achievements.headingAr : achievements.headingEn}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.items.map((item, i) => (
              <div key={i} className="osta-card p-5">
                {item.iconName && <DynamicIcon name={item.iconName} size={22} className="text-accent-2" />}
                <h3 className="mt-3 text-sm font-semibold text-text">
                  {lang === "ar" ? item.titleAr : item.titleEn}
                </h3>
                {(item.descriptionEn || item.descriptionAr) && (
                  <p className="mt-1.5 text-xs text-text-muted">
                    {lang === "ar" ? item.descriptionAr : item.descriptionEn}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
