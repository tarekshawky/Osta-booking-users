import { api, type BlogSummary, type CatalogCategory, type HomeSection, type MaintenanceData, type OpenJobs, type PricingConfig, type ServiceSummary } from "@/lib/api";
import type { CmsBlock } from "@/lib/cms";
import { fetchLocations, type PublicBranch } from "@/lib/locations";

// The admin API serves cover images as normal URLs. Inline (data:) images would bloat every page's data, so they are
// dropped here as a safeguard in case an older API still sends them.
export const slimPosts = (posts: BlogSummary[]): BlogSummary[] =>
  posts.map((p) => ({ ...p, coverImageUrl: p.coverImageUrl?.startsWith("data:") ? null : p.coverImageUrl }));

export type BlockData = { services: ServiceSummary[]; posts: BlogSummary[]; sections: HomeSection[]; pricing: PricingConfig | null; jobs: OpenJobs; subPages: { slug: string; titleEn: string; titleAr: string }[]; catalog: CatalogCategory[]; locations: PublicBranch[]; maintenance: Record<string, MaintenanceData | null> };

// Loads only the data the page's blocks actually need, and never lets a briefly unavailable API break the page.
export async function loadBlockData(blocks: CmsBlock[]): Promise<BlockData> {
  const has = (t: CmsBlock["type"]) => blocks.some((b) => b.type === t && !b.hidden);
  // The biggest "Open jobs" block decides how many jobs to fetch (and the type when all such blocks agree).
  const jobBlocks = blocks.filter((b) => b.type === "jobsList" && !b.hidden);
  const jobLimit = Math.max(0, ...jobBlocks.map((b) => Number(b.props.limit) || 6));
  const jobTypes = new Set(jobBlocks.map((b) => String(b.props.jobType ?? "all")));
  // A Services grid set to "All services from the Service Catalogue" needs the catalogue.
  const wantsCatalog = blocks.some((b) => !b.hidden && ((b.type === "servicesGrid" && b.props.source === "catalogue") || b.type === "serviceCatalog" || (b.type === "showcase" && b.props.source === "catalogue")));
  const [services, posts, sections, pricing, jobs, catalog, locations] = await Promise.all([
    has("servicesGrid") ? api.services().catch(() => [] as ServiceSummary[]) : Promise.resolve([] as ServiceSummary[]),
    has("blogPreview") ? api.blogPosts({ pageSize: 12 }).then((r) => slimPosts(r.data)).catch(() => [] as BlogSummary[]) : Promise.resolve([] as BlogSummary[]),
    has("homeSections") ? api.homeSections().catch(() => [] as HomeSection[]) : Promise.resolve([] as HomeSection[]),
    has("bookingCalculator") ? api.pricingConfig().catch(() => null) : Promise.resolve(null),
    jobBlocks.length ? api.openJobs({ limit: Math.min(24, jobLimit), type: jobTypes.size === 1 ? [...jobTypes][0] : "all" }).catch(() => ({ listUrl: "", items: [] }) as OpenJobs) : Promise.resolve({ listUrl: "", items: [] } as OpenJobs),
    wantsCatalog ? api.catalog().then((r) => r.categories).catch(() => [] as CatalogCategory[]) : Promise.resolve([] as CatalogCategory[]),
    has("locations") ? fetchLocations() : Promise.resolve([] as PublicBranch[]),
  ]);
  // The maintenance packages block draws the packages, prices, table and terms the admin keeps up to date.
  // Each block names its set of packages (its group key; empty = the original home packages); every set is fetched once.
  const groups = [...new Set(blocks.filter((b) => b.type === "maintenancePackages" && !b.hidden).map((b) => String(b.props.group ?? "")))];
  const maintenance: Record<string, MaintenanceData | null> = {};
  await Promise.all(groups.map(async (g) => { maintenance[g] = await api.maintenancePackages(g).catch(() => null); }));
  return { services, posts, sections, pricing, jobs, subPages: [], catalog, locations, maintenance };
}
