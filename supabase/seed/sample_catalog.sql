-- ═══════════════════════════════════════════════════════════════════════════
-- MSLAB — SAMPLE DATA FOR DEVELOPMENT ONLY. NEVER RUN AGAINST PRODUCTION.
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: give the catalog/services pages realistic shapes during development.
-- Rules:
--   * Every row is visibly labeled "(exemple)" / "(sample)" / "(مثال)" and every slug
--     starts with "exemple-" so it can never be mistaken for real MSLAB content.
--   * No company information (site_settings stays empty), no prices, no stock levels,
--     no client names, no statistics.
--   * Remove with supabase/seed/remove_sample_catalog.sql.
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING.

insert into public.categories (id, name_fr, name_ar, name_en, slug_fr, slug_ar, slug_en, description_fr, description_ar, description_en, sort_order)
values
  ('a0000000-0000-4000-8000-000000000001', 'Papeterie (exemple)', 'قرطاسية (مثال)', 'Stationery (sample)',
   'exemple-papeterie', 'exemple-papeterie', 'exemple-stationery',
   'Catégorie d''exemple pour le développement.', 'فئة تجريبية للتطوير.', 'Sample category for development.', 10),
  ('a0000000-0000-4000-8000-000000000002', 'Fournitures de bureau (exemple)', 'لوازم مكتبية (مثال)', 'Office supplies (sample)',
   'exemple-fournitures-bureau', 'exemple-fournitures-bureau', 'exemple-office-supplies',
   'Catégorie d''exemple pour le développement.', 'فئة تجريبية للتطوير.', 'Sample category for development.', 20),
  ('a0000000-0000-4000-8000-000000000003', 'Livres (exemple)', 'كتب (مثال)', 'Books (sample)',
   'exemple-livres', 'exemple-livres', 'exemple-books',
   'Catégorie d''exemple pour le développement.', 'فئة تجريبية للتطوير.', 'Sample category for development.', 30)
on conflict (id) do nothing;

insert into public.products (id, category_id, name_fr, name_ar, name_en, slug_fr, slug_ar, slug_en,
  short_description_fr, short_description_ar, short_description_en, sku, specifications, status, is_featured, sort_order)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Cahier (exemple)', 'دفتر (مثال)', 'Notebook (sample)',
   'exemple-cahier', 'exemple-cahier', 'exemple-notebook',
   'Produit d''exemple — contenu fictif pour le développement.', 'منتج تجريبي — محتوى وهمي للتطوير.', 'Sample product — placeholder content for development.',
   'EX-0001',
   '[{"label":{"fr":"Format","ar":"المقاس","en":"Size"},"value":{"fr":"A4 (exemple)","ar":"A4 (مثال)","en":"A4 (sample)"}}]',
   'published', true, 10),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Stylo (exemple)', 'قلم (مثال)', 'Pen (sample)',
   'exemple-stylo', 'exemple-stylo', 'exemple-pen',
   'Produit d''exemple — contenu fictif pour le développement.', 'منتج تجريبي — محتوى وهمي للتطوير.', 'Sample product — placeholder content for development.',
   'EX-0002', '[]', 'published', true, 20),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002',
   'Classeur (exemple)', 'ملف (مثال)', 'Binder (sample)',
   'exemple-classeur', 'exemple-classeur', 'exemple-binder',
   'Produit d''exemple — contenu fictif pour le développement.', 'منتج تجريبي — محتوى وهمي للتطوير.', 'Sample product — placeholder content for development.',
   'EX-0003', '[]', 'published', false, 10),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002',
   'Agrafeuse (exemple)', null, 'Stapler (sample)',
   'exemple-agrafeuse', null, 'exemple-stapler',
   'Produit d''exemple sans traduction arabe (teste le repli vers le français).', null, 'Sample product without Arabic translation (tests French fallback).',
   'EX-0004', '[]', 'published', false, 20),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003',
   'Livre (exemple)', 'كتاب (مثال)', 'Book (sample)',
   'exemple-livre', 'exemple-livre', 'exemple-book',
   'Produit d''exemple — contenu fictif pour le développement.', 'منتج تجريبي — محتوى وهمي للتطوير.', 'Sample product — placeholder content for development.',
   'EX-0005', '[]', 'published', true, 10),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003',
   'Produit brouillon (exemple)', null, null,
   'exemple-brouillon', null, null,
   'Brouillon d''exemple — ne doit jamais apparaître publiquement.', null, null,
   'EX-0006', '[]', 'draft', false, 20)
on conflict (id) do nothing;

insert into public.services (id, name_fr, name_ar, name_en, slug_fr, slug_ar, slug_en, summary_fr, summary_ar, summary_en, status, is_featured, sort_order)
values
  ('c0000000-0000-4000-8000-000000000001', 'Service d''impression (exemple)', 'خدمة طباعة (مثال)', 'Printing service (sample)',
   'exemple-impression', 'exemple-impression', 'exemple-printing',
   'Service d''exemple — le contenu réel sera fourni par MSLAB.', 'خدمة تجريبية — سيوفر MSLAB المحتوى الفعلي.', 'Sample service — real content will be provided by MSLAB.',
   'published', true, 10),
  ('c0000000-0000-4000-8000-000000000002', 'Service aux entreprises (exemple)', 'خدمة للشركات (مثال)', 'Business service (sample)',
   'exemple-entreprises', 'exemple-entreprises', 'exemple-business',
   'Service d''exemple — le contenu réel sera fourni par MSLAB.', 'خدمة تجريبية — سيوفر MSLAB المحتوى الفعلي.', 'Sample service — real content will be provided by MSLAB.',
   'published', false, 20)
on conflict (id) do nothing;
