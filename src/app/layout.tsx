import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { SiteProvider } from "@/lib/site-context";
import { ConsentManager } from "@/components/ConsentManager";
import { fetchSite } from "@/lib/site";
import type { Lang } from "@/lib/i18n";
import { SITE_URL } from "@/lib/siteUrl";
import { GlobalCode } from "@/components/CodeInjection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { settings, integrations } = await fetchSite();
  const iconVersion = settings.faviconUrl ? `?v=${encodeURIComponent(settings.faviconUrl.slice(-12))}` : "";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: settings.siteNameEn, template: `%s | ${settings.siteNameEn}` },
    description: settings.descriptionEn || undefined,
    robots: settings.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    // Small PNG versions of the favicon chosen in the admin (see src/lib/favicon.ts). The version in the address makes browsers
    // fetch the new picture when it is changed.
    icons: {
      icon: [{ url: `/favicon.ico${iconVersion}`, sizes: "48x48", type: "image/png" }, { url: `/icon${iconVersion}`, sizes: "192x192", type: "image/png" }],
      apple: `/apple-icon${iconVersion}`,
    },
    // Ownership checks for Google Search Console and Bing: plain meta tags, no cookies, no consent needed.
    ...(integrations?.searchConsoleToken || integrations?.bingToken
      ? { verification: { ...(integrations.searchConsoleToken ? { google: integrations.searchConsoleToken } : {}), ...(integrations.bingToken ? { other: { "msvalidate.01": integrations.bingToken } } : {}) } }
      : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#050b1a",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const stored = cookieStore.get("osta_lang_choice")?.value;
  const site = await fetchSite();
  // A visitor's own choice (cookie) wins; otherwise use the language the admin picked as default.
  const initialLang: Lang = stored === "ar" || stored === "en" ? stored : site.settings.defaultLocale;

  return (
    <html
      lang={initialLang}
      dir={initialLang === "ar" ? "rtl" : "ltr"}
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg">
        <SiteProvider site={site}>
          <LanguageProvider initialLang={initialLang}>
            <AuthProvider>{children}</AuthProvider>
            <ConsentManager />
            <GlobalCode />
          </LanguageProvider>
        </SiteProvider>
      </body>
    </html>
  );
}
