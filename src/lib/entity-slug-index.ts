import { createClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/config";
import type { EntityRoute } from "@/i18n/routes";
import type { Database } from "./supabase/database.types";

/**
 * Slug index for proxy.ts: decides 200 / 308 / 404 for entity URLs BEFORE rendering starts.
 *
 * Why: with Cache Components the page shell is streamed first, so a request-time
 * `notFound()` / `permanentRedirect()` inside the page can only send `200` plus a
 * `noindex` tag or a client-side redirect (node_modules/next/dist/docs/01-app/02-guides/
 * streaming.md → "The HTTP contract"). Crawlers report those as soft 404s. Checking the slug
 * here returns a real HTTP status instead.
 *
 * In-memory per server instance, refreshed every TTL_MS; an unknown slug forces one early
 * refresh so a product published a moment ago is never 404ed. Any failure returns null
 * ("don't know") and the request falls through to the page, which still validates.
 */
type Slugs = { fr: string; ar: string | null; en: string | null };
type Index = Record<EntityRoute, Slugs[]>;

const TTL_MS = 5 * 60_000;
const MIN_REFRESH_MS = 5_000;

let cache: { at: number; index: Index } | null = null;
let inflight: Promise<Index | null> | null = null;

async function load(): Promise<Index | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  // Same visibility rules as the pages: published products/services, all categories (RLS applies).
  const [categories, products, services] = await Promise.all([
    db.from("categories").select("slug_fr, slug_ar, slug_en"),
    db.from("products").select("slug_fr, slug_ar, slug_en").eq("status", "published").limit(10000),
    db.from("services").select("slug_fr, slug_ar, slug_en").eq("status", "published"),
  ]);
  if (categories.error || products.error || services.error) return null;
  const toSlugs = (rows: { slug_fr: string; slug_ar: string | null; slug_en: string | null }[]): Slugs[] =>
    rows.map((r) => ({ fr: r.slug_fr, ar: r.slug_ar, en: r.slug_en }));
  return { category: toSlugs(categories.data), product: toSlugs(products.data), service: toSlugs(services.data) };
}

async function getIndex(forceIfOlderThan: number): Promise<Index | null> {
  const age = cache ? Date.now() - cache.at : Infinity;
  if (cache && age < forceIfOlderThan) return cache.index;
  inflight ??= load()
    .then((index) => {
      if (index) cache = { at: Date.now(), index };
      return index ?? cache?.index ?? null;
    })
    .catch(() => cache?.index ?? null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export type SlugVerdict = { kind: "ok" } | { kind: "redirect"; slug: string } | { kind: "missing" };

// Untranslated slugs fall back to French (same rule as i18n/localize.ts slugFor).
const canonicalSlug = (entity: Slugs, locale: Locale) => entity[locale] ?? entity.fr;

function judge(entities: Slugs[], locale: Locale, slug: string): SlugVerdict | null {
  // The locale's own slug wins over another entity's slug in another language.
  if (entities.some((e) => canonicalSlug(e, locale) === slug)) return { kind: "ok" };
  // Another language's slug (old link, language switcher before hydration): 308 to this locale's URL.
  const entity = entities.find((e) => e.fr === slug || e.ar === slug || e.en === slug);
  return entity ? { kind: "redirect", slug: canonicalSlug(entity, locale) } : null;
}

/** null = the index is unavailable: let the page decide. */
export async function checkEntitySlug(route: EntityRoute, locale: Locale, slug: string): Promise<SlugVerdict | null> {
  const index = await getIndex(TTL_MS);
  if (!index) return null;
  const verdict = judge(index[route], locale, slug);
  if (verdict) return verdict;
  // Not found: refresh once (content may have just been published) before answering 404.
  const fresh = await getIndex(MIN_REFRESH_MS);
  if (!fresh) return null;
  return judge(fresh[route], locale, slug) ?? { kind: "missing" };
}
