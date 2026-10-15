import { fetchSite } from "@/lib/site";
import { fetchTechnical, textResponse } from "@/lib/technical";
import { buildRobotsTxt } from "@/lib/technicalFiles";
import { SITE_URL } from "@/lib/siteUrl";

// Read the admin's settings on every request (they are cached for a minute), never frozen at build time.
export const dynamic = "force-dynamic";

export async function GET() {
  const [{ settings }, tech] = await Promise.all([fetchSite(), fetchTechnical()]);
  // While the site is being rebuilt (Site & Contact → search engines off) every crawler is told to stay out.
  return textResponse(buildRobotsTxt({ allowIndexing: settings.allowIndexing, aiPolicy: tech.aiPolicy, extra: tech.robotsExtra, sitemapUrl: `${SITE_URL}/sitemap.xml` }));
}
