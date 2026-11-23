-- MSLAB ERP — Phase 0.3: internal settings, tax rates, document numbering, notifications
-- (docs/ERP_ARCHITECTURE.md §4.1, ADR-027).
--
-- * erp_settings is a STAFF-ONLY singleton. Company identity (name, legal name, address, RC, ICE…)
--   is NOT duplicated: it stays in site_settings / site_settings.legal_facts (ADR-014, ADR-025).
-- * tax_rates: empty on purpose — rates are entered by MSLAB (decision D4), never invented.
-- * Document numbering is gapless per type and year: private.next_document_number() increments a
--   counter row inside the caller's transaction, so a rolled-back document gives its number back.
--   Only SECURITY DEFINER business RPCs of later phases call it.
-- * notifications: per staff member, created by triggers when a request or a message arrives, for
--   the members allowed to see it. Only references are stored (no customer data copy).

-- ─── Internal settings ───────────────────────────────────────────────────────
create table public.erp_settings (
  id smallint primary key default 1 check (id = 1),
  default_currency char(3) not null default 'MAD' check (default_currency ~ '^[A-Z]{3}$'),
  payment_terms_days integer check (payment_terms_days between 0 and 365),
  quote_validity_days integer check (quote_validity_days between 1 and 365),
  discount_approval_pct numeric(5, 2) check (discount_approval_pct between 0 and 100),
  bank_name text check (char_length(bank_name) <= 120),
  bank_account text check (char_length(bank_account) <= 64),
  document_footer text check (char_length(document_footer) <= 1000),
  updated_by uuid references public.admin_profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
comment on table public.erp_settings is 'Internal ERP settings (ADR-027). Never public. Company identity lives in site_settings.';
create index erp_settings_updated_by_idx on public.erp_settings (updated_by);
create trigger erp_settings_updated_at before update on public.erp_settings
  for each row execute function public.set_updated_at();
insert into public.erp_settings (id) values (1);

create table public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{1,20}$'),
  label text not null check (char_length(label) between 1 and 80),
  rate numeric(5, 2) not null check (rate between 0 and 100),
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tax_rates_default_is_active check (not is_default or is_active)
);
create unique index tax_rates_one_default_idx on public.tax_rates (is_default) where is_default;
create trigger tax_rates_updated_at before update on public.tax_rates
  for each row execute function public.set_updated_at();

-- ─── Document numbering ──────────────────────────────────────────────────────
create table public.document_sequences (
  doc_type text primary key check (doc_type in (
    'quote', 'sales_order', 'delivery_note', 'invoice', 'credit_note',
    'purchase_request', 'purchase_order', 'goods_receipt', 'production_order', 'project'
  )),
  prefix text not null check (prefix ~ '^[A-Z0-9]{1,10}$'),
  padding smallint not null default 5 check (padding between 3 and 8),
  yearly_reset boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
create trigger document_sequences_updated_at before update on public.document_sequences
  for each row execute function public.set_updated_at();

-- Default prefixes = usual French document abbreviations; editable in /admin/settings/company.
insert into public.document_sequences (doc_type, prefix, sort_order) values
  ('quote', 'DEV', 10), ('sales_order', 'BC', 20), ('delivery_note', 'BL', 30),
  ('invoice', 'FAC', 40), ('credit_note', 'AV', 50), ('purchase_request', 'DA', 60),
  ('purchase_order', 'BCF', 70), ('goods_receipt', 'BR', 80), ('production_order', 'OF', 90),
  ('project', 'PRJ', 100);

create table public.document_counters (
  doc_type text not null references public.document_sequences (doc_type) on delete cascade,
  period integer not null check (period = 0 or period between 2000 and 2999),
  last_value bigint not null check (last_value >= 1),
  primary key (doc_type, period)
);

-- Format: PREFIX-YYYY-00001 (yearly reset) or PREFIX-00001.
create or replace function private.next_document_number(p_doc_type text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seq public.document_sequences;
  v_period integer;
  v_value bigint;
begin
  select * into v_seq from public.document_sequences where doc_type = p_doc_type;
  if not found then
    raise exception 'unknown_document_type' using errcode = '22023';
  end if;
  v_period := case when v_seq.yearly_reset
    then extract(year from (now() at time zone 'Africa/Casablanca'))::integer else 0 end;

  insert into public.document_counters as c (doc_type, period, last_value)
  values (p_doc_type, v_period, 1)
  on conflict (doc_type, period) do update set last_value = c.last_value + 1
  returning c.last_value into v_value;

  return v_seq.prefix || '-'
    || case when v_seq.yearly_reset then v_period::text || '-' else '' end
    || lpad(v_value::text, v_seq.padding, '0');
end;
$$;
revoke execute on function private.next_document_number(text) from public, anon, authenticated;

-- ─── Notifications ───────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.admin_profiles (id) on delete cascade,
  type text not null check (type in ('request.new', 'message.new')),
  entity_type text not null check (entity_type in ('quotation_request', 'inquiry')),
  entity_id uuid not null,
  reference text check (char_length(reference) <= 40),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, read_at, created_at desc);
create index notifications_entity_idx on public.notifications (entity_type, entity_id);

create or replace function private.notify_new_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (recipient_id, type, entity_type, entity_id, reference)
  select a.id, 'request.new', 'quotation_request', new.id, new.reference
  from public.admin_profiles a
  where a.is_active and (
    private.staff_can(a.id, 'requests.read')
    or (new.kind = 'custom' and private.staff_can(a.id, 'requests.read.custom'))
    or (new.kind = 'digital' and private.staff_can(a.id, 'requests.read.digital'))
  );
  delete from public.notifications where read_at < now() - interval '90 days';
  return null;
end;
$$;

create or replace function private.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (recipient_id, type, entity_type, entity_id, reference)
  select a.id, 'message.new', 'inquiry', new.id, new.reference
  from public.admin_profiles a
  where a.is_active and private.staff_can(a.id, 'messages.read');
  return null;
end;
$$;
revoke execute on function private.notify_new_request() from public, anon, authenticated;
revoke execute on function private.notify_new_message() from public, anon, authenticated;

create trigger quotation_requests_notify after insert on public.quotation_requests
  for each row execute function private.notify_new_request();
create trigger inquiries_notify after insert on public.inquiries
  for each row execute function private.notify_new_message();

-- Mark own notifications as read (all when p_ids is null). Returns the number updated.
create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not private.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.notifications
  set read_at = now()
  where recipient_id = (select auth.uid()) and read_at is null
    and (p_ids is null or id = any (p_ids));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke execute on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.erp_settings enable row level security;
alter table public.tax_rates enable row level security;
alter table public.document_sequences enable row level security;
alter table public.document_counters enable row level security;
alter table public.notifications enable row level security;
revoke all on public.erp_settings, public.tax_rates, public.document_sequences, public.document_counters, public.notifications from anon;
revoke truncate on public.erp_settings, public.tax_rates, public.document_sequences, public.document_counters, public.notifications from authenticated;
revoke insert, delete on public.erp_settings from authenticated;
revoke insert, delete on public.document_sequences from authenticated;
revoke insert, update, delete on public.document_counters, public.notifications from authenticated;

create policy "erp_settings: settings readers read" on public.erp_settings
  for select to authenticated
  using ((select private.can('settings.company.read')) or (select private.can('settings.company.manage')));
create policy "erp_settings: settings managers update" on public.erp_settings
  for update to authenticated
  using ((select private.can('settings.company.manage'))) with check ((select private.can('settings.company.manage')));

-- Tax rates are needed by every role that will prepare documents: staff read, managers write.
create policy "tax_rates: staff reads" on public.tax_rates
  for select to authenticated using ((select private.is_staff()));
create policy "tax_rates: settings managers insert" on public.tax_rates
  for insert to authenticated with check ((select private.can('settings.company.manage')));
create policy "tax_rates: settings managers update" on public.tax_rates
  for update to authenticated
  using ((select private.can('settings.company.manage'))) with check ((select private.can('settings.company.manage')));
create policy "tax_rates: settings managers delete" on public.tax_rates
  for delete to authenticated using ((select private.can('settings.company.manage')));

create policy "document_sequences: settings readers read" on public.document_sequences
  for select to authenticated
  using ((select private.can('settings.company.read')) or (select private.can('settings.company.manage')));
create policy "document_sequences: settings managers update" on public.document_sequences
  for update to authenticated
  using ((select private.can('settings.company.manage'))) with check ((select private.can('settings.company.manage')));

create policy "document_counters: settings readers read" on public.document_counters
  for select to authenticated
  using ((select private.can('settings.company.read')) or (select private.can('settings.company.manage')));

create policy "notifications: recipient reads own" on public.notifications
  for select to authenticated
  using (recipient_id = (select auth.uid()) and (select private.is_staff()));

-- ─── Audit ───────────────────────────────────────────────────────────────────
create trigger audit_erp_settings after insert or update or delete on public.erp_settings
  for each row execute function audit.capture('id');
create trigger audit_tax_rates after insert or update or delete on public.tax_rates
  for each row execute function audit.capture('id');
create trigger audit_document_sequences after insert or update or delete on public.document_sequences
  for each row execute function audit.capture('doc_type');
