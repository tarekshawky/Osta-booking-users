import { ApiError } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n";

// Which message to show for a failed sign-in / sign-up / recovery request. Messages come from the page's own translations (not the
// server's English text), so they follow the language switcher.
export function authErrorKey(err: unknown): TranslationKey {
  if (err instanceof ApiError) {
    if (err.status === 429 || err.code === "rate_limited") return "auth.errRateLimited";
    if (err.status === 401 || err.code === "invalid_credentials") return "auth.errCredentials";
    if (err.status === 409) return "auth.errExists";
    return "auth.errGeneric";
  }
  // fetch() itself failed: offline, blocked or the server is unreachable.
  return "auth.errNetwork";
}
