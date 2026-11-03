// Live weather for the Weather block, from Open-Meteo (free, no key; listed in github.com/public-apis/public-apis).
// The cities repeat the admin's list (osta-erp: src/lib/cms/weatherCities.ts): keep both in step.

export const WEATHER_CITIES = [
  { slug: "dubai", nameEn: "Dubai", nameAr: "دبي", lat: 25.2048, lon: 55.2708 },
  { slug: "abu-dhabi", nameEn: "Abu Dhabi", nameAr: "أبوظبي", lat: 24.4539, lon: 54.3773 },
  { slug: "sharjah", nameEn: "Sharjah", nameAr: "الشارقة", lat: 25.3463, lon: 55.4209 },
  { slug: "ajman", nameEn: "Ajman", nameAr: "عجمان", lat: 25.4052, lon: 55.5136 },
  { slug: "umm-al-quwain", nameEn: "Umm Al Quwain", nameAr: "أم القيوين", lat: 25.5647, lon: 55.5552 },
  { slug: "ras-al-khaimah", nameEn: "Ras Al Khaimah", nameAr: "رأس الخيمة", lat: 25.7895, lon: 55.9432 },
  { slug: "fujairah", nameEn: "Fujairah", nameAr: "الفجيرة", lat: 25.1288, lon: 56.3265 },
  { slug: "al-ain", nameEn: "Al Ain", nameAr: "العين", lat: 24.2075, lon: 55.7447 },
] as const;

export type WeatherNow = { tempC: number; feelsC: number; humidity: number; windKmh: number; code: number; isDay: boolean };
export type WeatherDay = { date: string; code: number; maxC: number; minC: number };
export type CityWeather = { slug: string; now: WeatherNow; days: WeatherDay[] };

export const cityOf = (slug: string) => WEATHER_CITIES.find((c) => c.slug === slug) ?? WEATHER_CITIES[0];

export function weatherUrl(slugs: string[], days: number): string {
  const cities = slugs.map(cityOf);
  const q = new URLSearchParams({
    latitude: cities.map((c) => c.lat).join(","),
    longitude: cities.map((c) => c.lon).join(","),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "Asia/Dubai",
    forecast_days: String(Math.min(7, Math.max(1, days))),
  });
  return `https://api.open-meteo.com/v1/forecast?${q.toString()}`;
}

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

// Open-Meteo answers with one object for one place and a list for several. Anything unexpected is refused (null), never shown half-filled.
export function parseWeather(json: unknown, slugs: string[]): CityWeather[] | null {
  const list = Array.isArray(json) ? json : [json];
  if (list.length !== slugs.length) return null;
  const out: CityWeather[] = [];
  for (const [i, raw] of list.entries()) {
    const r = raw as { current?: Record<string, unknown>; daily?: Record<string, unknown[]> } | null;
    const c = r?.current;
    const d = r?.daily;
    if (!c || !d || !num(c.temperature_2m) || !num(c.apparent_temperature) || !num(c.relative_humidity_2m) || !num(c.wind_speed_10m) || !num(c.weather_code)) return null;
    const dates = d.time, codes = d.weather_code, max = d.temperature_2m_max, min = d.temperature_2m_min;
    if (!Array.isArray(dates) || !Array.isArray(codes) || !Array.isArray(max) || !Array.isArray(min)) return null;
    const days: WeatherDay[] = [];
    for (let k = 0; k < dates.length; k++) {
      if (typeof dates[k] !== "string" || !num(codes[k]) || !num(max[k]) || !num(min[k])) return null;
      days.push({ date: dates[k] as string, code: codes[k] as number, maxC: max[k] as number, minC: min[k] as number });
    }
    out.push({ slug: slugs[i], now: { tempC: c.temperature_2m, feelsC: c.apparent_temperature, humidity: c.relative_humidity_2m, windKmh: c.wind_speed_10m, code: c.weather_code, isDay: c.is_day !== 0 }, days });
  }
  return out;
}

export type Condition = { en: string; ar: string; icon: "sun" | "moon" | "cloud-sun" | "cloud-moon" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "storm" };

// WMO weather codes, as Open-Meteo reports them.
export function conditionOf(code: number, isDay = true): Condition {
  if (code === 0) return isDay ? { en: "Clear sky", ar: "سماء صافية", icon: "sun" } : { en: "Clear night", ar: "ليلة صافية", icon: "moon" };
  if (code === 1 || code === 2) return { en: code === 1 ? "Mostly clear" : "Partly cloudy", ar: code === 1 ? "صافٍ في الغالب" : "غائم جزئياً", icon: isDay ? "cloud-sun" : "cloud-moon" };
  if (code === 3) return { en: "Overcast", ar: "غائم", icon: "cloud" };
  if (code === 45 || code === 48) return { en: "Fog", ar: "ضباب", icon: "fog" };
  if (code >= 51 && code <= 57) return { en: "Drizzle", ar: "رذاذ", icon: "drizzle" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { en: code >= 80 ? "Rain showers" : "Rain", ar: code >= 80 ? "زخات مطر" : "مطر", icon: "rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { en: "Snow", ar: "ثلج", icon: "snow" };
  if (code === 95 || code === 96 || code === 99) return { en: code === 95 ? "Thunderstorm" : "Thunderstorm with hail", ar: code === 95 ? "عاصفة رعدية" : "عاصفة رعدية مع برَد", icon: "storm" };
  return { en: "Cloudy", ar: "غائم", icon: "cloud" };
}

export const showTip = (tempC: number, fromC: number) => tempC >= fromC;

// "Today", then the weekday names ("Wed" / "الأربعاء"). The date is a plain calendar date (Asia/Dubai), so it is read as UTC to avoid a day shift.
export function dayLabel(date: string, index: number, lang: "en" | "ar"): string {
  if (index === 0) return lang === "ar" ? "اليوم" : "Today";
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-AE" : "en-GB", { weekday: "short", timeZone: "UTC" }).format(d);
}

const TTL_MS = 15 * 60 * 1000;

// Fetches (and keeps the answer for 15 minutes in this browser tab, so several weather blocks or page changes share one call).
export async function fetchWeather(slugs: string[], days: number, signal?: AbortSignal): Promise<CityWeather[]> {
  const url = weatherUrl(slugs, days);
  try {
    const raw = sessionStorage.getItem(`osta_weather:${url}`);
    if (raw) {
      const saved = JSON.parse(raw) as { t: number; data: CityWeather[] };
      if (Date.now() - saved.t < TTL_MS && Array.isArray(saved.data)) return saved.data;
    }
  } catch { /* storage unavailable: just fetch */ }
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const data = parseWeather(await res.json(), slugs);
  if (!data) throw new Error("weather: unexpected answer");
  try { sessionStorage.setItem(`osta_weather:${url}`, JSON.stringify({ t: Date.now(), data })); } catch { /* ignore */ }
  return data;
}
