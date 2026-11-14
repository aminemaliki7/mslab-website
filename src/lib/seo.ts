import "server-only";
import type { Metadata } from "next";
import { getSiteSettings } from "@/features/settings/queries";
import { localeMeta, type Locale } from "@/i18n/config";
import { alternatePaths, localizedPath, type RouteKey } from "@/i18n/routes";

/** Brand share image (public/brand/og-default.png); product pages override it with a photo. */
export const DEFAULT_OG_IMAGE = { url: "/brand/og-default.png", width: 1200, height: 630, alt: "MSLAB" };

type PageMetadataInput = {
  locale: Locale;
  route: RouteKey | Partial<Record<Locale, RouteKey>>;
  title: string;
  description: string;
  /** Set false for thank-you pages, filtered searches, etc. */
  index?: boolean;
};

/**
 * Localized metadata with canonical + hreflang alternates (x-default → fr).
 * Only languages enabled in /admin/settings are announced as alternates.
 */
export async function buildPageMetadata({ locale, route, title, description, index = true }: PageMetadataInput): Promise<Metadata> {
  const { enabledLocales } = await getSiteSettings();
  const { languages: all, xDefault } = alternatePaths(route);
  const languages = Object.fromEntries(Object.entries(all).filter(([l]) => enabledLocales.includes(l as Locale)));
  const canonical = "route" in route ? localizedPath(locale, route as RouteKey) : (all[locale] ?? xDefault);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { ...languages, "x-default": xDefault },
    },
    openGraph: {
      type: "website",
      siteName: "MSLAB",
      title,
      description,
      url: canonical,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: enabledLocales.filter((l) => l !== locale).map((l) => localeMeta[l].ogLocale),
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE.url] },
    robots: index ? undefined : { index: false, follow: true },
  };
}
