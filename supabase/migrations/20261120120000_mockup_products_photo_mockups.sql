-- MSLAB — Studio: three products added from the mockup sheet supplied by the owner on 2026-11-20
-- (folded card / leaflet, catalogue / brochure, banner). Their placeholder photos live in
-- public/mockups/photos and their print areas in src/features/print-on-demand/placeholder-views.ts.

alter table public.mockup_products drop constraint if exists mockup_products_key_check;
alter table public.mockup_products add constraint mockup_products_key_check check (key in (
  'tshirt', 'hoodie', 'tote', 'mug', 'box', 'notebook', 'sticker', 'business-card', 'flyer', 'poster', 'letterhead',
  'folded-card', 'catalog', 'banner'
));

-- Confirmed by the owner on 2026-11-20.
insert into public.mockup_products (key, sort_order) values
  ('folded-card', 82), ('catalog', 84), ('banner', 87)
on conflict (key) do nothing;
