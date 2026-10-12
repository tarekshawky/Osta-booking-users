import { api, type BlogSummary, type HomeSection, type PricingConfig, type ServiceSummary } from "@/lib/api";
import type { CmsBlock } from "@/lib/cms";

// The admin API serves cover images as normal URLs. Inline (data:) images would bloat every page's data, so they are
// dropped here as a safeguard in case an older API still sends them.
export const slimPosts = (posts: BlogSummary[]): BlogSummary[] =>
  posts.map((p) => ({ ...p, coverImageUrl: p.coverImageUrl?.startsWith("data:") ? null : p.coverImageUrl }));

export type BlockData = { services: ServiceSummary[]; posts: BlogSummary[]; sections: HomeSection[]; pricing: PricingConfig | null };

// Loads only the data the page's blocks actually need, and never lets a briefly unavailable API break the page.
export async function loadBlockData(blocks: CmsBlock[]): Promise<BlockData> {
  const has = (t: CmsBlock["type"]) => blocks.some((b) => b.type === t && !b.hidden);
  const [services, posts, sections, pricing] = await Promise.all([
    has("servicesGrid") ? api.services().catch(() => [] as ServiceSummary[]) : Promise.resolve([] as ServiceSummary[]),
    has("blogPreview") ? api.blogPosts({ pageSize: 12 }).then((r) => slimPosts(r.data)).catch(() => [] as BlogSummary[]) : Promise.resolve([] as BlogSummary[]),
    has("homeSections") ? api.homeSections().catch(() => [] as HomeSection[]) : Promise.resolve([] as HomeSection[]),
    has("bookingCalculator") ? api.pricingConfig().catch(() => null) : Promise.resolve(null),
  ]);
  return { services, posts, sections, pricing };
}
