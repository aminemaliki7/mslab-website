-- MSLAB Business Management — Phase 1: operational foundation (docs/BUSINESS_MANAGEMENT.md, ADR-028).
--
-- Requires the ERP Phase 0 migrations (20261122100000 audit log, 20261122100100 roles & permissions,
-- 20261122100200 settings / numbering / notifications): this file uses audit.capture(),
-- private.can(), private.is_staff(), private.next_document_number() and the roles tables.
--
-- Scope: product & stock ledger, customers (+ link from existing requests / messages), suppliers,
-- sales with lines and payments, expenses & stock purchases, daily journal with comments and
-- attachments, private bucket `business-files`, roles Gérant / Associé.
--
-- Integrity model:
--   * Money numeric(14,2), quantities numeric(14,3). No float anywhere.
--   * Stock quantities, sales totals, payments and expense amounts change ONLY inside the
--     SECURITY DEFINER functions below (one function call = one transaction, row locks,
--     client_key idempotency). Ledger tables have no INSERT/UPDATE/DELETE grant.
--   * Descriptive fields stay editable through RLS; protected columns are guarded by
--     private.business_protect_columns(), which only lets them change while a business RPC runs
--     (transaction-local flag `mslab.business_rpc`, not settable through the REST API).
--   * Nothing is ever deleted: products / customers / suppliers are archived, payments and
--     expenses are voided with a reason, cancelled sales return their stock. audit.log keeps who
--     changed what.
--   * No business data is seeded.

-- ─── 0. Permissions & roles ──────────────────────────────────────────────────
insert into public.permissions (key, module, sort_order) values
  ('business.read',               'business', 100),
  ('business.products.manage',    'business', 101),
  ('business.stock.manage',       'business', 102),
  ('business.stock.negative',     'business', 103),
  ('business.customers.manage',   'business', 104),
  ('business.sales.manage',       'business', 105),
  ('business.expenses.manage',    'business', 106),
  ('business.finance.correct',    'business', 107),
  ('business.journal.write',      'business', 108),
  ('business.journal.comment',    'business', 109);

insert into public.roles (key, name, description, is_system) values
  ('gerant',    'Gérant',  'Gère les opérations quotidiennes : stock, clients, ventes, dépenses et journal.', true),
  ('associate', 'Associé', 'Suit l''activité de l''entreprise à distance, commente et demande des suivis.', true);

insert into public.role_permissions (role_id, permission_key)
select r.id, g.permission_key
from public.roles r
join (values
  ('gerant', 'overview.read'), ('gerant', 'staff.read'),
  ('gerant', 'requests.read'), ('gerant', 'messages.read'),
  ('gerant', 'business.read'), ('gerant', 'business.products.manage'), ('gerant', 'business.stock.manage'),
  ('gerant', 'business.customers.manage'), ('gerant', 'business.sales.manage'),
  ('gerant', 'business.expenses.manage'), ('gerant', 'business.journal.write'), ('gerant', 'business.journal.comment'),
  ('associate', 'overview.read'), ('associate', 'staff.read'),
  ('associate', 'business.read'), ('associate', 'business.journal.comment')
) as g(role_key, permission_key) on g.role_key = r.key;

-- Sale numbers: VTE-2026-00001 (gapless per year, editable prefix in document_sequences).
alter table public.document_sequences drop constraint document_sequences_doc_type_check;
alter table public.document_sequences add constraint document_sequences_doc_type_check check (doc_type in (
  'quote', 'sales_order', 'delivery_note', 'invoice', 'credit_note',
  'purchase_request', 'purchase_order', 'goods_receipt', 'production_order', 'project', 'sale'
));
insert into public.document_sequences (doc_type, prefix, sort_order) values ('sale', 'VTE', 5);

-- ─── 1. Types ────────────────────────────────────────────────────────────────
create type public.business_category_kind as enum ('product', 'expense');
create type public.business_item_type as enum ('product', 'material', 'service');
create type public.business_movement_type as enum (
  'initial', 'entry', 'purchase', 'purchase_void', 'exit', 'sale', 'sale_return', 'damage', 'loss', 'adjustment'
);
create type public.business_customer_type as enum ('individual', 'company');
create type public.business_order_status as enum ('new', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled');
create type public.business_payment_status as enum ('unpaid', 'partial', 'paid');
create type public.business_payment_method as enum ('cash', 'transfer', 'cheque', 'card', 'other');
create type public.business_expense_treatment as enum ('operating', 'stock_purchase', 'investment');
create type public.business_line_kind as enum ('product', 'service', 'custom');
create type public.business_activity_type as enum (
  'production_completed', 'customer_meeting', 'new_order', 'delivery', 'supplier_visit',
  'purchase', 'maintenance', 'administrative', 'incident', 'other'
);

-- ─── 2. Guards ───────────────────────────────────────────────────────────────
create or replace function private.business_rpc_on()
returns boolean
language sql
volatile
set search_path = ''
as $$
  select coalesce(current_setting('mslab.business_rpc', true), '') = 'on';
$$;
revoke execute on function private.business_rpc_on() from public, anon, authenticated;

-- BEFORE UPDATE: the columns named in TG_ARGV may only change while a business RPC runs.
create or replace function private.business_protect_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  v_col text;
begin
  if private.business_rpc_on() then
    return new;
  end if;
  foreach v_col in array tg_argv loop
    if (v_new -> v_col) is distinct from (v_old -> v_col) then
      raise exception 'protected_column' using errcode = 'P0001', detail = v_col;
    end if;
  end loop;
  return new;
end;
$$;
revoke execute on function private.business_protect_columns() from public, anon, authenticated;

create or replace function private.business_set_rpc(p_on boolean)
returns void
language sql
set search_path = ''
as $$
  select set_config('mslab.business_rpc', case when p_on then 'on' else 'off' end, true);
$$;
revoke execute on function private.business_set_rpc(boolean) from public, anon, authenticated;

-- ─── 3. Categories, suppliers, customers ─────────────────────────────────────
create table public.business_categories (
  id uuid primary key default gen_random_uuid(),
  kind public.business_category_kind not null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index business_categories_kind_name_idx on public.business_categories (kind, lower(name));
create trigger business_categories_updated_at before update on public.business_categories
  for each row execute function public.set_updated_at();

create table public.business_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  phone text check (char_length(phone) <= 40),
  email public.email_address,
  address text check (char_length(address) <= 500),
  notes text check (char_length(notes) <= 4000),
  is_archived boolean not null default false,
  created_by uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index business_suppliers_name_idx on public.business_suppliers (lower(name));
create index business_suppliers_created_by_idx on public.business_suppliers (created_by);
create trigger business_suppliers_updated_at before update on public.business_suppliers
  for each row execute function public.set_updated_at();
create trigger business_suppliers_protect before update on public.business_suppliers
  for each row execute function private.business_protect_columns('created_by', 'created_at');

create table public.business_customers (
  id uuid primary key default gen_random_uuid(),
  customer_type public.business_customer_type not null default 'individual',
  name text not null check (char_length(btrim(name)) between 2 and 160),
  contact_name text check (char_length(contact_name) <= 120),
  phone text check (char_length(phone) <= 40),
  email public.email_address,
  address text check (char_length(address) <= 500),
  city text check (char_length(city) <= 80),
  notes text check (char_length(notes) <= 4000),
  is_archived boolean not null default false,
  created_by uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.business_customers.created_at is 'Registration date.';
create index business_customers_name_idx on public.business_customers (lower(name));
create index business_customers_phone_idx on public.business_customers (phone);
create index business_customers_created_by_idx on public.business_customers (created_by);
create trigger business_customers_updated_at before update on public.business_customers
  for each row execute function public.set_updated_at();
create trigger business_customers_protect before update on public.business_customers
  for each row execute function private.business_protect_columns('created_by', 'created_at');

create table public.business_customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.business_customers (id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'call', 'meeting', 'follow_up')),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_by uuid not null default auth.uid() references public.admin_profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);
create index business_customer_notes_customer_idx on public.business_customer_notes (customer_id, created_at desc);
create index business_customer_notes_created_by_idx on public.business_customer_notes (created_by);

-- Existing requests and contact messages can be linked to a customer (additive, nullable).
alter table public.quotation_requests
  add column customer_id uuid references public.business_customers (id) on delete set null;
create index quotation_requests_customer_id_idx on public.quotation_requests (customer_id);
alter table public.inquiries
  add column customer_id uuid references public.business_customers (id) on delete set null;
create index inquiries_customer_id_idx on public.inquiries (customer_id);

-- ─── 4. Products & stock ledger ──────────────────────────────────────────────
create table public.business_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.business_categories (id) on delete set null,
  item_type public.business_item_type not null default 'product',
  name text not null check (char_length(btrim(name)) between 2 and 160),
  sku text check (sku ~ '^[A-Za-z0-9][A-Za-z0-9._/-]{0,39}$'),
  description text check (char_length(description) <= 2000),
  unit text not null default 'unité' check (char_length(btrim(unit)) between 1 and 20),
  purchase_cost numeric(14, 2) check (purchase_cost >= 0),
  selling_price numeric(14, 2) check (selling_price >= 0),
  track_stock boolean not null default true,
  quantity_on_hand numeric(14, 3) not null default 0,
  min_stock numeric(14, 3) check (min_stock >= 0),
  allow_negative boolean not null default false,
  image_path text check (char_length(image_path) <= 300),
  catalog_product_id uuid references public.products (id) on delete set null,
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_by uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_products_service_not_stocked check (item_type <> 'service' or not track_stock),
  constraint business_products_untracked_empty check (track_stock or quantity_on_hand = 0)
);
comment on table public.business_products is 'Internal products, materials and services (ADR-028). Independent from the public catalogue; quantity_on_hand changes only through inventory_movements.';
create unique index business_products_sku_idx on public.business_products (lower(sku)) where sku is not null;
create index business_products_category_idx on public.business_products (category_id);
create index business_products_catalog_idx on public.business_products (catalog_product_id);
create index business_products_created_by_idx on public.business_products (created_by);
create index business_products_name_idx on public.business_products (lower(name));
create trigger business_products_updated_at before update on public.business_products
  for each row execute function public.set_updated_at();
create trigger business_products_protect before update on public.business_products
  for each row execute function private.business_protect_columns('quantity_on_hand', 'created_by', 'created_at');

create or replace function private.business_check_category()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.business_categories c where c.id = new.category_id and c.kind::text = tg_argv[0]
  ) then
    raise exception 'invalid_category' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.business_check_category() from public, anon, authenticated;
create trigger business_products_category before insert or update of category_id on public.business_products
  for each row execute function private.business_check_category('product');

create table public.business_sales (
  id uuid primary key default gen_random_uuid(),
  number text not null unique check (char_length(number) <= 40),
  customer_id uuid references public.business_customers (id) on delete restrict,
  quotation_request_id uuid references public.quotation_requests (id) on delete set null,
  sold_at timestamptz not null default now(),
  order_status public.business_order_status not null default 'new',
  payment_status public.business_payment_status not null default 'unpaid',
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(14, 2) not null default 0 check (discount_amount >= 0),
  total numeric(14, 2) not null default 0 check (total >= 0),
  amount_paid numeric(14, 2) not null default 0 check (amount_paid >= 0),
  balance numeric(14, 2) generated always as (total - amount_paid) stored,
  due_date date,
  notes text check (char_length(notes) <= 4000),
  client_key uuid not null unique,
  status_changed_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancel_reason text check (char_length(cancel_reason) <= 500),
  created_by uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_sales_total check (total = subtotal - discount_amount),
  constraint business_sales_paid check (amount_paid <= total),
  constraint business_sales_cancelled check ((order_status = 'cancelled') = (cancelled_at is not null))
);
create index business_sales_customer_idx on public.business_sales (customer_id, sold_at desc);
create index business_sales_sold_at_idx on public.business_sales (sold_at desc);
create index business_sales_status_idx on public.business_sales (order_status);
create index business_sales_payment_status_idx on public.business_sales (payment_status) where payment_status <> 'paid';
create index business_sales_request_idx on public.business_sales (quotation_request_id);
create index business_sales_created_by_idx on public.business_sales (created_by);
create trigger business_sales_updated_at before update on public.business_sales
  for each row execute function public.set_updated_at();
create trigger business_sales_protect before update on public.business_sales
  for each row execute function private.business_protect_columns(
    'number', 'sold_at', 'order_status', 'payment_status', 'subtotal', 'discount_amount', 'total',
    'amount_paid', 'client_key', 'status_changed_at', 'cancelled_at', 'cancel_reason', 'created_by', 'created_at'
  );

create table public.business_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.business_sales (id) on delete cascade,
  position smallint not null check (position between 1 and 200),
  line_kind public.business_line_kind not null,
  product_id uuid references public.business_products (id) on delete restrict,
  description text not null check (char_length(btrim(description)) between 1 and 300),
  unit text check (char_length(unit) <= 20),
  quantity numeric(14, 3) not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  discount_amount numeric(14, 2) not null default 0 check (discount_amount >= 0),
  line_total numeric(14, 2) not null check (line_total >= 0),
  unit_cost numeric(14, 2) check (unit_cost >= 0),
  deducts_stock boolean not null default false,
  created_at timestamptz not null default now(),
  unique (sale_id, position),
  constraint business_sale_items_product check (line_kind <> 'product' or product_id is not null),
  constraint business_sale_items_custom check (line_kind <> 'custom' or product_id is null),
  constraint business_sale_items_stock check (not deducts_stock or line_kind = 'product')
);
create index business_sale_items_product_idx on public.business_sale_items (product_id);

create table public.business_sale_events (
  id bigint generated always as identity primary key,
  sale_id uuid not null references public.business_sales (id) on delete cascade,
  event_type text not null check (event_type in ('created', 'status', 'payment', 'payment_void', 'cancelled')),
  from_status public.business_order_status,
  to_status public.business_order_status,
  amount numeric(14, 2),
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index business_sale_events_sale_idx on public.business_sale_events (sale_id, created_at);
create index business_sale_events_created_by_idx on public.business_sale_events (created_by);

create table public.business_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.business_sales (id) on delete restrict,
  customer_id uuid references public.business_customers (id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  method public.business_payment_method not null,
  paid_at timestamptz not null default now(),
  reference text check (char_length(reference) <= 120),
  notes text check (char_length(notes) <= 1000),
  client_key uuid not null unique,
  is_void boolean not null default false,
  voided_at timestamptz,
  voided_by uuid references public.admin_profiles (id) on delete set null,
  void_reason text check (char_length(void_reason) <= 500),
  created_by uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint business_payments_void check (is_void = (voided_at is not null))
);
create index business_payments_sale_idx on public.business_payments (sale_id);
create index business_payments_customer_idx on public.business_payments (customer_id, paid_at desc);
create index business_payments_paid_at_idx on public.business_payments (paid_at desc);
create index business_payments_created_by_idx on public.business_payments (created_by);
create index business_payments_voided_by_idx on public.business_payments (voided_by);

create table public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(btrim(label)) between 2 and 160),
  category_id uuid references public.business_categories (id) on delete set null,
  supplier_id uuid references public.business_suppliers (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  treatment public.business_expense_treatment not null default 'operating',
  payment_method public.business_payment_method not null,
  expense_date date not null,
  reference text check (char_length(reference) <= 120),
  description text check (char_length(description) <= 2000),
  client_key uuid not null unique,
  is_void boolean not null default false,
  voided_at timestamptz,
  voided_by uuid references public.admin_profiles (id) on delete set null,
  void_reason text check (char_length(void_reason) <= 500),
  created_by uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_expenses_void check (is_void = (voided_at is not null))
);
comment on column public.business_expenses.treatment is 'operating = counted in the operating result; stock_purchase = inventory replenishment (cash out, not an operating expense); investment = equipment.';
create index business_expenses_date_idx on public.business_expenses (expense_date desc);
create index business_expenses_category_idx on public.business_expenses (category_id);
create index business_expenses_supplier_idx on public.business_expenses (supplier_id);
create index business_expenses_created_by_idx on public.business_expenses (created_by);
create index business_expenses_voided_by_idx on public.business_expenses (voided_by);
create trigger business_expenses_updated_at before update on public.business_expenses
  for each row execute function public.set_updated_at();
create trigger business_expenses_protect before update on public.business_expenses
  for each row execute function private.business_protect_columns(
    'amount', 'treatment', 'expense_date', 'client_key', 'is_void', 'voided_at', 'voided_by', 'void_reason', 'created_by', 'created_at'
  );
create trigger business_expenses_category before insert or update of category_id on public.business_expenses
  for each row execute function private.business_check_category('expense');

create table public.business_expense_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.business_expenses (id) on delete cascade,
  product_id uuid not null references public.business_products (id) on delete restrict,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit_cost numeric(14, 2) not null check (unit_cost >= 0),
  line_total numeric(14, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
create index business_expense_items_expense_idx on public.business_expense_items (expense_id);
create index business_expense_items_product_idx on public.business_expense_items (product_id);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.business_products (id) on delete restrict,
  movement_type public.business_movement_type not null,
  quantity numeric(14, 3) not null check (quantity <> 0),
  quantity_before numeric(14, 3) not null,
  quantity_after numeric(14, 3) not null,
  unit_cost numeric(14, 2) check (unit_cost >= 0),
  reason text check (char_length(reason) <= 500),
  occurred_at timestamptz not null default now(),
  sale_id uuid references public.business_sales (id) on delete restrict,
  sale_item_id uuid references public.business_sale_items (id) on delete restrict,
  expense_id uuid references public.business_expenses (id) on delete restrict,
  allowed_negative boolean not null default false,
  client_key uuid unique,
  created_by uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movements_math check (quantity_after = quantity_before + quantity)
);
comment on table public.inventory_movements is 'Append-only stock ledger (ADR-028). quantity is signed. Written only by business RPCs.';
create index inventory_movements_product_idx on public.inventory_movements (product_id, occurred_at desc);
create index inventory_movements_occurred_idx on public.inventory_movements (occurred_at desc);
create index inventory_movements_sale_idx on public.inventory_movements (sale_id);
create index inventory_movements_sale_item_idx on public.inventory_movements (sale_item_id);
create index inventory_movements_expense_idx on public.inventory_movements (expense_id);
create index inventory_movements_created_by_idx on public.inventory_movements (created_by);

-- ─── 5. Daily journal & attachments ──────────────────────────────────────────
create table public.business_activities (
  id uuid primary key default gen_random_uuid(),
  activity_type public.business_activity_type not null,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text check (char_length(description) <= 4000),
  occurred_at timestamptz not null default now(),
  responsible_id uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  customer_id uuid references public.business_customers (id) on delete set null,
  sale_id uuid references public.business_sales (id) on delete set null,
  created_by uuid not null default auth.uid() references public.admin_profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index business_activities_occurred_idx on public.business_activities (occurred_at desc);
create index business_activities_responsible_idx on public.business_activities (responsible_id);
create index business_activities_customer_idx on public.business_activities (customer_id);
create index business_activities_sale_idx on public.business_activities (sale_id);
create index business_activities_created_by_idx on public.business_activities (created_by);
create trigger business_activities_updated_at before update on public.business_activities
  for each row execute function public.set_updated_at();
create trigger business_activities_protect before update on public.business_activities
  for each row execute function private.business_protect_columns('created_by', 'created_at');

create table public.business_activity_comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.business_activities (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  author_id uuid not null default auth.uid() references public.admin_profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);
create index business_activity_comments_activity_idx on public.business_activity_comments (activity_id, created_at);
create index business_activity_comments_author_idx on public.business_activity_comments (author_id);

create table public.business_attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('expense', 'activity')),
  entity_id uuid not null,
  storage_path text not null unique check (char_length(storage_path) <= 300),
  file_name text not null check (char_length(file_name) between 1 and 200),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  created_by uuid not null default auth.uid() references public.admin_profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);
create index business_attachments_entity_idx on public.business_attachments (entity_type, entity_id);
create index business_attachments_created_by_idx on public.business_attachments (created_by);

-- ─── 6. Views ────────────────────────────────────────────────────────────────
create view public.business_customer_balances with (security_invoker = true) as
select
  c.id as customer_id,
  count(s.id) filter (where s.order_status <> 'cancelled')::integer as sales_count,
  coalesce(sum(s.total) filter (where s.order_status <> 'cancelled'), 0)::numeric(14, 2) as total_sales,
  coalesce(sum(s.amount_paid) filter (where s.order_status <> 'cancelled'), 0)::numeric(14, 2) as total_paid,
  coalesce(sum(s.balance) filter (where s.order_status <> 'cancelled'), 0)::numeric(14, 2) as balance,
  max(s.sold_at) filter (where s.order_status <> 'cancelled') as last_sale_at
from public.business_customers c
left join public.business_sales s on s.customer_id = c.id
group by c.id;

-- ─── 7. Internal operations (not callable through the API) ───────────────────
-- Applies a signed stock change to one product. Caller holds the transaction.
create or replace function private.business_apply_movement(
  p_product uuid,
  p_type public.business_movement_type,
  p_delta numeric,
  p_reason text,
  p_occurred_at timestamptz,
  p_unit_cost numeric,
  p_allow_negative boolean,
  p_sale uuid,
  p_sale_item uuid,
  p_expense uuid,
  p_client_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.business_products;
  v_after numeric(14, 3);
  v_id uuid;
begin
  select * into v_product from public.business_products where id = p_product for update;
  if not found then
    raise exception 'product_not_found' using errcode = 'P0002';
  end if;
  if not v_product.track_stock then
    raise exception 'not_stock_tracked' using errcode = 'P0001', detail = v_product.name;
  end if;
  if p_delta = 0 then
    raise exception 'no_change' using errcode = 'P0001';
  end if;
  v_after := v_product.quantity_on_hand + p_delta;
  if v_after < 0 and not v_product.allow_negative
     and not (coalesce(p_allow_negative, false) and private.can('business.stock.negative')) then
    raise exception 'insufficient_stock' using errcode = 'P0001',
      detail = v_product.name || ' (' || v_product.quantity_on_hand::text || ')';
  end if;

  perform private.business_set_rpc(true);
  update public.business_products set quantity_on_hand = v_after where id = p_product;
  perform private.business_set_rpc(false);

  insert into public.inventory_movements (
    product_id, movement_type, quantity, quantity_before, quantity_after, unit_cost, reason,
    occurred_at, sale_id, sale_item_id, expense_id, allowed_negative, client_key
  ) values (
    p_product, p_type, p_delta, v_product.quantity_on_hand, v_after, p_unit_cost, nullif(btrim(coalesce(p_reason, '')), ''),
    coalesce(p_occurred_at, now()), p_sale, p_sale_item, p_expense, v_after < 0, p_client_key
  ) returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function private.business_apply_movement(uuid, public.business_movement_type, numeric, text, timestamptz, numeric, boolean, uuid, uuid, uuid, uuid) from public, anon, authenticated;

-- Initial stock typed in the product form becomes an 'initial' movement (same transaction).
create or replace function private.business_product_initial_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qty numeric(14, 3) := new.quantity_on_hand;
begin
  if v_qty = 0 then
    return null;
  end if;
  if not private.can('business.stock.manage') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_qty < 0 then
    raise exception 'insufficient_stock' using errcode = 'P0001', detail = new.name;
  end if;
  insert into public.inventory_movements (product_id, movement_type, quantity, quantity_before, quantity_after, unit_cost, reason)
  values (new.id, 'initial', v_qty, 0, v_qty, new.purchase_cost, 'Stock initial');
  return null;
end;
$$;
revoke execute on function private.business_product_initial_stock() from public, anon, authenticated;
create trigger business_products_initial_stock after insert on public.business_products
  for each row execute function private.business_product_initial_stock();

-- Recomputes amount paid / payment status of a sale from its valid payments.
create or replace function private.business_refresh_sale_payment(p_sale uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_paid numeric(14, 2);
  v_total numeric(14, 2);
begin
  select coalesce(sum(amount), 0) into v_paid from public.business_payments where sale_id = p_sale and not is_void;
  select total into v_total from public.business_sales where id = p_sale;
  perform private.business_set_rpc(true);
  update public.business_sales
  set amount_paid = v_paid,
      payment_status = case when v_paid >= v_total then 'paid' when v_paid = 0 then 'unpaid' else 'partial' end::public.business_payment_status
  where id = p_sale;
  perform private.business_set_rpc(false);
end;
$$;
revoke execute on function private.business_refresh_sale_payment(uuid) from public, anon, authenticated;

create or replace function private.business_add_payment(
  p_sale uuid, p_amount numeric, p_method public.business_payment_method, p_paid_at timestamptz,
  p_reference text, p_notes text, p_client_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale public.business_sales;
  v_id uuid;
begin
  select * into v_sale from public.business_sales where id = p_sale for update;
  if not found then
    raise exception 'sale_not_found' using errcode = 'P0002';
  end if;
  if v_sale.order_status = 'cancelled' then
    raise exception 'sale_cancelled' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;
  if p_amount > v_sale.total - v_sale.amount_paid then
    raise exception 'overpayment' using errcode = 'P0001', detail = (v_sale.total - v_sale.amount_paid)::text;
  end if;
  if p_paid_at > now() + interval '5 minutes' then
    raise exception 'future_date' using errcode = '22023';
  end if;
  insert into public.business_payments (sale_id, customer_id, amount, method, paid_at, reference, notes, client_key)
  values (p_sale, v_sale.customer_id, p_amount, p_method, coalesce(p_paid_at, now()),
          nullif(btrim(coalesce(p_reference, '')), ''), nullif(btrim(coalesce(p_notes, '')), ''), p_client_key)
  returning id into v_id;
  perform private.business_refresh_sale_payment(p_sale);
  insert into public.business_sale_events (sale_id, event_type, amount, note)
  values (p_sale, 'payment', p_amount, p_method::text);
  return v_id;
end;
$$;
revoke execute on function private.business_add_payment(uuid, numeric, public.business_payment_method, timestamptz, text, text, uuid) from public, anon, authenticated;

-- ─── 8. Business RPCs (callable by signed-in staff; permission checked first) ─
create or replace function public.business_record_stock_movement(
  p_product_id uuid,
  p_type text,
  p_quantity numeric,
  p_reason text default null,
  p_occurred_at timestamptz default null,
  p_unit_cost numeric default null,
  p_allow_negative boolean default false,
  p_client_key uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing uuid;
  v_current numeric(14, 3);
  v_delta numeric(14, 3);
begin
  if not private.can('business.stock.manage') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_client_key is not null then
    select id into v_existing from public.inventory_movements where client_key = p_client_key;
    if v_existing is not null then
      return v_existing;
    end if;
  end if;
  if p_type not in ('entry', 'exit', 'damage', 'loss', 'adjustment') then
    raise exception 'invalid_movement_type' using errcode = '22023';
  end if;
  if p_quantity is null or p_quantity < 0 or (p_quantity = 0 and p_type <> 'adjustment') or p_quantity <> round(p_quantity, 3) then
    raise exception 'invalid_quantity' using errcode = '22023';
  end if;
  if p_type <> 'entry' and char_length(btrim(coalesce(p_reason, ''))) < 2 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  if p_occurred_at > now() + interval '5 minutes' then
    raise exception 'future_date' using errcode = '22023';
  end if;
  if p_unit_cost is not null and p_unit_cost < 0 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  select quantity_on_hand into v_current from public.business_products where id = p_product_id for update;
  if not found then
    raise exception 'product_not_found' using errcode = 'P0002';
  end if;
  v_delta := case p_type
    when 'entry' then p_quantity
    when 'adjustment' then p_quantity - v_current   -- p_quantity = counted quantity
    else -p_quantity
  end;

  return private.business_apply_movement(
    p_product_id, p_type::public.business_movement_type, v_delta, p_reason, p_occurred_at,
    p_unit_cost, p_allow_negative, null, null, null, p_client_key
  );
end;
$$;

-- Payload: { client_key, customer_id?, quotation_request_id?, sold_at?, order_status?, due_date?,
--   discount_amount?, notes?, allow_negative?,
--   items: [{ line_kind, product_id?, description?, quantity, unit_price, discount_amount? }],
--   payment?: { amount, method, reference? } }
create or replace function public.business_record_sale(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key uuid := (p_payload ->> 'client_key')::uuid;
  v_existing uuid;
  v_customer uuid := nullif(p_payload ->> 'customer_id', '')::uuid;
  v_request uuid := nullif(p_payload ->> 'quotation_request_id', '')::uuid;
  v_status public.business_order_status := coalesce(nullif(p_payload ->> 'order_status', ''), 'new')::public.business_order_status;
  v_sold_at timestamptz := coalesce(nullif(p_payload ->> 'sold_at', '')::timestamptz, now());
  v_discount numeric(14, 2) := coalesce(nullif(p_payload ->> 'discount_amount', '')::numeric, 0);
  v_allow_negative boolean := coalesce((p_payload ->> 'allow_negative')::boolean, false);
  v_items jsonb := p_payload -> 'items';
  v_payment jsonb := p_payload -> 'payment';
  v_sale uuid;
  v_number text;
  v_item jsonb;
  v_pos integer;
  v_kind public.business_line_kind;
  v_product public.business_products;
  v_qty numeric(14, 3);
  v_price numeric(14, 2);
  v_line_discount numeric(14, 2);
  v_line_total numeric(14, 2);
  v_subtotal numeric(14, 2) := 0;
  v_item_id uuid;
  v_deducts boolean;
  v_description text;
begin
  if not private.can('business.sales.manage') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_key is null then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;
  select id into v_existing from public.business_sales where client_key = v_key;
  if v_existing is not null then
    return v_existing;  -- double submit / retry: same sale, nothing posted twice
  end if;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) not between 1 and 100 then
    raise exception 'invalid_items' using errcode = '22023';
  end if;
  if v_status = 'cancelled' then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if v_sold_at > now() + interval '5 minutes' then
    raise exception 'future_date' using errcode = '22023';
  end if;
  if v_discount < 0 or v_discount <> round(v_discount, 2) then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;
  if v_customer is not null and not exists (select 1 from public.business_customers where id = v_customer and not is_archived) then
    raise exception 'customer_not_found' using errcode = 'P0002';
  end if;
  if v_request is not null and not exists (select 1 from public.quotation_requests where id = v_request) then
    raise exception 'request_not_found' using errcode = 'P0002';
  end if;

  -- Lock every product of the sale in a fixed order (no deadlock between concurrent sales).
  perform 1 from public.business_products
  where id in (select nullif(e ->> 'product_id', '')::uuid from jsonb_array_elements(v_items) e)
  order by id
  for update;

  v_number := private.next_document_number('sale');
  insert into public.business_sales (
    number, customer_id, quotation_request_id, sold_at, order_status, due_date, notes, client_key
  ) values (
    v_number, v_customer, v_request, v_sold_at, v_status, nullif(p_payload ->> 'due_date', '')::date,
    nullif(btrim(coalesce(p_payload ->> 'notes', '')), ''), v_key
  ) returning id into v_sale;

  for v_item, v_pos in select e, o from jsonb_array_elements(v_items) with ordinality as t(e, o) loop
    v_kind := (v_item ->> 'line_kind')::public.business_line_kind;
    v_qty := (v_item ->> 'quantity')::numeric;
    v_price := (v_item ->> 'unit_price')::numeric;
    v_line_discount := coalesce(nullif(v_item ->> 'discount_amount', '')::numeric, 0);
    if v_qty is null or v_qty <= 0 or v_qty <> round(v_qty, 3)
       or v_price is null or v_price < 0 or v_price <> round(v_price, 2)
       or v_line_discount < 0 or v_line_discount <> round(v_line_discount, 2) then
      raise exception 'invalid_line' using errcode = '22023', detail = v_pos::text;
    end if;
    v_line_total := round(v_qty * v_price, 2) - v_line_discount;
    if v_line_total < 0 then
      raise exception 'invalid_line' using errcode = '22023', detail = v_pos::text;
    end if;

    v_product := null;
    v_deducts := false;
    if nullif(v_item ->> 'product_id', '') is not null then
      if v_kind = 'custom' then
        raise exception 'invalid_line' using errcode = '22023', detail = v_pos::text;
      end if;
      select * into v_product from public.business_products where id = (v_item ->> 'product_id')::uuid;
      if not found or v_product.is_archived then
        raise exception 'product_not_found' using errcode = 'P0002', detail = v_pos::text;
      end if;
      -- Stock is deducted only for a product line of a product that tracks stock.
      v_deducts := v_kind = 'product' and v_product.track_stock;
    elsif v_kind = 'product' then
      raise exception 'invalid_line' using errcode = '22023', detail = v_pos::text;
    end if;

    v_description := coalesce(nullif(btrim(coalesce(v_item ->> 'description', '')), ''), v_product.name);
    if v_description is null then
      raise exception 'invalid_line' using errcode = '22023', detail = v_pos::text;
    end if;

    insert into public.business_sale_items (
      sale_id, position, line_kind, product_id, description, unit, quantity, unit_price,
      discount_amount, line_total, unit_cost, deducts_stock
    ) values (
      v_sale, v_pos, v_kind, v_product.id, left(v_description, 300), v_product.unit, v_qty, v_price,
      v_line_discount, v_line_total, v_product.purchase_cost, v_deducts
    ) returning id into v_item_id;

    if v_deducts then
      perform private.business_apply_movement(
        v_product.id, 'sale', -v_qty, v_number, v_sold_at, v_product.purchase_cost,
        v_allow_negative, v_sale, v_item_id, null, null
      );
    end if;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if v_discount > v_subtotal then
    raise exception 'discount_too_high' using errcode = 'P0001';
  end if;
  perform private.business_set_rpc(true);
  update public.business_sales
  set subtotal = v_subtotal, discount_amount = v_discount, total = v_subtotal - v_discount,
      payment_status = case when v_subtotal - v_discount = 0 then 'paid' else 'unpaid' end::public.business_payment_status
  where id = v_sale;
  perform private.business_set_rpc(false);

  insert into public.business_sale_events (sale_id, event_type, to_status, amount)
  values (v_sale, 'created', v_status, v_subtotal - v_discount);

  if v_payment is not null and jsonb_typeof(v_payment) = 'object'
     and coalesce(nullif(v_payment ->> 'amount', '')::numeric, 0) > 0 then
    perform private.business_add_payment(
      v_sale, (v_payment ->> 'amount')::numeric, (v_payment ->> 'method')::public.business_payment_method,
      v_sold_at, v_payment ->> 'reference', null, md5(v_key::text || ':payment')::uuid
    );
  end if;
  return v_sale;
end;
$$;

create or replace function public.business_record_payment(
  p_sale_id uuid,
  p_amount numeric,
  p_method text,
  p_client_key uuid,
  p_paid_at timestamptz default null,
  p_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing uuid;
begin
  if not private.can('business.sales.manage') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_client_key is null then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;
  select id into v_existing from public.business_payments where client_key = p_client_key;
  if v_existing is not null then
    return v_existing;
  end if;
  return private.business_add_payment(
    p_sale_id, p_amount, p_method::public.business_payment_method, p_paid_at, p_reference, p_notes, p_client_key
  );
end;
$$;

create or replace function public.business_void_payment(p_payment_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.business_payments;
begin
  if not private.can('business.finance.correct') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  select * into v_payment from public.business_payments where id = p_payment_id;
  if not found then
    raise exception 'payment_not_found' using errcode = 'P0002';
  end if;
  perform 1 from public.business_sales where id = v_payment.sale_id for update;
  select * into v_payment from public.business_payments where id = p_payment_id for update;
  if v_payment.is_void then
    raise exception 'already_void' using errcode = 'P0001';
  end if;
  update public.business_payments
  set is_void = true, voided_at = now(), voided_by = (select auth.uid()), void_reason = left(btrim(p_reason), 500)
  where id = p_payment_id;
  perform private.business_refresh_sale_payment(v_payment.sale_id);
  insert into public.business_sale_events (sale_id, event_type, amount, note)
  values (v_payment.sale_id, 'payment_void', v_payment.amount, left(btrim(p_reason), 1000));
end;
$$;

create or replace function public.business_set_sale_status(p_sale_id uuid, p_status text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale public.business_sales;
  v_status public.business_order_status;
begin
  if not private.can('business.sales.manage') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  v_status := p_status::public.business_order_status;
  if v_status = 'cancelled' then
    raise exception 'use_cancel' using errcode = '22023';
  end if;
  select * into v_sale from public.business_sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale_not_found' using errcode = 'P0002';
  end if;
  if v_sale.order_status = 'cancelled' then
    raise exception 'sale_cancelled' using errcode = 'P0001';
  end if;
  if v_sale.order_status = v_status then
    return;
  end if;
  perform private.business_set_rpc(true);
  update public.business_sales set order_status = v_status, status_changed_at = now() where id = p_sale_id;
  perform private.business_set_rpc(false);
  insert into public.business_sale_events (sale_id, event_type, from_status, to_status, note)
  values (p_sale_id, 'status', v_sale.order_status, v_status, nullif(left(btrim(coalesce(p_note, '')), 1000), ''));
end;
$$;

create or replace function public.business_cancel_sale(p_sale_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale public.business_sales;
  v_line record;
begin
  if not private.can('business.sales.manage') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  select * into v_sale from public.business_sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale_not_found' using errcode = 'P0002';
  end if;
  if v_sale.order_status = 'cancelled' then
    raise exception 'sale_cancelled' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.business_payments where sale_id = p_sale_id and not is_void) then
    raise exception 'has_payments' using errcode = 'P0001';
  end if;

  perform 1 from public.business_products
  where id in (select product_id from public.business_sale_items where sale_id = p_sale_id and deducts_stock)
  order by id
  for update;
  for v_line in
    select id, product_id, quantity from public.business_sale_items where sale_id = p_sale_id and deducts_stock order by position
  loop
    perform private.business_apply_movement(
      v_line.product_id, 'sale_return', v_line.quantity, v_sale.number || ' — ' || left(btrim(p_reason), 200),
      now(), null, true, p_sale_id, v_line.id, null, null
    );
  end loop;

  perform private.business_set_rpc(true);
  update public.business_sales
  set order_status = 'cancelled', status_changed_at = now(), cancelled_at = now(), cancel_reason = left(btrim(p_reason), 500)
  where id = p_sale_id;
  perform private.business_set_rpc(false);
  insert into public.business_sale_events (sale_id, event_type, from_status, to_status, note)
  values (p_sale_id, 'cancelled', v_sale.order_status, 'cancelled', left(btrim(p_reason), 1000));
end;
$$;

-- Payload: { client_key, label, category_id?, supplier_id?, amount, treatment, payment_method,
--   expense_date, reference?, description?, update_cost?, items?: [{ product_id, quantity, unit_cost }] }
create or replace function public.business_record_expense(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key uuid := (p_payload ->> 'client_key')::uuid;
  v_existing uuid;
  v_amount numeric(14, 2) := (p_payload ->> 'amount')::numeric;
  v_treatment public.business_expense_treatment := coalesce(nullif(p_payload ->> 'treatment', ''), 'operating')::public.business_expense_treatment;
  v_date date := (p_payload ->> 'expense_date')::date;
  v_supplier uuid := nullif(p_payload ->> 'supplier_id', '')::uuid;
  v_items jsonb := coalesce(p_payload -> 'items', '[]'::jsonb);
  v_update_cost boolean := coalesce((p_payload ->> 'update_cost')::boolean, true);
  v_expense uuid;
  v_label text := btrim(coalesce(p_payload ->> 'label', ''));
  v_item jsonb;
  v_qty numeric(14, 3);
  v_cost numeric(14, 2);
  v_lines_total numeric(14, 2) := 0;
  v_product public.business_products;
begin
  if not private.can('business.expenses.manage') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_key is null then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;
  select id into v_existing from public.business_expenses where client_key = v_key;
  if v_existing is not null then
    return v_existing;
  end if;
  if v_amount is null or v_amount <= 0 or v_amount <> round(v_amount, 2) then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;
  if v_date is null or v_date > (now() at time zone 'Africa/Casablanca')::date then
    raise exception 'future_date' using errcode = '22023';
  end if;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) > 50
     or (jsonb_array_length(v_items) > 0 and v_treatment <> 'stock_purchase') then
    raise exception 'invalid_items' using errcode = '22023';
  end if;
  if v_supplier is not null and not exists (select 1 from public.business_suppliers where id = v_supplier) then
    raise exception 'supplier_not_found' using errcode = 'P0002';
  end if;

  insert into public.business_expenses (
    label, category_id, supplier_id, amount, treatment, payment_method, expense_date, reference, description, client_key
  ) values (
    v_label, nullif(p_payload ->> 'category_id', '')::uuid, v_supplier, v_amount, v_treatment,
    (p_payload ->> 'payment_method')::public.business_payment_method, v_date,
    nullif(btrim(coalesce(p_payload ->> 'reference', '')), ''), nullif(btrim(coalesce(p_payload ->> 'description', '')), ''), v_key
  ) returning id into v_expense;

  perform 1 from public.business_products
  where id in (select nullif(e ->> 'product_id', '')::uuid from jsonb_array_elements(v_items) e)
  order by id
  for update;
  for v_item in select e from jsonb_array_elements(v_items) e loop
    v_qty := (v_item ->> 'quantity')::numeric;
    v_cost := (v_item ->> 'unit_cost')::numeric;
    if v_qty is null or v_qty <= 0 or v_qty <> round(v_qty, 3) or v_cost is null or v_cost < 0 or v_cost <> round(v_cost, 2) then
      raise exception 'invalid_line' using errcode = '22023';
    end if;
    select * into v_product from public.business_products where id = (v_item ->> 'product_id')::uuid;
    if not found or v_product.is_archived or not v_product.track_stock then
      raise exception 'product_not_found' using errcode = 'P0002';
    end if;
    insert into public.business_expense_items (expense_id, product_id, quantity, unit_cost, line_total)
    values (v_expense, v_product.id, v_qty, v_cost, round(v_qty * v_cost, 2));
    v_lines_total := v_lines_total + round(v_qty * v_cost, 2);
    perform private.business_apply_movement(
      v_product.id, 'purchase', v_qty, v_label, (v_date::timestamp + (now() at time zone 'Africa/Casablanca')::time) at time zone 'Africa/Casablanca',
      v_cost, false, null, null, v_expense, null
    );
    if v_update_cost then
      update public.business_products set purchase_cost = v_cost where id = v_product.id;
    end if;
  end loop;
  if v_lines_total > v_amount then
    raise exception 'lines_exceed_amount' using errcode = 'P0001';
  end if;
  return v_expense;
end;
$$;

create or replace function public.business_void_expense(p_expense_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expense public.business_expenses;
  v_line record;
begin
  if not private.can('business.finance.correct') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  select * into v_expense from public.business_expenses where id = p_expense_id for update;
  if not found then
    raise exception 'expense_not_found' using errcode = 'P0002';
  end if;
  if v_expense.is_void then
    raise exception 'already_void' using errcode = 'P0001';
  end if;
  perform 1 from public.business_products
  where id in (select product_id from public.business_expense_items where expense_id = p_expense_id)
  order by id
  for update;
  -- The purchased quantities leave the stock again (refused if they were already used).
  for v_line in select product_id, quantity from public.business_expense_items where expense_id = p_expense_id loop
    perform private.business_apply_movement(
      v_line.product_id, 'purchase_void', -v_line.quantity, v_expense.label || ' — ' || left(btrim(p_reason), 200),
      now(), null, false, null, null, p_expense_id, null
    );
  end loop;
  perform private.business_set_rpc(true);
  update public.business_expenses
  set is_void = true, voided_at = now(), voided_by = (select auth.uid()), void_reason = left(btrim(p_reason), 500)
  where id = p_expense_id;
  perform private.business_set_rpc(false);
end;
$$;

-- Links (or unlinks with p_customer_id = null) an existing request or contact message.
create or replace function public.business_link_customer(p_customer_id uuid, p_request_id uuid default null, p_inquiry_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.can('business.customers.manage') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if (p_request_id is null) = (p_inquiry_id is null) then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;
  if p_customer_id is not null and not exists (select 1 from public.business_customers where id = p_customer_id) then
    raise exception 'customer_not_found' using errcode = 'P0002';
  end if;
  if p_request_id is not null then
    if not private.can('requests.read') then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    update public.quotation_requests set customer_id = p_customer_id where id = p_request_id;
  else
    if not private.can('messages.read') then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    update public.inquiries set customer_id = p_customer_id where id = p_inquiry_id;
  end if;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.business_record_stock_movement(uuid, text, numeric, text, timestamptz, numeric, boolean, uuid) from public, anon;
revoke execute on function public.business_record_sale(jsonb) from public, anon;
revoke execute on function public.business_record_payment(uuid, numeric, text, uuid, timestamptz, text, text) from public, anon;
revoke execute on function public.business_void_payment(uuid, text) from public, anon;
revoke execute on function public.business_set_sale_status(uuid, text, text) from public, anon;
revoke execute on function public.business_cancel_sale(uuid, text) from public, anon;
revoke execute on function public.business_record_expense(jsonb) from public, anon;
revoke execute on function public.business_void_expense(uuid, text) from public, anon;
revoke execute on function public.business_link_customer(uuid, uuid, uuid) from public, anon;
grant execute on function public.business_record_stock_movement(uuid, text, numeric, text, timestamptz, numeric, boolean, uuid) to authenticated;
grant execute on function public.business_record_sale(jsonb) to authenticated;
grant execute on function public.business_record_payment(uuid, numeric, text, uuid, timestamptz, text, text) to authenticated;
grant execute on function public.business_void_payment(uuid, text) to authenticated;
grant execute on function public.business_set_sale_status(uuid, text, text) to authenticated;
grant execute on function public.business_cancel_sale(uuid, text) to authenticated;
grant execute on function public.business_record_expense(jsonb) to authenticated;
grant execute on function public.business_void_expense(uuid, text) to authenticated;
grant execute on function public.business_link_customer(uuid, uuid, uuid) to authenticated;

-- ─── 9. Row Level Security & grants ──────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'business_categories', 'business_suppliers', 'business_customers', 'business_customer_notes',
    'business_products', 'business_sales', 'business_sale_items', 'business_sale_events', 'business_payments',
    'business_expenses', 'business_expense_items', 'inventory_movements', 'business_activities',
    'business_activity_comments', 'business_attachments'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, delete on public.%I from authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select private.can(''business.read'')))', t || ': business readers read', t);
  end loop;
end;
$$;
revoke all on public.business_customer_balances from anon;
grant select on public.business_customer_balances to authenticated;

-- Ledgers and RPC-only tables: no direct writes at all.
revoke insert, update on public.inventory_movements, public.business_sale_items, public.business_sale_events,
  public.business_payments, public.business_expense_items from authenticated;
revoke insert on public.business_sales, public.business_expenses from authenticated;
-- Insert-only history.
revoke update on public.business_customer_notes, public.business_activity_comments, public.business_attachments from authenticated;

create policy "business_categories: managers insert" on public.business_categories
  for insert to authenticated
  with check ((kind = 'product' and (select private.can('business.products.manage')))
           or (kind = 'expense' and (select private.can('business.expenses.manage'))));
create policy "business_categories: managers update" on public.business_categories
  for update to authenticated
  using ((kind = 'product' and (select private.can('business.products.manage')))
      or (kind = 'expense' and (select private.can('business.expenses.manage'))))
  with check ((kind = 'product' and (select private.can('business.products.manage')))
           or (kind = 'expense' and (select private.can('business.expenses.manage'))));

create policy "business_suppliers: expense managers insert" on public.business_suppliers
  for insert to authenticated with check ((select private.can('business.expenses.manage')));
create policy "business_suppliers: expense managers update" on public.business_suppliers
  for update to authenticated
  using ((select private.can('business.expenses.manage'))) with check ((select private.can('business.expenses.manage')));

create policy "business_customers: customer managers insert" on public.business_customers
  for insert to authenticated with check ((select private.can('business.customers.manage')));
create policy "business_customers: customer managers update" on public.business_customers
  for update to authenticated
  using ((select private.can('business.customers.manage'))) with check ((select private.can('business.customers.manage')));

create policy "business_customer_notes: customer managers insert" on public.business_customer_notes
  for insert to authenticated
  with check ((select private.can('business.customers.manage')) and created_by = (select auth.uid()));

create policy "business_products: product managers insert" on public.business_products
  for insert to authenticated with check ((select private.can('business.products.manage')));
create policy "business_products: product managers update" on public.business_products
  for update to authenticated
  using ((select private.can('business.products.manage'))) with check ((select private.can('business.products.manage')));

create policy "business_sales: sales managers update details" on public.business_sales
  for update to authenticated
  using ((select private.can('business.sales.manage'))) with check ((select private.can('business.sales.manage')));

create policy "business_expenses: expense managers update details" on public.business_expenses
  for update to authenticated
  using ((select private.can('business.expenses.manage'))) with check ((select private.can('business.expenses.manage')));

create policy "business_activities: journal writers insert" on public.business_activities
  for insert to authenticated
  with check ((select private.can('business.journal.write')) and created_by = (select auth.uid()));
create policy "business_activities: journal writers update" on public.business_activities
  for update to authenticated
  using ((select private.can('business.journal.write'))) with check ((select private.can('business.journal.write')));

create policy "business_activity_comments: commenters insert" on public.business_activity_comments
  for insert to authenticated
  with check (((select private.can('business.journal.comment')) or (select private.can('business.journal.write')))
              and author_id = (select auth.uid()));

create policy "business_attachments: writers insert" on public.business_attachments
  for insert to authenticated
  with check (created_by = (select auth.uid()) and (
    (entity_type = 'expense' and (select private.can('business.expenses.manage')))
    or (entity_type = 'activity' and (select private.can('business.journal.write')))));
grant delete on public.business_attachments to authenticated;
create policy "business_attachments: writers delete" on public.business_attachments
  for delete to authenticated
  using ((entity_type = 'expense' and (select private.can('business.expenses.manage')))
      or (entity_type = 'activity' and (select private.can('business.journal.write'))));

-- ─── 10. Storage: private bucket for business files ──────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-files', 'business-files', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "business-files: business readers read" on storage.objects
  for select to authenticated
  using (bucket_id = 'business-files' and (select private.can('business.read')));
create policy "business-files: writers upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'business-files' and (
    ((storage.foldername(name))[1] = 'products' and (select private.can('business.products.manage')))
    or ((storage.foldername(name))[1] = 'expenses' and (select private.can('business.expenses.manage')))
    or ((storage.foldername(name))[1] = 'activities' and (select private.can('business.journal.write')))));
create policy "business-files: writers delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'business-files' and (
    ((storage.foldername(name))[1] = 'products' and (select private.can('business.products.manage')))
    or ((storage.foldername(name))[1] = 'expenses' and (select private.can('business.expenses.manage')))
    or ((storage.foldername(name))[1] = 'activities' and (select private.can('business.journal.write')))));

-- ─── 11. Audit ───────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'business_categories', 'business_suppliers', 'business_customers', 'business_customer_notes',
    'business_products', 'business_sales', 'business_sale_items', 'business_payments',
    'business_expenses', 'business_expense_items', 'inventory_movements', 'business_activities',
    'business_activity_comments', 'business_attachments'
  ] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function audit.capture(''id'')', 'audit_' || t, t);
  end loop;
end;
$$;
