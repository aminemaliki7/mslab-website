-- Corporate kits and tote bags printed with MSLAB's identity (owner request 2026-11-23), from blanks
-- supplied by the owner (design/catalogue-mockups/bases/). Catalogue only; Studio untouched.
-- Data only, idempotent: rows are changed only while they still hold the original photos.

begin;

-- Corporate kits (0009): the designed kit replaces the previous photo (another brand's logo).
update public.product_images
set storage_path = '/catalog/mockups/merchandise/corporate-kits/corporate-kits-set.webp',
    alt_fr = 'Kit d’entreprise aux couleurs de MSLAB : gourdes, T-shirt, mug, stylos, fanion et drapeau de table',
    alt_ar = 'طقم مؤسسي بألوان MSLAB: قنينات وقميص وكوب وأقلام وراية وعلم طاولة',
    alt_en = 'Corporate kit in MSLAB colours: bottles, T-shirt, mug, pens, hand flag and table flag',
    width = 1200, height = 1600
where storage_path = '/catalog/products/corporate-kits.webp';

-- Tote bags (0008): the designed tote becomes the main photo; the MSLAB event photo stays as a
-- second view.
update public.product_images
set is_primary = false, sort_order = 1
where storage_path = '/catalog/products/custom-tote-bags.webp' and is_primary;

insert into public.product_images (product_id, storage_path, alt_fr, alt_ar, alt_en, width, height, sort_order, is_primary)
select p.id, '/catalog/mockups/merchandise/tote-bags/tote-bags-canvas-print.webp',
  'Tote bag en toile naturelle sérigraphié du logo MSLAB',
  'حقيبة قماشية طبيعية مطبوعة بالشاشة الحريرية بشعار MSLAB',
  'Natural canvas tote bag screen printed with the MSLAB logo',
  832, 1248, 0, true
from public.products p
where p.id = 'd0000000-0000-4000-8000-000000000008'
  and not exists (select 1 from public.product_images i where i.product_id = p.id and i.is_primary)
on conflict (storage_path) do nothing;

commit;
