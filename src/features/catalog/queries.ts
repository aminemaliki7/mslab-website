import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/config";
import { pick, slugFor } from "@/i18n/localize";
import type { Tables } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";
import { catalogImageUrl } from "@/lib/supabase/storage";

/** Cache tags — admin mutations call updateTag() with these (Milestone 6). */
export const CATALOG_TAG = "catalog";
export const productTag = (id: string) => `product:${id}`;
export const categoryTag = (id: string) => `category:${id}`;

export const PAGE_SIZE = 24;

type CategoryRow = Tables<"categories">;
type ProductRow = Tables<"products">;
type ImageRow = Tables<"product_images">;

export type CategorySummary = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  slugs: { fr: string; ar: string | null; en: string | null };
  description: string | null;
  imageUrl: string | null;
};

export type ProductImage = { url: string; alt: string; width: number | null; height: number | null };

export type ProductSpec = { label: string; value: string };

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  /** Stable identifier (picks the drawing shown when there is no photo). */
  slugFr: string;
  sku: string | null;
  shortDescription: string | null;
  categoryId: string | null;
  isFeatured: boolean;
  image: ProductImage | null;
};

export type ProductDetail = ProductSummary & {
  slugs: { fr: string; ar: string | null; en: string | null };
  description: string | null;
  specifications: ProductSpec[];
  images: ProductImage[];
  category: CategorySummary | null;
  updatedAt: string;
};

const CATEGORY_COLUMNS =
  "id, parent_id, name_fr, name_ar, name_en, slug_fr, slug_ar, slug_en, description_fr, description_ar, description_en, image_path, sort_order";
const PRODUCT_SUMMARY_COLUMNS =
  "id, name_fr, name_ar, name_en, slug_fr, slug_ar, slug_en, sku, short_description_fr, short_description_ar, short_description_en, category_id, is_featured, sort_order, " +
  "product_images(storage_path, alt_fr, alt_ar, alt_en, width, height, is_primary, sort_order)";

function toCategory(row: Pick<CategoryRow, "id" | "parent_id" | "name_fr" | "name_ar" | "name_en" | "slug_fr" | "slug_ar" | "slug_en" | "description_fr" | "description_ar" | "description_en" | "image_path">, locale: Locale): CategorySummary {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: pick(row, "name", locale) ?? row.name_fr,
    slug: slugFor(row, locale),
    slugs: { fr: row.slug_fr, ar: row.slug_ar, en: row.slug_en },
    description: pick(row, "description", locale),
    imageUrl: row.image_path ? catalogImageUrl(row.image_path) : null,
  };
}

type ImagePick = Pick<ImageRow, "storage_path" | "alt_fr" | "alt_ar" | "alt_en" | "width" | "height" | "is_primary" | "sort_order">;

function toImage(image: ImagePick, locale: Locale, fallbackAlt: string): ProductImage {
  return {
    url: catalogImageUrl(image.storage_path),
    alt: pick(image, "alt", locale) ?? fallbackAlt,
    width: image.width,
    height: image.height,
  };
}

function sortImages(images: ImagePick[]): ImagePick[] {
  return [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
}

type ProductSummaryRow = Pick<ProductRow, "id" | "name_fr" | "name_ar" | "name_en" | "slug_fr" | "slug_ar" | "slug_en" | "sku" | "short_description_fr" | "short_description_ar" | "short_description_en" | "category_id" | "is_featured"> & {
  product_images: ImagePick[];
};

function toProductSummary(row: ProductSummaryRow, locale: Locale): ProductSummary {
  const name = pick(row, "name", locale) ?? row.name_fr;
  const [first] = sortImages(row.product_images ?? []);
  return {
    id: row.id,
    name,
    slug: slugFor(row, locale),
    slugFr: row.slug_fr,
    sku: row.sku,
    shortDescription: pick(row, "short_description", locale),
    categoryId: row.category_id,
    isFeatured: row.is_featured,
    image: first ? toImage(first, locale, name) : null,
  };
}

function parseSpecs(value: unknown, locale: Locale): ProductSpec[] {
  if (!Array.isArray(value)) return [];
  const specs: ProductSpec[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const { label, value: v } = entry as { label?: Record<string, string>; value?: Record<string, string> };
    const l = label?.[locale] || label?.fr;
    const val = v?.[locale] || v?.fr;
    if (l && val) specs.push({ label: l, value: val });
  }
  return specs;
}

// ─── Queries ────────────────────────────────────────────────────────────────

/** Published categories (RLS hides unpublished), ordered for navigation. */
export async function listCategories(locale: Locale): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .order("sort_order")
    .order("name_fr");
  if (error) throw new Error(`[catalog] listCategories: ${error.code}`);
  return data.map((row) => toCategory(row, locale));
}

export async function getCategoryBySlug(locale: Locale, slug: string): Promise<CategorySummary | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const column = locale === "fr" ? "slug_fr" : locale === "ar" ? "slug_ar" : "slug_en";
  const client = createPublicClient();
  let { data, error } = await client.from("categories").select(CATEGORY_COLUMNS).eq(column, slug).maybeSingle();
  if (!error && !data && locale !== "fr") {
    // Untranslated category: reachable through its French slug.
    ({ data, error } = await client.from("categories").select(CATEGORY_COLUMNS).eq("slug_fr", slug).maybeSingle());
  }
  if (error) throw new Error(`[catalog] getCategoryBySlug: ${error.code}`);
  return data ? toCategory(data, locale) : null;
}

export type ProductListParams = {
  locale: Locale;
  /** Restrict to these categories (a parent category passes itself + its children). */
  categoryIds?: string[];
  query?: string;
  page?: number;
};

export type ProductListResult = { items: ProductSummary[]; total: number; page: number; pageCount: number };

/** Published products with optional category filter, text search and pagination. */
export async function listProducts({ locale, categoryIds, query, page = 1 }: ProductListParams): Promise<ProductListResult> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const safePage = Math.max(1, Math.floor(page));
  const from = (safePage - 1) * PAGE_SIZE;

  let request = createPublicClient()
    .from("products")
    .select(PRODUCT_SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "published");
  if (categoryIds && categoryIds.length > 0) request = request.in("category_id", categoryIds);
  const term = query?.trim().toLowerCase().slice(0, 100);
  if (term) {
    // Escape LIKE wildcards; search_text is lower-cased and trigram-indexed.
    const escaped = term.replace(/[\\%_]/g, (c) => `\\${c}`);
    request = request.ilike("search_text", `%${escaped}%`);
  }

  const { data, error, count } = await request
    .order("sort_order")
    .order("published_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  // PGRST103 = page beyond the last result (e.g. stale ?page= link): show an empty page, not an error.
  if (error?.code === "PGRST103") return { items: [], total: 0, page: safePage, pageCount: 1 };
  if (error) throw new Error(`[catalog] listProducts: ${error.code}`);

  const total = count ?? 0;
  return {
    items: (data as unknown as ProductSummaryRow[]).map((row) => toProductSummary(row, locale)),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function listFeaturedProducts(locale: Locale, limit = 8): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SUMMARY_COLUMNS)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("sort_order")
    .limit(limit);
  if (error) throw new Error(`[catalog] listFeaturedProducts: ${error.code}`);
  return (data as unknown as ProductSummaryRow[]).map((row) => toProductSummary(row, locale));
}

export async function getProductBySlug(locale: Locale, slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const columns =
    "id, name_fr, name_ar, name_en, slug_fr, slug_ar, slug_en, sku, short_description_fr, short_description_ar, short_description_en, " +
    "description_fr, description_ar, description_en, specifications, category_id, is_featured, updated_at, " +
    `product_images(storage_path, alt_fr, alt_ar, alt_en, width, height, is_primary, sort_order), categories(${CATEGORY_COLUMNS})`;
  const column = locale === "fr" ? "slug_fr" : locale === "ar" ? "slug_ar" : "slug_en";
  const client = createPublicClient();

  let { data, error } = await client.from("products").select(columns).eq("status", "published").eq(column, slug).maybeSingle();
  if (!error && !data && locale !== "fr") {
    ({ data, error } = await client.from("products").select(columns).eq("status", "published").eq("slug_fr", slug).maybeSingle());
  }
  if (error) throw new Error(`[catalog] getProductBySlug: ${error.code}`);
  if (!data) return null;

  const row = data as unknown as ProductSummaryRow &
    Pick<ProductRow, "description_fr" | "description_ar" | "description_en" | "specifications" | "updated_at"> & {
      categories: CategoryRow | null;
    };
  cacheTag(productTag(row.id));
  const summary = toProductSummary(row, locale);
  return {
    ...summary,
    slugs: { fr: row.slug_fr, ar: row.slug_ar, en: row.slug_en },
    description: pick(row, "description", locale),
    specifications: parseSpecs(row.specifications, locale),
    images: sortImages(row.product_images ?? []).map((image) => toImage(image, locale, summary.name)),
    category: row.categories ? toCategory(row.categories, locale) : null,
    updatedAt: row.updated_at,
  };
}

/** Other published products from the same category. */
export async function listRelatedProducts(locale: Locale, productId: string, categoryId: string | null, limit = 4) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  if (!categoryId) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SUMMARY_COLUMNS)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("id", productId)
    .order("sort_order")
    .limit(limit);
  if (error) throw new Error(`[catalog] listRelatedProducts: ${error.code}`);
  return (data as unknown as ProductSummaryRow[]).map((row) => toProductSummary(row, locale));
}

/** Published products by id (quote page prefill, quote list validation, notification emails). */
export async function getProductsByIds(locale: Locale, ids: string[]): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const unique = [...new Set(ids)].slice(0, 50);
  if (unique.length === 0) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SUMMARY_COLUMNS)
    .eq("status", "published")
    .in("id", unique);
  if (error) throw new Error(`[catalog] getProductsByIds: ${error.code}`);
  return (data as unknown as ProductSummaryRow[]).map((row) => toProductSummary(row, locale));
}

export type SitemapEntity = {
  kind: "category" | "product" | "service";
  slugs: { fr: string; ar: string | null; en: string | null };
  updatedAt: string;
};

/** Every published category/product/service with its per-locale slugs (sitemap.xml). */
export async function listSitemapEntities(): Promise<SitemapEntity[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG, "services");

  const db = createPublicClient();
  const [categories, products, services] = await Promise.all([
    db.from("categories").select("slug_fr, slug_ar, slug_en, updated_at"),
    db.from("products").select("slug_fr, slug_ar, slug_en, updated_at").eq("status", "published").limit(10000),
    db.from("services").select("slug_fr, slug_ar, slug_en, updated_at").eq("status", "published"),
  ]);
  const error = categories.error ?? products.error ?? services.error;
  if (error) throw new Error(`[sitemap] ${error.code}`);

  const map = (kind: SitemapEntity["kind"]) => (row: { slug_fr: string; slug_ar: string | null; slug_en: string | null; updated_at: string }) => ({
    kind,
    slugs: { fr: row.slug_fr, ar: row.slug_ar, en: row.slug_en },
    updatedAt: row.updated_at,
  });
  return [
    ...(categories.data ?? []).map(map("category")),
    ...(products.data ?? []).map(map("product")),
    ...(services.data ?? []).map(map("service")),
  ];
}
