-- Catalogue photos printed with MSLAB's own identity (owner request 2026-11-23).
--
-- The catalogue's blank product photos (/catalog/products/*.webp) are replaced, IN THE CATALOGUE
-- ONLY, by designed versions built by scripts/build-catalogue-mockups.mjs into
-- /catalog/mockups/<category>/<product>/*.webp. MSLAB Studio does not read product_images: its
-- blank templates (public/mockups/) are untouched.
--
-- Data only, idempotent: a row is updated only while it still points at the original blank, so
-- a photo replaced in /admin is never overwritten. The Flyers product gets its first photo.

begin;

update public.product_images as pi
set storage_path = v.new_path, alt_fr = v.alt_fr, alt_ar = v.alt_ar, alt_en = v.alt_en, width = 1200, height = 900
from (values
  ('/catalog/products/business-cards.webp', '/catalog/mockups/printing/business-cards/business-cards-front-back.webp',
   'Cartes de visite MSLAB : recto bleu canard au logo blanc, verso avec les coordonnées',
   'بطاقات زيارة MSLAB: الوجه الأمامي أزرق بالشعار الأبيض، والخلفي بمعلومات الاتصال',
   'MSLAB business cards: teal front with the white logo, back with contact details'),
  ('/catalog/products/stickers.webp', '/catalog/mockups/printing/stickers/stickers-round-diecut.webp',
   'Sticker rond découpé à la forme, aux couleurs de MSLAB',
   'ملصق دائري مقصوص على الشكل بألوان MSLAB',
   'Round die-cut sticker in MSLAB colours'),
  ('/catalog/products/custom-t-shirts.webp', '/catalog/mockups/apparel/t-shirts/t-shirts-front-print.webp',
   'T-shirt blanc imprimé en sérigraphie : logo MSLAB et « Votre idée. Votre design. Notre production. »',
   'قميص أبيض مطبوع بالشاشة الحريرية: شعار MSLAB وعبارة «فكرتكم. تصميمكم. إنتاجنا.»',
   'White T-shirt screen printed with the MSLAB logo and “Your idea. Your design. Our production.”'),
  ('/catalog/products/custom-hoodies.webp', '/catalog/mockups/apparel/hoodies/hoodies-front-embroidery.webp',
   'Sweat à capuche noir, logo MSLAB brodé côté cœur',
   'سترة سوداء بقلنسوة، شعار MSLAB مطرز على الصدر',
   'Black hoodie with the MSLAB logo embroidered on the left chest'),
  ('/catalog/products/custom-hoodies-back.webp', '/catalog/mockups/apparel/hoodies/hoodies-back-print.webp',
   'Sweat à capuche noir, vue de dos : grand marquage MSLAB',
   'سترة سوداء بقلنسوة من الخلف: طباعة كبيرة لـMSLAB',
   'Black hoodie, back view: large MSLAB print'),
  ('/catalog/products/custom-mugs.webp', '/catalog/mockups/merchandise/mugs/mugs-wrap-print.webp',
   'Mug blanc imprimé : logo MSLAB et « Votre idée. Votre design. Notre production. »',
   'كوب أبيض مطبوع: شعار MSLAB وعبارة «فكرتكم. تصميمكم. إنتاجنا.»',
   'White mug printed with the MSLAB logo and “Your idea. Your design. Our production.”'),
  ('/catalog/products/letterhead.webp', '/catalog/mockups/stationery/letterhead/letterhead-a4.webp',
   'Papier à en-tête A4 MSLAB avec un exemple de lettre',
   'ورق رسائل A4 بترويسة MSLAB مع نموذج رسالة',
   'MSLAB A4 letterhead with a sample letter'),
  ('/catalog/products/custom-notebooks.webp', '/catalog/mockups/stationery/notebooks/notebooks-spiral-notepad.webp',
   'Bloc-notes à spirale aux couleurs de MSLAB',
   'دفتر ملاحظات حلزوني بألوان MSLAB',
   'Spiral notepad in MSLAB colours'),
  ('/catalog/products/leaflets.webp', '/catalog/mockups/printed-materials/leaflets/leaflets-trifold.webp',
   'Dépliant trois volets MSLAB ouvert : lignes de production, étapes d’une commande et couverture',
   'مطوية MSLAB بثلاث طيات مفتوحة: خطوط الإنتاج ومراحل الطلب والغلاف',
   'Open MSLAB tri-fold leaflet: production lines, order steps and cover'),
  ('/catalog/products/brochures-catalogs.webp', '/catalog/mockups/printed-materials/brochures-catalogs/brochures-catalogs-cover.webp',
   'Brochures agrafées : couverture du catalogue de production MSLAB',
   'كتيبات مدبّسة: غلاف كتالوج إنتاج MSLAB',
   'Stapled brochures: MSLAB production catalogue cover'),
  ('/catalog/products/custom-mailer-boxes.webp', '/catalog/mockups/packaging/mailer-boxes/mailer-boxes-kraft-print.webp',
   'Boîte d’expédition kraft imprimée en une couleur avec le logo MSLAB',
   'علبة شحن من الكرتون مطبوعة بلون واحد بشعار MSLAB',
   'Kraft mailer box printed in one colour with the MSLAB logo'),
  ('/catalog/products/custom-paper-bags.webp', '/catalog/mockups/packaging/paper-bags/paper-bags-front.webp',
   'Sac en papier blanc aux couleurs de MSLAB',
   'كيس ورقي أبيض بألوان MSLAB',
   'White paper bag in MSLAB colours')
) as v(old_path, new_path, alt_fr, alt_ar, alt_en)
where pi.storage_path = v.old_path;

-- Flyers (product 0013) had no photo: add it as its primary image, only if it still has none.
insert into public.product_images (product_id, storage_path, alt_fr, alt_ar, alt_en, width, height, sort_order, is_primary)
select p.id, '/catalog/mockups/printed-materials/flyers/flyers-a4-stack.webp',
  'Pile de flyers A4 MSLAB : promesse, lignes de production et contact',
  'رزمة من المنشورات الإعلانية A4 لـMSLAB: الوعد وخطوط الإنتاج ومعلومات الاتصال',
  'Stack of MSLAB A4 flyers: promise, production lines and contact',
  1200, 900, 0, true
from public.products p
where p.id = 'd0000000-0000-4000-8000-000000000013'
  and not exists (select 1 from public.product_images i where i.product_id = p.id)
on conflict (storage_path) do nothing;

commit;
