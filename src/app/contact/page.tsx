import type { Metadata } from "next";
import { ContactClient } from "./ContactClient";
import { CmsRouteView } from "@/components/cms/CmsRouteView";
import { overrideMetadata, publishedOverride } from "@/lib/builtInPage";

export const revalidate = 60;

const BUILT_IN: Metadata = {
  title: "Contact Us",
  description: "Get in touch with OSTA Services via WhatsApp, phone, or email.",
  alternates: { canonical: "/contact" },
};

export const generateMetadata = () => overrideMetadata("contact", BUILT_IN);

export default async function ContactPage() {
  const cms = await publishedOverride("contact");
  return cms ? <CmsRouteView page={cms} /> : <ContactClient />;
}
