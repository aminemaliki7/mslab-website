import { ArrowLink } from "@/components/ui/arrow-link";
import { Skeleton } from "@/components/ui/layout";
import { listProducts, type CategorySummary } from "@/features/catalog/queries";
import { catalogHref, parseCatalogQuery } from "@/features/catalog/search-params";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { localizedPath } from "@/i18n/routes";
import { CatalogSearchForm } from "./catalog-search-form";
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
};

/**
 * Search form + results + pagination. Reads searchParams (request-time data), so callers
 * render it inside <Suspense fallback={<ProductListingSkeleton />}>.
 */
export async function ProductListing({ locale, dict, basePath, searchParams, categories, fixedCategory }: Props) {
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

      <div className="bg-surface border-line rounded-[var(--radius-card)] border p-4 sm:p-5">
        <CatalogSearchForm
          action={basePath}
          dict={dict}
          q={query.q}
          categories={fixedCategory ? undefined : { options: categories, selected: filterCategory?.slug }}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2" aria-live="polite">
        {query.q ? (
          <h2 className="text-fg text-lg font-semibold">{format(dict.catalog.resultsFor, { q: query.q })}</h2>
        ) : (
          <span />
        )}
        <p className="text-fg-muted text-sm">{format(dict.catalog.resultsCount, { count: result.total })}</p>
      </div>

      {result.items.length > 0 ? (
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {result.items.map((product) => (
            <li key={product.id} className="reveal">
              <ProductCard
                product={product}
                href={localizedPath(locale, { route: "product", slug: product.slug })}
                labels={{ sku: dict.product.sku, noImage: dict.product.noImage }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-line mt-5 rounded-[var(--radius-card)] border border-dashed p-8">
          <p className="text-fg font-medium">{isFiltered ? dict.catalog.noResults : dict.catalog.emptyCatalog}</p>
          {isFiltered ? <p className="text-fg-muted mt-2 text-sm">{dict.catalog.noResultsHint}</p> : null}
          <ArrowLink href={localizedPath(locale, { route: "quote" })} className="mt-4">
            {dict.common.requestQuote}
          </ArrowLink>
        </div>
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

export function ProductListingSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-[5.5rem] w-full" />
      <Skeleton className="mt-8 h-5 w-32" />
      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full" />
        ))}
      </div>
    </div>
  );
}
