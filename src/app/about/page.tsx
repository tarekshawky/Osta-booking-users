import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";
import { CmsRouteView } from "@/components/cms/CmsRouteView";
import { overrideMetadata, publishedOverride } from "@/lib/builtInPage";

export const revalidate = 60;

const BUILT_IN: Metadata = {
  title: "About Us",
  description: "OSTA Services was founded to make home maintenance in the UAE faster, easier, and more reliable.",
  alternates: { canonical: "/about" },
};

export const generateMetadata = () => overrideMetadata("about", BUILT_IN);

export default async function AboutPage() {
  const cms = await publishedOverride("about");
  return cms ? <CmsRouteView page={cms} /> : <AboutClient />;
}
