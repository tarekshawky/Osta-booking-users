import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

// Called by the admin after a publish/unpublish so the live page refreshes immediately.
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const body = (await request.json().catch(() => null)) as { secret?: string; paths?: string[]; tags?: string[] } | null;
  if (!secret || !body || body.secret !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const paths = (body.paths ?? []).filter((p) => p === "/" || /^\/[a-z0-9-]+$/.test(p)).slice(0, 20);
  for (const path of paths) revalidatePath(path);
  // Only known tags: the shared header/footer/contact data, and the blog (articles and categories).
  const tags = (body.tags ?? []).filter((t) => t === "site" || t === "blog");
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: paths, tags });
}
