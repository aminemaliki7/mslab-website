/**
 * Money and quantity helpers for the business module (ADR-028). Pure module (server + client).
 *
 * Amounts are stored as numeric(14,2) and every total that matters is computed by Postgres.
 * In JavaScript, money is only handled as INTEGER CENTS (never as floating-point MAD), and
 * quantities as integer thousandths, so previews and list sums are exact.
 */
import type { AdminLang } from "@/features/admin/dictionary";

const LOCALES: Record<AdminLang, string> = { fr: "fr-MA", en: "en-GB", ar: "ar-MA" };
const MAX_CENTS = 99_999_999_999_99; // numeric(14,2)

/** "1 234,50" · "1234.5" · "1,234.50" → 123450. Returns null when invalid or > 2 decimals. */
export function parseCents(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? parseCents(String(input)) : null;
  if (typeof input !== "string") return null;
  let s = input.replace(/[\s  ]/g, "").replace(/MAD|DH|dhs?/gi, "");
  if (!s) return null;
  // Both separators: the last one is the decimal separator.
  if (s.includes(",") && s.includes(".")) {
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else {
    s = s.replace(",", ".");
  }
  const match = /^(-?)(\d{1,12})(?:\.(\d{0,2}))?$/.exec(s);
  if (!match) return null;
  const cents = Number(match[2]) * 100 + Number((match[3] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return null;
  return match[1] ? -cents : cents;
}

/** Integer thousandths: "2,5" → 2500. Null when invalid or > 3 decimals. */
export function parseMilli(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? parseMilli(String(input)) : null;
  if (typeof input !== "string") return null;
  const s = input.replace(/[\s  ]/g, "").replace(",", ".");
  const match = /^(\d{1,11})(?:\.(\d{0,3}))?$/.exec(s);
  if (!match) return null;
  const milli = Number(match[1]) * 1000 + Number((match[2] ?? "").padEnd(3, "0"));
  return Number.isSafeInteger(milli) ? milli : null;
}

/** Value read from the database (number or numeric string) → integer cents. */
export function dbCents(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return parseCents(String(value)) ?? 0;
}

export function dbMilli(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const negative = String(value).trim().startsWith("-");
  const parsed = parseMilli(String(value).replace("-", "")) ?? 0;
  return negative ? -parsed : parsed;
}

/** Cents → "1234.50" for RPC payloads (Postgres parses it as an exact numeric). */
export function centsToDecimal(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function milliToDecimal(milli: number): string {
  const sign = milli < 0 ? "-" : "";
  const abs = Math.abs(milli);
  return `${sign}${Math.trunc(abs / 1000)}.${String(abs % 1000).padStart(3, "0")}`;
}

/** line total = round(qty × unit price, 2) − discount, exactly as Postgres computes it. */
export function lineTotalCents(milli: number, unitCents: number, discountCents = 0): number {
  // milli × cents / 1000, rounded half away from zero like numeric round().
  const raw = milli * unitCents;
  const rounded = Math.sign(raw) * Math.floor((Math.abs(raw) + 500) / 1000);
  return rounded - discountCents;
}

export function formatMoney(value: number | string | null | undefined, lang: AdminLang, opts: { cents?: boolean } = {}): string {
  if (value === null || value === undefined || value === "") return "—";
  const cents = opts.cents ? Number(value) : dbCents(value);
  const formatted = new Intl.NumberFormat(LOCALES[lang], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    numberingSystem: "latn",
  }).format(Math.trunc(cents / 100) + (cents % 100) / 100);
  return `${formatted} MAD`;
}

export function formatQty(value: number | string | null | undefined, lang: AdminLang, opts: { milli?: boolean } = {}): string {
  if (value === null || value === undefined || value === "") return "—";
  const milli = opts.milli ? Number(value) : dbMilli(value);
  return new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 3, numberingSystem: "latn" }).format(
    Math.trunc(milli / 1000) + (milli % 1000) / 1000,
  );
}

/** For <input defaultValue>: "12.50" → "12,50" in French, unchanged otherwise. */
export function inputAmount(value: number | string | null | undefined, lang: AdminLang): string {
  if (value === null || value === undefined || value === "") return "";
  const s = centsToDecimal(dbCents(value));
  return lang === "fr" ? s.replace(".", ",") : s;
}

export function inputQty(value: number | string | null | undefined, lang: AdminLang): string {
  if (value === null || value === undefined || value === "") return "";
  const s = milliToDecimal(dbMilli(value)).replace(/\.?0+$/, "");
  return lang === "fr" ? s.replace(".", ",") : s;
}
