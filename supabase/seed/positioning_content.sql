-- ═══════════════════════════════════════════════════════════════════════════
-- MSLAB — positioning content (docs/POSITIONING.md; revised with the owner 2026-11-21)
-- MSLAB: a Moroccan printing, reprographics and custom-production company serving businesses,
-- institutions and individuals. Bulk orders only, quoted per project.
-- Safe for production: owner-confirmed wording, no figures. Idempotent (updates by slug_fr).
-- The French slug `impression-a-la-demande` is kept so existing URLs keep working; the page is
-- recognised by that slug (src/components/illustrations/service-art.tsx → PRINT_ON_DEMAND_SLUG).
-- Arabic and English: translations of the French text, to be reviewed by a native speaker.
-- These texts can also be edited later in /admin/services and /admin/settings.
-- ═══════════════════════════════════════════════════════════════════════════

-- "Who we are" (homepage) and "Presentation" (About page).
update public.site_settings set
  about_fr = 'MSLAB est une entreprise marocaine d''impression, de reprographie et de production sur mesure. Nous imprimons et produisons en quantité, sur devis, pour les entreprises, les institutions et les particuliers : imprimés et documents, vêtements et objets personnalisés, objets d''entreprise, papeterie et fournitures de bureau, livres et brochures, packaging.',
  about_ar = 'MSLAB شركة مغربية للطباعة والاستنساخ والإنتاج حسب الطلب. نطبع وننتج بكميات، بعرض سعر، للشركات والمؤسسات والأفراد: مطبوعات ووثائق، ملابس ومنتجات مخصصة، منتجات الشركات، قرطاسية ولوازم مكتبية، كتب وكتيبات، وتغليف.',
  about_en = 'MSLAB is a Moroccan printing, reprographics and custom-production company. We print and produce in quantity, quoted per project, for businesses, institutions and individuals: printed materials and documents, custom apparel and personalized products, corporate merchandise, stationery and office supplies, books and brochures, packaging.';

update public.services set
  name_fr = 'Production sur mesure',
  name_ar = 'الإنتاج حسب الطلب',
  name_en = 'Custom production',
  summary_fr = 'Votre idée. Votre design. Notre production.',
  summary_ar = 'فكرتكم. تصميمكم. إنتاجنا.',
  summary_en = 'Your idea. Your design. Our production.',
  description_fr = 'Vêtements, objets personnalisés, imprimés, papeterie et packaging, produits en série à partir de vos designs et de vos spécifications, pour les entreprises, les institutions et les particuliers.',
  description_ar = 'ملابس ومنتجات مخصصة ومطبوعات وقرطاسية وتغليف، تُنتَج بكميات انطلاقًا من تصاميمكم ومواصفاتكم، للشركات والمؤسسات والأفراد.',
  description_en = 'Apparel, personalized products, print, stationery and packaging, made in quantity from your designs and specifications, for businesses, institutions and individuals.'
where slug_fr = 'impression-a-la-demande';

update public.services set
  summary_fr = 'Impression et reproduction de documents en volume pour les entreprises, les institutions et les particuliers.',
  summary_ar = 'طباعة الوثائق ونسخها بكميات للشركات والمؤسسات والأفراد.',
  summary_en = 'Document printing and reproduction in volume for businesses, institutions and individuals.'
where slug_fr = 'impression-reprographie';

update public.services set
  summary_fr = 'Articles et consommables de bureau pour équiper vos équipes, commandés en volume.',
  summary_ar = 'مواد ومستهلكات مكتبية لتجهيز فرقكم، تُطلب بكميات.',
  summary_en = 'Office items and consumables to equip your teams, ordered in volume.'
where slug_fr = 'fournitures-de-bureau';

update public.services set
  summary_fr = 'Papeterie et fournitures scolaires pour les établissements, les associations et les entreprises, en volume.',
  summary_ar = 'قرطاسية ولوازم مدرسية للمؤسسات التعليمية والجمعيات والشركات، بكميات.',
  summary_en = 'Stationery and school supplies for schools, associations and companies, in volume.'
where slug_fr = 'papeterie-fournitures-scolaires';

update public.services set
  summary_fr = 'Livres, brochures et supports imprimés pour les établissements, les organisations et les particuliers, en volume.',
  summary_ar = 'كتب وكتيبات ومطبوعات للمؤسسات التعليمية والهيئات والأفراد، بكميات.',
  summary_en = 'Books, brochures and printed materials for schools, organizations and individuals, in volume.'
where slug_fr = 'livres-ouvrages';

-- Digital Solutions: separate web division (owner request, 2026-11-21). Dedicated landing page,
-- recognised by its French slug (src/components/illustrations/service-art.tsx →
-- DIGITAL_SOLUTIONS_SLUG). Arabic URL uses the French slug, like the other services.
insert into public.services (name_fr, name_ar, name_en, slug_fr, slug_ar, slug_en,
  summary_fr, summary_ar, summary_en, description_fr, description_ar, description_en,
  status, is_featured, sort_order)
values (
  'Solutions digitales', 'الحلول الرقمية', 'Digital solutions',
  'solutions-digitales', null, 'digital-solutions',
  'Des solutions web conçues pour votre activité.',
  'حلول ويب مصممة لنشاطكم.',
  'Web solutions built for your business.',
  'Sites d''entreprise, e-commerce, applications web et plateformes de gestion : MSLAB conçoit, développe et maintient les outils numériques de votre activité.',
  'مواقع الشركات والتجارة الإلكترونية وتطبيقات الويب ومنصات التسيير: تصمم MSLAB الأدوات الرقمية لنشاطكم وتطوّرها وتتولى صيانتها.',
  'Corporate websites, e-commerce, web applications and management platforms: MSLAB designs, builds and maintains your business''s digital tools.',
  'published', false, 60
)
on conflict (slug_fr) do update set
  name_fr = excluded.name_fr, name_ar = excluded.name_ar, name_en = excluded.name_en,
  slug_ar = excluded.slug_ar, slug_en = excluded.slug_en,
  summary_fr = excluded.summary_fr, summary_ar = excluded.summary_ar, summary_en = excluded.summary_en,
  description_fr = excluded.description_fr, description_ar = excluded.description_ar, description_en = excluded.description_en,
  status = excluded.status, sort_order = excluded.sort_order;
