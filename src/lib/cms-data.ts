import { api, type BlogSummary, type HomeSection, type ServiceSummary } from "@/lib/api";
import type { CmsBlock } from "@/lib/cms";

export type BlockData = { services: ServiceSummary[]; posts: BlogSummary[]; sections: HomeSection[] };

// Loads only the data the page's blocks actually need, and never lets a briefly unavailable API break the page.
export async function loadBlockData(blocks: CmsBlock[]): Promise<BlockData> {
  const has = (t: CmsBlock["type"]) => blocks.some((b) => b.type === t && !b.hidden);
  const [services, posts, sections] = await Promise.all([
    has("servicesGrid") ? api.services().catch(() => [] as ServiceSummary[]) : Promise.resolve([] as ServiceSummary[]),
    has("blogPreview") ? api.blogPosts({ pageSize: 6 }).then((r) => r.data).catch(() => [] as BlogSummary[]) : Promise.resolve([] as BlogSummary[]),
    has("homeSections") ? api.homeSections().catch(() => [] as HomeSection[]) : Promise.resolve([] as HomeSection[]),
  ]);
  return { services, posts, sections };
}
