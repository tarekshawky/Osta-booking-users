import type { Bi, CmsBlock } from "@/lib/cms";
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
  options: { method?: string; body?: unknown; token?: string | null; fresh?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, token, fresh } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Public lists (services, blog, homepage sections) are identical for everyone: reuse them for 60 s instead of
    // hitting the admin API and database on every page view. Anything with a login token is never cached.
    // Blog requests carry a tag so the admin can refresh them the moment an article or category changes.
    ...(fresh ? { cache: "no-store" as const } : method === "GET" && !token ? { next: { revalidate: 60, ...(path.startsWith("/blog") ? { tags: ["blog"] } : {}) } } : {}),
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
    // What one price covers, e.g. "per sqm" / "للمتر المربع" (empty on older services).
    unitLabelEn?: string;
    unitLabelAr?: string;
    // "INSPECTION" = price after inspection: bookable in every emirate with no price. Older APIs don't send it (= priced).
    priceMode?: "PRICED" | "INSPECTION";
    // The service category the booking page groups it under (from the Service Catalogue).
    group?: { en: string; ar: string; order: number; icon?: string } | null;
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
  // Minimum order and the emergency off-hours / holiday surcharges (older APIs don't send it).
  rules?: { minimumOrderFils: number; offHoursPercent: number; holidayPercent: number; normalStart: string; normalEnd: string; holidays: string[] };
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
  // More services for the same visit (same place, time and booking type): one order is created for each, the booking fee only once.
  extraServices?: { serviceId: string; quantity: number; optionId?: string; addOnIds?: string[] }[];
  consent: true;
  idempotencyKey: string;
};

// The Service Catalogue for the Services page: each category with its services, the page that describes each one (when published)
// and the booking service its Book button opens.
export type CatalogCategory = {
  slug: string | null; nameEn: string; nameAr: string; icon: string;
  services: { nameEn: string; nameAr: string; slug: string | null; bookSlug: string | null }[];
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

// Annual home maintenance packages (Website → Maintenance Packages in the admin). The comparison table and the numbered terms are
// worked out by the admin API, so the website only draws them.
export type MaintenancePackage = {
  id: string; nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string; suitableEn: string; suitableAr: string;
  // null = "Custom Quotation" (priceText says so). pricePrefix is for "Starting from".
  price: number | null; pricePrefixEn?: string; pricePrefixAr?: string; priceTextEn?: string; priceTextAr?: string;
  maxAcUnits: number | null; badgeEn: string; badgeAr: string; highlighted: boolean; bullets?: { en: string; ar: string }[];
  lines: { serviceId: string; quantityEn: string; quantityAr: string }[];
};
export type MaintenanceData = {
  key?: string;
  // "subscribe" = Subscribe Now (a household's property form); "quote" = Request a Quote (a business enquiry)
  ctaMode?: "subscribe" | "quote";
  settings: { headingEn: string; headingAr: string; subtitleEn: string; subtitleAr: string; noteEn: string; noteAr: string } | null;
  services: { id: string; nameEn: string; nameAr: string }[];
  packages: MaintenancePackage[];
  comparison: { key: string; labelEn: string; labelAr: string; cells: { en: string; ar: string }[] }[];
  terms: { en: string[]; ar: string[] };
  builder?: { config: BuilderConfigPublic; options: { id: string; category: string; nameEn: string; nameAr: string }[] } | null;
};
// The Smart Package Builder (sent only for a group where the admin switched it on).
export type BuilderField = "off" | "optional" | "required";
export type BuilderConfigPublic = {
  calculator: boolean;
  propertyTypes: { key: string; en: string; ar: string }[];
  categories: { key: string; en: string; ar: string }[];
  fields: Record<"whatsapp" | "area" | "address" | "bedrooms" | "bathrooms" | "floors" | "size" | "acUnits", BuilderField>;
  extras: { key: string; nameEn: string; nameAr: string; unitEn: string; unitAr: string; unitPrice: number | null; enabled: boolean }[];
};
export type BuilderNeeds = { acUnits: number; handymanHours: number; optionIds: string[]; extras: Record<string, number>; otherText: string };
export type BuilderLine = { key: string; labelEn: string; labelAr: string; qty: number; unitPrice: number | null; amount: number | null; note: "base" | "included" | "extra" | "quote" };
export type BuilderEvaluation = {
  selectedId: string; selectedFits: boolean; recommendedId: string | null; exceedsAll: boolean;
  notices: { kind: string; en: string; ar: string; upgradeTo: string | null; optionId?: string }[];
  best: { en: string; ar: string } | null; exceeds: { en: string; ar: string } | null;
  recommendation: { packageId: string; priceDiff: number | null; addedServices: { en: string; ar: string }[]; acCovers: number | null; custom: boolean } | null;
  breakdown: { packageId: string; lines: BuilderLine[]; subtotal: number; vat: number; total: number; vatPercent: number; pricesIncludeVat: boolean; quote: boolean; quoteReasons: string[] };
};
export type BuilderSubmit = {
  group: string; selectedId: string; chosenId?: string; needs: BuilderNeeds;
  customer: { name: string; phone: string; whatsapp: string; email: string; emirate: string; area: string; address: string };
  property: { type: string; bedrooms: number; bathrooms: number; floors: number; size: number };
  notes: string; activationDate: string; wantsQuote: boolean;
  // The five statements of the Maintenance Service Agreement, all ticked (needed to confirm a subscription, not for a quotation request).
  agreement?: { accepted: boolean[]; lang: "en" | "ar" };
};
export type BuilderSubmitResult = { received: boolean; quoteRequested: boolean; contract?: { number: string; requestNumber: string; url: string } | null };

// The Maintenance Service Agreement.
export type AgreementClause = { key: string; titleEn: string; titleAr: string; bodyEn: string; bodyAr: string };
export type AgreementTerms = { version: number; clauses: AgreementClause[]; checks: { en: string; ar: string }[]; company: { name: string; website: string; phone: string }; durationMonths: number };
export type AgreementStatus = "DRAFT" | "PENDING_APPROVAL" | "CHANGES_REQUESTED" | "AWAITING_PAYMENT" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED" | "REJECTED";
export type AgreementView = {
  number: string; requestNumber: string; version: number; lang: "en" | "ar"; status: AgreementStatus; createdAt: string; needsAcceptance: boolean; acceptedAt: string | null; paid: boolean; awaitingPayment: boolean;
  customerName: string; packageEn: string; packageAr: string; property: { emirate: string; area: string; address: string; type: string };
  pricing: { currency: string; packagePrice: number | null; additional: number; discount: number; subtotal: number; vatPercent: number; vat: number; pricesIncludeVat: boolean; total: number; quote: boolean };
  lines: { serviceEn: string; serviceAr: string; quantityEn: string; quantityAr: string }[];
  extras: { labelEn: string; labelAr: string; qty: number; amount: number | null; included: boolean }[];
  termsVersion: number; note: string; rejectionReason: string; paymentInstructions: { en: string; ar: string } | null; activationDate: string | null; expiryDate: string | null;
  checks: { en: string; ar: string }[]; clauses: AgreementClause[];
};
export type MyContract = { id: string; number: string; status: AgreementStatus; packageEn: string; packageAr: string; total: number; currency: string; createdAt: string; activationDate: string | null; expiryDate: string | null; paid: boolean; accessToken: string | null };

export type SubscribeBody = {
  kind?: "subscribe" | "quote"; packageId: string; name: string; phone: string; email: string; emirate: string; location: string; propertyType: string; bedrooms: number; acUnits: number; activationDate: string;
  company?: string; message?: string;
};

// The ducted / concealed / semi-central AC installation calculator. The server holds the price list and does every calculation; the website
// only draws what it answers.
export type AcBiList = { en: string[]; ar: string[] };
export type AcPackageKey = "standard" | "complete" | "premium";
export type AcConfig = {
  vatPercent: number; validityDays: number;
  plenum: { nameEn: string; nameAr: string; price: number; descriptionEn: string; descriptionAr: string; included: AcBiList; notIncluded: AcBiList };
  acTypes: { key: string; nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string; active: boolean }[];
  capacities: { key: string; labelEn: string; labelAr: string; active: boolean; prices: Record<AcPackageKey, number> }[];
  packages: { key: AcPackageKey; nameEn: string; nameAr: string; subtitleEn: string; subtitleAr: string; included: AcBiList; notIncluded: AcBiList; copperMeters: number; active: boolean }[];
  services: { key: string; nameEn: string; nameAr: string; unit: "meter" | "unit" | "lot"; price: number | null; rfq: boolean; active: boolean }[];
  exclusions: AcBiList; disclaimer: Bi;
  propertyTypes: { key: string; en: string; ar: string }[]; emirates: { key: string; en: string; ar: string }[];
  uploads: { maxFiles: number; maxMb: number };
};
export type AcLine = { id: string; kind: "unit" | "plenum" | "service" | "custom"; unitIndex: number | null; labelEn: string; labelAr: string; detailEn: string; detailAr: string; qty: number; unitPrice: number | null; amount: number | null; rfq: boolean };
export type AcTotals = { baseTotal: number; plenumTotal: number; servicesTotal: number; subtotal: number; vatPercent: number; vat: number; total: number; rfq: boolean; rfqItems: Bi[] };
export type AcInput = { units: { acType: string; capacity: string; packageKey: AcPackageKey; qty: number }[]; services: { key: string; qty: number; note?: string }[] };
export type AcCustomer = { name: string; phone: string; whatsapp: string; email: string; contactMethod: "phone" | "whatsapp" | "email"; preferredDate: string };
export type AcProject = { propertyType: string; emirate: string; location: string; floors: number; existingDuct: string; existingCopper: string; ceilingType: string; notes: string };
export type AcQuoteBody = { lang: "en" | "ar"; input: AcInput; customer: AcCustomer; project: AcProject; uploadKey?: string };
export type AcQuoteStatus = "Draft" | "Generated" | "Submitted" | "Under Review" | "Site Inspection Required" | "Revised" | "Sent" | "Accepted" | "Rejected" | "Expired" | "Converted to Order";
export type AcQuoteView = {
  number: string; version: number; status: AcQuoteStatus; lang: "en" | "ar"; createdAt: string; expiresAt: string; bookRequested: boolean;
  customer: AcCustomer; project: AcProject & { propertyType: string; emirate: string; location: string }; input: AcInput; manual: boolean; lines: AcLine[]; totals: AcTotals;
  packages: { key: string; nameEn: string; nameAr: string; subtitleEn: string; subtitleAr: string; included: AcBiList; notIncluded: AcBiList }[];
  disclaimer: Bi; exclusions: AcBiList; validityDays: number; canEdit: boolean; canSubmit: boolean; canBook: boolean; files: { id: string; name: string; size: number }[]; rejectionReason: string;
};

// The HVAC ductwork quotation calculator. As with the AC calculator, the server holds the price list and does every area and price
// calculation; the website only draws what it answers.
export type DuctUnit = "PCS" | "LM" | "m2" | "SET" | "LOT";
export type DuctMode = "supply-fabricate-install" | "fabricate-supply" | "install-only" | "custom";
export type DuctSpecKey = "gauge" | "fiberglass" | "pir" | "pressure" | "application";
export type DuctOption = { key: string; en: string; ar: string };
export type DuctConfig = {
  vatPercent: number; validityDays: number;
  systems: {
    key: string; nameEn: string; nameAr: string; shortEn: string; shortAr: string; descriptionEn: string; descriptionAr: string;
    included: AcBiList; notIncluded: AcBiList; technical: AcBiList; specFields: DuctSpecKey[]; modes: Record<DuctMode, { enabled: boolean; rate: number | null }>; active: boolean;
  }[];
  accessories: { key: string; nameEn: string; nameAr: string; units: DuctUnit[]; prices: Partial<Record<DuctUnit, number | null>>; active: boolean }[];
  services: { key: string; nameEn: string; nameAr: string; unit: DuctUnit; price: number | null; rfq: boolean; active: boolean }[];
  discount: { enabled: boolean; type: "percent" | "fixed"; value: number; labelEn: string; labelAr: string };
  minAreaM2: number;
  specs: Record<DuctSpecKey, DuctOption[]>;
  estimateNotice: Bi; straightDuctNote: Bi; reviewNote: Bi; terms: AcBiList;
  projectTypes: DuctOption[]; emirates: { key: string; en: string; ar: string }[];
  uploads: { maxFiles: number; maxMb: number };
};
export type DuctSectionInput = {
  id: string; method: "area" | "rect" | "round"; system: string; mode: DuctMode; description?: string;
  area?: number; sections?: number; widthMm?: number; heightMm?: number; diameterMm?: number; lengthM?: number; qty?: number;
};
export type DuctInput = { sections: DuctSectionInput[]; accessories: { key: string; unit: DuctUnit; qty: number; note?: string }[]; services: { key: string; qty: number; note?: string }[] };
export type DuctSpec = Partial<Record<DuctSpecKey, string>> & { indoorOutdoor?: string; drawingsAvailable?: string; completionDate?: string; special?: string; otherSpec?: string };
export type DuctLine = { id: string; kind: "duct" | "accessory" | "service" | "custom" | "discount"; system: string | null; mode: DuctMode | null; labelEn: string; labelAr: string; detailEn: string; detailAr: string; qty: number; unit: DuctUnit; unitPrice: number | null; amount: number | null; rfq: boolean };
export type DuctTotals = {
  areas: { system: string; mode: DuctMode; nameEn: string; nameAr: string; area: number }[]; totalArea: number;
  ductSubtotal: number; accessoriesSubtotal: number; servicesSubtotal: number; discount: number; subtotal: number; vatPercent: number; vat: number; total: number; rfq: boolean; rfqItems: Bi[];
};
export type DuctComputedSection = DuctSectionInput & { areaM2: number };
export type DuctCustomer = { name: string; company: string; phone: string; email: string };
export type DuctProject = { projectType: string; emirate: string; location: string; projectName: string; siteAddress: string; description: string };
export type DuctQuoteBody = { lang: "en" | "ar"; input: DuctInput; spec: DuctSpec; customer: DuctCustomer; project: DuctProject; uploadKey?: string };
export type DuctRequestType = "inspection" | "final" | "inquiry";
export type DuctQuoteStatus = AcQuoteStatus | "Under Technical Review" | "Converted to Project";
export type DuctQuoteView = {
  kind: "ductwork"; number: string; version: number; status: DuctQuoteStatus; lang: "en" | "ar"; createdAt: string; expiresAt: string; requestType: string;
  customer: DuctCustomer; project: DuctProject; input: DuctInput; spec: DuctSpec; manual: boolean; lines: DuctLine[]; sections: DuctComputedSection[]; totals: DuctTotals;
  specRows: { labelEn: string; labelAr: string; valueEn: string; valueAr: string; confirmed: boolean }[]; review: { key: string; en: string; ar: string }[];
  systems: { key: string; nameEn: string; nameAr: string }[]; estimateNotice: Bi; straightDuctNote: Bi; terms: AcBiList; validityDays: number;
  canEdit: boolean; canSubmit: boolean; files: { id: string; name: string; size: number; category: string }[]; rejectionReason: string;
};

// The Split AC installation calculator: packages with prices by AC capacity, optional extras and a quotation PDF. The server holds the price
// list and does every calculation; the website only draws what it answers.
export type SplitPackage = {
  key: string; nameEn: string; nameAr: string; subtitleEn: string; subtitleAr: string; descriptionEn: string; descriptionAr: string; copperMeters: number;
  icon: string; imageUrl: string; imageAltEn: string; imageAltAr: string; highlighted: boolean; materials: AcBiList; services: AcBiList; notIncluded: AcBiList; prices: Record<string, number>; active: boolean;
};
export type SplitExtraUnit = "meter" | "unit" | "lot";
export type SplitConfig = {
  vatPercent: number; validityDays: number;
  capacities: { key: string; labelEn: string; labelAr: string; active: boolean }[];
  packages: SplitPackage[];
  extras: { key: string; nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string; unit: SplitExtraUnit; price: number | null; rfq: boolean; active: boolean }[];
  discount: { enabled: boolean; type: "percent" | "fixed"; value: number; labelEn: string; labelAr: string };
  conditions: AcBiList; technicalNote: Bi; disclaimer: Bi; footer: Bi;
  propertyTypes: { key: string; en: string; ar: string }[]; emirates: { key: string; en: string; ar: string }[];
};
export type SplitLine = {
  id: string; kind: "unit" | "service" | "custom" | "discount"; unitIndex: number | null; labelEn: string; labelAr: string; detailEn: string; detailAr: string;
  packageKey: string; packageEn: string; packageAr: string; capacityEn: string; capacityAr: string; qty: number; unitPrice: number | null; amount: number | null; rfq: boolean;
};
export type SplitTotals = { unitCount: number; unitsTotal: number; servicesTotal: number; discount: number; subtotal: number; vatPercent: number; vat: number; total: number; rfq: boolean; rfqItems: Bi[] };
export type SplitInput = { units: { capacity: string; packageKey: string; qty: number }[]; services: { key: string; qty: number; note?: string }[] };
export type SplitCustomer = { name: string; phone: string; email: string };
export type SplitProject = { propertyType: string; emirate: string; location: string; address: string; notes: string };
export type SplitQuoteBody = { lang: "en" | "ar"; input: SplitInput; customer: SplitCustomer; project: SplitProject };
export type SplitQuoteView = {
  kind: "split-ac"; number: string; version: number; status: DuctQuoteStatus; lang: "en" | "ar"; createdAt: string; expiresAt: string; bookRequested: boolean;
  customer: SplitCustomer; project: SplitProject; input: SplitInput; manual: boolean; lines: SplitLine[]; totals: SplitTotals;
  packages: { key: string; nameEn: string; nameAr: string; copperMeters: number }[]; conditions: AcBiList; technicalNote: Bi; disclaimer: Bi; validityDays: number;
  canEdit: boolean; canBook: boolean; rejectionReason: string;
};

export const api = {
  acQuoteConfig: () => apiFetch<AcConfig>("/ac-quote/config"),
  acQuoteCalculate: (input: AcInput) => apiFetch<{ lines: AcLine[]; totals: AcTotals }>("/ac-quote/calculate", { method: "POST", body: input }),
  acQuoteCreate: (body: AcQuoteBody) => apiFetch<{ number: string; token: string; url: string; total: number; expiresAt: string }>("/ac-quote", { method: "POST", body }),
  acQuoteView: (token: string) => apiFetch<AcQuoteView>(`/ac-quote/${encodeURIComponent(token)}`, { fresh: true }),
  acQuoteEdit: (token: string, body: AcQuoteBody) => apiFetch<{ number: string; version: number }>(`/ac-quote/${encodeURIComponent(token)}/edit`, { method: "POST", body }),
  acQuoteSubmit: (token: string, book: boolean) => apiFetch<{ received: boolean; number: string; booking: boolean }>(`/ac-quote/${encodeURIComponent(token)}/submit`, { method: "POST", body: { book } }),
  splitQuoteConfig: () => apiFetch<SplitConfig>("/split-quote/config"),
  splitQuoteCalculate: (input: SplitInput) => apiFetch<{ lines: SplitLine[]; totals: SplitTotals }>("/split-quote/calculate", { method: "POST", body: input }),
  splitQuoteCreate: (body: SplitQuoteBody) => apiFetch<{ number: string; token: string; url: string; total: number; expiresAt: string }>("/split-quote", { method: "POST", body }),
  splitQuoteView: (token: string) => apiFetch<SplitQuoteView>(`/split-quote/${encodeURIComponent(token)}`, { fresh: true }),
  splitQuoteEdit: (token: string, body: SplitQuoteBody) => apiFetch<{ number: string; version: number }>(`/split-quote/${encodeURIComponent(token)}/edit`, { method: "POST", body }),
  splitQuoteBook: (token: string) => apiFetch<{ received: boolean; number: string }>(`/split-quote/${encodeURIComponent(token)}/book`, { method: "POST", body: {} }),
  ductQuoteConfig: () => apiFetch<DuctConfig>("/duct-quote/config"),
  ductQuoteCalculate: (input: DuctInput) => apiFetch<{ lines: DuctLine[]; sections: DuctComputedSection[]; totals: DuctTotals }>("/duct-quote/calculate", { method: "POST", body: input }),
  ductQuoteCreate: (body: DuctQuoteBody) => apiFetch<{ number: string; token: string; url: string; total: number; expiresAt: string }>("/duct-quote", { method: "POST", body }),
  ductQuoteView: (token: string) => apiFetch<DuctQuoteView>(`/duct-quote/${encodeURIComponent(token)}`, { fresh: true }),
  ductQuoteEdit: (token: string, body: DuctQuoteBody) => apiFetch<{ number: string; version: number }>(`/duct-quote/${encodeURIComponent(token)}/edit`, { method: "POST", body }),
  ductQuoteSubmit: (token: string, type: DuctRequestType) => apiFetch<{ received: boolean; number: string; type: DuctRequestType }>(`/duct-quote/${encodeURIComponent(token)}/submit`, { method: "POST", body: { type } }),
  maintenancePackages: (group = "") => apiFetch<MaintenanceData>(`/maintenance-packages${group ? `?group=${encodeURIComponent(group)}` : ""}`),
  evaluateBuilder: (body: { group: string; selectedId: string; chosenId?: string; needs: BuilderNeeds }) => apiFetch<BuilderEvaluation>("/maintenance-builder/evaluate", { method: "POST", body }),
  submitBuilder: (body: BuilderSubmit) => apiFetch<BuilderSubmitResult>("/maintenance-builder/submit", { method: "POST", body }),
  agreementTerms: (group: string) => apiFetch<AgreementTerms>(`/maintenance-builder/agreement${group ? `?group=${encodeURIComponent(group)}` : ""}`, { fresh: true }),
  agreement: (token: string) => apiFetch<AgreementView>(`/agreements/${encodeURIComponent(token)}`, { fresh: true }),
  acceptAgreement: (token: string, accepted: boolean[]) => apiFetch<{ accepted: boolean; number: string }>(`/agreements/${encodeURIComponent(token)}`, { method: "POST", body: { accepted } }),
  myContracts: (token: string) => apiFetch<MyContract[]>("/me/contracts", { token, fresh: true }),
  subscribeMaintenance: (body: SubscribeBody) => apiFetch<{ received: boolean }>("/maintenance-subscriptions", { method: "POST", body }),

  // `identifier` is an email or a mobile number.
  login: (identifier: string, password: string) =>
    apiFetch<{ accessToken: string; customer: CustomerSummary }>("/auth/login", {
      method: "POST",
      body: { identifier, password },
    }),

  // Asks for a password-reset link by email. The answer is always the same, whether or not an account exists.
  forgotPassword: (identifier: string) => apiFetch<{ requested: boolean }>("/auth/forgot-password", { method: "POST", body: { identifier } }),

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
    apiFetch<Order & { totalFils: number; extraOrders?: Order[] }>("/orders", { method: "POST", body, token }),

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
  catalog: () => apiFetch<{ categories: CatalogCategory[] }>("/catalog"),
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

// Downloads an agreement PDF. The final file is only handed to the signed-in customer who owns it, so the request carries their token and the
// file is saved from the response (a plain link could not send it).
export async function downloadAgreementPdf(path: string, token: string | null, fallbackName: string) {
  const res = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status === 404 ? "Not found." : "The PDF could not be prepared. Please try again.", res.status);
  const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
export const agreementPdfPath = (accessToken: string) => `/agreements/${encodeURIComponent(accessToken)}/pdf`;
export const myContractPdfPath = (id: string) => `/me/contracts/${encodeURIComponent(id)}/pdf`;

export const acQuotePdfPath = (token: string, lang: "en" | "ar") => `/ac-quote/${encodeURIComponent(token)}/pdf?lang=${lang}`;

// One drawing, BOQ or site photo, sent before the quotation exists (it is attached when the quotation is created).
export async function uploadAcFile(file: File, uploadKey: string): Promise<{ id: string; name: string; size: number }> {
  const form = new FormData();
  form.append("file", file); form.append("uploadKey", uploadKey);
  const res = await fetch(`${API_BASE}/ac-quote/uploads`, { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.error?.message || "The upload failed.", res.status, json?.error?.code);
  return json.data;
}

export const ductQuotePdfPath = (token: string, lang: "en" | "ar" | "both") => `/duct-quote/${encodeURIComponent(token)}/pdf?lang=${lang}`;

// A downloaded PDF as a blob URL (for printing or opening), from the same private link.
export async function fetchPdfBlobUrl(path: string): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new ApiError("The PDF could not be prepared. Please try again.", res.status);
  return URL.createObjectURL(await res.blob());
}

// One drawing or BOQ, sent before the quotation exists (it is attached when the quotation is created).
export async function uploadDuctFile(file: File, uploadKey: string, category: "drawing" | "boq"): Promise<{ id: string; name: string; size: number; category: string }> {
  const form = new FormData();
  form.append("file", file); form.append("uploadKey", uploadKey); form.append("category", category);
  const res = await fetch(`${API_BASE}/duct-quote/uploads`, { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.error?.message || "The upload failed.", res.status, json?.error?.code);
  return json.data;
}

export const splitQuotePdfPath = (token: string, lang: "en" | "ar" | "both") => `/split-quote/${encodeURIComponent(token)}/pdf?lang=${lang}`;
