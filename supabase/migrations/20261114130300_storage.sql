-- MSLAB — Storage bucket for catalog/service images.
-- Public read via public object URLs (no SELECT policy → anonymous clients cannot list files).
-- Writes restricted to active admins.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog',
  'catalog',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "catalog: admin reads objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'catalog' and (select public.is_admin()));

create policy "catalog: admin uploads" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'catalog'
    and (select public.is_admin())
    and (storage.foldername(name))[1] in ('products', 'categories', 'services')
  );

create policy "catalog: admin updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'catalog' and (select public.is_admin()))
  with check (bucket_id = 'catalog' and (select public.is_admin()));

create policy "catalog: admin deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'catalog' and (select public.is_admin()));
