import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { locales, type Locale } from "@/i18n/config";
import { createPublicClient } from "@/lib/supabase/public";
import { LEGAL_FACT_FIELDS, type LegalFactValues } from "@/content/legal/types";

export const SETTINGS_TAG = "settings";

/** Value for a locale with French fallback (settings are entered French-first). */
export function forLocale(values: PerLocale, locale: Locale): string | null {
  return values[locale] ?? values.fr ?? null;
}

type PerLocale = Partial<Record<Locale, string>>;

/**
 * Verified company information (ADR-014). Every field is optional: an empty value is
 * HIDDEN on the site, never replaced by a placeholder.
 */
export type SiteSettings = {
  companyName: string | null;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  /** E.164 digits without "+" — WhatsApp buttons are hidden while null. */
  whatsappNumber: string | null;
  address: PerLocale;
  mapsUrl: string | null;
  openingHours: PerLocale;
  about: PerLocale;
  mission: PerLocale;
  values: PerLocale;
  /** "Why choose MSLAB" points, one per line (homepage section hidden while empty). */
  highlights: PerLocale;
  /** Legal pages text, written/validated by MSLAB (Loi 09-08). Empty → "being prepared" notice. */
  legalNotice: PerLocale;
  privacyPolicy: PerLocale;
  /** Values for the legal documents (/admin/settings → Informations légales); missing = hidden. */
  legalFacts: LegalFactValues;
  social: {
    facebook: string | null;
    instagram: string | null;
    linkedin: string | null;
    youtube: string | null;
  };
  enabledLocales: Locale[];
};

const EMPTY_SETTINGS: SiteSettings = {
  companyName: null,
  legalName: null,
  email: null,
  phone: null,
  whatsappNumber: null,
  address: {},
  mapsUrl: null,
  openingHours: {},
  about: {},
  mission: {},
  values: {},
  highlights: {},
  legalNotice: {},
  privacyPolicy: {},
  legalFacts: {},
  social: { facebook: null, instagram: null, linkedin: null, youtube: null },
  enabledLocales: [...locales],
};

function perLocale(row: Record<string, unknown>, field: string): PerLocale {
  const result: PerLocale = {};
  for (const locale of locales) {
    const value = row[`${field}_${locale}`];
    if (typeof value === "string" && value.trim()) result[locale] = value;
  }
  return result;
}

/** site_settings.legal_facts (jsonb) → only known keys and non-empty strings are kept. */
export function parseLegalFacts(raw: unknown): LegalFactValues {
  const result: LegalFactValues = {};
  if (!raw || typeof raw !== "object") return result;
  const source = raw as Record<string, unknown>;
  for (const { key } of LEGAL_FACT_FIELDS) {
    const entry = source[key];
    if (!entry || typeof entry !== "object") continue;
    const values: Partial<Record<Locale | "all", string>> = {};
    for (const lang of ["all", ...locales] as const) {
      const value = (entry as Record<string, unknown>)[lang];
      if (typeof value === "string" && value.trim()) values[lang] = value.trim();
    }
    if (Object.keys(values).length) result[key] = values;
  }
  return result;
}

/** Public site settings, cached; invalidated with updateTag(SETTINGS_TAG) from /admin/settings. */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);

  const { data, error } = await createPublicClient()
    .from("site_settings")
    // Singleton row of public company facts: every column is mapped below.
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    // Degrade gracefully (site stays up without contact details) and retry soon.
    cacheLife("minutes");
    console.error("[settings] failed to load site_settings", error?.code ?? "no row");
    return EMPTY_SETTINGS;
  }

  cacheLife("hours");
  const row = data as unknown as Record<string, unknown>;
  return {
    companyName: data.company_name,
    legalName: data.legal_name,
    email: data.email,
    phone: data.phone,
    whatsappNumber: data.whatsapp_number,
    address: perLocale(row, "address"),
    mapsUrl: data.maps_url,
    openingHours: perLocale(row, "opening_hours"),
    about: perLocale(row, "about"),
    mission: perLocale(row, "mission"),
    values: perLocale(row, "values"),
    highlights: perLocale(row, "highlights"),
    legalNotice: perLocale(row, "legal_notice"),
    privacyPolicy: perLocale(row, "privacy_policy"),
    legalFacts: parseLegalFacts(row.legal_facts),
    social: {
      facebook: data.social_facebook,
      instagram: data.social_instagram,
      linkedin: data.social_linkedin,
      youtube: data.social_youtube,
    },
    enabledLocales: data.enabled_locales.filter((l): l is Locale => (locales as readonly string[]).includes(l)),
  };
}
