/**
 * Business days are Morocco local days (Africa/Casablanca — UTC+1, UTC+0 during Ramadan).
 * Timestamps are stored in UTC (timestamptz); these helpers convert at the edges. Pure module.
 */
export const BUSINESS_TZ = "Africa/Casablanca";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function partsInZone(date: Date): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, Number(p.value)]));
}

/** Offset of the business zone at that instant, in ms (local − UTC). */
function zoneOffset(date: Date): number {
  const p = partsInZone(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - (date.getTime() - date.getMilliseconds());
}

/** Morocco local wall time → UTC instant. */
export function zonedToUtc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let utc = guess - zoneOffset(new Date(guess));
  utc = guess - zoneOffset(new Date(utc)); // second pass across an offset change
  return new Date(utc);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Today's date in Morocco, "YYYY-MM-DD". */
export function businessToday(now = new Date()): string {
  const p = partsInZone(now);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** [start, end) UTC bounds of Morocco days `from`..`to` inclusive. */
export function dayRange(from: string, to: string = from): { start: string; end: string } {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = addDays(to, 1).split("-").map(Number);
  return { start: zonedToUtc(y1, m1, d1).toISOString(), end: zonedToUtc(y2, m2, d2).toISOString() };
}

/** UTC ISO → "YYYY-MM-DDTHH:mm" Morocco local, for <input type="datetime-local">. */
export function toLocalInput(iso: string | null | undefined): string {
  const date = iso ? new Date(iso) : new Date();
  const p = partsInZone(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** "YYYY-MM-DDTHH:mm" Morocco local → UTC ISO, or null when malformed. */
export function fromLocalInput(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match || !isIsoDate(`${match[1]}-${match[2]}-${match[3]}`)) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  if (h > 23 || mi > 59) return null;
  return zonedToUtc(y, mo, d, h, mi).toISOString();
}

/** Morocco local date of a UTC instant. */
export function businessDateOf(iso: string): string {
  return businessToday(new Date(iso));
}

export function formatTime(iso: string, lang: "fr" | "en" | "ar"): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : `${lang}-MA`, { timeStyle: "short", timeZone: BUSINESS_TZ, numberingSystem: "latn" }).format(new Date(iso));
}

export function formatDay(isoDate: string, lang: "fr" | "en" | "ar"): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : `${lang}-MA`, { dateStyle: "full", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatShortDay(isoDate: string, lang: "fr" | "en" | "ar"): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : `${lang}-MA`, { dateStyle: "medium", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(Date.UTC(y, m - 1, d)));
}
