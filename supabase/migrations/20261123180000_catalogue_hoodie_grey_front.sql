-- Hoodies (0006): front view of the navy hoodie photo supplied by the owner on 2026-11-23.
-- Data only, idempotent.

begin;

update public.product_images
set storage_path = '/catalog/products/custom-hoodies-navy.jpg',
    alt_fr = 'Sweat à capuche bleu marine à capuche',
    alt_ar = 'سترة زرقاء داكنة بقلنسوة',
    alt_en = 'Navy blue hooded sweatshirt',
    width = 768, height = 1365
where product_id = 'd0000000-0000-4000-8000-000000000006';

commit;

-- The black hoodie back view no longer matches the grey front: removed from the gallery (owner
-- request 2026-11-23). The image row only; the product keeps its front photo.
begin;

delete from public.product_images
where storage_path = '/catalog/mockups/apparel/hoodies/hoodies-back-print-cutout.webp';

commit;
