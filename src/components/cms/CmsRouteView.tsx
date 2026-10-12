import { CmsPageView } from "@/components/cms/CmsPageView";
import { loadBlockData } from "@/lib/cms-data";
import type { CmsPage } from "@/lib/cms";

// Renders a published CMS page (with its validated structured data). "<" is escaped so content can't close the script tag.
export async function CmsRouteView({ page }: { page: CmsPage }) {
  const data = await loadBlockData(page.blocks);
  return (
    <>
      {page.jsonLd?.map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }} />
      ))}
      <CmsPageView page={page} data={data} />
    </>
  );
}
