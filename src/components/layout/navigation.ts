import "server-only";
import { PRINT_3D_ID } from "@/components/home/print-3d";
import { DIGITAL_SOLUTIONS_SLUG, PRINT_ON_DEMAND_SLUG } from "@/components/illustrations/service-art";
import { PRODUCTION_LINES } from "@/config/production-lines";
import { listCategories } from "@/features/catalog/queries";
import { catalogHref } from "@/features/catalog/search-params";
import { listServices } from "@/features/services/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath, studioHref } from "@/i18n/routes";
import type { NavItem, NavLink } from "./nav-links";
import { STUDIO_ENABLED } from "@/config/features";

/** Supply services (Catalogue & fournitures division), by French slug, in menu order. */
const SUPPLY_SERVICES = [
  { slug: "fournitures-de-bureau", label: "officeSupplies" },
  { slug: "papeterie-fournitures-scolaires", label: "schoolSupplies" },
  { slug: "livres-ouvrages", label: "books" },
] as const;

/**
 * Main navigation, organised around MSLAB's three divisions (docs/CX_AUDIT_AND_PLAN.md):
 * Production · Catalogue · Digital solutions, then About and Contact. Every link points to a page
 * that exists: a menu entry whose service or category is not published is left out.
 */
export async function buildNavigation(locale: Locale, dict: Dictionary): Promise<{
  items: NavItem[];
  productionHref: string | null;
  digitalHref: string | null;
}> {
  const [services, categories] = await Promise.all([listServices(locale), listCategories(locale)]);
  const m = dict.cx.menu;
  const serviceHref = (slugFr: string) => {
    const service = services.find((s) => s.slugs.fr === slugFr);
    return service ? localizedPath(locale, { route: "service", slug: service.slug }) : null;
  };
  const productionHref = serviceHref(PRINT_ON_DEMAND_SLUG);
  const digitalHref = serviceHref(DIGITAL_SOLUTIONS_SLUG);
  const catalogPath = localizedPath(locale, { route: "catalog" });

  const lines: NavLink[] = PRODUCTION_LINES.flatMap((line) => {
    const category = categories.find((c) => c.slugs.fr === line.category);
    return category ? [{ href: localizedPath(locale, { route: "category", slug: category.slug }), label: m.lines[line.key] }] : [];
  });
  const production: NavItem = {
    key: "production",
    label: m.production,
    href: productionHref ?? localizedPath(locale, { route: "services" }),
    match: productionHref ? [productionHref] : [],
    overview: { href: productionHref ?? localizedPath(locale, { route: "services" }), label: m.productionOverview, hint: m.productionOverviewHint },
    // 3D printing has no page of its own yet: it links to its homepage section.
    children: [...lines, { href: `${localizedPath(locale, { route: "home" })}#${PRINT_3D_ID}`, label: m.print3d }],
    extra: STUDIO_ENABLED ? { href: studioHref(locale), label: m.studio, hint: m.studioHint } : undefined,
  };

  const supplies: NavLink[] = SUPPLY_SERVICES.flatMap(({ slug, label }) => {
    const href = serviceHref(slug);
    return href ? [{ href, label: m[label] }] : [];
  });
  const supplyHrefs = supplies.map((s) => s.href);
  const catalog: NavItem = {
    key: "catalog",
    label: m.catalog,
    href: catalogPath,
    sections: ["catalog", "products"],
    match: supplyHrefs,
    overview: { href: catalogPath, label: m.catalogAll, hint: m.catalogAllHint },
    children: [...supplies, { href: catalogHref(catalogPath, { type: "customizable" }), label: m.customizable }],
  };

  const digital: NavItem | null = digitalHref
    ? {
        key: "digital",
        label: m.digital,
        href: digitalHref,
        match: [digitalHref],
        overview: { href: digitalHref, label: m.digitalOverview, hint: m.digitalOverviewHint },
        children: dict.digital.services.map((service, index) => ({
          href: `${digitalHref}#${dict.cx.digital.details[index]?.id ?? ""}`,
          label: service.title,
        })),
      }
    : null;

  const items: NavItem[] = [
    production,
    catalog,
    ...(digital ? [digital] : []),
    { key: "about", label: dict.nav.about, href: localizedPath(locale, { route: "about" }), sections: ["about"] },
    { key: "contact", label: dict.nav.contact, href: localizedPath(locale, { route: "contact" }), sections: ["contact"] },
  ];
  return { items, productionHref, digitalHref };
}
