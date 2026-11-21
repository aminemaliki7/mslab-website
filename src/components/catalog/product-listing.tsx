import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/layout";
import { listProducts, type CategorySummary } from "@/features/catalog/queries";
import { catalogHref, parseCatalogQuery } from "@/features/catalog/search-params";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { localizedPath, quoteFormHref } from "@/i18n/routes";
import { CatalogSearchForm } from "./catalog-search-form";
import { CatalogEmptyState } from "./empty-state";
import { Pagination } from "./pagination";
import { ProductCard } from "./product-card";

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
 * Search form + results + pagination. Reads searchParams (request-time data), so callers
 * render it inside <Suspense fallback={<ProductListingSkeleton />}>.
 */
export async function ProductListing({ locale, dict, basePath, searchParams, categories, fixedCategory, nav }: Props) {
  const query = parseCatalogQuery(await searchParams);

  const filterCategory = fixedCategory ?? (query.category ? categories.find((c) => c.slug === query.category) : undefined);
  const categoryIds = filterCategory
    ? [filterCategory.id, ...categories.filter((c) => c.parentId === filterCategory.id).map((c) => c.id)]
    : undefined;

  const result = await listProducts({ locale, categoryIds, query: query.q, page: query.page });
  const isFiltered = Boolean(query.q || (!fixedCategory && filterCategory) || query.page > 1);
  const keep = { q: query.q, category: fixedCategory ? undefined : filterCategory?.slug };

  return (
    <div>
      {/* Filtered/paginated variants are not separate pages for search engines. */}
      {query.q || (!fixedCategory && filterCategory) ? <meta name="robots" content="noindex, follow" /> : null}

      <FilterBar nav={nav} search={<CatalogSearchForm action={basePath} dict={dict} q={query.q} />} />

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2" aria-live="polite">
        {query.q ? (
          <h2 className="type-display text-fg text-xl">{format(dict.catalog.resultsFor, { q: query.q })}</h2>
        ) : (
          <span />
        )}
        {/* No "0 product(s)" line above the empty state. */}
        {result.total > 0 ? <p className="text-fg-muted text-sm">{format(dict.catalog.resultsCount, { count: result.total })}</p> : null}
      </div>

      {result.items.length > 0 ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {result.items.map((product) => (
            <li key={product.id} className="reveal">
              <ProductCard
                product={product}
                href={localizedPath(locale, { route: "product", slug: product.slug })}
                labels={{ sku: dict.product.sku, noImage: dict.product.noImage, moq: dict.product.moqShort }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <CatalogEmptyState
          message={isFiltered ? dict.catalog.noResults : fixedCategory ? dict.catalog.emptyCategory : dict.catalog.emptyCatalog}
          hint={isFiltered ? dict.catalog.noResultsHint : undefined}
          action={{ href: quoteFormHref(locale), label: dict.common.requestQuote }}
          secondary={
            fixedCategory || isFiltered
              ? { href: localizedPath(locale, { route: "catalog" }), label: dict.sections.allProducts }
              : undefined
          }
        />
      )}

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(page) => catalogHref(basePath, { ...keep, page })}
        dict={dict}
      />
    </div>
  );
}

export function ProductListingSkeleton({ nav }: { nav?: ReactNode }) {
  return (
    <div aria-busy="true">
      <FilterBar nav={nav} search={<Skeleton className="h-12 w-full" />} />
      <Skeleton className="mt-8 h-5 w-32" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full" />
        ))}
      </div>
    </div>
  );
}
