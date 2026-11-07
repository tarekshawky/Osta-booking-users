import type { Metadata } from "next";
import { AgreementClient } from "./AgreementClient";

// A customer's private agreement page: never indexed, never cached.
export const metadata: Metadata = { title: "Your Maintenance Agreement", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AgreementPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AgreementClient token={token} />;
}
