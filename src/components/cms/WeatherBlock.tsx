"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSun, Droplets, Moon, Snowflake, Sun, Thermometer, Wind } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { RichLine } from "@/components/cms/RichInline";
import { cityOf, conditionOf, dayLabel, fetchWeather, showTip, WEATHER_CITIES, type CityWeather, type Condition } from "@/lib/weather";

type Bi = { en: string; ar: string };
type P = Record<string, unknown>;

const ICONS: Record<Condition["icon"], typeof Sun> = { sun: Sun, moon: Moon, "cloud-sun": CloudSun, "cloud-moon": CloudMoon, cloud: Cloud, fog: CloudFog, drizzle: CloudDrizzle, rain: CloudRain, snow: Snowflake, storm: CloudLightning };

function Icon({ code, isDay, size }: { code: number; isDay: boolean; size: number }) {
  const I = ICONS[conditionOf(code, isDay).icon];
  return <I size={size} className="text-accent-2" aria-hidden />;
}

// Live weather (Open-Meteo): one emirate with an optional forecast, or a card for every emirate. Loads on the visitor's screen, so it is current.
export function WeatherBlock({ p }: { p: P }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const bi = (v: Bi | undefined) => (v ? (ar ? v.ar || v.en : v.en || v.ar) : "");
  const all = p.mode === "all";
  const city = cityOf(typeof p.city === "string" ? p.city : "dubai");
  const forecast = p.forecast === "none" ? 0 : Number(p.forecast) || 5;
  const slugs = all ? WEATHER_CITIES.map((c) => c.slug) : [city.slug];
  const key = `${slugs.join(",")}|${all ? 1 : Math.max(1, forecast)}`;

  const [result, setResult] = useState<{ key: string; data: CityWeather[] | null } | null>(null);
  useEffect(() => {
    const ctl = new AbortController();
    const [list, days] = key.split("|");
    fetchWeather(list.split(","), Number(days), ctl.signal)
      .then((data) => setResult({ key, data }))
      .catch((e) => { if (!ctl.signal.aborted) { console.error("[weather]", e); setResult({ key, data: null }); } });
    return () => ctl.abort();
  }, [key]);
  const loading = result?.key !== key;
  const data = result?.key === key ? result.data : null;

  const name = (slug: string) => { const c = cityOf(slug); return ar ? c.nameAr : c.nameEn; };
  const deg = (n: number) => `${Math.round(n)}°`;
  const tip = bi(p.tipText as Bi);
  const tipUrl = typeof p.tipUrl === "string" ? p.tipUrl : "";
  const hottest = data ? Math.max(...data.map((d) => d.now.tempC)) : -Infinity;
  const tipFrom = typeof p.tipFromC === "number" ? p.tipFromC : 38;

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-12 text-center" aria-live="polite">
      {bi(p.heading as Bi) && <h2 className="text-2xl font-bold text-text sm:text-3xl">{bi(p.heading as Bi)}</h2>}
      {bi(p.subtitle as Bi) && <RichLine className="mx-auto mt-3 max-w-md text-sm text-text-muted" text={bi(p.subtitle as Bi)} />}

      <div className="mt-8">
        {loading && <div className="osta-card mx-auto h-44 max-w-xl animate-pulse" aria-busy="true" aria-label={ar ? "جارٍ تحميل الطقس" : "Loading weather"} />}
        {!loading && !data && <p className="osta-card mx-auto max-w-xl p-6 text-sm text-text-muted">{ar ? "الطقس غير متاح حالياً. حاول مرة أخرى لاحقاً." : "The weather is not available right now. Please try again later."}</p>}

        {data && !all && (() => {
          const w = data[0];
          const cond = conditionOf(w.now.code, w.now.isDay);
          return (
            <div className="osta-card mx-auto max-w-xl p-6">
              <p className="text-sm font-semibold text-text-muted">{name(w.slug)}</p>
              <div className="mt-2 flex items-center justify-center gap-4">
                <Icon code={w.now.code} isDay={w.now.isDay} size={56} />
                <span className="text-6xl font-bold text-text" dir="ltr">{deg(w.now.tempC)}</span>
              </div>
              <p className="mt-2 text-base text-text">{ar ? cond.ar : cond.en}</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-xs text-text-muted">
                <span className="flex flex-col items-center gap-1"><Thermometer size={16} className="text-accent-2" />{ar ? "تبدو كأنها" : "Feels like"}<b className="text-sm text-text" dir="ltr">{deg(w.now.feelsC)}</b></span>
                <span className="flex flex-col items-center gap-1"><Droplets size={16} className="text-accent-2" />{ar ? "الرطوبة" : "Humidity"}<b className="text-sm text-text" dir="ltr">{Math.round(w.now.humidity)}%</b></span>
                <span className="flex flex-col items-center gap-1"><Wind size={16} className="text-accent-2" />{ar ? "الرياح" : "Wind"}<b className="text-sm text-text" dir="ltr">{Math.round(w.now.windKmh)} {ar ? "كم/س" : "km/h"}</b></span>
              </div>
              {forecast > 0 && w.days.length > 0 && (
                <div className="mt-6 flex justify-center gap-2 overflow-x-auto border-t border-card-border pt-5" role="list" aria-label={ar ? "التوقعات" : "Forecast"}>
                  {w.days.slice(0, forecast).map((d, i) => (
                    <div key={d.date} role="listitem" className="flex min-w-16 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-xs text-text-muted">
                      <span>{dayLabel(d.date, i, lang)}</span>
                      <Icon code={d.code} isDay size={22} />
                      <b className="text-sm text-text" dir="ltr">{deg(d.maxC)}</b>
                      <span dir="ltr">{deg(d.minC)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {data && all && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.map((w) => {
              const cond = conditionOf(w.now.code, w.now.isDay);
              return (
                <div key={w.slug} className="osta-card flex flex-col items-center gap-1.5 p-4">
                  <span className="text-sm font-semibold text-text">{name(w.slug)}</span>
                  <Icon code={w.now.code} isDay={w.now.isDay} size={30} />
                  <span className="text-2xl font-bold text-text" dir="ltr">{deg(w.now.tempC)}</span>
                  <span className="text-[11px] text-text-muted">{ar ? cond.ar : cond.en}</span>
                  {w.days[0] && <span className="text-[11px] text-text-faint" dir="ltr">{deg(w.days[0].maxC)} / {deg(w.days[0].minC)}</span>}
                </div>
              );
            })}
          </div>
        )}

        {data && tip && tipUrl && showTip(hottest, tipFrom) && (
          <div className="osta-card osta-glow-border mx-auto mt-4 flex max-w-xl flex-col items-center gap-3 p-4 sm:flex-row sm:justify-between sm:text-start">
            <p className="text-sm text-text">{tip}</p>
            {tipUrl.startsWith("/")
              ? <Link href={tipUrl} className="osta-btn-primary shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white">{ar ? "احجز الآن" : "Book now"}</Link>
              : <a href={tipUrl} className="osta-btn-primary shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" {...(tipUrl.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{ar ? "احجز الآن" : "Book now"}</a>}
          </div>
        )}
        {data && <p className="mt-3 text-[11px] text-text-faint">{ar ? "بيانات الطقس من " : "Weather data by "}<a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline">Open-Meteo</a></p>}
      </div>
    </section>
  );
}
