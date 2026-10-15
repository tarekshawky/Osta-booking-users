import { cookies } from "next/headers";
import { fetchSite } from "@/lib/site";

// The language the visitor will see, known on the server (for page titles and descriptions): their own choice when they
// made one, otherwise the default language set in the admin. Mirrors how the layout picks it.
export async function serverLang(): Promise<"en" | "ar"> {
  const stored = (await cookies()).get("osta_lang_choice")?.value;
  if (stored === "ar" || stored === "en") return stored;
  return (await fetchSite()).settings.defaultLocale;
}

export const pick = (lang: "en" | "ar", en: string | null | undefined, ar: string | null | undefined) =>
  (lang === "ar" ? ar || en : en || ar) ?? "";
