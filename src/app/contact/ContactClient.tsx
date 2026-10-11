"use client";

import { Phone, Mail, MessageCircle, MapPin, Clock } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import { telHref, whatsappHref } from "@/lib/site";

export function ContactClient() {
  const { t, lang } = useLanguage();
  const { settings } = useSite();
  const ar = lang === "ar";
  const address = ar ? settings.addressAr || settings.addressEn : settings.addressEn || settings.addressAr;
  const hours = ar ? settings.hoursAr || settings.hoursEn : settings.hoursEn || settings.hoursAr;
  const wa = whatsappHref(settings, lang);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <section className="mx-auto w-full max-w-2xl px-5 py-16 text-center">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">{t("contact.pageTitle")}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">{t("contact.pageSubtitle")}</p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {settings.whatsapp && (
            <a href={wa} className="osta-card flex flex-col items-center gap-2 p-6">
              <MessageCircle size={22} className="text-accent-2" />
              <span className="text-sm font-semibold text-text">{t("contact.whatsapp")}</span>
              <span className="text-xs text-text-muted" dir="ltr">{settings.phone || `+${settings.whatsapp}`}</span>
            </a>
          )}
          {settings.phone && (
            <a href={telHref(settings.phone)} className="osta-card flex flex-col items-center gap-2 p-6">
              <Phone size={22} className="text-accent-2" />
              <span className="text-sm font-semibold text-text">{t("contact.phone")}</span>
              <span className="text-xs text-text-muted" dir="ltr">{settings.phone}</span>
            </a>
          )}
          {settings.email && (
            <a href={`mailto:${settings.email}`} className="osta-card flex flex-col items-center gap-2 p-6">
              <Mail size={22} className="text-accent-2" />
              <span className="text-sm font-semibold text-text">{t("contact.email")}</span>
              <span className="text-xs text-text-muted">{settings.email}</span>
            </a>
          )}
        </div>

        {(address || hours) && (
          <div className="osta-card mx-auto mt-4 flex max-w-md flex-col gap-3 p-5 text-start text-sm text-text-muted">
            {address && (
              <p className="flex gap-2 whitespace-pre-line"><MapPin size={16} className="mt-0.5 shrink-0 text-accent-2" />
                {settings.mapsUrl ? <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-text">{address}</a> : address}
              </p>
            )}
            {hours && <p className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-accent-2" />{hours}</p>}
          </div>
        )}

        {settings.whatsapp && (
          <a href={wa} className="osta-btn-primary mt-10 inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-white">
            {t("contact.chatOnWhatsapp")}
          </a>
        )}
      </section>

      <MarketingFooter />
    </div>
  );
}
