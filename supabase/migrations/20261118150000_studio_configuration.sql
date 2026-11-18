-- MSLAB Studio (ADR-026): verified product configuration, structured designs, file roles.
--
-- * studio_products / studio_views / studio_options are entered by MSLAB in
--   /admin/print-on-demand/studio/<product>. NOTHING is seeded except the five product keys:
--   views (photos of MSLAB's own products), colours, sizes, materials, techniques and print
--   areas only exist once MSLAB enters them. Without a view, the Studio uses its placeholder
--   visual and shows no specification.
-- * custom_request_details.design keeps the design the visitor composed (layers per view,
--   chosen options snapshotted by name), validated by the server action.
-- * quotation_files.role separates the customer's original artwork from the Studio mockups.

-- ─── Products configured for the Studio editor ───────────────────────────────
create table public.studio_products (
  key text primary key check (key in ('tshirt', 'hoodie', 'mug', 'tote', 'notebook')),
  -- Minimum print resolution MSLAB accepts (dots per inch at the printed size); null = no check.
  min_dpi integer check (min_dpi between 72 and 1200),
  updated_at timestamptz not null default now()
);
create trigger studio_products_updated_at before update on public.studio_products
  for each row execute function public.set_updated_at();
insert into public.studio_products (key) values ('tshirt'), ('hoodie'), ('mug'), ('tote'), ('notebook')
on conflict (key) do nothing;

-- ─── Views: one photo per printable side, with its print area ───────────────
create table public.studio_views (
  id uuid primary key default gen_random_uuid(),
  product_key text not null references public.studio_products (key) on delete cascade,
  view text not null check (view in ('front', 'back', 'left_sleeve', 'right_sleeve', 'wrap')),
  -- Objects in the public catalog bucket, folder "studio/".
  image_path text not null check (char_length(image_path) <= 300),
  image_width integer not null check (image_width between 1 and 10000),
  image_height integer not null check (image_height between 1 and 10000),
  mask_path text check (char_length(mask_path) <= 300),
  displacement_path text check (char_length(displacement_path) <= 300),
  -- Printable area in the photo's pixels.
  area_x integer not null check (area_x >= 0),
  area_y integer not null check (area_y >= 0),
  area_w integer not null check (area_w > 0),
  area_h integer not null check (area_h > 0),
  -- Real printable size; required to compute print dimensions and resolution.
  print_width_mm numeric(7, 1) check (print_width_mm > 0 and print_width_mm <= 5000),
  print_height_mm numeric(7, 1) check (print_height_mm > 0 and print_height_mm <= 5000),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (product_key, view),
  constraint studio_views_area_inside check (area_x + area_w <= image_width and area_y + area_h <= image_height)
);
create index studio_views_product_idx on public.studio_views (product_key, sort_order);
create trigger studio_views_updated_at before update on public.studio_views
  for each row execute function public.set_updated_at();

-- ─── Options: colours, sizes, materials, printing techniques (verified only) ─
create table public.studio_options (
  id uuid primary key default gen_random_uuid(),
  product_key text not null references public.studio_products (key) on delete cascade,
  kind text not null check (kind in ('color', 'size', 'material', 'technique')),
  name_fr text not null check (char_length(name_fr) between 1 and 120),
  name_ar text check (char_length(name_ar) between 1 and 120),
  name_en text check (char_length(name_en) between 1 and 120),
  hex text check (hex ~ '^#[0-9A-F]{6}$'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint studio_options_color_hex check ((kind = 'color') = (hex is not null))
);
create index studio_options_product_idx on public.studio_options (product_key, kind, sort_order);
create trigger studio_options_updated_at before update on public.studio_options
  for each row execute function public.set_updated_at();

alter table public.studio_products enable row level security;
alter table public.studio_views enable row level security;
alter table public.studio_options enable row level security;
revoke insert, update, delete, truncate on public.studio_products, public.studio_views, public.studio_options from anon;
revoke truncate on public.studio_products, public.studio_views, public.studio_options from authenticated;

create policy "studio_products: public reads" on public.studio_products
  for select to anon, authenticated using (true);
create policy "studio_products: admin updates" on public.studio_products
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "studio_views: public reads active" on public.studio_views
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "studio_views: admin inserts" on public.studio_views
  for insert to authenticated with check ((select private.is_admin()));
create policy "studio_views: admin updates" on public.studio_views
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "studio_views: admin deletes" on public.studio_views
  for delete to authenticated using ((select private.is_admin()));

create policy "studio_options: public reads active" on public.studio_options
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "studio_options: admin inserts" on public.studio_options
  for insert to authenticated with check ((select private.is_admin()));
create policy "studio_options: admin updates" on public.studio_options
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "studio_options: admin deletes" on public.studio_options
  for delete to authenticated using ((select private.is_admin()));

-- Studio photos, masks and displacement maps live in the public catalog bucket ("studio/").
drop policy if exists "catalog: admin uploads" on storage.objects;
create policy "catalog: admin uploads" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'catalog'
    and (select private.is_admin())
    and (storage.foldername(name))[1] in ('products', 'categories', 'services', 'portfolio', 'studio')
  );

-- ─── Designs and file roles ───────────────────────────────────────────────────
alter table public.custom_request_details
  add column design jsonb
    constraint custom_request_details_design_object check (design is null or jsonb_typeof(design) = 'object')
    constraint custom_request_details_design_size check (design is null or pg_column_size(design) <= 131072);

alter table public.quotation_files
  add column role text not null default 'artwork' check (role in ('artwork', 'mockup'));

-- SVG artwork is accepted (downloaded as an attachment in the admin, never rendered inline).
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/heic', 'image/svg+xml',
  'application/pdf', 'application/postscript', 'application/illustrator',
  'image/vnd.adobe.photoshop', 'application/x-photoshop'
]
where id = 'custom-uploads';

-- A ticket now carries up to 5 artwork files + up to 5 Studio mockups ("mslab-mockup-…").
create or replace function private.upload_ticket_allows(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_folder text := split_part(object_name, '/', 1);
  v_ticket uuid;
begin
  if array_length(string_to_array(object_name, '/'), 1) <> 2 or split_part(object_name, '/', 2) = '' then
    return false;
  end if;
  begin
    v_ticket := v_folder::uuid;
  exception when invalid_text_representation then
    return false;
  end;
  if not exists (
    select 1 from private.upload_tickets
    where id = v_ticket and used_at is null and created_at > now() - interval '2 hours'
  ) then
    return false;
  end if;
  return (
    select count(*) from storage.objects
    where bucket_id = 'custom-uploads' and name like v_folder || '/%'
  ) < 10;
end;
$$;

-- submit_custom_request: same as before + design (already validated and resolved by the
-- server action) + file roles. Only the changed parts differ from 20261115100000.
create or replace function public.submit_custom_request(payload jsonb, submission_key text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission uuid;
  v_ip text := nullif(payload ->> 'ip_hash', '');
  v_locale text := coalesce(payload ->> 'locale', 'fr');
  v_ticket uuid;
  v_request_id uuid;
  v_reference text;
  v_material text;
  v_material_id uuid;
  v_finishings text[] := '{}';
  v_project text := btrim(payload ->> 'project_type');
  v_quantity integer;
  v_design jsonb := case when jsonb_typeof(payload -> 'design') = 'object' then payload -> 'design' end;
begin
  perform private.check_submission_key(submission_key);

  begin
    v_submission := (payload ->> 'submission_id')::uuid;
    v_ticket := nullif(payload ->> 'upload_ticket', '')::uuid;
    v_material_id := nullif(payload ->> 'material_option_id', '')::uuid;
    v_quantity := (payload ->> 'quantity')::integer;
  exception when invalid_text_representation then
    raise exception 'invalid_payload' using errcode = '22023';
  end;
  if v_submission is null or v_quantity is null then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  select reference into v_reference from public.quotation_requests where submission_id = v_submission;
  if found then
    return v_reference;
  end if;

  if v_ip is not null and (
    select count(*) from public.quotation_requests
    where ip_hash = v_ip and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  if v_material_id is not null then
    select name_fr into v_material from public.production_options
    where id = v_material_id and kind = 'material' and is_active;
    if not found then
      raise exception 'invalid_option' using errcode = '22023';
    end if;
  else
    v_material := nullif(btrim(payload ->> 'material_other'), '');
  end if;

  if jsonb_typeof(payload -> 'finishing_option_ids') = 'array' then
    select coalesce(array_agg(o.name_fr order by o.sort_order, o.name_fr), '{}')
    into v_finishings
    from public.production_options o
    where o.kind = 'finishing' and o.is_active
      and o.id::text in (select jsonb_array_elements_text(payload -> 'finishing_option_ids'));
  end if;

  insert into public.quotation_requests (
    submission_id, kind, full_name, email, phone, company_name, message, preferred_contact,
    locale, source_path, consent, ip_hash
  ) values (
    v_submission,
    'custom',
    btrim(payload ->> 'full_name'),
    lower(btrim(payload ->> 'email')),
    btrim(payload ->> 'phone'),
    nullif(btrim(payload ->> 'company_name'), ''),
    null,
    coalesce((payload ->> 'preferred_contact')::public.contact_method, 'email'),
    v_locale,
    left(payload ->> 'source_path', 300),
    coalesce((payload ->> 'consent')::boolean, false),
    v_ip
  )
  returning id, reference into v_request_id, v_reference;

  insert into public.quotation_items (quotation_request_id, product_name_snapshot, quantity, sort_order)
  values (v_request_id, v_project, v_quantity, 0);

  insert into public.custom_request_details (
    quotation_request_id, project_type, description, quantity, width, height, depth,
    dimension_unit, material, finishings, deadline, design
  ) values (
    v_request_id,
    v_project,
    btrim(payload ->> 'description'),
    v_quantity,
    nullif(payload ->> 'width', '')::numeric,
    nullif(payload ->> 'height', '')::numeric,
    nullif(payload ->> 'depth', '')::numeric,
    coalesce(nullif(payload ->> 'dimension_unit', ''), 'cm'),
    v_material,
    v_finishings,
    nullif(payload ->> 'deadline', '')::date,
    v_design
  );

  if v_ticket is not null then
    update private.upload_tickets
    set used_at = now(), quotation_request_id = v_request_id
    where id = v_ticket and used_at is null and created_at > now() - interval '24 hours';

    if found then
      insert into public.quotation_files (quotation_request_id, storage_path, original_name, mime_type, size_bytes, role)
      select
        v_request_id,
        o.name,
        left(regexp_replace(split_part(o.name, '/', 2), '^[0-9]+-', ''), 255),
        o.metadata ->> 'mimetype',
        nullif(o.metadata ->> 'size', '')::bigint,
        case when split_part(o.name, '/', 2) ~ '^[0-9]+-mslab-mockup-' and o.metadata ->> 'mimetype' = 'image/png'
          then 'mockup' else 'artwork' end
      from storage.objects o
      where o.bucket_id = 'custom-uploads' and o.name like v_ticket::text || '/%'
        and o.name in (select jsonb_array_elements_text(coalesce(payload -> 'files', '[]'::jsonb)))
      order by o.name
      limit 10;
    end if;
  end if;

  return v_reference;
end;
$$;
revoke execute on function public.submit_custom_request(jsonb, text) from public;
grant execute on function public.submit_custom_request(jsonb, text) to anon, authenticated;
