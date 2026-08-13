const API_BASE = "https://osta-invoices.vercel.app/api/v1";

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
  refundedAmount: number;
  warrantyUntil: string | null;
  createdAt: string;
};

export type InvoiceDetail = Invoice & {
  items: { serviceName: string; description: string | null; qty: number; unitPrice: number }[];
};

type Page<T> = { data: T[]; page: number; pageSize: number; total: number };

async function apiFetchPage<T>(
  path: string,
  options: { token?: string | null } = {}
): Promise<Page<T>> {
  const { token } = options;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(json?.error?.message || `Request failed (${res.status})`, res.status, json?.error?.code);
  }
  return json as Page<T>;
}

export const api = {
  requestOtp: (phone: string) =>
    apiFetch<{ sent: boolean; devCode?: string }>("/auth/otp/request", {
      method: "POST",
      body: { phone },
    }),

  verifyOtp: (phone: string, code: string) =>
    apiFetch<{ accessToken: string; customer: CustomerSummary }>("/auth/otp/verify", {
      method: "POST",
      body: { phone, code },
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
};
