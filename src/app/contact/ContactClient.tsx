"use client";

import { Phone, Mail, MessageCircle } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useLanguage } from "@/lib/language-context";

export function ContactClient() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <section className="mx-auto w-full max-w-2xl px-5 py-16 text-center">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">{t("contact.pageTitle")}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">{t("contact.pageSubtitle")}</p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a href="https://wa.me/971568676036" className="osta-card flex flex-col items-center gap-2 p-6">
            <MessageCircle size={22} className="text-accent-2" />
            <span className="text-sm font-semibold text-text">{t("contact.whatsapp")}</span>
            <span className="text-xs text-text-muted" dir="ltr">+971 56 867 6036</span>
          </a>
          <a href="tel:+97156867603" className="osta-card flex flex-col items-center gap-2 p-6">
            <Phone size={22} className="text-accent-2" />
            <span className="text-sm font-semibold text-text">{t("contact.phone")}</span>
            <span className="text-xs text-text-muted" dir="ltr">+971 56 867 6036</span>
          </a>
          <a href="mailto:info@ostaservices.com" className="osta-card flex flex-col items-center gap-2 p-6">
            <Mail size={22} className="text-accent-2" />
            <span className="text-sm font-semibold text-text">{t("contact.email")}</span>
            <span className="text-xs text-text-muted">info@ostaservices.com</span>
          </a>
        </div>

        <a
          href="https://wa.me/971568676036"
          className="osta-btn-primary mt-10 inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
        >
          {t("contact.chatOnWhatsapp")}
        </a>
      </section>

      <MarketingFooter />
    </div>
  );
}
