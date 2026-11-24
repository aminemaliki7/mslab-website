/**
 * Localized URL map (ADR-003). Internal route folders use English names; public URLs use
 * the localized first segment for each locale. Pure module: used by proxy.ts, links,
 * metadata, sitemap and the language switcher.
 */
import { defaultLocale, hasLocale, locales, type Locale } from "./config";

/** Internal first segment (folder name under app/[lang]/(site)). */
const sections = {
  about: { fr: "a-propos", ar: "a-propos", en: "about" },
  services: { fr: "services", ar: "services", en: "services" },
  catalog: { fr: "catalogue", ar: "catalogue", en: "catalog" },
  products: { fr: "produits", ar: "produits", en: "products" },
  contact: { fr: "contact", ar: "contact", en: "contact" },
  quote: { fr: "devis", ar: "devis", en: "quote" },
  legal: { fr: "mentions-legales", ar: "mentions-legales", en: "legal-notice" },
  privacy: { fr: "confidentialite", ar: "confidentialite", en: "privacy" },
  cookies: { fr: "politique-cookies", ar: "politique-cookies", en: "cookie-policy" },
  terms: { fr: "conditions-utilisation", ar: "conditions-utilisation", en: "terms-of-use" },
  sales: { fr: "conditions-vente", ar: "conditions-vente", en: "terms-of-sale" },
  delivery: { fr: "livraison", ar: "livraison", en: "delivery" },
  returns: { fr: "retours-remboursements", ar: "retours-remboursements", en: "returns-refunds" },
  "custom-orders": { fr: "commandes-personnalisees", ar: "commandes-personnalisees", en: "custom-orders" },
  track: { fr: "suivi-commande", ar: "suivi-commande", en: "order-tracking" },
  studio: { fr: "studio", ar: "studio", en: "studio" },
} as const satisfies Record<string, Record<Locale, string>>;

export type Section = keyof typeof sections;

export type RouteKey =
  | { route: "home" }
  | { route: Exclude<Section, "products"> }
  | { route: "service"; slug: string }
  | { route: "category"; slug: string }
  | { route: "product"; slug: string };

const internalSections = Object.keys(sections) as Section[];

function isSection(value: string): value is Section {
  return (internalSections as string[]).includes(value);
}

/** Section routes that take no slug (used to validate links written in content files). */
export function isStaticSection(value: string): value is Exclude<Section, "products"> {
  return isSection(value) && value !== "products";
}

/** Build the public, localized path for a route. Only way to build public hrefs. */
/** Id of the quote form on the quote page: every "request a quote" link lands on the form itself. */
export const QUOTE_FORM_ID = "formulaire";

/** The quote form, optionally with a catalogue product already in the list. */
export function quoteFormHref(locale: Locale, productId?: string): string {
  const query = productId ? `?product=${encodeURIComponent(productId)}` : "";
  return `${localizedPath(locale, { route: "quote" })}${query}#${QUOTE_FORM_ID}`;
}

/** Query value that switches the quote page to the Digital Solutions (web project) form. */
export const DIGITAL_QUOTE_TYPE = "digital";

/** The Studio page, optionally opened on one support (?product=<mockup key>). */
export function studioHref(locale: Locale, product?: string): string {
  return `${localizedPath(locale, { route: "studio" })}${product ? `?product=${encodeURIComponent(product)}` : ""}`;
}

/** Query value that switches the quote page to the custom production form. */
export const PRODUCTION_QUOTE_TYPE = "production";

/** The quote page opened on the custom production form. */
export function productionQuoteHref(locale: Locale): string {
  return `${localizedPath(locale, { route: "quote" })}?type=${PRODUCTION_QUOTE_TYPE}#${QUOTE_FORM_ID}`;
}

/** The quote page opened on the web-project form (Digital Solutions). */
export function digitalQuoteHref(locale: Locale): string {
  return `${localizedPath(locale, { route: "quote" })}?type=${DIGITAL_QUOTE_TYPE}#${QUOTE_FORM_ID}`;
}

export function localizedPath(locale: Locale, key: RouteKey): string {
  switch (key.route) {
    case "home":
      return `/${locale}`;
    case "service":
      return `/${locale}/${sections.services[locale]}/${encodeURIComponent(key.slug)}`;
    case "category":
      return `/${locale}/${sections.catalog[locale]}/${encodeURIComponent(key.slug)}`;
    case "product":
      return `/${locale}/${sections.products[locale]}/${encodeURIComponent(key.slug)}`;
    default:
      return `/${locale}/${sections[key.route][locale]}`;
  }
}

/** Find the internal section for a localized first segment in a given locale. */
function sectionFromLocalized(locale: Locale, segment: string): Section | undefined {
  return internalSections.find((s) => sections[s][locale] === segment);
}

export type ResolvedPath =
  | { kind: "pass" }
  | { kind: "rewrite"; internalPath: string }
  | { kind: "redirect"; canonicalPath: string };

/**
 * Decide how proxy.ts handles a locale-prefixed pathname.
 * - localized segment (e.g. /fr/catalogue/x) → rewrite to internal (/fr/catalog/x)
 * - internal English segment used where a localized one exists (/fr/catalog) → redirect
 * - anything else → pass through (route tree decides, unknown → localized 404)
 */
export function resolveLocalizedPath(locale: Locale, rest: string[]): ResolvedPath {
  const [first, ...tail] = rest;
  if (!first) return { kind: "pass" };
  const suffix = tail.length ? `/${tail.join("/")}` : "";

  const fromLocalized = sectionFromLocalized(locale, first);
  if (fromLocalized) {
    if (fromLocalized === first) return { kind: "pass" };
    return { kind: "rewrite", internalPath: `/${locale}/${fromLocalized}${suffix}` };
  }
  if (isSection(first) && sections[first][locale] !== first) {
    return { kind: "redirect", canonicalPath: `/${locale}/${sections[first][locale]}${suffix}` };
  }
  return { kind: "pass" };
}

/** Entity routes whose last segment is a database slug (validated in proxy.ts). */
export type EntityRoute = "category" | "product" | "service";
const entitySections = { catalog: "category", products: "product", services: "service" } as const;

/**
 * `/fr/produits/<slug>` → { route: "product", slug }. Only exact two-segment entity paths
 * (section + slug), written with the locale's own section segment.
 */
export function entityFromPath(locale: Locale, rest: string[]): { route: EntityRoute; slug: string } | null {
  if (rest.length !== 2) return null;
  const [first, slug] = rest;
  const section = sectionFromLocalized(locale, first);
  if (!section || !(section in entitySections)) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return null;
  }
  return { route: entitySections[section as keyof typeof entitySections], slug: decoded };
}

/** Split a pathname into its locale and the remaining segments. */
export function splitLocale(pathname: string): { locale: Locale | null; rest: string[] } {
  const segments = pathname.split("/").filter(Boolean);
  const [first, ...rest] = segments;
  if (hasLocale(first)) return { locale: first, rest };
  return { locale: null, rest: segments };
}

/** Identify which top-level section a public (or internal) pathname belongs to. */
export function sectionOfPath(pathname: string): Section | "home" | null {
  const { locale, rest } = splitLocale(pathname);
  if (!locale) return null;
  const [first] = rest;
  if (!first) return "home";
  return sectionFromLocalized(locale, first) ?? (isSection(first) ? first : null);
}

/**
 * Path of the same page in another locale, used only until the language switcher has read the
 * page's hreflang links (components/layout/page-alternates.tsx). Section segments are
 * translated. Entity slugs differ per locale and cannot be derived from the URL, so an entity
 * page falls back to its section in the target locale: guessing the slug produced links to
 * redirects and 404s in the server-rendered HTML that crawlers read.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  const { locale, rest } = splitLocale(pathname);
  if (!locale) return `/${target}`;
  const [first, ...tail] = rest;
  if (!first) return `/${target}`;
  const section = sectionFromLocalized(locale, first) ?? (isSection(first) ? first : null);
  if (!section) return `/${target}`;
  if (tail.length && section in entitySections) {
    // Products have no index page of their own: their section is the catalog.
    const index = section === "products" ? "catalog" : section;
    return `/${target}/${sections[index][target]}`;
  }
  const suffix = tail.length ? `/${tail.join("/")}` : "";
  return `/${target}/${sections[section][target]}${suffix}`;
}

/** Alternate URLs for a route in every locale (hreflang). */
export function alternatePaths(key: RouteKey | Partial<Record<Locale, RouteKey>>) {
  const result = {} as Record<Locale, string>;
  for (const locale of locales) {
    const k = "route" in key ? (key as RouteKey) : (key as Partial<Record<Locale, RouteKey>>)[locale];
    if (k) result[locale] = localizedPath(locale, k);
  }
  return { languages: result, xDefault: result[defaultLocale] };
}
