import type { NextConfig } from "next";
import { adminOrigins, securityHeaders } from "./src/lib/securityHeaders";

// The admin that shows the website's draft preview in a frame: the API address, plus any extra addresses in ADMIN_FRAME_ORIGINS.
const framedBy = adminOrigins({ apiBase: process.env.NEXT_PUBLIC_API_BASE ?? "https://osta-invoices.vercel.app/api/v1", extra: process.env.ADMIN_FRAME_ORIGINS });

const nextConfig: NextConfig = {
  poweredByHeader: false, // do not announce the framework in every response
  async headers() {
    // Development needs eval for hot reload, so the policy is for the real (production) site only.
    if (process.env.NODE_ENV !== "production") return [];
    return [
      { source: "/:path*", headers: securityHeaders() },
      // the draft preview is shown inside the admin's page editor: only that address may frame it (later rule overrides the policy above)
      { source: "/preview/:path*", headers: securityHeaders({ framedBy }) },
    ];
  },
};

export default nextConfig;
