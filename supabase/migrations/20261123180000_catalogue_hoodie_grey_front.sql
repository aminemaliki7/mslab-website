-- Hoodies (0006): front view from the grey heather hoodie photo supplied by the owner on
-- 2026-11-23, centre-chest MSLAB print, transparent background. Data only, idempotent.

begin;

update public.product_images
set storage_path = '/catalog/mockups/apparel/hoodies/hoodies-front-print-cutout.webp',
    alt_fr = 'Sweat à capuche gris chiné imprimé du logo MSLAB sur la poitrine',
    alt_ar = 'سترة رمادية بقلنسوة مطبوع على صدرها شعار MSLAB',
    alt_en = 'Grey heather hoodie printed with the MSLAB logo on the chest',
    width = 1200, height = 900
where storage_path = '/catalog/mockups/apparel/hoodies/hoodies-front-embroidery-cutout.webp';

commit;

-- The black hoodie back view no longer matches the grey front: removed from the gallery (owner
-- request 2026-11-23). The image row only; the product keeps its front photo.
begin;

delete from public.product_images
where storage_path = '/catalog/mockups/apparel/hoodies/hoodies-back-print-cutout.webp';

commit;
