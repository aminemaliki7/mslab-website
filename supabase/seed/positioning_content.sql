-- ═══════════════════════════════════════════════════════════════════════════
-- MSLAB — production positioning content (docs/POSITIONING.md, decided with the owner 2026-11-19)
-- Safe for production: owner-confirmed wording, no figures. Idempotent (updates by slug_fr).
-- The French slug `impression-a-la-demande` is kept so existing URLs keep working; the page is
-- recognised by that slug (src/components/illustrations/service-art.tsx → PRINT_ON_DEMAND_SLUG).
-- Arabic and English: translations of the French text, to be reviewed by a native speaker.
-- These texts can also be edited later in /admin/services.
-- ═══════════════════════════════════════════════════════════════════════════

update public.services set
  name_fr = 'Production sur mesure',
  name_ar = 'الإنتاج حسب الطلب',
  name_en = 'Custom production',
  summary_fr = 'Votre idée. Votre design. Notre production.',
  summary_ar = 'فكرتكم. تصميمكم. إنتاجنا.',
  summary_en = 'Your idea. Your design. Our production.',
  description_fr = 'Textile, objets promotionnels, imprimés, packaging et collections en marque propre, fabriqués en série à partir de vos designs et de vos spécifications.',
  description_ar = 'نسيج ومنتجات ترويجية ومطبوعات وتغليف ومجموعات بعلامة خاصة، تُصنَّع بكميات انطلاقًا من تصاميمكم ومواصفاتكم.',
  description_en = 'Apparel, promotional merchandise, print, packaging and private-label collections, manufactured in quantity from your designs and specifications.'
where slug_fr = 'impression-a-la-demande';

-- Supply services stay published as a secondary activity; their summaries now say "in volume".
update public.services set
  summary_fr = 'Impression et reproduction de documents en volume pour les entreprises, administrations et établissements.',
  summary_ar = 'طباعة الوثائق ونسخها بكميات للشركات والإدارات والمؤسسات.',
  summary_en = 'Document printing and reproduction in volume for companies, administrations and schools.'
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
  summary_fr = 'Livres et supports d''apprentissage pour les établissements et les organisations, en volume.',
  summary_ar = 'كتب ووسائط تعلم للمؤسسات التعليمية والهيئات، بكميات.',
  summary_en = 'Books and learning materials for schools and organizations, in volume.'
where slug_fr = 'livres-ouvrages';
