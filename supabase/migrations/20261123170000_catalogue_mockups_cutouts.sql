-- Catalogue product images on transparent backgrounds (owner request 2026-11-23): the product
-- keeps its shadow and sits on the card tile / gallery colour instead of a white rectangle.
-- New file names (-cutout) so no cache serves the previous white-background images.
-- Data only, idempotent: only rows still pointing at the previous files change.

begin;

update public.product_images as pi
set storage_path = replace(pi.storage_path, '.webp', '-cutout.webp')
where pi.storage_path in (
  '/catalog/mockups/printing/business-cards/business-cards-front-back.webp',
  '/catalog/mockups/printing/stickers/stickers-round-diecut.webp',
  '/catalog/mockups/apparel/t-shirts/t-shirts-front-print.webp',
  '/catalog/mockups/apparel/hoodies/hoodies-front-embroidery.webp',
  '/catalog/mockups/apparel/hoodies/hoodies-back-print.webp',
  '/catalog/mockups/merchandise/mugs/mugs-wrap-print.webp',
  '/catalog/mockups/stationery/letterhead/letterhead-a4.webp',
  '/catalog/mockups/stationery/notebooks/notebooks-spiral-notepad.webp',
  '/catalog/mockups/printed-materials/flyers/flyers-a4-stack.webp',
  '/catalog/mockups/printed-materials/leaflets/leaflets-trifold.webp',
  '/catalog/mockups/printed-materials/brochures-catalogs/brochures-catalogs-cover.webp',
  '/catalog/mockups/packaging/mailer-boxes/mailer-boxes-kraft-print.webp',
  '/catalog/mockups/packaging/paper-bags/paper-bags-front.webp'
);

commit;
