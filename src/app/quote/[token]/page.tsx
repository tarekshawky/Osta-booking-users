import type { Metadata } from "next";
import { QuoteClient } from "./QuoteClient";

// A customer's private quotation page: never indexed, never cached.
export const metadata: Metadata = { title: "Your AC Installation Quotation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <QuoteClient token={token} />;
}
