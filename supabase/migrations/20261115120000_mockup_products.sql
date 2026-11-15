-- MSLAB — Print on demand mockups: which products the live mockup studio shows.
-- The drawings live in code (components/print-on-demand/mockups.tsx); MSLAB only turns each
-- product on or off and orders them from /admin/print-on-demand.

create table public.mockup_products (
  key text primary key check (key in (
    'tshirt', 'hoodie', 'tote', 'mug', 'box', 'notebook', 'sticker', 'business-card', 'flyer', 'poster', 'letterhead'
  )),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
create trigger mockup_products_updated_at before update on public.mockup_products
  for each row execute function public.set_updated_at();

-- Confirmed by the owner on 2026-11-15 (hoodie and poster added the same day).
insert into public.mockup_products (key, sort_order) values
  ('tshirt', 10), ('hoodie', 15), ('tote', 20), ('mug', 30), ('box', 40), ('notebook', 50),
  ('sticker', 60), ('business-card', 70), ('flyer', 80), ('poster', 85), ('letterhead', 90)
on conflict (key) do nothing;

alter table public.mockup_products enable row level security;
revoke insert, update, delete, truncate on public.mockup_products from anon;
revoke truncate on public.mockup_products from authenticated;

create policy "mockup_products: public reads active" on public.mockup_products
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "mockup_products: admin updates" on public.mockup_products
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
