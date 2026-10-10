"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useLanguage } from "@/lib/language-context";

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain", "Ras Al Khaimah", "Umm Al Quwain", "Fujairah"];

export function MarketingFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-card-border bg-bg-elevated">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo size="md" />
          <p className="mt-3 text-sm text-text-muted">{t("footer.tagline")}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-text">{t("footer.quickLinks")}</h3>
          <ul className="flex flex-col gap-2 text-sm text-text-muted">
            <li><Link href="/services" className="hover:text-text">{t("nav.services")}</Link></li>
            <li><Link href="/pricing" className="hover:text-text">{t("nav.pricing")}</Link></li>
            <li><Link href="/blog" className="hover:text-text">{t("nav.blog")}</Link></li>
            <li><Link href="/about" className="hover:text-text">{t("nav.about")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-text">{t("footer.getInTouch")}</h3>
          <ul className="flex flex-col gap-2 text-sm text-text-muted">
            <li>
              <a href="https://wa.me/971568676036" className="hover:text-text">
                WhatsApp: +971 56 867 6036
              </a>
            </li>
            <li>
              <a href="mailto:info@ostaservices.com" className="hover:text-text">
                info@ostaservices.com
              </a>
            </li>
            <li><Link href="/contact" className="hover:text-text">{t("nav.contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-text">{t("footer.areasWeCover")}</h3>
          <p className="text-sm text-text-muted">{EMIRATES.join(" · ")}</p>
        </div>
      </div>

      <div className="border-t border-card-border px-5 py-5 text-center text-xs text-text-faint">
        © {year} OSTA Services. {t("footer.rightsReserved")}
      </div>
    </footer>
  );
}
