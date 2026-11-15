-- ═══════════════════════════════════════════════════════════════════════════
-- MSLAB — REAL SERVICES CONTENT (provided by the owner on 2026-11-14)
-- Safe for production: verified company content, not sample data.
-- French = owner's text (source). Arabic and English = translations of that exact text,
-- to be reviewed by a native speaker before launch (they can be edited in /admin/services).
-- Idempotent: upsert on slug_fr.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.services (
  name_fr, name_ar, name_en,
  slug_fr, slug_ar, slug_en,
  summary_fr, summary_ar, summary_en,
  status, is_featured, sort_order
) values
  (
    'Impression & reprographie', 'الطباعة والاستنساخ', 'Printing & reprographics',
    'impression-reprographie', null, 'printing-reprographics',
    'Des solutions d''impression et de reproduction de documents adaptées à vos besoins.',
    'حلول لطباعة الوثائق ونسخها، ملائمة لاحتياجاتكم.',
    'Printing and document reproduction solutions tailored to your needs.',
    'published', true, 10
  ),
  (
    'Fournitures de bureau', 'اللوازم المكتبية', 'Office supplies',
    'fournitures-de-bureau', null, 'office-supplies',
    'Une sélection d''articles et de consommables pour équiper et organiser vos espaces de travail.',
    'تشكيلة من المواد والمستهلكات لتجهيز فضاءات عملكم وتنظيمها.',
    'A selection of items and consumables to equip and organize your workspaces.',
    'published', true, 20
  ),
  (
    'Papeterie & fournitures scolaires', 'القرطاسية واللوازم المدرسية', 'Stationery & school supplies',
    'papeterie-fournitures-scolaires', null, 'stationery-school-supplies',
    'Les essentiels de papeterie et les fournitures destinés aux besoins scolaires et quotidiens.',
    'أساسيات القرطاسية واللوازم الموجهة للاحتياجات المدرسية واليومية.',
    'Stationery essentials and supplies for school and everyday needs.',
    'published', true, 30
  ),
  (
    'Livres & ouvrages', 'الكتب والمؤلفات', 'Books & publications',
    'livres-ouvrages', null, 'books-publications',
    'Des livres et supports de lecture et d''apprentissage adaptés à différents besoins.',
    'كتب ووسائط للقراءة والتعلم ملائمة لمختلف الاحتياجات.',
    'Books and reading and learning materials suited to different needs.',
    'published', true, 40
  )
on conflict (slug_fr) do update set
  name_fr = excluded.name_fr, name_ar = excluded.name_ar, name_en = excluded.name_en,
  slug_en = excluded.slug_en,
  summary_fr = excluded.summary_fr, summary_ar = excluded.summary_ar, summary_en = excluded.summary_en,
  status = excluded.status, is_featured = excluded.is_featured, sort_order = excluded.sort_order;

-- Print on demand (provided by the owner on 2026-11-15, English source text; fr/ar translated,
-- to be reviewed). Dedicated page: gallery, custom request form, order tracking.
insert into public.services (
  name_fr, name_ar, name_en,
  slug_fr, slug_ar, slug_en,
  summary_fr, summary_ar, summary_en,
  description_fr, description_ar, description_en,
  status, is_featured, sort_order
) values (
  'Impression à la demande', 'الطباعة حسب الطلب', 'Print on demand',
  'impression-a-la-demande', null, 'print-on-demand',
  'Votre idée. Votre design. Notre production.',
  'فكرتكم. تصميمكم. إنتاجنا.',
  'Your idea. Your design. Our production.',
  'Donnez vie à vos idées. Des objets personnalisés aux supports professionnels, jusqu''aux produits sur mesure : nous vous aidons à concrétiser vos projets.',
  'حوّلوا أفكاركم إلى واقع. من الأغراض المخصصة والمطبوعات المهنية إلى المنتجات حسب الطلب، نساعدكم على تجسيد مشاريعكم.',
  'Turn your ideas into reality. From personalized objects and business materials to custom-made products, we help bring your projects to life.',
  'published', false, 50
)
on conflict (slug_fr) do update set
  name_fr = excluded.name_fr, name_ar = excluded.name_ar, name_en = excluded.name_en,
  slug_en = excluded.slug_en,
  summary_fr = excluded.summary_fr, summary_ar = excluded.summary_ar, summary_en = excluded.summary_en,
  description_fr = excluded.description_fr, description_ar = excluded.description_ar, description_en = excluded.description_en,
  status = excluded.status, is_featured = excluded.is_featured, sort_order = excluded.sort_order;
