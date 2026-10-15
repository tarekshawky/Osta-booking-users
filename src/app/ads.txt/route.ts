import { fetchTechnical, textResponse } from "@/lib/technical";

// Read the admin's settings on every request (they are cached for a minute), never frozen at build time.
export const dynamic = "force-dynamic";

export async function GET() {
  return textResponse((await fetchTechnical()).ads);
}
