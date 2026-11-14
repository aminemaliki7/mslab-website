import type { MetadataRoute } from "next";
import { listSitemapEntities } from "@/features/catalog/queries";
import { getSiteSettings } from "@/features/settings/queries";
import { defaultLocale, type Locale } from "@/i18n/config";
import { localizedPath, type RouteKey } from "@/i18n/routes";
import { siteUrl } from "@/lib/env";

/**
 * sitemap.xml: every indexable public page in every ENABLED locale, with hreflang alternates.
 * Excluded on purpose: search/filter URLs, legal pages until their text exists, admin.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, entities] = await Promise.all([getSiteSettings(), listSitemapEntities()]);
  const enabled = settings.enabledLocales;

  const entry = (routes: Partial<Record<Locale, RouteKey>>, lastModified?: string): MetadataRoute.Sitemap => {
    const languages = Object.fromEntries(
      enabled.filter((l) => routes[l]).map((l) => [l, `${siteUrl}${localizedPath(l, routes[l]!)}`]),
    ) as Record<string, string>;
    if (routes[defaultLocale]) languages["x-default"] = `${siteUrl}${localizedPath(defaultLocale, routes[defaultLocale]!)}`;
    return enabled
      .filter((l) => routes[l])
      .map((l) => ({
        url: `${siteUrl}${localizedPath(l, routes[l]!)}`,
        ...(lastModified ? { lastModified } : {}),
        alternates: { languages },
      }));
  };

  const same = (key: RouteKey) => Object.fromEntries(enabled.map((l) => [l, key])) as Record<Locale, RouteKey>;
  const staticKeys: RouteKey[] = [
    { route: "home" },
    { route: "about" },
    { route: "services" },
    { route: "catalog" },
    { route: "contact" },
    { route: "quote" },
  ];
  if (settings.legalNotice.fr) staticKeys.push({ route: "legal" });
  if (settings.privacyPolicy.fr) staticKeys.push({ route: "privacy" });

  const routeName = { category: "category", product: "product", service: "service" } as const;

  return [
    ...staticKeys.flatMap((key) => entry(same(key))),
    ...entities.flatMap((entity) =>
      entry(
        Object.fromEntries(
          enabled.map((l) => [l, { route: routeName[entity.kind], slug: entity.slugs[l] ?? entity.slugs.fr }]),
        ) as Record<Locale, RouteKey>,
        entity.updatedAt,
      ),
    ),
  ];
}
