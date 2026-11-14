import { z } from "zod";

/**
 * Catalog URL state (?q=&category=&page=). Invalid values are dropped, never errors:
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
  page: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});

export type CatalogQuery = { q?: string; category?: string; page: number };

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseCatalogQuery(raw: RawSearchParams): CatalogQuery {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const parsed = schema.parse({ q: first(raw.q), category: first(raw.category), page: first(raw.page) });
  return { q: parsed.q || undefined, category: parsed.category, page: parsed.page ?? 1 };
}

/** Build a catalog URL keeping only meaningful params (page 1 is implicit). */
export function catalogHref(basePath: string, query: Partial<CatalogQuery>): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}
