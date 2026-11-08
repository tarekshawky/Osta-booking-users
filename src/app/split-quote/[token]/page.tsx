import type { Metadata } from "next";
import { SplitQuoteClient } from "./SplitQuoteClient";

// A customer's private Split AC quotation page: never indexed, never cached.
export const metadata: Metadata = { title: "Your Split AC Installation Quotation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SplitQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SplitQuoteClient token={token} />;
}
