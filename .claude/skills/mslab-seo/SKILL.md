---
name: mslab-seo
description: MSLAB SEO — localized metadata with generateMetadata, canonical and hreflang alternates for fr/ar/en, sitemap.ts and robots.ts, Open Graph images, JSON-LD (Organization, LocalBusiness, Product, BreadcrumbList), indexing rules and Core Web Vitals. Use when adding or reviewing any public page, URL, metadata, structured data, or performance work.
---

# MSLAB SEO

## Objective
Make MSLAB discoverable in Moroccan search results in French, Arabic and English for its services and product categories, with clean multilingual signals and no duplicate content.

## When to use
Any new public route, metadata change, slug change, sitemap/robots, structured data, OG images, performance tuning.

## Technical guidelines

### Metadata (read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`)
- Root `[lang]` layout: `metadataBase` from `NEXT_PUBLIC_SITE_URL`, title template `%s | MSLAB`, default description from dictionary.
- Every page exports `generateMetadata` returning:
  - localized `title` (≤ 60 chars) and `description` (≤ 155 chars), unique per page
  - `alternates.canonical` (self, localized URL)
  - `alternates.languages`: `{ fr, ar, en, 'x-default': fr-url }` — only locales where the page exists
  - `openGraph` (`locale`: `fr_MA`, `ar_MA`, `en_US`; `alternateLocale`), `twitter` card
- Build all URLs with the shared `localizedPath` helper so canonical, hreflang, sitemap and links never diverge. Central helper: `src/lib/seo.ts` → `buildPageMetadata({ routeKey, params, title, description, image })`.
- Admin, search results with `q`, thank-you pages, and preview deployments: `robots: { index: false }`.

### Sitemap & robots
- `src/app/sitemap.ts`: all static pages × 3 locales + published categories/products (only locales with a translation), each entry with `alternates.languages`. Use `generateSitemaps` if products exceed ~10k.
- `src/app/robots.ts`: allow all on production; disallow `/admin`, `/api`; on non-production (`VERCEL_ENV !== 'production'`) disallow everything.

### Structured data (JSON-LD via `<script type="application/ld+json">`)
- `Organization` / `LocalBusiness` on home & contact — **only fields MSLAB has verified** (name, logo, url, address, telephone, openingHours, sameAs). Omit unknown fields; never placeholders.
- `Product` on product pages: name, description, image, brand, sku, category. No `offers`/price until pricing is defined; `aggregateRating`/`review` are forbidden unless real.
- `BreadcrumbList` on category and product pages.
- Serialize with `JSON.stringify` and escape `<` (`.replace(/</g, '\\u003c')`).

### OG images
- Static default OG image per locale (needs brand assets — `TODO(brand)`); optional dynamic product OG via `opengraph-image.tsx` + `ImageResponse` later. Arabic text in OG images needs an Arabic font loaded explicitly.

### Content & URLs
- One `<h1>` matching search intent; descriptive localized slugs; internal links between services ↔ categories ↔ products.
- Slug changes on published content require a 308 redirect (planned `slug_redirects` table).
- Avoid thin pages: categories with zero published products are `noindex` or hidden.

### Performance (Core Web Vitals)
- Static shell via Cache Components; catalog data `'use cache'`.
- `next/image` with `sizes`, `priority` only for the LCP image; `next/font`.
- Keep client JS minimal; the approved Google Tag Manager container (`GTM-MDTX63Q6`) loads on production only. Ensure analytics tags and privacy disclosures match the published container configuration.

## Workflow
1. Define route key and localized segments (`mslab-multilingual`).
2. Implement `generateMetadata` via `buildPageMetadata`.
3. Add to sitemap (static list or data source).
4. Add JSON-LD if applicable with verified data only.
5. Verify rendered `<head>`: title, description, canonical, 3 hreflang + x-default, OG.

## Quality requirements
- Lighthouse SEO = 100, Accessibility ≥ 95, Performance ≥ 90 (mobile) on home, category, product pages.
- No page indexable without canonical + hreflang.
- Google Rich Results test passes for Product/Breadcrumb.

## Security
- Never put PII in URLs, metadata or JSON-LD.
- Preview/staging must not be indexed.
