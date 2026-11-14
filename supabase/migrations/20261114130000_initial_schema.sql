-- MSLAB — initial schema (ADR-009 … ADR-014). See docs/DATABASE_SCHEMA.md.
-- Localized content uses per-locale columns: *_fr is required, *_ar / *_en optional (public fallback to fr).

create extension if not exists pg_trgm with schema extensions;

-- ─── Types ───────────────────────────────────────────────────────────────────
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.quotation_status as enum ('new', 'in_review', 'contacted', 'quoted', 'accepted', 'rejected', 'closed');
create type public.inquiry_status as enum ('new', 'read', 'replied', 'closed', 'spam');
create type public.contact_method as enum ('email', 'phone', 'whatsapp');
create type public.admin_role as enum ('owner', 'editor');

create domain public.slug as text
  check (value ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(value) <= 120);

create domain public.email_address as text
  check (char_length(value) <= 254 and value ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- E.164 (server normalizes Moroccan formats before insert)
create domain public.phone_e164 as text
  check (value ~ '^\+[1-9][0-9]{6,14}$');

create domain public.locale_code as text
  check (value in ('fr', 'ar', 'en'));

-- ─── Shared trigger ──────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── Admin profiles ──────────────────────────────────────────────────────────
-- Membership is a row here (created by an owner or manually). Never derived from user metadata.
create table public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  role public.admin_role not null default 'editor',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.admin_profiles is 'Back-office users. A Supabase Auth user is an admin only if an active row exists here.';

-- ─── Categories ──────────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  name_fr text not null check (char_length(name_fr) between 1 and 120),
  name_ar text check (char_length(name_ar) between 1 and 120),
  name_en text check (char_length(name_en) between 1 and 120),
  slug_fr public.slug not null unique,
  slug_ar public.slug unique,
  slug_en public.slug unique,
  description_fr text check (char_length(description_fr) <= 2000),
  description_ar text check (char_length(description_ar) <= 2000),
  description_en text check (char_length(description_en) <= 2000),
  image_path text check (char_length(image_path) <= 300),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_not_own_parent check (parent_id is null or parent_id <> id),
  constraint categories_slug_ar_needs_name check (slug_ar is null or name_ar is not null),
  constraint categories_slug_en_needs_name check (slug_en is null or name_en is not null)
);
create index categories_parent_id_idx on public.categories (parent_id);
create index categories_published_sort_idx on public.categories (is_published, sort_order);

-- ─── Products ────────────────────────────────────────────────────────────────
create table public.products (
  id uuid primary key default gen_random_uuid(),
  -- Deleting a category leaves its products uncategorized (admin is warned first).
  category_id uuid references public.categories (id) on delete set null,
  name_fr text not null check (char_length(name_fr) between 1 and 200),
  name_ar text check (char_length(name_ar) between 1 and 200),
  name_en text check (char_length(name_en) between 1 and 200),
  slug_fr public.slug not null unique,
  slug_ar public.slug unique,
  slug_en public.slug unique,
  short_description_fr text check (char_length(short_description_fr) <= 500),
  short_description_ar text check (char_length(short_description_ar) <= 500),
  short_description_en text check (char_length(short_description_en) <= 500),
  description_fr text check (char_length(description_fr) <= 10000),
  description_ar text check (char_length(description_ar) <= 10000),
  description_en text check (char_length(description_en) <= 10000),
  sku text unique check (char_length(sku) between 1 and 64),
  -- [{ "label": {"fr": "...", "ar": "...", "en": "..."}, "value": {"fr": "...", ...} }]
  specifications jsonb not null default '[]'::jsonb check (jsonb_typeof(specifications) = 'array'),
  status public.content_status not null default 'draft',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text text generated always as (
    lower(
      coalesce(name_fr, '') || ' ' || coalesce(name_ar, '') || ' ' || coalesce(name_en, '') || ' ' ||
      coalesce(sku, '') || ' ' ||
      coalesce(short_description_fr, '') || ' ' || coalesce(short_description_ar, '') || ' ' ||
      coalesce(short_description_en, '')
    )
  ) stored,
  constraint products_slug_ar_needs_name check (slug_ar is null or name_ar is not null),
  constraint products_slug_en_needs_name check (slug_en is null or name_en is not null)
);
create index products_category_id_idx on public.products (category_id);
create index products_status_featured_idx on public.products (status, is_featured, sort_order);
create index products_created_by_idx on public.products (created_by);
create index products_search_text_trgm_idx on public.products using gin (search_text extensions.gin_trgm_ops);

create or replace function public.products_set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

-- ─── Product images ──────────────────────────────────────────────────────────
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 300),
  alt_fr text check (char_length(alt_fr) <= 250),
  alt_ar text check (char_length(alt_ar) <= 250),
  alt_en text check (char_length(alt_en) <= 250),
  width integer check (width > 0),
  height integer check (height > 0),
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index product_images_product_sort_idx on public.product_images (product_id, sort_order);
create unique index product_images_one_primary_idx on public.product_images (product_id) where is_primary;

-- ─── Services ────────────────────────────────────────────────────────────────
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null check (char_length(name_fr) between 1 and 160),
  name_ar text check (char_length(name_ar) between 1 and 160),
  name_en text check (char_length(name_en) between 1 and 160),
  slug_fr public.slug not null unique,
  slug_ar public.slug unique,
  slug_en public.slug unique,
  summary_fr text check (char_length(summary_fr) <= 500),
  summary_ar text check (char_length(summary_ar) <= 500),
  summary_en text check (char_length(summary_en) <= 500),
  description_fr text check (char_length(description_fr) <= 10000),
  description_ar text check (char_length(description_ar) <= 10000),
  description_en text check (char_length(description_en) <= 10000),
  image_path text check (char_length(image_path) <= 300),
  status public.content_status not null default 'draft',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_slug_ar_needs_name check (slug_ar is null or name_ar is not null),
  constraint services_slug_en_needs_name check (slug_en is null or name_en is not null)
);
create index services_status_sort_idx on public.services (status, sort_order);

-- ─── Contact inquiries ───────────────────────────────────────────────────────
create sequence public.inquiry_reference_seq;

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default ('MSC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.inquiry_reference_seq')::text, 6, '0')),
  submission_id uuid not null unique,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email public.email_address not null,
  phone public.phone_e164,
  subject text not null check (char_length(subject) between 2 and 200),
  message text not null check (char_length(message) between 10 and 5000),
  locale public.locale_code not null default 'fr',
  status public.inquiry_status not null default 'new',
  read_at timestamptz,
  source_path text check (char_length(source_path) <= 300),
  consent boolean not null check (consent),
  ip_hash text check (ip_hash ~ '^[a-f0-9]{64}$'),
  notified_at timestamptz,
  notification_error text check (char_length(notification_error) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_status_created_idx on public.inquiries (status, created_at desc);
create index inquiries_ip_hash_created_idx on public.inquiries (ip_hash, created_at);

-- ─── Quotation requests ──────────────────────────────────────────────────────
create sequence public.quotation_reference_seq;

create table public.quotation_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default ('MSQ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.quotation_reference_seq')::text, 6, '0')),
  submission_id uuid not null unique,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email public.email_address not null,
  phone public.phone_e164 not null,
  company_name text check (char_length(company_name) <= 160),
  message text check (char_length(message) <= 5000),
  preferred_contact public.contact_method not null default 'email',
  locale public.locale_code not null default 'fr',
  status public.quotation_status not null default 'new',
  status_changed_at timestamptz not null default now(),
  internal_notes text check (char_length(internal_notes) <= 10000),
  assigned_to uuid references public.admin_profiles (id) on delete set null,
  source_path text check (char_length(source_path) <= 300),
  consent boolean not null check (consent),
  ip_hash text check (ip_hash ~ '^[a-f0-9]{64}$'),
  notified_at timestamptz,
  notification_error text check (char_length(notification_error) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quotation_requests_status_created_idx on public.quotation_requests (status, created_at desc);
create index quotation_requests_ip_hash_created_idx on public.quotation_requests (ip_hash, created_at);
create index quotation_requests_assigned_to_idx on public.quotation_requests (assigned_to);

create or replace function public.quotation_requests_track_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

-- Items are immutable history: names/SKU are snapshots taken at submission time.
create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_request_id uuid not null references public.quotation_requests (id) on delete cascade,
  -- Nullable: custom requests (e.g. bespoke printing) have no catalog product;
  -- deleting a product keeps the snapshot below.
  product_id uuid references public.products (id) on delete set null,
  product_name_snapshot text not null check (char_length(product_name_snapshot) between 1 and 200),
  product_sku_snapshot text check (char_length(product_sku_snapshot) <= 64),
  quantity integer not null check (quantity between 1 and 1000000),
  specifications text check (char_length(specifications) <= 2000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index quotation_items_request_idx on public.quotation_items (quotation_request_id, sort_order);
create index quotation_items_product_idx on public.quotation_items (product_id);

-- ─── Site settings (singleton) ───────────────────────────────────────────────
-- Every field is optional: empty = hidden on the public site. Only verified facts go here.
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  company_name text check (char_length(company_name) <= 160),
  legal_name text check (char_length(legal_name) <= 200),
  email public.email_address,
  phone public.phone_e164,
  whatsapp_number text check (whatsapp_number ~ '^[1-9][0-9]{6,14}$'),
  address_fr text check (char_length(address_fr) <= 300),
  address_ar text check (char_length(address_ar) <= 300),
  address_en text check (char_length(address_en) <= 300),
  maps_url text check (char_length(maps_url) <= 500 and maps_url ~ '^https://'),
  opening_hours_fr text check (char_length(opening_hours_fr) <= 300),
  opening_hours_ar text check (char_length(opening_hours_ar) <= 300),
  opening_hours_en text check (char_length(opening_hours_en) <= 300),
  about_fr text check (char_length(about_fr) <= 5000),
  about_ar text check (char_length(about_ar) <= 5000),
  about_en text check (char_length(about_en) <= 5000),
  mission_fr text check (char_length(mission_fr) <= 2000),
  mission_ar text check (char_length(mission_ar) <= 2000),
  mission_en text check (char_length(mission_en) <= 2000),
  values_fr text check (char_length(values_fr) <= 2000),
  values_ar text check (char_length(values_ar) <= 2000),
  values_en text check (char_length(values_en) <= 2000),
  social_facebook text check (social_facebook ~ '^https://'),
  social_instagram text check (social_instagram ~ '^https://'),
  social_linkedin text check (social_linkedin ~ '^https://'),
  social_youtube text check (social_youtube ~ '^https://'),
  enabled_locales text[] not null default array['fr', 'ar', 'en']
    check (enabled_locales <@ array['fr', 'ar', 'en'] and 'fr' = any (enabled_locales)),
  updated_by uuid references public.admin_profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
create index site_settings_updated_by_idx on public.site_settings (updated_by);
insert into public.site_settings (id) values (1);

-- ─── updated_at / status triggers ────────────────────────────────────────────
create trigger admin_profiles_updated_at before update on public.admin_profiles
  for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger products_published_at before insert or update of status on public.products
  for each row execute function public.products_set_published_at();
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create trigger inquiries_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();
create trigger quotation_requests_updated_at before update on public.quotation_requests
  for each row execute function public.set_updated_at();
create trigger quotation_requests_status before update of status on public.quotation_requests
  for each row execute function public.quotation_requests_track_status();
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
