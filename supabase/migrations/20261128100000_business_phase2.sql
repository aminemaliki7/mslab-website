-- MSLAB Business Management — Phase 2: overview figures, daily closing & reports, tasks
-- (docs/BUSINESS_MANAGEMENT.md, ADR-028). Requires 20261127100000 + 20261127100100.
--
-- * business_period_summary(from, to): every overview / closing figure, computed in Postgres from
--   the recorded rows (numeric, Morocco days). Money values are returned as text ("205.10").
-- * business_close_day(): stores a SNAPSHOT of that summary + the day's journal timeline + the
--   manager's notes. A closed report never changes when later rows change; corrections go
--   through business_correct_report() (permission + reason + old/new values kept).
-- * A closed day is locked: new sales, payments, stock movements, expenses and journal entries
--   dated on it are refused unless the member may correct reports (Administrator by default).
-- * Tasks: assigned by associates or the manager, progress by the assignee, status history
--   written by a trigger in the same transaction.

-- ─── Permissions ─────────────────────────────────────────────────────────────
insert into public.permissions (key, module, sort_order) values
  ('business.day.close',      'business', 110),
  ('business.reports.correct','business', 111),
  ('business.tasks.assign',   'business', 112),
  ('business.tasks.update',   'business', 113);

insert into public.role_permissions (role_id, permission_key)
select r.id, g.permission_key
from public.roles r
join (values
  ('gerant', 'business.day.close'), ('gerant', 'business.tasks.assign'), ('gerant', 'business.tasks.update'),
  ('associate', 'business.tasks.assign')
) as g(role_key, permission_key) on g.role_key = r.key;

-- ─── Types ───────────────────────────────────────────────────────────────────
create type public.business_report_status as enum ('closed', 'corrected');
create type public.business_task_status as enum ('todo', 'in_progress', 'completed', 'blocked');
create type public.business_task_priority as enum ('low', 'normal', 'high', 'urgent');

-- ─── Daily reports ───────────────────────────────────────────────────────────
create table public.business_daily_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null unique,
  status public.business_report_status not null default 'closed',
  version integer not null default 1 check (version >= 1),
  summary jsonb not null,
  timeline jsonb not null default '[]'::jsonb,
  observations text check (char_length(observations) <= 4000),
  problems text check (char_length(problems) <= 4000),
  decisions text check (char_length(decisions) <= 4000),
  priorities text check (char_length(priorities) <= 4000),
  closed_by uuid references public.admin_profiles (id) on delete set null,
  closed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.business_daily_reports is 'Daily closing reports (ADR-028): immutable snapshot; corrections only through business_correct_report.';
create index business_daily_reports_closed_by_idx on public.business_daily_reports (closed_by);

create table public.business_report_corrections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.business_daily_reports (id) on delete cascade,
  version integer not null,
  reason text not null check (char_length(btrim(reason)) between 3 and 500),
  previous jsonb not null,
  next jsonb not null,
  corrected_by uuid references public.admin_profiles (id) on delete set null,
  corrected_at timestamptz not null default now()
);
create index business_report_corrections_report_idx on public.business_report_corrections (report_id, version);
create index business_report_corrections_by_idx on public.business_report_corrections (corrected_by);

create table public.business_report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.business_daily_reports (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  author_id uuid not null default auth.uid() references public.admin_profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);
create index business_report_comments_report_idx on public.business_report_comments (report_id, created_at);
create index business_report_comments_author_idx on public.business_report_comments (author_id);

-- ─── Tasks ───────────────────────────────────────────────────────────────────
create table public.business_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text check (char_length(description) <= 4000),
  assigned_to uuid references public.admin_profiles (id) on delete set null,
  priority public.business_task_priority not null default 'normal',
  due_date date,
  status public.business_task_status not null default 'todo',
  customer_id uuid references public.business_customers (id) on delete set null,
  sale_id uuid references public.business_sales (id) on delete set null,
  report_id uuid references public.business_daily_reports (id) on delete set null,
  completed_at timestamptz,
  created_by uuid not null default auth.uid() references public.admin_profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index business_tasks_open_idx on public.business_tasks (status, due_date) where status <> 'completed';
create index business_tasks_assigned_idx on public.business_tasks (assigned_to, status);
create index business_tasks_created_by_idx on public.business_tasks (created_by);
create index business_tasks_customer_idx on public.business_tasks (customer_id);
create index business_tasks_sale_idx on public.business_tasks (sale_id);
create index business_tasks_report_idx on public.business_tasks (report_id);
create trigger business_tasks_updated_at before update on public.business_tasks
  for each row execute function public.set_updated_at();
create trigger business_tasks_protect before update on public.business_tasks
  for each row execute function private.business_protect_columns('created_by', 'created_at');

create table public.business_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.business_tasks (id) on delete cascade,
  kind text not null default 'comment' check (kind in ('comment', 'status')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  author_id uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index business_task_comments_task_idx on public.business_task_comments (task_id, created_at);
create index business_task_comments_author_idx on public.business_task_comments (author_id);

-- completed_at follows the status; every status change is written to the task history.
create or replace function private.business_task_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.completed_at := case when new.status = 'completed' then now() end;
    return new;
  end if;
  if new.status is distinct from old.status then
    new.completed_at := case when new.status = 'completed' then now() end;
    insert into public.business_task_comments (task_id, kind, body)
    values (new.id, 'status', old.status::text || '→' || new.status::text);
  end if;
  return new;
end;
$$;
revoke execute on function private.business_task_status() from public, anon, authenticated;
create trigger business_tasks_status before insert or update of status on public.business_tasks
  for each row execute function private.business_task_status();

-- ─── Closed-day lock ─────────────────────────────────────────────────────────
create or replace function private.business_day_closed(p_date date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.business_daily_reports where report_date = p_date);
$$;
revoke execute on function private.business_day_closed(date) from public, anon, authenticated;

-- TG_ARGV[0] = column, TG_ARGV[1] = 'ts' (timestamptz → Morocco date) or 'date'.
create or replace function private.business_guard_closed_day()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new date;
  v_old date;
begin
  if tg_argv[1] = 'date' then
    v_new := (to_jsonb(new) ->> tg_argv[0])::date;
    if tg_op = 'UPDATE' then v_old := (to_jsonb(old) ->> tg_argv[0])::date; end if;
  else
    v_new := ((to_jsonb(new) ->> tg_argv[0])::timestamptz at time zone 'Africa/Casablanca')::date;
    if tg_op = 'UPDATE' then v_old := ((to_jsonb(old) ->> tg_argv[0])::timestamptz at time zone 'Africa/Casablanca')::date; end if;
  end if;
  if (private.business_day_closed(v_new) or (v_old is not null and private.business_day_closed(v_old)))
     and not private.can('business.reports.correct') then
    raise exception 'day_closed' using errcode = 'P0001', detail = coalesce(v_old, v_new)::text;
  end if;
  return new;
end;
$$;
revoke execute on function private.business_guard_closed_day() from public, anon, authenticated;

create trigger business_sales_closed_day before insert on public.business_sales
  for each row execute function private.business_guard_closed_day('sold_at', 'ts');
create trigger business_payments_closed_day before insert on public.business_payments
  for each row execute function private.business_guard_closed_day('paid_at', 'ts');
create trigger inventory_movements_closed_day before insert on public.inventory_movements
  for each row execute function private.business_guard_closed_day('occurred_at', 'ts');
create trigger business_expenses_closed_day before insert on public.business_expenses
  for each row execute function private.business_guard_closed_day('expense_date', 'date');
create trigger business_activities_closed_day before insert or update on public.business_activities
  for each row execute function private.business_guard_closed_day('occurred_at', 'ts');

-- ─── Period summary (single source of every overview / closing figure) ───────
create or replace function private.business_summary(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_start timestamptz := (p_from::timestamp at time zone 'Africa/Casablanca');
  v_end timestamptz := ((p_to + 1)::timestamp at time zone 'Africa/Casablanca');
  v_today date := (now() at time zone 'Africa/Casablanca')::date;
  v_revenue numeric(14, 2);
  v_sales integer;
  v_receivable_period numeric(14, 2);
  v_collected numeric(14, 2);
  v_by_method jsonb;
  v_operating numeric(14, 2);
  v_stock numeric(14, 2);
  v_investment numeric(14, 2);
  v_result jsonb;
begin
  select coalesce(sum(total), 0), count(*), coalesce(sum(balance), 0)
  into v_revenue, v_sales, v_receivable_period
  from public.business_sales
  where sold_at >= v_start and sold_at < v_end and order_status <> 'cancelled';

  select coalesce(sum(amount), 0) into v_collected
  from public.business_payments where not is_void and paid_at >= v_start and paid_at < v_end;
  select coalesce(jsonb_object_agg(method, total::text), '{}'::jsonb) into v_by_method
  from (select method, sum(amount) as total from public.business_payments
        where not is_void and paid_at >= v_start and paid_at < v_end group by method) m;

  select coalesce(sum(amount) filter (where treatment = 'operating'), 0),
         coalesce(sum(amount) filter (where treatment = 'stock_purchase'), 0),
         coalesce(sum(amount) filter (where treatment = 'investment'), 0)
  into v_operating, v_stock, v_investment
  from public.business_expenses where not is_void and expense_date between p_from and p_to;

  v_result := jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'computed_at', now(),
    'revenue', v_revenue::text,
    'sales_count', v_sales,
    'collected', v_collected::text,
    'collected_by_method', v_by_method,
    'receivable_period', v_receivable_period::text,
    'receivable_total', (select coalesce(sum(balance), 0)::text from public.business_sales where order_status <> 'cancelled'),
    'expenses_operating', v_operating::text,
    'expenses_stock', v_stock::text,
    'expenses_investment', v_investment::text,
    'expenses_total', (v_operating + v_stock + v_investment)::text,
    'operating_result', (v_revenue - v_operating)::text,
    'new_customers', (select count(*) from public.business_customers where created_at >= v_start and created_at < v_end),
    'orders_completed', (select count(distinct sale_id) from public.business_sale_events
                         where event_type = 'status' and to_status = 'delivered' and created_at >= v_start and created_at < v_end),
    'orders_cancelled', (select count(*) from public.business_sale_events where event_type = 'cancelled' and created_at >= v_start and created_at < v_end),
    'orders_open', (select jsonb_object_agg(order_status, n) from (
                      select order_status, count(*) as n from public.business_sales
                      where order_status in ('new', 'confirmed', 'in_production', 'ready') group by order_status) o),
    'products_sold', (select coalesce(jsonb_agg(p order by p.revenue::numeric desc), '[]'::jsonb) from (
                        select i.product_id, max(i.description) as name, max(i.unit) as unit,
                               sum(i.quantity)::text as quantity, sum(i.line_total)::text as revenue
                        from public.business_sale_items i
                        join public.business_sales s on s.id = i.sale_id
                        where s.sold_at >= v_start and s.sold_at < v_end and s.order_status <> 'cancelled' and i.product_id is not null
                        group by i.product_id
                        order by sum(i.line_total) desc
                        limit 20) p),
    'movements', (select coalesce(jsonb_object_agg(movement_type, n), '{}'::jsonb) from (
                    select movement_type, count(*) as n from public.inventory_movements
                    where occurred_at >= v_start and occurred_at < v_end group by movement_type) m),
    'activities_count', (select count(*) from public.business_activities where occurred_at >= v_start and occurred_at < v_end),
    'production_completed', (select count(*) from public.business_activities
                             where activity_type = 'production_completed' and occurred_at >= v_start and occurred_at < v_end),
    'incidents', (select count(*) from public.business_activities
                  where activity_type = 'incident' and occurred_at >= v_start and occurred_at < v_end),
    'low_stock', (select count(*) from public.business_products
                  where not is_archived and track_stock and min_stock is not null and quantity_on_hand <= min_stock),
    'tasks_open', (select count(*) from public.business_tasks where status <> 'completed'),
    'tasks_overdue', (select count(*) from public.business_tasks where status <> 'completed' and due_date < v_today)
  );
  return v_result;
end;
$$;
revoke execute on function private.business_summary(date, date) from public, anon, authenticated;

create or replace function public.business_period_summary(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can('business.read') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 400 then
    raise exception 'invalid_period' using errcode = '22023';
  end if;
  return private.business_summary(p_from, p_to);
end;
$$;

-- ─── Closing & corrections ───────────────────────────────────────────────────
create or replace function private.business_day_timeline(p_date date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'at', a.occurred_at, 'type', a.activity_type, 'title', a.title,
      'description', a.description, 'responsible', coalesce(p.full_name, p.email::text)
    ) order by a.occurred_at), '[]'::jsonb)
  from public.business_activities a
  left join public.admin_profiles p on p.id = a.responsible_id
  where a.occurred_at >= (p_date::timestamp at time zone 'Africa/Casablanca')
    and a.occurred_at < ((p_date + 1)::timestamp at time zone 'Africa/Casablanca');
$$;
revoke execute on function private.business_day_timeline(date) from public, anon, authenticated;

create or replace function public.business_close_day(
  p_date date,
  p_observations text default null,
  p_problems text default null,
  p_decisions text default null,
  p_priorities text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.can('business.day.close') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_date is null or p_date > (now() at time zone 'Africa/Casablanca')::date then
    raise exception 'future_date' using errcode = '22023';
  end if;
  -- Serialise closings of the same day (unique index is the final guard).
  perform pg_advisory_xact_lock(hashtext('business_close_day:' || p_date::text));
  if private.business_day_closed(p_date) then
    raise exception 'already_closed' using errcode = 'P0001';
  end if;
  insert into public.business_daily_reports (report_date, summary, timeline, observations, problems, decisions, priorities, closed_by)
  values (
    p_date, private.business_summary(p_date, p_date), private.business_day_timeline(p_date),
    nullif(btrim(coalesce(p_observations, '')), ''), nullif(btrim(coalesce(p_problems, '')), ''),
    nullif(btrim(coalesce(p_decisions, '')), ''), nullif(btrim(coalesce(p_priorities, '')), ''),
    (select auth.uid())
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.business_correct_report(
  p_report_id uuid,
  p_reason text,
  p_observations text default null,
  p_problems text default null,
  p_decisions text default null,
  p_priorities text default null,
  p_refresh_figures boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.business_daily_reports;
  v_previous jsonb;
  v_next jsonb;
begin
  if not private.can('business.reports.correct') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  select * into v_report from public.business_daily_reports where id = p_report_id for update;
  if not found then
    raise exception 'report_not_found' using errcode = 'P0002';
  end if;
  v_previous := jsonb_build_object('observations', v_report.observations, 'problems', v_report.problems,
                                   'decisions', v_report.decisions, 'priorities', v_report.priorities);
  v_next := jsonb_build_object('observations', nullif(btrim(coalesce(p_observations, '')), ''), 'problems', nullif(btrim(coalesce(p_problems, '')), ''),
                               'decisions', nullif(btrim(coalesce(p_decisions, '')), ''), 'priorities', nullif(btrim(coalesce(p_priorities, '')), ''));
  if p_refresh_figures then
    v_previous := v_previous || jsonb_build_object('summary', v_report.summary, 'timeline', v_report.timeline);
    v_next := v_next || jsonb_build_object('summary', private.business_summary(v_report.report_date, v_report.report_date),
                                           'timeline', private.business_day_timeline(v_report.report_date));
  end if;
  if v_next = v_previous then
    raise exception 'no_change' using errcode = 'P0001';
  end if;
  update public.business_daily_reports
  set observations = v_next ->> 'observations', problems = v_next ->> 'problems',
      decisions = v_next ->> 'decisions', priorities = v_next ->> 'priorities',
      summary = coalesce(v_next -> 'summary', summary), timeline = coalesce(v_next -> 'timeline', timeline),
      status = 'corrected', version = version + 1, updated_at = now()
  where id = p_report_id;
  insert into public.business_report_corrections (report_id, version, reason, previous, next, corrected_by)
  values (p_report_id, v_report.version + 1, left(btrim(p_reason), 500), v_previous, v_next, (select auth.uid()));
end;
$$;

revoke execute on function public.business_period_summary(date, date) from public, anon;
revoke execute on function public.business_close_day(date, text, text, text, text) from public, anon;
revoke execute on function public.business_correct_report(uuid, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.business_period_summary(date, date) to authenticated;
grant execute on function public.business_close_day(date, text, text, text, text) to authenticated;
grant execute on function public.business_correct_report(uuid, text, text, text, text, text, boolean) to authenticated;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['business_daily_reports', 'business_report_corrections', 'business_report_comments',
                           'business_tasks', 'business_task_comments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, delete on public.%I from authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select private.can(''business.read'')))', t || ': business readers read', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function audit.capture(''id'')', 'audit_' || t, t);
  end loop;
end;
$$;
-- Reports and corrections: written only by the RPCs above. Comments and task history: insert-only.
revoke insert, update on public.business_daily_reports, public.business_report_corrections from authenticated;
revoke update on public.business_report_comments, public.business_task_comments from authenticated;

create policy "business_report_comments: commenters insert" on public.business_report_comments
  for insert to authenticated
  with check (author_id = (select auth.uid()) and (
    (select private.can('business.journal.comment')) or (select private.can('business.day.close'))
    or (select private.can('business.tasks.assign'))));

create policy "business_tasks: assigners insert" on public.business_tasks
  for insert to authenticated
  with check ((select private.can('business.tasks.assign')) and created_by = (select auth.uid()));
-- Assignee updates progress; creator edits what they asked for; administrators everything.
create policy "business_tasks: assignee, creator or administrator update" on public.business_tasks
  for update to authenticated
  using (
    (select private.can('roles.manage'))
    or ((select private.can('business.tasks.update')) and assigned_to = (select auth.uid()))
    or ((select private.can('business.tasks.assign')) and created_by = (select auth.uid()))
  )
  with check (
    (select private.can('roles.manage'))
    or ((select private.can('business.tasks.update')) and assigned_to = (select auth.uid()))
    or ((select private.can('business.tasks.assign')) and created_by = (select auth.uid()))
  );

create policy "business_task_comments: participants insert" on public.business_task_comments
  for insert to authenticated
  with check (kind = 'comment' and author_id = (select auth.uid()) and (
    (select private.can('business.tasks.update')) or (select private.can('business.tasks.assign'))
    or (select private.can('business.journal.comment'))));
