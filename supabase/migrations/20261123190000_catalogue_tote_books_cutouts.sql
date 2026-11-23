-- Tote bags (0008, main image) and books (0016) on transparent backgrounds (owner request
-- 2026-11-23): hand-traced silhouettes with a soft drop shadow, like the other catalogue cut-outs.
-- Data only, idempotent.

begin;

update public.product_images
set storage_path = '/catalog/mockups/merchandise/tote-bags/tote-bags-canvas-print-cutout.webp'
where storage_path = '/catalog/mockups/merchandise/tote-bags/tote-bags-canvas-print.webp';

update public.product_images
set storage_path = '/catalog/mockups/printed-materials/books/books-mslab-cover-cutout.webp',
    width = 736, height = 946
where storage_path = '/catalog/products/books.webp';

commit;
