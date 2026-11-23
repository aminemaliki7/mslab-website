-- MSLAB ERP — Phase 0.1: generic audit log (docs/ERP_ARCHITECTURE.md §4.1, ADR-027).
--
-- * One append-only table in the non-exposed `audit` schema. Nothing (anon, authenticated) can
--   read or write it directly: reads go through permission-checked RPCs defined in the next
--   migration (they need private.can()).
-- * What is stored, to avoid copying customer data a second time:
--     INSERT → only who/when/which row (the row itself holds the data)
--     UPDATE → only the changed columns, as {"column": [old, new]}
--     DELETE → the full old row (the only remaining copy, needed to investigate)
--   Noise columns (updated_at, generated search text, IP hashes) are ignored.
-- * Triggers are attached per table with the primary-key column names as arguments, so
--   composite keys (staff_roles, role_permissions) get a readable row id "a:b".

create schema if not exists audit;
revoke all on schema audit from public, anon, authenticated;

create table audit.log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  table_name text not null check (char_length(table_name) <= 63),
  row_id text not null check (char_length(row_id) <= 200),
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  changes jsonb
);
comment on table audit.log is 'ERP audit trail (ADR-027). Append-only; read through public.audit_timeline / public.recent_activity.';
create index audit_log_row_idx on audit.log (table_name, row_id, occurred_at desc);
create index audit_log_occurred_idx on audit.log (occurred_at desc);
create index audit_log_actor_idx on audit.log (actor_id, occurred_at desc);
alter table audit.log enable row level security;
revoke all on audit.log from public, anon, authenticated;

create or replace function audit.capture()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_row jsonb;
  v_changes jsonb;
  v_row_id text;
  v_ignored text[] := array['updated_at', 'search_text', 'ip_hash'];
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(new);
  end if;
  v_row := coalesce(v_new, v_old);

  select string_agg(coalesce(v_row ->> col, ''), ':' order by ord)
  into v_row_id
  from unnest(tg_argv) with ordinality as a(col, ord);

  if tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, jsonb_build_array(v_old -> n.key, n.value))
    into v_changes
    from jsonb_each(v_new) as n
    where n.key <> all (v_ignored) and n.value is distinct from (v_old -> n.key);
    if v_changes is null then
      return null; -- only ignored columns changed
    end if;
  elsif tg_op = 'DELETE' then
    select coalesce(jsonb_object_agg(o.key, o.value), '{}'::jsonb)
    into v_changes
    from jsonb_each(v_old) as o
    where o.key <> all (v_ignored);
  end if;

  insert into audit.log (actor_id, table_name, row_id, action, changes)
  values ((select auth.uid()), tg_table_name, left(coalesce(v_row_id, ''), 200), tg_op, v_changes);
  return null;
end;
$$;
revoke execute on function audit.capture() from public, anon, authenticated;

-- ─── Existing tables (business records and website content) ────────────────────
create trigger audit_admin_profiles after insert or update or delete on public.admin_profiles
  for each row execute function audit.capture('id');
create trigger audit_quotation_requests after insert or update or delete on public.quotation_requests
  for each row execute function audit.capture('id');
create trigger audit_inquiries after insert or update or delete on public.inquiries
  for each row execute function audit.capture('id');
create trigger audit_products after insert or update or delete on public.products
  for each row execute function audit.capture('id');
create trigger audit_product_images after insert or update or delete on public.product_images
  for each row execute function audit.capture('id');
create trigger audit_categories after insert or update or delete on public.categories
  for each row execute function audit.capture('id');
create trigger audit_services after insert or update or delete on public.services
  for each row execute function audit.capture('id');
create trigger audit_portfolio_items after insert or update or delete on public.portfolio_items
  for each row execute function audit.capture('id');
create trigger audit_production_options after insert or update or delete on public.production_options
  for each row execute function audit.capture('id');
create trigger audit_site_settings after insert or update or delete on public.site_settings
  for each row execute function audit.capture('id');
create trigger audit_mockup_products after insert or update or delete on public.mockup_products
  for each row execute function audit.capture('key');
create trigger audit_studio_products after insert or update or delete on public.studio_products
  for each row execute function audit.capture('key');
create trigger audit_studio_views after insert or update or delete on public.studio_views
  for each row execute function audit.capture('id');
create trigger audit_studio_options after insert or update or delete on public.studio_options
  for each row execute function audit.capture('id');
