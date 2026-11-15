# Catalog — Audit and Implementation Plan (revised)

_Revised 2026-11-15 to apply the owner's clarification on the animated catalog. Read-only audit; no code changed._

## 0. Owner clarification (binding for this plan)

1. **Keep the animated catalog exactly as designed.** Its cards, drawings, motion, transitions, branding, typography and responsive behavior stay as they are. Nothing here redesigns it.
2. **Visual presentation is separate from product records.** The drawings are a *presentation layer*. Product records hold real data only.
3. **No fake business data.** No invented products, prices, stock levels or availability are shown as real. Sample rows stay in development only.
4. **Every drawing can be replaced by a real photo later** without changing the architecture. An uploaded photo always takes priority.
5. **The catalog is built on Supabase:** dynamic categories, products managed by administrators, and two product types: **standard** and **customizable (print on demand)**.
6. **When nothing is published, show a designed, animated empty state.** No fake inventory, no broken page.

---

## 1. What exists today

### 1.1 Presentation layer (keep as is)
| Piece | File | Notes |
|---|---|---|
| Product card with lift on hover, drawing rises on hover | `src/components/catalog/product-card.tsx` | Shows a photo if there is one; otherwise `ProductArt` |
| 8 product drawings (notebook, pen, book, binder, stapler, paper, print, supplies) | `src/components/illustrations/product-art.tsx` | Original SVGs in brand colors, ~1–2 KB each |
| Page scenes with motion (`anim-float`, `anim-print`, `anim-draw`, `anim-grow-x`) | `src/components/illustrations/scenes.tsx`, `index.tsx` | Catalog header uses `StationeryIllustration` |
| Scroll reveal `.reveal` (CSS scroll-driven, no JS), reduced-motion safe | `src/app/globals.css` | Used on catalog grid, homepage, services, portfolio |
| Product gallery with drawing fallback | `src/components/catalog/product-gallery.tsx`, `products/[product]/page.tsx:119` | |
| Print-on-demand mockup studio (11 SVG mockups, live design placement) | `src/components/print-on-demand/mockups.tsx`, `mockup-studio.tsx` | |

**Verdict:** the visual layer is already mostly decoupled from the data (photo → else drawing). It meets requirements 1–3 and 6. **Do not touch its markup, classes or motion.**

### 1.2 Data layer
| Area | State |
|---|---|
| `categories` | Supabase, tree via `parent_id`, fr/ar/en, `is_published`, `image_path` (column exists but **is never shown publicly**) |
| `products` | Supabase, fr/ar/en, `status` draft/published/archived, featured, SKU, specs (JSON), no prices, **no availability column** (correct for now) |
| `product_images` | Storage bucket `catalog`, alt text per language, primary image, width/height |
| Public reads | `src/features/catalog/queries.ts`: cookie-less client, `'use cache'` + `cacheTag('catalog')`, published-only |
| Admin | Product CRUD, image upload/primary/delete, categories CRUD, publish status, specs editor, featured toggle |
| Print on demand | **Not product records.** `mockup_products` is a fixed list of 11 keys enforced by a `CHECK` constraint; the studio is driven by code, not by the catalog |
| Initial catalog | `supabase/seed/initial_catalog.sql`: 3 categories, 5 products confirmed by MSLAB (names only). Replaced the former `exemple-*` sample rows on 2026-11-15 |

---

## 2. Findings against the clarification

| # | Requirement | Finding | Severity |
|---|---|---|---|
| F1 | 5, 7: separate visuals from records; swap for photos later | The drawing is chosen by **regular expressions on the French slug** (`productArtKind`). Renaming a slug can silently change the picture, and admins cannot choose it. The link between a record and its drawing is implicit. | High |
| F2 | 6: illustrative imagery clearly identified | A drawing in place of a photo is announced only to screen readers ("Image non disponible", `sr-only`). Sighted visitors cannot tell a drawing from a product photo. On the product page this matters most. | High |
| F3 | 10: animated empty state | When no product is published, `product-listing.tsx` shows a plain dashed box with text. The homepage hides the featured section (acceptable). There is no designed empty state. | High |
| F4 | 9: standard vs customizable types | `products` has no type. POD items live in a separate fixed list (`mockup_products`, `CHECK` on 11 keys) that is not linked to products, categories, specs or photos. Adding a new customizable item needs a migration and code. | High |
| F5 | 8: admin manages specs, photos, publishing | Works for standard products. Missing: product type, choice of drawing, image reordering, alt text required before publish, a "ready to publish" check, and POD configuration per product. | Medium |
| F6 | 8: dynamic categories | Categories are dynamic. Their `image_path` is never displayed, and there is no drawing fallback per category, so category pages cannot carry their own visual. | Low |
| F7 | 4: no fake data in production | Sample data is clearly labeled and dev-only. Nothing in the deploy path stops it being run in production by mistake. | Medium |
| F8 | General | `docs/DESIGN_SYSTEM.md` §11 and the catalog skill describe slug-based drawing selection; both need updating with the change. | Low |

No finding requires changing the look of the catalog.

---

## 3. Target architecture

### 3.1 Principle: two layers, one contract
```
Product record (Supabase, real data only)
  ├─ product_type: standard | customizable
  ├─ visual_key: which drawing to show when there is no photo (nullable → automatic)
  └─ product_images[]: real photos (always win)

Presentation (code, unchanged look)
  resolveProductVisual(record) →
     { kind: "photo", image }                       if a photo exists
     { kind: "illustration", key, label }           otherwise
```
A single resolver function decides what to show. Cards, gallery and studio call it. Replacing a drawing with a photo is a data change (upload) only.

### 3.2 Schema changes (one new migration, additive, no data loss)
```sql
create type public.product_type as enum ('standard', 'customizable');

alter table public.products
  add column product_type public.product_type not null default 'standard',
  -- Drawing used when there is no photo. Null = automatic (current slug rule, kept as fallback).
  add column visual_key text check (visual_key in (
    'notebook','pen','book','binder','stapler','paper','print','supplies')),
  -- Customizable products only: which studio mockup to use.
  add column mockup_key text references public.mockup_products (key),
  add constraint products_mockup_only_customizable
    check (product_type = 'customizable' or mockup_key is null);

-- Per-product customization settings (customizable products only).
create table public.product_customization (
  product_id uuid primary key references public.products (id) on delete cascade,
  allow_image boolean not null default true,
  allow_text boolean not null default true,
  colors text[] not null default '{}',          -- hex values MSLAB actually offers; empty = studio default
  min_quantity integer check (min_quantity > 0), -- null = not stated (never invented)
  production_option_ids uuid[] not null default '{}', -- links to existing production_options
  updated_at timestamptz not null default now()
);

alter table public.categories
  add column visual_key text check (visual_key in (...same list...));
```
- RLS: `product_customization` readable by anon only when the product is published; writable only by `private.is_admin()`. Same pattern as existing tables.
- `product_images` gets an index on `(product_id, sort_order)` if not present; add reorder support.
- **No price, stock or availability columns.** If MSLAB later defines a policy, add a nullable column that is hidden when empty.
- `mockup_products` stays (the list of drawings that exist in code). Products point to it; it no longer acts as the catalog.

### 3.3 Queries
- `ProductSummary` gains `type`, `visual` (resolved), `customization` (for customizable products on the detail page).
- `listProducts` gains an optional `type` filter (`?type=standard|customizable`) validated in `search-params.ts`.
- New `getCatalogState(locale)` → `{ publishedCount, categoryCount }` cached on `catalog`, to choose between the grid and the empty state.

### 3.4 Customizable products on the public site
- Product page for `customizable`: same layout and gallery. The CTA becomes "Personnaliser" and opens the existing studio pre-set to the product's `mockup_key`, colors and options (the existing `mockup-handoff.ts` already carries studio state to the request form).
- The standalone studio page keeps working; its product list comes from published customizable products when there are any, otherwise from the active `mockup_products` (current behavior). Nothing visual changes.

---

## 4. Implementation plan

Each step is a small PR on `feat/catalog-architecture`. Visual regression is checked at every step with the existing Playwright screenshots (`scripts/screenshots.mjs`) at 360/768/1280 px, fr + ar.

| Step | Work | Files | Done when |
|---|---|---|---|
| **1. Visual resolver** (F1) ✅ done 2026-11-15 — `visualKey` is `null` until step 2 adds the column | Add `resolveProductVisual()` + explicit `visual_key` support; keep `productArtKind` as the automatic fallback. Cards and gallery call the resolver. **No markup or class changes.** | `components/illustrations/product-art.tsx`, `features/catalog/visual.ts` (new), `product-card.tsx`, `product-gallery.tsx` | Screenshots identical before/after; unit test for resolver (photo wins, explicit key wins over slug, fallback) |
| **2. Migration** (F4, F6) | `product_type`, `visual_key`, `mockup_key`, `product_customization`, category `visual_key`, RLS + role checks, regenerate `database.types.ts` | `supabase/migrations/2026111x_catalog_types.sql`, `docs/DATABASE_SCHEMA.md` | Applied to **local/dev only**; SQL role tests pass (anon cannot read drafts or write) |
| **3. Illustration label** (F2) | Small visible caption on drawings: exactly "Illustration" (fr) / "رسم توضيحي" (ar) / "Illustration" (en), placed in the existing image area corner in the same style as current meta text. Same caption on cards and the product page; no extra wording such as "photo à venir" (owner decision, 2026-11-15). | `product-card.tsx`, `products/[product]/page.tsx`, 3 dictionaries | Caption visible, readable (contrast ≥ 4.5:1), RTL correct; disappears as soon as a photo exists |
| **4. Animated empty state** (F3) | `CatalogEmptyState` built only from existing pieces: `StationeryIllustration`/`ProductArt` drawings, `anim-float`/`anim-draw`, `.reveal`, card styles. Message from dictionaries + "Demander un devis" and "Personnaliser un produit" CTAs. Separate copy for "no results for this search" (keeps current text). Used on catalog, category pages and the type filter. | `components/catalog/empty-state.tsx` (new), `product-listing.tsx`, dictionaries | Shows when 0 published products; reduced-motion shows it static; no fake product names, prices or counts |
| **5. Queries + type filter** | Add `type`, `visual`, `getCatalogState`, `?type=` filter; customization data on detail query; cache tags unchanged | `features/catalog/queries.ts`, `search-params.ts`, `catalog-search-form.tsx` | Unpublished items never public; filter is crawl-safe (`noindex` when filtered, as today) |
| **6. Admin: product form** (F5) | Fields: product type, drawing choice (with live preview of the drawing), customizable panel (mockup, colors, image/text allowed, min quantity, production options). Image reordering. Publish check: French name, category, at least alt text for each photo; when publishing without a photo, show an info note (not a block): "Une illustration sera affichée". | `components/admin/product-form.tsx`, `image-upload-form.tsx`, `features/admin/content-actions.ts`, `content-schemas.ts` | Every action: `requireAdmin` → Zod → write → `updateTag`; E2E admin flow covers create → upload → publish → visible → unpublish |
| **7. Admin: categories** (F6) | Drawing choice + optional photo upload for a category; show it on category pages using existing header layout | `components/admin/category-form.tsx`, `catalog/[category]/page.tsx` | Photo wins over drawing, same as products |
| **8. Customizable product page** | CTA + studio handoff for `customizable` products, studio list from published customizable products with fallback | `products/[product]/page.tsx`, `mockup-studio.tsx`, `print-on-demand/queries.ts` | Customer request carries product id + chosen design settings; no visual change to the studio |
| **9. Production guard** (F7) | ✅ Superseded 2026-11-15: MSLAB confirmed the 5 products as its current catalog. Sample data removed; `supabase/seed/initial_catalog.sql` holds the real names only and is safe for production. | | |
| **10. Docs + tests** (F8) | Update `DESIGN_SYSTEM.md` §11, `DATABASE_SCHEMA.md`, catalog skill, `PRODUCTION_READINESS.md` (B3 becomes "content entry", not a blocker for launch since the empty state is production-ready) | docs, `tests/` | `npm run check` and E2E pass; screenshots attached in fr + ar |

**Order:** 1 → 2 → 3 and 4 (independent) → 5 → 6 → 7 and 8 (independent) → 9 → 10.

### What does not change
- Card, gallery, scene and studio markup, Tailwind classes, colors, fonts, motion timings, reveal behavior, RTL handling.
- No prices, stock or availability are introduced.
- No migration is applied to a remote Supabase project and nothing is deployed without the owner asking.

---

## 5. Decisions and open questions

**Decided by MSLAB (2026-11-15)**
- A product with no real photo is published with its illustration. A photo is not required to publish.
- The caption on illustrations is exactly **"Illustration"** (ar: "رسم توضيحي"). No "photo à venir" or similar wording.

**Still open**
1. Which colors and minimum quantities do you actually offer per customizable product? (Fields stay empty and hidden until you fill them.)
