/**
 * Locale configuration. Pure module: safe to import from proxy, server and client code.
 */
export const locales = ["fr", "ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function hasLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export type Direction = "ltr" | "rtl";

export function getDirection(locale: Locale): Direction {
  return locale === "ar" ? "rtl" : "ltr";
}

export const localeMeta: Record<
  Locale,
  { nativeName: string; htmlLang: string; hreflang: string; ogLocale: string; intl: string }
> = {
  fr: { nativeName: "Français", htmlLang: "fr", hreflang: "fr-MA", ogLocale: "fr_MA", intl: "fr-MA" },
  // Latin digits by default — Arabic-Indic numerals is an open question for MSLAB.
  ar: { nativeName: "العربية", htmlLang: "ar", hreflang: "ar-MA", ogLocale: "ar_MA", intl: "ar-MA-u-nu-latn" },
  en: { nativeName: "English", htmlLang: "en", hreflang: "en", ogLocale: "en_US", intl: "en" },
};

/** Locale for an hreflang value as written in <link rel="alternate"> ("fr-MA" → "fr"). */
export function localeFromHreflang(value: string): Locale | null {
  const found = locales.find((l) => localeMeta[l].hreflang.toLowerCase() === value.toLowerCase());
  return found ?? null;
}
