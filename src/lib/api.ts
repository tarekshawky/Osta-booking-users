import type { CmsBlock } from "@/lib/cms";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://osta-invoices.vercel.app/api/v1";

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
    ...(method === "GET" && !token ? { next: { revalidate: 60 } } : {}),
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
  invoice: { number: string; amount: number; status: string } | null;
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
    prices: { regionId: string; unitPriceFils: number }[];
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
};

export type BlogSummary = {
  slug: string;
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
  contentEn: string;
  contentAr: string;
  seoTitleEn: string | null;
  seoTitleAr: string | null;
  seoDescriptionEn: string | null;
  seoDescriptionAr: string | null;
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
  const res = await fetch(`${API_BASE}${path}`, { headers, ...(token ? {} : { next: { revalidate: 60 } }) });
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

  pricingConfig: () => apiFetch<PricingConfig>("/pricing/config"),

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
  blogPosts: (params: { page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetchPage<BlogSummary>(`/blog${suffix}`);
  },
  blogPost: (slug: string) => apiFetch<BlogDetail>(`/blog/${slug}`),
  homeSections: () => apiFetch<HomeSection[]>("/home-sections"),
};
