import type { Metadata } from "next";
import { DuctQuoteClient } from "./DuctQuoteClient";

// A customer's private ductwork quotation page: never indexed, never cached.
export const metadata: Metadata = { title: "Your Ductwork Quotation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DuctQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <DuctQuoteClient token={token} />;
}
