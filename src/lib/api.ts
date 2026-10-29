import type { CmsBlock } from "@/lib/cms";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://osta-invoices.vercel.app/api/v1";
// The ERP itself (the job application form posts straight to it).
export const ERP_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

export class ApiError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Public lists (services, blog, homepage sections) are identical for everyone: reuse them for 60 s instead of
    // hitting the admin API and database on every page view. Anything with a login token is never cached.
    // Blog requests carry a tag so the admin can refresh them the moment an article or category changes.
    ...(method === "GET" && !token ? { next: { revalidate: 60, ...(path.startsWith("/blog") ? { tags: ["blog"] } : {}) } } : {}),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      json?.error?.message || `Request failed (${res.status})`,
      res.status,
      json?.error?.code
    );
  }

  return json.data as T;
}

export type CustomerSummary = {
  id: string;
  code: string;
  name: string;
  companyName: string | null;
  phone: string;
  email: string | null;
  language: string;
};

export type Customer = CustomerSummary & {
  type: "INDIVIDUAL" | "COMPANY";
  whatsapp: string | null;
  emirate: string;
  city: string | null;
  area: string | null;
  buildingName: string | null;
  flatNo: string | null;
  address: string | null;
};

export type Order = {
  id: string;
  number: string;
  date: string;
  scheduledAt: string | null;
  locationUrl: string | null;
  orderType: string;
  priceAgreed: string;
  customerLanguage: string;
  notes: string | null;
  status: string;
  team: { name: string } | null;
  assignedTo: { name: string } | null;
  invoiceId: string | null;
  // Money still to pay on this order (set once an invoice exists and is unpaid).
  paymentDue?: number | null;
  doneAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  rescheduledAt: string | null;
  rescheduleReason: string | null;
  createdAt: string;
};

export type OrderDetail = Order & {
  totalFils: number | null;
  quantity: number | null;
  bookableService: { nameEn: string; nameAr: string } | null;
  events: { type: string; createdAt: string }[];
  // Only a paid invoice is sent. Rate first, then pay, then the invoice appears.
  invoice: { number: string; amount: number; status: string } | null;
  review: { rating: number; comment: string | null; createdAt: string } | null;
  canReview: boolean;
  payment: { amount: number; link: string | null; locked: boolean } | null;
  acceptedAt: string | null;
  departedAt: string | null;
  etaMinutes: string | null;
  arrivedAt: string | null;
  workStartedAt: string | null;
};

export type Invoice = {
  id: string;
  number: string;
  date: string;
  serviceType: string;
  category: string;
  payment: string;
  amount: number;
  status: string;
  paymentLink: string | null;
  refundedAmount: number;
  warrantyUntil: string | null;
  createdAt: string;
};

export type InvoiceDetail = Invoice & {
  items: { serviceName: string; description: string | null; qty: number; unitPrice: number }[];
};


export type PricingTier = { minQty: number; maxQty: number | null; percent: number; startsAt: string | null; endsAt: string | null };
export type PricingConfig = {
  regions: { id: string; slug: string; nameEn: string; nameAr: string }[];
  services: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string | null;
    descriptionAr: string | null;
    imageUrl: string | null;
    pricingUnit: string;
    minQuantity: number;
    pricesIncludeVat: boolean | null;
    // What the price does or does not include, e.g. "Repair only, spare parts not included" (set in the admin).
    noteEn?: string;
    noteAr?: string;
    prices: { regionId: string; unitPriceFils: number }[];
    // Choices the customer must pick (e.g. a gas weight), each with its own price per emirate.
    optionLabelEn?: string;
    optionLabelAr?: string;
    options?: { id: string; nameEn: string; nameAr: string; noteEn?: string; noteAr?: string; prices: { regionId: string; unitPriceFils: number }[] }[];
    tiers: PricingTier[];
    addOns: { id: string; nameEn: string; nameAr: string; prices: { regionId: string; priceFils: number }[] }[];
  }[];
  bookingTypes: {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string | null;
    descriptionAr: string | null;
    defaultFeeFils: number;
    sameDayAllowed: boolean;
    hoursStart: string | null;
    hoursEnd: string | null;
    overrides: { serviceId: string | null; regionId: string | null; feeFils: number }[];
  }[];
  tax: { vatRatePercent: number; pricesIncludeVat: boolean };
  visitFeePolicy: {
    id: string;
    version: number;
    amountFils: number;
    textAr: string;
    textEn: string;
    consentLabelAr: string;
    consentLabelEn: string;
  } | null;
};

export type PricedOrderBody = {
  serviceId: string;
  regionId: string;
  bookingTypeId: string;
  quantity: number;
  addOnIds?: string[];
  optionId?: string;
  scheduledAt?: string;
  locationUrl?: string;
  customerLanguage?: string;
  notes?: string;
  consent: true;
  idempotencyKey: string;
};

export type ServiceSummary = {
  slug: string;
  nameEn: string;
  nameAr: string;
  shortDescriptionEn: string;
  shortDescriptionAr: string;
  iconName: string | null;
  coverImageUrl: string | null;
  priceFrom: number | null;
  priceNote: string | null;
};

export type ServiceDetail = ServiceSummary & {
  // Block-based body built in the admin; when present it is shown instead of the plain content.
  blocks?: CmsBlock[];
  contentEn: string;
  contentAr: string;
  seoTitleEn: string | null;
  seoTitleAr: string | null;
  seoDescriptionEn: string | null;
  seoDescriptionAr: string | null;
  seoKeywordsEn?: string | null;
  seoKeywordsAr?: string | null;
};

export type BlogCategoryBrief = { slug: string; nameEn: string; nameAr: string };

export type BlogCategory = BlogCategoryBrief & {
  descriptionEn: string;
  descriptionAr: string;
  seoTitleEn: string | null;
  seoTitleAr: string | null;
  seoDescriptionEn: string | null;
  seoDescriptionAr: string | null;
  seoKeywordsEn?: string | null;
  seoKeywordsAr?: string | null;
  coverImageUrl: string | null;
  count: number;
  // Enough articles for the category page to be offered to search engines.
  indexable: boolean;
};

export type BlogSummary = {
  slug: string;
  category?: BlogCategoryBrief | null;
  featured?: boolean;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  coverImageUrl: string | null;
  authorName: string | null;
  publishedAt: string | null;
};

export type BlogDetail = BlogSummary & {
  blocks?: CmsBlock[];
  secondaryCategories?: BlogCategoryBrief[];
  related?: BlogSummary[];
  contentEn: string;
  contentAr: string;
  seoTitleEn: string | null;
  seoTitleAr: string | null;
  seoDescriptionEn: string | null;
  seoDescriptionAr: string | null;
  seoKeywordsEn?: string | null;
  seoKeywordsAr?: string | null;
};

export type OpenJob = {
  slug: string; url: string; type: "PERMANENT" | "DAILY";
  titleEn: string; titleAr: string; categoryEn: string; categoryAr: string; emirateEn: string; emirateAr: string; area: string | null;
  propertyEn: string | null; propertyAr: string | null; workersEn: string; workersAr: string; wageEn: string | null; wageAr: string | null;
  durationEn: string | null; durationAr: string | null; startEn: string | null; startAr: string | null; deadlineEn: string | null; deadlineAr: string | null;
};
export type OpenJobListItem = OpenJob & { categoryKey: string; emirateKey: string; propertyKey: string | null };
export type OpenJobs = { listUrl: string; items: OpenJobListItem[]; categories?: { key: string; nameEn: string; nameAr: string }[] };

export type PublicJob = {
  id: string; slug: string | null; type: "PERMANENT" | "DAILY"; state: "open" | "closed" | "completed" | "cancelled";
  title: string; descriptionHtml: string; requirements: string; fallbackNote: "ar-only" | "en-only" | null;
  category: string; emirate: string; area: string | null; property: string | null; workers: number; workersText: string; durationText: string | null;
  wage: { kind: "amount" | "range" | "agreed"; text: string } | null; duration: number | null; daysPerWeek: number | null; hours: string | null; materials: string | null;
  startDate: string | null; deadline: string | null; fields: { label: string; value: string }[];
};
export type JobDetail = {
  slug: string; url: string; listUrl: string; status: string; ar: PublicJob; en: PublicJob; emirateEn: string; emirateAr: string;
  jsonLd: { ar: Record<string, unknown> | null; en: Record<string, unknown> | null } | null;
  form: {
    skills: { key: string; labelEn: string; labelAr: string }[]; emirates: { key: string; en: string; ar: string }[];
    minPhotos: number; maxPhotos: number; maxFileMb: number; privacyUrl: string | null; turnstileSiteKey: string | null;
  };
};

export type HomeSectionItem = {
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  iconName: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
};

export type HomeSection = {
  key: string;
  headingEn: string;
  headingAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  ctaLabelEn: string | null;
  ctaLabelAr: string | null;
  ctaUrl: string | null;
  items: HomeSectionItem[];
};

type Page<T> = { data: T[]; page: number; pageSize: number; total: number };

async function apiFetchPage<T>(
  path: string,
  options: { token?: string | null } = {}
): Promise<Page<T>> {
  const { token } = options;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers, ...(token ? {} : { next: { revalidate: 60, ...(path.startsWith("/blog") ? { tags: ["blog"] } : {}) } }) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(json?.error?.message || `Request failed (${res.status})`, res.status, json?.error?.code);
  }
  return json as Page<T>;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; customer: CustomerSummary }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  signup: (body: { name: string; phone: string; email: string; password: string; emirate?: string }) =>
    apiFetch<{ accessToken: string; customer: CustomerSummary }>("/auth/signup", {
      method: "POST",
      body,
    }),

  me: (token: string) => apiFetch<Customer>("/me", { token }),

  orders: (token: string, params: { page?: number; pageSize?: number; status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.status) qs.set("status", params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetchPage<Order>(`/orders${suffix}`, { token });
  },

  order: (token: string, id: string) => apiFetch<OrderDetail>(`/orders/${id}`, { token }),

  reviewOrder: (token: string, id: string, body: { rating: number; comment?: string }) =>
    apiFetch<{ rating: number; comment: string | null; createdAt: string }>(`/orders/${id}/review`, { method: "POST", body, token }),

  resetPassword: (resetToken: string, password: string) =>
    apiFetch<{ reset: boolean }>("/auth/reset-password", { method: "POST", body: { token: resetToken, password } }),

  pricingConfig: () => apiFetch<PricingConfig>("/pricing/config"),

  // Jobs that are open for applications (Jobs & Workforce). Cached for 60 s like the other public lists.
  jobDetail: (slug: string) => apiFetch<JobDetail>(`/jobs/${encodeURIComponent(slug)}`),
  openJobs: (params: { limit?: number; type?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.type && params.type !== "all") qs.set("type", params.type);
    return apiFetch<OpenJobs>(`/jobs${qs.toString() ? `?${qs}` : ""}`);
  },

  createPricedOrder: (token: string, body: PricedOrderBody) =>
    apiFetch<Order & { totalFils: number }>("/orders", { method: "POST", body, token }),

  createOrder: (
    token: string,
    body: {
      orderType?: string;
      scheduledAt?: string;
      locationUrl?: string;
      customerLanguage?: string;
      notes?: string;
    }
  ) => apiFetch<Order>("/orders", { method: "POST", body, token }),

  invoices: (token: string, params: { page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetchPage<Invoice>(`/invoices${suffix}`, { token });
  },

  invoice: (token: string, id: string) => apiFetch<InvoiceDetail>(`/invoices/${id}`, { token }),

  // Public marketing-site content -- no bearer token required.
  services: () => apiFetch<ServiceSummary[]>("/services"),
  service: (slug: string) => apiFetch<ServiceDetail>(`/services/${slug}`),
  blogCategories: () => apiFetch<BlogCategory[]>("/blog/categories"),
  blogCategory: (slug: string) => apiFetch<BlogCategory>(`/blog/categories/${encodeURIComponent(slug)}`),
  blogPosts: (params: { page?: number; pageSize?: number; category?: string; q?: string; featured?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.q) qs.set("q", params.q);
    if (params.featured) qs.set("featured", "1");
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetchPage<BlogSummary>(`/blog${suffix}`);
  },
  blogPost: (slug: string) => apiFetch<BlogDetail>(`/blog/${slug}`),
  homeSections: () => apiFetch<HomeSection[]>("/home-sections"),
};
