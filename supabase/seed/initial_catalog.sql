-- ═══════════════════════════════════════════════════════════════════════════
-- MSLAB — INITIAL CATALOG (real content, confirmed by MSLAB on 2026-11-15)
-- ═══════════════════════════════════════════════════════════════════════════
-- The catalog MSLAB offers for the moment: 3 categories, 5 products.
-- Rules:
--   * Names only. No descriptions, SKUs, specifications, prices or availability until
--     MSLAB provides them in /admin/products (never invented here).
--   * No photos yet: the site shows each product's illustration, captioned "Illustration".
--   * Safe for development and production. Idempotent: fixed UUIDs + upsert, so running it
--     again restores these values (it also converts the former "(exemple)" sample rows,
--     which used the same UUIDs, in place).
-- Run once per environment (SQL editor or `psql -f`). Edits made later in the admin are
-- overwritten if this file is run again — run it only to set up an environment.

begin;

insert into public.categories (id, name_fr, name_ar, name_en, slug_fr, slug_ar, slug_en,
  description_fr, description_ar, description_en, sort_order, is_published)
values
  ('a0000000-0000-4000-8000-000000000001', 'Papeterie', 'قرطاسية', 'Stationery',
   'papeterie', 'papeterie', 'stationery', null, null, null, 10, true),
  ('a0000000-0000-4000-8000-000000000002', 'Fournitures de bureau', 'لوازم مكتبية', 'Office supplies',
   'fournitures-de-bureau', 'fournitures-de-bureau', 'office-supplies', null, null, null, 20, true),
  ('a0000000-0000-4000-8000-000000000003', 'Livres', 'كتب', 'Books',
   'livres', 'livres', 'books', null, null, null, 30, true)
on conflict (id) do update set
  name_fr = excluded.name_fr, name_ar = excluded.name_ar, name_en = excluded.name_en,
  slug_fr = excluded.slug_fr, slug_ar = excluded.slug_ar, slug_en = excluded.slug_en,
  description_fr = null, description_ar = null, description_en = null,
  sort_order = excluded.sort_order, is_published = excluded.is_published;

insert into public.products (id, category_id, name_fr, name_ar, name_en, slug_fr, slug_ar, slug_en,
  short_description_fr, short_description_ar, short_description_en,
  description_fr, description_ar, description_en, sku, specifications, status, is_featured, sort_order)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Cahier', 'دفتر', 'Notebook', 'cahier', 'cahier', 'notebook',
   null, null, null, null, null, null, null, '[]', 'published', true, 10),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Stylo', 'قلم', 'Pen', 'stylo', 'stylo', 'pen',
   null, null, null, null, null, null, null, '[]', 'published', true, 20),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002',
   'Classeur', 'ملف', 'Binder', 'classeur', 'classeur', 'binder',
   null, null, null, null, null, null, null, '[]', 'published', false, 10),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002',
   'Agrafeuse', 'دباسة', 'Stapler', 'agrafeuse', 'agrafeuse', 'stapler',
   null, null, null, null, null, null, null, '[]', 'published', false, 20),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003',
   'Livre', 'كتاب', 'Book', 'livre', 'livre', 'book',
   null, null, null, null, null, null, null, '[]', 'published', true, 10)
on conflict (id) do update set
  category_id = excluded.category_id,
  name_fr = excluded.name_fr, name_ar = excluded.name_ar, name_en = excluded.name_en,
  slug_fr = excluded.slug_fr, slug_ar = excluded.slug_ar, slug_en = excluded.slug_en,
  short_description_fr = null, short_description_ar = null, short_description_en = null,
  description_fr = null, description_ar = null, description_en = null,
  sku = null, specifications = '[]', status = excluded.status,
  is_featured = excluded.is_featured, sort_order = excluded.sort_order;

-- Former development-only draft (not a real product).
delete from public.products where id = 'b0000000-0000-4000-8000-000000000006';

commit;
