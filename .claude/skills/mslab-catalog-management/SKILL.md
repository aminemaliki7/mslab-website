---
name: mslab-catalog-management
description: MSLAB product catalog — categories, products, translations, images, availability, search and filtering, public catalog pages and admin CRUD. Use when working on anything under features/catalog, catalog routes, product/category admin screens, product images, or catalog caching.
---

# MSLAB Catalog Management

## Objective
A multilingual product catalog (printing, office supplies & stationery, books) that lets B2B buyers find items and **request a quote**, and lets MSLAB staff manage it without a developer.

## When to use
- Public pages: catalog index, category page, product page, search/filter.
- Admin: product and category CRUD, image upload/order, publish/unpublish, availability.
- Catalog data access, caching, or schema changes.

## Domain model (see `docs/DATABASE_SCHEMA.md`)
- `categories` (tree via `parent_id`, max depth 2 recommended) + `category_translations` (per locale: name, slug, description, SEO fields).
- `products` (category, SKU?, brand?, availability, published/featured flags) + `product_translations` (name, slug, descriptions, specifications, SEO).
- `product_images` (+ per-locale alt text) stored in Supabase Storage bucket `catalog`.
- Availability enum: `in_stock | on_order | out_of_stock | discontinued`. **No prices** until MSLAB defines a pricing policy.
- A product/category is publicly visible only if `is_published = true` **and** it has a translation for the requested locale (fallback policy is an open question — default: show French content with a notice, never an empty page).

## Technical guidelines

### Reads (public)
- `src/features/catalog/queries.ts`, `import 'server-only'`.
- Use the **cookie-less public Supabase client** so functions can be cached:
  ```ts
  export async function getCategoryBySlug(locale: Locale, slug: string) {
    'use cache'
    cacheLife('hours')
    cacheTag('catalog')
    // query category_translations by (locale, slug) …
  }
  ```
  Tag granularly too: `cacheTag('catalog', `category:${id}`)`, `product:${id}`.
- Pass `locale` explicitly into cached functions (root params can be read in the caller with `lang()`).
- Select only needed columns; paginate (`range`) — default 24 per page.
- Product pages: `generateStaticParams` for published products is optional; with Cache Components, cached data + `generateStaticParams` per locale gives a static shell.

### Search & filtering
- State lives in the URL (`?q=&category=&availability=&page=`) so results are shareable and crawlable for category pages; the search results page itself is `noindex`.
- Validate `searchParams` with Zod; unknown values are ignored, not errors.
- Postgres: `pg_trgm` GIN index on translated names for fuzzy/partial match (works for Arabic and French), plus `tsvector` (`simple` config) for description search. Use an RPC `search_products(locale, q, category_id, availability, limit, offset)` returning only published rows.

### Writes (admin)
- `src/features/catalog/actions.ts`, `'use server'`. Each action: `requireAdmin()` → Zod parse → write via the **session-bound** server client (RLS enforces admin) → `updateTag('catalog')` and the specific tag → return typed result.
- Slugs: generated from the name per locale (lowercase, ASCII-folded for fr/en; for `ar` admins provide a Latin slug — open question), unique per `(locale, slug)`; editable; changing a published slug should create a redirect entry (Phase 4: `slug_redirects`).
- Deleting a category with products is blocked (`ON DELETE RESTRICT`); offer "move products" first.
- Prefer **unpublish** over delete for products that have appeared in quotes.

### Images
- Upload: admin-only server action, or signed upload URL created server-side after `requireAdmin()`.
- Validate: `image/jpeg|png|webp|avif`, ≤ 5 MB, dimensions read server-side; path `products/<productId>/<uuid>.<ext>` (never user-supplied filenames).
- Store `width`/`height` for `next/image`; one `is_primary` per product (partial unique index).
- Delete storage object when the DB row is deleted (in the same action; log failures).

## Workflow
1. Confirm schema supports the change; if not, write a migration (see `mslab-supabase`).
2. Update Zod schemas in `features/catalog/schema.ts`.
3. Implement query/action with caching + tags.
4. Build UI (see `mslab-ui-design`), include empty, loading, error states.
5. Add dictionary keys for all three locales.
6. Verify: unpublished items never appear publicly; cache invalidates after admin edit.

## Quality requirements
- Category and product pages have localized metadata, breadcrumbs and canonical URLs (see `mslab-seo`).
- Every product card links to its page and has a "Request a quote" CTA prefilled with the product.
- No N+1 queries: fetch primary image with the product list in one query.

## Security
- RLS: anon can `select` only published rows and their translations/images; only `is_admin()` can write.
- Never trust `is_published` or IDs from the client for authorization.
- Never expose `created_by` or internal notes publicly.
