-- MSLAB — Digital Solutions quote requests (web projects), 2026-11-21.
--
-- * A web project request is a quotation_request with kind = 'digital', so it lands in the same
--   admin inbox and order tracking as the other requests; its project details live in
--   digital_request_details (1:1).
-- * Project types and features are stored as stable KEYS (validated against an allow-list
--   here and in the server action); the admin shows them with localized labels.
-- * One quotation_item is created ("Solutions digitales", quantity 1) so existing lists, counts
--   and e-mails keep working unchanged.
-- * Same protections as submit_custom_request: server submission key, idempotent on
--   submission_id, 5 requests / 10 min per IP hash, SECURITY DEFINER with an empty search_path.

alter type public.request_kind add value if not exists 'digital';

create table public.digital_request_details (
  quotation_request_id uuid primary key references public.quotation_requests (id) on delete cascade,
  project_types text[] not null check (
    cardinality(project_types) between 1 and 6
    and project_types <@ array['corporate', 'ecommerce', 'webapp', 'platform', 'uiux', 'maintenance']
  ),
  description text not null check (char_length(description) between 10 and 5000),
  features text[] not null default '{}' check (
    cardinality(features) <= 8
    and features <@ array['multilingual', 'payment', 'accounts', 'booking', 'content', 'backoffice', 'integrations', 'seo']
  ),
  existing_website text check (char_length(existing_website) <= 300 and existing_website ~ '^https?://'),
  budget text check (char_length(budget) <= 120),
  deadline date,
  created_at timestamptz not null default now()
);

-- ─── RLS & grants: only admins read; writes only through the RPC below ─────────
alter table public.digital_request_details enable row level security;
revoke insert, update, delete, truncate on public.digital_request_details from anon, authenticated;
revoke select on public.digital_request_details from anon;
create policy "digital_request_details: admin reads" on public.digital_request_details
  for select to authenticated using ((select private.is_admin()));

-- ─── Public submission RPC ───────────────────────────────────────────────────
create or replace function public.submit_digital_request(payload jsonb, submission_key text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission uuid;
  v_ip text := nullif(payload ->> 'ip_hash', '');
  v_request_id uuid;
  v_reference text;
  v_types text[];
  v_features text[] := '{}';
begin
  perform private.check_submission_key(submission_key);

  begin
    v_submission := (payload ->> 'submission_id')::uuid;
  exception when invalid_text_representation then
    raise exception 'invalid_payload' using errcode = '22023';
  end;
  if v_submission is null or jsonb_typeof(payload -> 'project_types') <> 'array' then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  -- Idempotent: a double submit returns the first reference.
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

  select coalesce(array_agg(distinct value), '{}') into v_types
  from jsonb_array_elements_text(payload -> 'project_types') as value;
  if jsonb_typeof(payload -> 'features') = 'array' then
    select coalesce(array_agg(distinct value), '{}') into v_features
    from jsonb_array_elements_text(payload -> 'features') as value;
  end if;
  -- Unknown keys are rejected by the table CHECK constraints (allow-lists).

  insert into public.quotation_requests (
    submission_id, kind, full_name, email, phone, company_name, message, preferred_contact,
    locale, source_path, consent, ip_hash
  ) values (
    v_submission,
    'digital',
    btrim(payload ->> 'full_name'),
    lower(btrim(payload ->> 'email')),
    btrim(payload ->> 'phone'),
    nullif(btrim(payload ->> 'company_name'), ''),
    null,
    coalesce((payload ->> 'preferred_contact')::public.contact_method, 'email'),
    coalesce(payload ->> 'locale', 'fr'),
    left(payload ->> 'source_path', 300),
    coalesce((payload ->> 'consent')::boolean, false),
    v_ip
  )
  returning id, reference into v_request_id, v_reference;

  insert into public.quotation_items (quotation_request_id, product_name_snapshot, quantity, sort_order)
  values (v_request_id, 'Solutions digitales', 1, 0);

  insert into public.digital_request_details (
    quotation_request_id, project_types, description, features, existing_website, budget, deadline
  ) values (
    v_request_id,
    v_types,
    btrim(payload ->> 'description'),
    v_features,
    nullif(btrim(payload ->> 'existing_website'), ''),
    nullif(btrim(payload ->> 'budget'), ''),
    nullif(payload ->> 'deadline', '')::date
  );

  return v_reference;
end;
$$;
revoke execute on function public.submit_digital_request(jsonb, text) from public;
grant execute on function public.submit_digital_request(jsonb, text) to anon, authenticated;
