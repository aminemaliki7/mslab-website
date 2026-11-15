-- MSLAB — Print on demand ("Your idea. Your design. Our production.").
--
-- * A custom production request is a quotation_request with kind = 'custom', so it shows in the
--   existing admin inbox; its project details live in custom_request_details.
-- * Visitors attach files by uploading straight to a PRIVATE bucket with a short-lived upload
--   ticket (no file ever passes through the Next.js server → no 4.5 MB function body limit).
-- * Production options (materials, finishes) and the portfolio gallery are managed by MSLAB
--   in /admin — nothing is hard-coded.
-- * Order tracking: production statuses + a status history, readable by the customer only with
--   reference + e-mail through a rate-limited RPC.

-- ─── Statuses ────────────────────────────────────────────────────────────────
alter type public.quotation_status add value if not exists 'in_production' after 'accepted';
alter type public.quotation_status add value if not exists 'ready' after 'in_production';
alter type public.quotation_status add value if not exists 'delivered' after 'ready';

create type public.request_kind as enum ('catalog', 'custom');
alter table public.quotation_requests add column kind public.request_kind not null default 'catalog';
create index quotation_requests_kind_created_idx on public.quotation_requests (kind, created_at desc);

-- ─── Production options (admin-managed lists shown in the request form) ──────
create type public.production_option_kind as enum ('material', 'finishing');

create table public.production_options (
  id uuid primary key default gen_random_uuid(),
  kind public.production_option_kind not null,
  name_fr text not null check (char_length(name_fr) between 1 and 120),
  name_ar text check (char_length(name_ar) between 1 and 120),
  name_en text check (char_length(name_en) between 1 and 120),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index production_options_kind_sort_idx on public.production_options (kind, sort_order);
create trigger production_options_updated_at before update on public.production_options
  for each row execute function public.set_updated_at();

-- ─── Custom request details (1:1 with quotation_requests of kind 'custom') ────
create table public.custom_request_details (
  quotation_request_id uuid primary key references public.quotation_requests (id) on delete cascade,
  project_type text not null check (char_length(project_type) between 2 and 160),
  description text not null check (char_length(description) between 10 and 5000),
  quantity integer not null check (quantity between 1 and 1000000),
  width numeric(10, 2) check (width > 0 and width <= 100000),
  height numeric(10, 2) check (height > 0 and height <= 100000),
  depth numeric(10, 2) check (depth > 0 and depth <= 100000),
  dimension_unit text not null default 'cm' check (dimension_unit in ('mm', 'cm', 'm')),
  -- Snapshots (French names) so later edits to the option lists keep the history intact.
  material text check (char_length(material) <= 200),
  finishings text[] not null default '{}' check (cardinality(finishings) <= 20),
  deadline date,
  created_at timestamptz not null default now()
);

-- ─── Files attached to a request (objects in the private custom-uploads bucket) ─
create table public.quotation_files (
  id uuid primary key default gen_random_uuid(),
  quotation_request_id uuid not null references public.quotation_requests (id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 400),
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text check (char_length(mime_type) <= 120),
  size_bytes bigint check (size_bytes >= 0),
  created_at timestamptz not null default now()
);
create index quotation_files_request_idx on public.quotation_files (quotation_request_id);

-- ─── Status history (order tracking timeline) ─────────────────────────────────
create table public.quotation_status_events (
  id bigint generated always as identity primary key,
  quotation_request_id uuid not null references public.quotation_requests (id) on delete cascade,
  status public.quotation_status not null,
  created_at timestamptz not null default now()
);
create index quotation_status_events_request_idx on public.quotation_status_events (quotation_request_id, created_at);

create or replace function public.quotation_requests_log_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.quotation_status_events (quotation_request_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;
revoke execute on function public.quotation_requests_log_status() from public, anon, authenticated;

create trigger quotation_requests_log_status after insert or update of status on public.quotation_requests
  for each row execute function public.quotation_requests_log_status();

-- History for requests that existed before this migration.
insert into public.quotation_status_events (quotation_request_id, status, created_at)
select id, 'new', created_at from public.quotation_requests;
insert into public.quotation_status_events (quotation_request_id, status, created_at)
select id, status, status_changed_at from public.quotation_requests where status <> 'new';

-- ─── Portfolio (gallery of products MSLAB has made) ───────────────────────────
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title_fr text not null check (char_length(title_fr) between 2 and 160),
  title_ar text check (char_length(title_ar) between 2 and 160),
  title_en text check (char_length(title_en) between 2 and 160),
  caption_fr text check (char_length(caption_fr) <= 500),
  caption_ar text check (char_length(caption_ar) <= 500),
  caption_en text check (char_length(caption_en) <= 500),
  image_path text check (char_length(image_path) <= 400),
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index portfolio_items_status_sort_idx on public.portfolio_items (status, sort_order);
create trigger portfolio_items_updated_at before update on public.portfolio_items
  for each row execute function public.set_updated_at();

-- ─── RLS & grants ────────────────────────────────────────────────────────────
alter table public.production_options enable row level security;
alter table public.custom_request_details enable row level security;
alter table public.quotation_files enable row level security;
alter table public.quotation_status_events enable row level security;
alter table public.portfolio_items enable row level security;

revoke insert, update, delete, truncate on public.production_options, public.custom_request_details,
  public.quotation_files, public.quotation_status_events, public.portfolio_items from anon;
revoke truncate on public.production_options, public.custom_request_details,
  public.quotation_files, public.quotation_status_events, public.portfolio_items from authenticated;
revoke select on public.custom_request_details, public.quotation_files, public.quotation_status_events from anon;

create policy "production_options: public reads active" on public.production_options
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "production_options: admin inserts" on public.production_options
  for insert to authenticated with check ((select private.is_admin()));
create policy "production_options: admin updates" on public.production_options
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "production_options: admin deletes" on public.production_options
  for delete to authenticated using ((select private.is_admin()));

create policy "portfolio_items: public reads published" on public.portfolio_items
  for select to anon, authenticated using (status = 'published' or (select private.is_admin()));
create policy "portfolio_items: admin inserts" on public.portfolio_items
  for insert to authenticated with check ((select private.is_admin()));
create policy "portfolio_items: admin updates" on public.portfolio_items
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "portfolio_items: admin deletes" on public.portfolio_items
  for delete to authenticated using ((select private.is_admin()));

create policy "custom_request_details: admin reads" on public.custom_request_details
  for select to authenticated using ((select private.is_admin()));
create policy "quotation_files: admin reads" on public.quotation_files
  for select to authenticated using ((select private.is_admin()));
create policy "quotation_status_events: admin reads" on public.quotation_status_events
  for select to authenticated using ((select private.is_admin()));

-- ─── Storage ─────────────────────────────────────────────────────────────────
-- Portfolio photos live in the public catalog bucket (new "portfolio" folder).
drop policy if exists "catalog: admin uploads" on storage.objects;
create policy "catalog: admin uploads" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'catalog'
    and (select private.is_admin())
    and (storage.foldername(name))[1] in ('products', 'categories', 'services', 'portfolio')
  );

-- Customer files: private bucket, never publicly readable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'custom-uploads',
  'custom-uploads',
  false,
  15728640, -- 15 MB per file
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/heic',
    'application/pdf', 'application/postscript', 'application/illustrator',
    'image/vnd.adobe.photoshop', 'application/x-photoshop'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table private.upload_tickets (
  id uuid primary key default gen_random_uuid(),
  ip_hash text check (ip_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  quotation_request_id uuid references public.quotation_requests (id) on delete set null
);
create index upload_tickets_ip_created_idx on private.upload_tickets (ip_hash, created_at);
alter table private.upload_tickets enable row level security;
revoke all on private.upload_tickets from public, anon, authenticated;

create table private.tracking_attempts (
  id bigint generated always as identity primary key,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index tracking_attempts_ip_created_idx on private.tracking_attempts (ip_hash, created_at);
alter table private.tracking_attempts enable row level security;
revoke all on private.tracking_attempts from public, anon, authenticated;

-- Storage INSERT check: "<ticket>/<file>" with a fresh, unused ticket and at most 5 files.
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
  ) < 5;
end;
$$;
revoke execute on function private.upload_ticket_allows(text) from public;
grant execute on function private.upload_ticket_allows(text) to anon, authenticated;

create policy "custom-uploads: visitor uploads with a ticket" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'custom-uploads' and private.upload_ticket_allows(name));
create policy "custom-uploads: admin reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'custom-uploads' and (select private.is_admin()));
create policy "custom-uploads: admin deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'custom-uploads' and (select private.is_admin()));

-- ─── RPC: upload ticket (server key + per-IP rate limit) ─────────────────────
create or replace function public.create_upload_ticket(submission_key text, ip_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip text := nullif(ip_hash, '');
  v_id uuid;
begin
  perform private.check_submission_key(submission_key);
  if v_ip is not null and (
    select count(*) from private.upload_tickets t
    where t.ip_hash = v_ip and t.created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into private.upload_tickets (ip_hash) values (v_ip) returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.create_upload_ticket(text, text) from public;
grant execute on function public.create_upload_ticket(text, text) to anon, authenticated;

-- ─── RPC: custom production request ──────────────────────────────────────────
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

  -- Option names come from the database (active rows only), never from the client.
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

  -- One line item so the request reads like any other quote in lists and e-mails.
  insert into public.quotation_items (quotation_request_id, product_name_snapshot, quantity, sort_order)
  values (v_request_id, v_project, v_quantity, 0);

  insert into public.custom_request_details (
    quotation_request_id, project_type, description, quantity, width, height, depth,
    dimension_unit, material, finishings, deadline
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
    nullif(payload ->> 'deadline', '')::date
  );

  -- Attach the files uploaded with this ticket (the ticket can only be used once).
  if v_ticket is not null then
    update private.upload_tickets
    set used_at = now(), quotation_request_id = v_request_id
    where id = v_ticket and used_at is null and created_at > now() - interval '24 hours';

    if found then
      insert into public.quotation_files (quotation_request_id, storage_path, original_name, mime_type, size_bytes)
      select
        v_request_id,
        o.name,
        left(regexp_replace(split_part(o.name, '/', 2), '^[0-9]+-', ''), 255),
        o.metadata ->> 'mimetype',
        nullif(o.metadata ->> 'size', '')::bigint
      from storage.objects o
      where o.bucket_id = 'custom-uploads' and o.name like v_ticket::text || '/%'
        and o.name in (select jsonb_array_elements_text(coalesce(payload -> 'files', '[]'::jsonb)))
      order by o.name
      limit 5;
    end if;
  end if;

  return v_reference;
end;
$$;
revoke execute on function public.submit_custom_request(jsonb, text) from public;
grant execute on function public.submit_custom_request(jsonb, text) to anon, authenticated;

-- ─── RPC: order tracking (reference + e-mail, rate limited) ──────────────────
create or replace function public.track_quotation(p_reference text, p_email text, submission_key text, ip_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip text := nullif(ip_hash, '');
  v_request public.quotation_requests%rowtype;
begin
  perform private.check_submission_key(submission_key);

  if v_ip is not null and (
    select count(*) from private.tracking_attempts a
    where a.ip_hash = v_ip and a.created_at > now() - interval '10 minutes'
  ) >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into private.tracking_attempts (ip_hash) values (v_ip);

  select * into v_request from public.quotation_requests
  where reference = upper(btrim(p_reference)) and email = lower(btrim(p_email));
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'reference', v_request.reference,
    'kind', v_request.kind,
    'status', v_request.status,
    'created_at', v_request.created_at,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('status', e.status, 'at', e.created_at) order by e.created_at, e.id)
      from public.quotation_status_events e
      where e.quotation_request_id = v_request.id
    ), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.track_quotation(text, text, text, text) from public;
grant execute on function public.track_quotation(text, text, text, text) to anon, authenticated;
