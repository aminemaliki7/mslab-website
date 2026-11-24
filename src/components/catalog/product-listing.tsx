import Link from "next/link";
import type { ReactNode } from "react";
import { PRINT_ON_DEMAND_SLUG } from "@/components/illustrations/service-art";
import { ArrowIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/layout";
import { OFFER_TYPES, type OfferType } from "@/config/catalog-offers";
import { listProducts, type CategorySummary } from "@/features/catalog/queries";
import { CATALOG_SORTS, catalogHref, parseCatalogQuery, type CatalogQuery, type CatalogSort } from "@/features/catalog/search-params";
import { listServices } from "@/features/services/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { localizedPath, quoteFormHref } from "@/i18n/routes";
import { cn } from "@/lib/utils";
import { CatalogSearchForm } from "./catalog-search-form";
import { CatalogEmptyState } from "./empty-state";
import { OfferBadge } from "./offer-badge";
import { Pagination } from "./pagination";
import { ProductCard, productCardLabels } from "./product-card";

type Props = {
  locale: Locale;
  dict: Dictionary;
  /** Canonical path of the listing (catalog index or a category page). */
  basePath: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  categories: CategorySummary[];
  /** Set on category pages: the route fixes the category, the form hides the selector. */
  fixedCategory?: CategorySummary;
  /** Category links shown beside the search line (static; also passed to the skeleton). */
  nav?: ReactNode;
};

/**
 * Filter bar in the site's index style (docs/ART_DIRECTION.md): a 2 px ink rule opens it,
 * categories on the start side, the search line on the end side (stacked on phones).
 */
function FilterBar({ nav, search }: { nav?: ReactNode; search: ReactNode }) {
  return (
    <div className="border-fg grid grid-cols-1 gap-x-10 gap-y-3 border-t-2 pt-3 md:grid-cols-12 md:items-center">
      {nav ? <div className="min-w-0 md:col-span-7">{nav}</div> : null}
      <div className={nav ? "md:col-span-5" : "md:col-span-12"}>{search}</div>
    </div>
  );
}

/**
 * The three ways to order, explained once above the products (docs/CX_AUDIT_AND_PLAN.md §2.3):
 * available article, customizable product, custom production (outside the catalogue).
 */
export function OfferLegend({ dict, customHref }: { dict: Dictionary; customHref: string }) {
  const o = dict.cx.offer;
  const items: Array<{ type: OfferType | "custom"; hint: string; href?: string }> = [
    { type: "customizable", hint: o.customizableHint },
    { type: "standard", hint: o.standardHint },
    { type: "custom", hint: o.customHint, href: customHref },
  ];
  return (
    <section aria-label={o.legendLabel} className="bg-surface mt-6 rounded-[var(--radius-card)] px-4 py-4 sm:px-5">
      <ul className="grid gap-3 sm:grid-cols-3 sm:gap-6">
        {items.map((item) => (
          <li key={item.type} className="flex flex-col items-start gap-1.5">
            <OfferBadge type={item.type} labels={o} />
            <p className="text-fg-muted text-sm leading-snug">
              {item.hint}
              {item.href ? (
                <>
                  {" "}
                  <Link href={item.href} className="text-accent font-medium whitespace-nowrap underline underline-offset-2">
                    {o.customCardCta}
                  </Link>
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Offer-type filter and sort as plain links (shareable URLs, no JavaScript needed). */
function ListingControls({ dict, basePath, query, keep }: { dict: Dictionary; basePath: string; query: CatalogQuery; keep: Partial<CatalogQuery> }) {
  const o = dict.cx.offer;
  const types: Array<{ value: OfferType | undefined; label: string }> = [
    { value: undefined, label: o.filterAll },
    // Same order as the legend: customizable products first (most of the catalogue).
    ...[...OFFER_TYPES].reverse().map((value) => ({ value, label: o[value] })),
  ];
  const sortLabels: Record<CatalogSort, string> = { default: o.sortDefault, name: o.sortName };
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors",
      active ? "border-fg bg-fg text-bg font-semibold" : "border-line text-fg-muted hover:border-fg hover:text-fg",
    );
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <nav aria-label={o.filterLabel} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <ul className="flex gap-2">
          {types.map((type) => {
            const active = query.type === type.value;
            return (
              <li key={type.label}>
                <Link href={catalogHref(basePath, { ...keep, sort: query.sort, type: type.value })} aria-current={active ? "true" : undefined} className={chip(active)}>
                  {type.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <nav aria-label={o.sortLabel} className="flex items-center gap-3 text-sm">
        <span className="text-fg-subtle">{o.sortLabel}</span>
        <ul className="flex gap-3">
          {CATALOG_SORTS.map((sort) => {
            const active = (query.sort ?? "default") === sort;
            return (
              <li key={sort}>
                <Link
                  href={catalogHref(basePath, { ...keep, type: query.type, sort })}
                  aria-current={active ? "true" : undefined}
                  className={cn("inline-flex min-h-10 items-center underline-offset-[6px]", active ? "text-fg font-semibold underline decoration-2" : "text-fg-muted hover:text-fg hover:underline")}
                >
                  {sortLabels[sort]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/** Last tile of every listing: anything not in the catalogue is produced to order. */
function CustomProductionCard({ dict, href }: { dict: Dictionary; href: string }) {
  const o = dict.cx.offer;
  return (
    <Link
      href={href}
      className="group border-line hover:border-fg flex h-full min-h-56 flex-col justify-between rounded-[var(--radius-card)] border-2 border-dashed p-5 transition-colors"
    >
      <div>
        <OfferBadge type="custom" labels={o} />
        <p className="text-fg mt-4 text-base font-semibold leading-snug">{o.customCardTitle}</p>
        <p className="text-fg-muted mt-2 text-sm leading-relaxed">{o.customCardBody}</p>
      </div>
      <span className="text-accent mt-4 inline-flex items-center gap-1 text-sm font-semibold">
        {o.customCardCta}
        <ArrowIcon width={14} height={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
      </span>
    </Link>
  );
}

/**
 * Search form + offer legend + filter/sort + results + pagination. Reads searchParams
 * (request-time data), so callers render it inside <Suspense fallback={<ProductListingSkeleton />}>.
 */
export async function ProductListing({ locale, dict, basePath, searchParams, categories, fixedCategory, nav }: Props) {
  const query = parseCatalogQuery(await searchParams);

  const filterCategory = fixedCategory ?? (query.category ? categories.find((c) => c.slug === query.category) : undefined);
  const categoryIds = filterCategory
    ? [filterCategory.id, ...categories.filter((c) => c.parentId === filterCategory.id).map((c) => c.id)]
    : undefined;

  const [result, services] = await Promise.all([
    listProducts({ locale, categoryIds, query: query.q, offerType: query.type, sort: query.sort, page: query.page }),
    listServices(locale),
  ]);
  const production = services.find((s) => s.slugs.fr === PRINT_ON_DEMAND_SLUG);
  const customHref = production ? `${localizedPath(locale, { route: "service", slug: production.slug })}#demande` : quoteFormHref(locale);

  const isFiltered = Boolean(query.q || query.type || (!fixedCategory && filterCategory) || query.page > 1);
  const keep = { q: query.q, category: fixedCategory ? undefined : filterCategory?.slug };
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const labels = productCardLabels(dict);

  return (
    <div>
      {/* Filtered/sorted variants are not separate pages for search engines. */}
      {query.q || query.type || query.sort || (!fixedCategory && filterCategory) ? <meta name="robots" content="noindex, follow" /> : null}

      <FilterBar nav={nav} search={<CatalogSearchForm action={basePath} dict={dict} q={query.q} />} />

      <OfferLegend dict={dict} customHref={customHref} />
      <ListingControls dict={dict} basePath={basePath} query={query} keep={keep} />

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2" aria-live="polite">
        {query.q ? <h2 className="type-display text-fg text-xl">{format(dict.catalog.resultsFor, { q: query.q })}</h2> : <span />}
        {/* No "0 product(s)" line above the empty state. */}
        {result.total > 0 ? <p className="text-fg-muted text-sm">{format(dict.catalog.resultsCount, { count: result.total })}</p> : null}
      </div>

      {result.items.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {result.items.map((product) => (
            <li key={product.id} className="reveal">
              <ProductCard
                product={product}
                href={localizedPath(locale, { route: "product", slug: product.slug })}
                labels={labels}
                categoryName={fixedCategory ? null : product.categoryId ? categoryName.get(product.categoryId) : null}
              />
            </li>
          ))}
          {result.page === result.pageCount ? (
            <li className="col-span-2 sm:col-span-1">
              <CustomProductionCard dict={dict} href={customHref} />
            </li>
          ) : null}
        </ul>
      ) : (
        <CatalogEmptyState
          message={isFiltered ? dict.catalog.noResults : fixedCategory ? dict.catalog.emptyCategory : dict.catalog.emptyCatalog}
          hint={isFiltered ? dict.catalog.noResultsHint : undefined}
          action={{ href: customHref, label: dict.cx.offer.customCardCta }}
          secondary={
            fixedCategory || isFiltered
              ? { href: localizedPath(locale, { route: "catalog" }), label: dict.sections.allProducts }
              : { href: quoteFormHref(locale), label: dict.common.requestQuote }
          }
        />
      )}

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(page) => catalogHref(basePath, { ...keep, type: query.type, sort: query.sort, page })}
        dict={dict}
      />
    </div>
  );
}

export function ProductListingSkeleton({ nav }: { nav?: ReactNode }) {
  return (
    <div aria-busy="true">
      <FilterBar nav={nav} search={<Skeleton className="h-12 w-full" />} />
      <Skeleton className="mt-6 h-24 w-full sm:h-16" />
      <Skeleton className="mt-5 h-10 w-72" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full" />
        ))}
      </div>
    </div>
  );
}
