// Choosing a visit time inside the service hours. Hours may run past midnight (for example 10:00–01:00).

const MIN = 24 * 60;
export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) => `${String(Math.floor((min % MIN) / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// True when `hhmm` is inside [start, end]. If the end is earlier than the start the hours cross midnight.
export function withinHours(hhmm: string, start: string | null | undefined, end: string | null | undefined): boolean {
  if (!start || !end) return true;
  const t = toMinutes(hhmm);
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === e) return true; // same start and end = open all day
  return s < e ? t >= s && t <= e : t >= s || t <= e;
}

// Every `step` minutes from the opening time to the closing time (inclusive), crossing midnight when needed.
export function slotTimes(start: string | null | undefined, end: string | null | undefined, step = 30): string[] {
  const s = start ? toMinutes(start) : 0;
  let e = end ? toMinutes(end) : MIN - step;
  if (start && end && toMinutes(start) === toMinutes(end)) e = s + MIN - step;
  else if (e < s) e += MIN;
  const out: string[] = [];
  for (let t = s; t <= e; t += step) out.push(toHHMM(t));
  return out;
}

// A date as YYYY-MM-DD in the visitor's own time zone (what <input type="date"> uses).
export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// The times that can still be booked on `date`: inside the hours, and later than `now` when the date is today.
export function availableTimes(date: string, start: string | null | undefined, end: string | null | undefined, now = new Date(), step = 30): string[] {
  const all = slotTimes(start, end, step);
  if (!date || date !== localDateStr(now)) return all;
  return all.filter((hhmm) => new Date(`${date}T${hhmm}`).getTime() > now.getTime());
}
