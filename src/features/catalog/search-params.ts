import { z } from "zod";
import { OFFER_TYPES, type OfferType } from "@/config/catalog-offers";

/** Sort orders offered on catalogue listings ("default" = MSLAB's own order). */
export const CATALOG_SORTS = ["default", "name"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

/**
 * Catalog URL state (?q=&category=&type=&sort=&page=). Invalid values are dropped, never errors:
 * shared or hand-edited links must always render something sensible.
 */
const schema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(120)
    .optional()
    .catch(undefined),
  type: z.enum(OFFER_TYPES).optional().catch(undefined),
  sort: z.enum(CATALOG_SORTS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});

export type CatalogQuery = { q?: string; category?: string; type?: OfferType; sort?: CatalogSort; page: number };

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseCatalogQuery(raw: RawSearchParams): CatalogQuery {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const parsed = schema.parse({
    q: first(raw.q),
    category: first(raw.category),
    type: first(raw.type),
    sort: first(raw.sort),
    page: first(raw.page),
  });
  return {
    q: parsed.q || undefined,
    category: parsed.category,
    type: parsed.type,
    sort: parsed.sort === "default" ? undefined : parsed.sort,
    page: parsed.page ?? 1,
  };
}

/** Build a catalog URL keeping only meaningful params (page 1 and the default sort are implicit). */
export function catalogHref(basePath: string, query: Partial<CatalogQuery>): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.type) params.set("type", query.type);
  if (query.sort && query.sort !== "default") params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}
