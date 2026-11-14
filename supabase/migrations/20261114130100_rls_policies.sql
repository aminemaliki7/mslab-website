-- MSLAB — authorization helpers, Row Level Security and grants. See docs/SECURITY_STRATEGY.md.

-- ─── Helpers ─────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = (select auth.uid()) and is_active
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = (select auth.uid()) and is_active and role = 'owner'
  );
$$;

revoke execute on function public.is_admin() from public;
revoke execute on function public.is_owner() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;

-- Trigger functions are not callable through the API.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.products_set_published_at() from public, anon, authenticated;
revoke execute on function public.quotation_requests_track_status() from public, anon, authenticated;

-- ─── Enable RLS everywhere ───────────────────────────────────────────────────
alter table public.admin_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.services enable row level security;
alter table public.inquiries enable row level security;
alter table public.quotation_requests enable row level security;
alter table public.quotation_items enable row level security;
alter table public.site_settings enable row level security;

-- Defense in depth: the public role never writes directly (inquiries go through RPCs).
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke truncate on all tables in schema public from authenticated;
revoke usage, select on all sequences in schema public from anon;
revoke select on public.admin_profiles, public.inquiries, public.quotation_requests, public.quotation_items from anon;

-- ─── admin_profiles ──────────────────────────────────────────────────────────
create policy "admin_profiles: read own or as admin" on public.admin_profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "admin_profiles: owner inserts" on public.admin_profiles
  for insert to authenticated
  with check ((select public.is_owner()));
create policy "admin_profiles: owner updates" on public.admin_profiles
  for update to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));
create policy "admin_profiles: owner deletes others" on public.admin_profiles
  for delete to authenticated
  using ((select public.is_owner()) and id <> (select auth.uid()));

-- ─── Catalog & services: public reads published rows, admins manage ─────────
create policy "categories: public reads published" on public.categories
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy "categories: admin inserts" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "categories: admin updates" on public.categories
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories: admin deletes" on public.categories
  for delete to authenticated using ((select public.is_admin()));

create policy "products: public reads published" on public.products
  for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));
create policy "products: admin inserts" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products: admin updates" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products: admin deletes" on public.products
  for delete to authenticated using ((select public.is_admin()));

create policy "product_images: public reads images of published products" on public.product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'published'
    )
    or (select public.is_admin())
  );
create policy "product_images: admin inserts" on public.product_images
  for insert to authenticated with check ((select public.is_admin()));
create policy "product_images: admin updates" on public.product_images
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "product_images: admin deletes" on public.product_images
  for delete to authenticated using ((select public.is_admin()));

create policy "services: public reads published" on public.services
  for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));
create policy "services: admin inserts" on public.services
  for insert to authenticated with check ((select public.is_admin()));
create policy "services: admin updates" on public.services
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "services: admin deletes" on public.services
  for delete to authenticated using ((select public.is_admin()));

-- ─── Customer data: admin only (inserts happen through SECURITY DEFINER RPCs) ─
create policy "inquiries: admin reads" on public.inquiries
  for select to authenticated using ((select public.is_admin()));
create policy "inquiries: admin updates" on public.inquiries
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "inquiries: owner deletes" on public.inquiries
  for delete to authenticated using ((select public.is_owner()));

create policy "quotation_requests: admin reads" on public.quotation_requests
  for select to authenticated using ((select public.is_admin()));
create policy "quotation_requests: admin updates" on public.quotation_requests
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "quotation_requests: owner deletes" on public.quotation_requests
  for delete to authenticated using ((select public.is_owner()));

-- Items: read-only history (no insert/update/delete policies; removed only by cascade).
create policy "quotation_items: admin reads" on public.quotation_items
  for select to authenticated using ((select public.is_admin()));

-- ─── Site settings: public facts, admin edits ───────────────────────────────
create policy "site_settings: public reads" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site_settings: admin updates" on public.site_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
