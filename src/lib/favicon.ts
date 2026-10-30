import { NextResponse } from "next/server";
import sharp from "sharp";
import { ERP_ORIGIN } from "@/lib/api";
import { fetchSite } from "@/lib/site";

// The favicon is the image chosen in the admin (Website → Site & Contact). Browsers, Google and iPhones want small, square,
// reliable files, so the picture (often large, sometimes WebP) is resized here to a PNG of the size asked for.
async function sourceBytes(src: string): Promise<Buffer | null> {
  if (src.startsWith("data:")) {
    const comma = src.indexOf(",");
    return comma < 0 ? null : Buffer.from(src.slice(comma + 1), /;base64/.test(src.slice(0, comma)) ? "base64" : "utf8");
  }
  const res = await fetch(src.startsWith("/") ? `${ERP_ORIGIN}${src}` : src, { next: { revalidate: 3600 } });
  return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
}

export async function faviconResponse(size: number, requestUrl: string): Promise<Response> {
  // No favicon chosen yet (or it can't be read): the built-in icon, for a short time so a fix shows quickly.
  const fallback = () => NextResponse.redirect(new URL("/favicon-default.ico", requestUrl), { status: 307, headers: { "Cache-Control": "public, max-age=300" } });
  const { settings } = await fetchSite();
  if (!settings.faviconUrl) return fallback();
  try {
    const bytes = await sourceBytes(settings.faviconUrl);
    if (!bytes) return fallback();
    const png = await sharp(bytes).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toBuffer();
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return fallback();
  }
}
