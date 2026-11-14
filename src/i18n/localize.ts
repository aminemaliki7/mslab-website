import type { Locale } from "./config";

type LocalizedFields<K extends string> = { [P in `${K}_fr` | `${K}_ar` | `${K}_en`]?: string | null };

/**
 * Pick a per-locale column (`name_ar`) with French fallback (ADR-010).
 * Returns null only when even the French value is empty.
 */
export function pick<K extends string>(row: LocalizedFields<K>, field: K, locale: Locale): string | null {
  const value = row[`${field}_${locale}` as keyof LocalizedFields<K>];
  if (value) return value;
  return row[`${field}_fr` as keyof LocalizedFields<K>] ?? null;
}

/** Whether a row has its own (non-fallback) content for the locale. */
export function hasTranslation<K extends string>(row: LocalizedFields<K>, field: K, locale: Locale): boolean {
  return Boolean(row[`${field}_${locale}` as keyof LocalizedFields<K>]);
}

/** Per-locale slug: own slug if present, otherwise the French slug (page is shown with fr fallback). */
export function slugFor(row: { slug_fr: string; slug_ar?: string | null; slug_en?: string | null }, locale: Locale) {
  if (locale === "ar") return row.slug_ar ?? row.slug_fr;
  if (locale === "en") return row.slug_en ?? row.slug_fr;
  return row.slug_fr;
}
