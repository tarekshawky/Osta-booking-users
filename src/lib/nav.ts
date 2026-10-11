// Is `url` the page (or a parent section of the page) the visitor is on? "/" only matches the home page itself.
export function isActivePath(pathname: string | null, url: string): boolean {
  if (!pathname || !url.startsWith("/") || url.startsWith("//")) return false;
  const path = url.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}
