import { describe, it, expect } from "vitest";
import { cityOf, conditionOf, dayLabel, parseWeather, showTip, weatherUrl, WEATHER_CITIES } from "./weather";

const cur = { temperature_2m: 31.4, relative_humidity_2m: 68, apparent_temperature: 37.1, weather_code: 0, wind_speed_10m: 13.3, is_day: 1 };
const daily = { time: ["2026-11-03", "2026-11-04"], weather_code: [0, 3], temperature_2m_max: [32.3, 30.1], temperature_2m_min: [27.1, 26.4] };

describe("weatherUrl", () => {
  it("asks Open-Meteo for several emirates in one call, in Dubai time", () => {
    const u = new URL(weatherUrl(["dubai", "abu-dhabi"], 5));
    expect(u.origin + u.pathname).toBe("https://api.open-meteo.com/v1/forecast");
    expect(u.searchParams.get("latitude")).toBe("25.2048,24.4539");
    expect(u.searchParams.get("longitude")).toBe("55.2708,54.3773");
    expect(u.searchParams.get("timezone")).toBe("Asia/Dubai");
    expect(u.searchParams.get("forecast_days")).toBe("5");
    expect(u.searchParams.get("current")).toContain("apparent_temperature");
  });
  it("keeps the number of days between 1 and 7 and knows every emirate", () => {
    expect(new URL(weatherUrl(["dubai"], 0)).searchParams.get("forecast_days")).toBe("1");
    expect(new URL(weatherUrl(["dubai"], 30)).searchParams.get("forecast_days")).toBe("7");
    expect(WEATHER_CITIES).toHaveLength(8);
    expect(cityOf("nowhere").slug).toBe("dubai");
  });
});

describe("parseWeather", () => {
  it("reads a single place (an object) and several places (a list)", () => {
    const one = parseWeather({ current: cur, daily }, ["dubai"]);
    expect(one?.[0].now).toEqual({ tempC: 31.4, feelsC: 37.1, humidity: 68, windKmh: 13.3, code: 0, isDay: true });
    expect(one?.[0].days).toEqual([{ date: "2026-11-03", code: 0, maxC: 32.3, minC: 27.1 }, { date: "2026-11-04", code: 3, maxC: 30.1, minC: 26.4 }]);
    const two = parseWeather([{ current: cur, daily }, { current: { ...cur, is_day: 0 }, daily }], ["dubai", "al-ain"]);
    expect(two?.map((c) => c.slug)).toEqual(["dubai", "al-ain"]);
    expect(two?.[1].now.isDay).toBe(false);
  });
  it("refuses anything unexpected instead of showing half a card", () => {
    expect(parseWeather(null, ["dubai"])).toBeNull();
    expect(parseWeather({ error: true, reason: "x" }, ["dubai"])).toBeNull();
    expect(parseWeather({ current: { ...cur, temperature_2m: "hot" }, daily }, ["dubai"])).toBeNull();
    expect(parseWeather({ current: cur, daily: { ...daily, temperature_2m_max: [32.3] } }, ["dubai"])).toBeNull();
    expect(parseWeather([{ current: cur, daily }], ["dubai", "sharjah"])).toBeNull(); // wrong number of places
  });
});

describe("conditionOf", () => {
  it("names the weather in both languages, day and night", () => {
    expect(conditionOf(0, true)).toMatchObject({ en: "Clear sky", icon: "sun" });
    expect(conditionOf(0, false)).toMatchObject({ icon: "moon" });
    expect(conditionOf(2, true).icon).toBe("cloud-sun");
    expect(conditionOf(3).ar).toBe("غائم");
    expect(conditionOf(45).icon).toBe("fog");
    expect(conditionOf(63).icon).toBe("rain");
    expect(conditionOf(81).en).toBe("Rain showers");
    expect(conditionOf(95).icon).toBe("storm");
    expect(conditionOf(999).icon).toBe("cloud"); // unknown code: a safe default
  });
});

describe("tip and day names", () => {
  it("shows the tip from the chosen temperature", () => {
    expect(showTip(37.9, 38)).toBe(false);
    expect(showTip(38, 38)).toBe(true);
  });
  it("labels today, then weekdays", () => {
    expect(dayLabel("2026-11-03", 0, "en")).toBe("Today");
    expect(dayLabel("2026-11-03", 0, "ar")).toBe("اليوم");
    expect(dayLabel("2026-11-04", 1, "en")).toBe("Wed");
    expect(dayLabel("bad", 1, "en")).toBe("bad");
  });
});
