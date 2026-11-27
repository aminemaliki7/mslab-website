-- MSLAB Business Management — Phase 3: analytics and internal notifications
-- (docs/BUSINESS_MANAGEMENT.md, ADR-028). Requires 20261128100000.
--
-- * business_analytics(from, to, granularity): trends, expense breakdown, sales by product,
--   inventory valuation, customer activity, receivables ageing, order completion — computed in
--   Postgres (numeric; money returned as text), Morocco days, at most 400 days.
-- * Internal notifications reuse public.notifications (ERP Phase 0) with new types, created by
--   triggers in the same transaction as the event. No external service. Overdue tasks are
--   notified once per task when the assignee's notifications are synchronised (no scheduler on
--   this project).

-- ─── Analytics ───────────────────────────────────────────────────────────────
create or replace function public.business_analytics(p_from date, p_to date, p_granularity text default 'day')
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
  v_step interval;
begin
  if not private.can('business.read') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 400 then
    raise exception 'invalid_period' using errcode = '22023';
  end if;
  if p_granularity not in ('day', 'week', 'month') then
    raise exception 'invalid_period' using errcode = '22023';
  end if;
  v_step := ('1 ' || p_granularity)::interval;

  return jsonb_build_object(
    'from', p_from, 'to', p_to, 'granularity', p_granularity, 'computed_at', now(),

    -- Revenue / collected / operating expenses / cash out per bucket (empty buckets included).
    'series', (
      with buckets as (
        select gs::date as bucket
        from generate_series(date_trunc(p_granularity, p_from::timestamp), p_to::timestamp, v_step) gs
      ),
      s as (
        select date_trunc(p_granularity, sold_at at time zone 'Africa/Casablanca')::date as bucket, sum(total) as revenue, count(*) as n
        from public.business_sales
        where sold_at >= v_start and sold_at < v_end and order_status <> 'cancelled'
        group by 1
      ),
      p as (
        select date_trunc(p_granularity, paid_at at time zone 'Africa/Casablanca')::date as bucket, sum(amount) as collected
        from public.business_payments
        where not is_void and paid_at >= v_start and paid_at < v_end
        group by 1
      ),
      e as (
        select date_trunc(p_granularity, expense_date::timestamp)::date as bucket,
               sum(amount) filter (where treatment = 'operating') as operating, sum(amount) as cash_out
        from public.business_expenses
        where not is_void and expense_date between p_from and p_to
        group by 1
      )
      select coalesce(jsonb_agg(jsonb_build_object(
          'bucket', b.bucket,
          'revenue', coalesce(s.revenue, 0)::text,
          'sales', coalesce(s.n, 0),
          'collected', coalesce(p.collected, 0)::text,
          'operating', coalesce(e.operating, 0)::text,
          'cash_out', coalesce(e.cash_out, 0)::text
        ) order by b.bucket), '[]'::jsonb)
      from buckets b
      left join s on s.bucket = b.bucket
      left join p on p.bucket = b.bucket
      left join e on e.bucket = b.bucket
    ),

    'expenses_by_category', (
      select coalesce(jsonb_agg(x order by x.amount::numeric desc), '[]'::jsonb) from (
        select c.name as category, e.treatment, count(*) as count, sum(e.amount)::text as amount
        from public.business_expenses e
        left join public.business_categories c on c.id = e.category_id
        where not e.is_void and e.expense_date between p_from and p_to
        group by c.name, e.treatment
      ) x
    ),

    -- Revenue per product; estimated cost from the purchase cost recorded on each line.
    'sales_by_product', (
      select coalesce(jsonb_agg(x order by x.revenue::numeric desc), '[]'::jsonb) from (
        select i.product_id, coalesce(max(bp.name), max(i.description)) as name, max(i.unit) as unit,
               sum(i.quantity)::text as quantity, sum(i.line_total)::text as revenue, count(distinct i.sale_id) as sales,
               sum(round(i.quantity * i.unit_cost, 2)) filter (where i.unit_cost is not null)::text as cost,
               bool_and(i.unit_cost is not null) as cost_complete
        from public.business_sale_items i
        join public.business_sales s on s.id = i.sale_id
        left join public.business_products bp on bp.id = i.product_id
        where s.sold_at >= v_start and s.sold_at < v_end and s.order_status <> 'cancelled' and i.product_id is not null
        group by i.product_id
        order by sum(i.line_total) desc
        limit 50
      ) x
    ),
    'custom_lines', (
      select jsonb_build_object('count', count(*), 'revenue', coalesce(sum(i.line_total), 0)::text)
      from public.business_sale_items i
      join public.business_sales s on s.id = i.sale_id
      where s.sold_at >= v_start and s.sold_at < v_end and s.order_status <> 'cancelled' and i.product_id is null
    ),

    -- Current stock value at purchase cost (not period-bound).
    'inventory', (
      select coalesce(jsonb_agg(x order by x.value::numeric desc), '[]'::jsonb) from (
        select c.name as category, count(*) as products,
               coalesce(sum(round(p.quantity_on_hand * p.purchase_cost, 2)) filter (where p.purchase_cost is not null and p.quantity_on_hand > 0), 0)::text as value,
               count(*) filter (where p.purchase_cost is null) as missing_cost,
               count(*) filter (where p.min_stock is not null and p.quantity_on_hand <= p.min_stock) as low
        from public.business_products p
        left join public.business_categories c on c.id = p.category_id
        where not p.is_archived and p.track_stock
        group by c.name
      ) x
    ),

    'customers', jsonb_build_object(
      'active', (select count(distinct customer_id) from public.business_sales
                 where customer_id is not null and order_status <> 'cancelled' and sold_at >= v_start and sold_at < v_end),
      'new', (select count(*) from public.business_customers where created_at >= v_start and created_at < v_end),
      'walk_in_revenue', (select coalesce(sum(total), 0)::text from public.business_sales
                          where customer_id is null and order_status <> 'cancelled' and sold_at >= v_start and sold_at < v_end),
      'top', (select coalesce(jsonb_agg(x order by x.revenue::numeric desc), '[]'::jsonb) from (
                select c.id, c.name, count(s.id) as sales, sum(s.total)::text as revenue,
                       (select coalesce(sum(s2.balance), 0) from public.business_sales s2
                        where s2.customer_id = c.id and s2.order_status <> 'cancelled')::text as balance
                from public.business_sales s
                join public.business_customers c on c.id = s.customer_id
                where s.order_status <> 'cancelled' and s.sold_at >= v_start and s.sold_at < v_end
                group by c.id, c.name
                order by sum(s.total) desc
                limit 20) x)
    ),

    -- What customers still owe today, by age of the sale (not period-bound).
    'receivables_ageing', (
      select jsonb_object_agg(bucket, jsonb_build_object('count', n, 'amount', amount::text)) from (
        select case
                 when v_today - (sold_at at time zone 'Africa/Casablanca')::date <= 30 then '0_30'
                 when v_today - (sold_at at time zone 'Africa/Casablanca')::date <= 60 then '31_60'
                 when v_today - (sold_at at time zone 'Africa/Casablanca')::date <= 90 then '61_90'
                 else '90_plus' end as bucket,
               count(*) as n, sum(balance) as amount
        from public.business_sales
        where order_status <> 'cancelled' and balance > 0
        group by 1
      ) a
    ),

    -- Orders of the period and where they are now.
    'orders', (
      select jsonb_build_object(
        'total', count(*),
        'cancelled', count(*) filter (where order_status = 'cancelled'),
        'delivered', count(*) filter (where order_status = 'delivered'),
        'open', count(*) filter (where order_status in ('new', 'confirmed', 'in_production', 'ready'))
      )
      from public.business_sales where sold_at >= v_start and sold_at < v_end
    )
  );
end;
$$;
revoke execute on function public.business_analytics(date, date, text) from public, anon;
grant execute on function public.business_analytics(date, date, text) to authenticated;

-- ─── Notifications ───────────────────────────────────────────────────────────
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'request.new', 'message.new',
  'report.closed', 'task.assigned', 'task.overdue', 'stock.low', 'order.new', 'payment.received', 'incident.reported'
));
alter table public.notifications drop constraint notifications_entity_type_check;
alter table public.notifications add constraint notifications_entity_type_check check (entity_type in (
  'quotation_request', 'inquiry', 'daily_report', 'task', 'product', 'sale', 'activity'
));
create unique index notifications_task_overdue_once_idx on public.notifications (recipient_id, entity_id) where type = 'task.overdue';

-- One row per active member holding the permission, except the person who caused the event.
create or replace function private.business_notify(
  p_type text, p_entity_type text, p_entity_id uuid, p_reference text, p_permission text, p_exclude uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_id, type, entity_type, entity_id, reference)
  select a.id, p_type, p_entity_type, p_entity_id, left(p_reference, 40)
  from public.admin_profiles a
  where a.is_active and a.id is distinct from p_exclude and private.staff_can(a.id, p_permission);
$$;
revoke execute on function private.business_notify(text, text, uuid, text, text, uuid) from public, anon, authenticated;

create or replace function private.business_notify_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  case tg_table_name
    when 'business_daily_reports' then
      perform private.business_notify('report.closed', 'daily_report', new.id, new.report_date::text, 'business.read', new.closed_by);
    when 'business_sales' then
      perform private.business_notify('order.new', 'sale', new.id, new.number, 'business.read', coalesce(new.created_by, v_actor));
    when 'business_payments' then
      perform private.business_notify('payment.received', 'sale', new.sale_id,
        (select number from public.business_sales where id = new.sale_id), 'business.read', coalesce(new.created_by, v_actor));
    when 'business_activities' then
      if new.activity_type = 'incident' then
        perform private.business_notify('incident.reported', 'activity', new.id, new.title, 'business.read', coalesce(new.created_by, v_actor));
      end if;
    when 'business_tasks' then
      if new.assigned_to is not null and new.assigned_to is distinct from v_actor
         and (tg_op = 'INSERT' or new.assigned_to is distinct from old.assigned_to)
         and exists (select 1 from public.admin_profiles where id = new.assigned_to and is_active) then
        insert into public.notifications (recipient_id, type, entity_type, entity_id, reference)
        values (new.assigned_to, 'task.assigned', 'task', new.id, left(new.title, 40));
      end if;
    when 'business_products' then
      if new.track_stock and new.min_stock is not null and not new.is_archived
         and new.quantity_on_hand <= new.min_stock and old.quantity_on_hand > old.min_stock then
        perform private.business_notify('stock.low', 'product', new.id, new.name, 'business.stock.manage', null);
      end if;
  end case;
  return null;
end;
$$;
revoke execute on function private.business_notify_event() from public, anon, authenticated;

create trigger business_daily_reports_notify after insert on public.business_daily_reports
  for each row execute function private.business_notify_event();
create trigger business_sales_notify after insert on public.business_sales
  for each row execute function private.business_notify_event();
create trigger business_payments_notify after insert on public.business_payments
  for each row execute function private.business_notify_event();
create trigger business_activities_notify after insert on public.business_activities
  for each row execute function private.business_notify_event();
create trigger business_tasks_notify after insert or update of assigned_to on public.business_tasks
  for each row execute function private.business_notify_event();
create trigger business_products_notify after update of quantity_on_hand on public.business_products
  for each row execute function private.business_notify_event();

-- Called when the signed-in member's notifications are read: adds one "overdue" notice per task
-- assigned to them that is past due (never twice), then returns the unread count.
create or replace function public.business_sync_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_count integer;
begin
  if not private.is_staff() then
    return 0;
  end if;
  insert into public.notifications (recipient_id, type, entity_type, entity_id, reference)
  select v_user, 'task.overdue', 'task', t.id, left(t.title, 40)
  from public.business_tasks t
  where t.assigned_to = v_user and t.status <> 'completed'
    and t.due_date < (now() at time zone 'Africa/Casablanca')::date
  on conflict (recipient_id, entity_id) where type = 'task.overdue' do nothing;
  select count(*) into v_count from public.notifications where recipient_id = v_user and read_at is null;
  return v_count;
end;
$$;
revoke execute on function public.business_sync_notifications() from public, anon;
grant execute on function public.business_sync_notifications() to authenticated;
