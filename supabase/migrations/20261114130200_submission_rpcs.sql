-- MSLAB — public submission entry points (contact + quotation).
--
-- Visitors never write to tables directly. The Next.js server action validates input (Zod),
-- runs anti-spam checks, then calls these SECURITY DEFINER functions with:
--   * a server-held submission key — only its SHA-256 hash is stored here (private.app_config),
--     so calls made directly with the public API key are rejected;
--   * an ip_hash used for rate limiting; and a submission_id for idempotency.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table private.app_config enable row level security;
revoke all on private.app_config from public, anon, authenticated;
comment on table private.app_config is
  'Server-side configuration. submission_key_sha256 = hex SHA-256 of FORM_SUBMISSION_KEY (set per environment).';

create or replace function private.check_submission_key(submission_key text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  expected text;
begin
  select value into expected from private.app_config where key = 'submission_key_sha256';
  if expected is null
     or submission_key is null
     or encode(extensions.digest(convert_to(submission_key, 'UTF8'), 'sha256'), 'hex') <> expected then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;
revoke all on function private.check_submission_key(text) from public, anon, authenticated;

-- ─── Contact inquiry ─────────────────────────────────────────────────────────
create or replace function public.submit_contact_inquiry(payload jsonb, submission_key text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission uuid;
  v_ip text := nullif(payload ->> 'ip_hash', '');
  v_reference text;
begin
  perform private.check_submission_key(submission_key);

  begin
    v_submission := (payload ->> 'submission_id')::uuid;
  exception when invalid_text_representation then
    raise exception 'invalid_payload' using errcode = '22023';
  end;
  if v_submission is null then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  -- Idempotency: a retried submission returns the original reference.
  select reference into v_reference from public.inquiries where submission_id = v_submission;
  if found then
    return v_reference;
  end if;

  if v_ip is not null and (
    select count(*) from public.inquiries
    where ip_hash = v_ip and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.inquiries (
    submission_id, full_name, email, phone, subject, message, locale, source_path, consent, ip_hash
  ) values (
    v_submission,
    btrim(payload ->> 'full_name'),
    lower(btrim(payload ->> 'email')),
    nullif(btrim(payload ->> 'phone'), ''),
    btrim(payload ->> 'subject'),
    btrim(payload ->> 'message'),
    coalesce(payload ->> 'locale', 'fr'),
    left(payload ->> 'source_path', 300),
    coalesce((payload ->> 'consent')::boolean, false),
    v_ip
  )
  returning reference into v_reference;

  return v_reference;
end;
$$;

-- ─── Quotation request (one or many items, catalog or custom) ───────────────
create or replace function public.submit_quotation_request(payload jsonb, submission_key text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission uuid;
  v_ip text := nullif(payload ->> 'ip_hash', '');
  v_locale text := coalesce(payload ->> 'locale', 'fr');
  v_items jsonb := payload -> 'items';
  v_request_id uuid;
  v_reference text;
  v_item jsonb;
  v_index integer := 0;
  v_product_id uuid;
  v_name text;
  v_sku text;
begin
  perform private.check_submission_key(submission_key);

  begin
    v_submission := (payload ->> 'submission_id')::uuid;
  exception when invalid_text_representation then
    raise exception 'invalid_payload' using errcode = '22023';
  end;
  if v_submission is null
     or jsonb_typeof(v_items) is distinct from 'array'
     or jsonb_array_length(v_items) not between 1 and 50 then
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

  insert into public.quotation_requests (
    submission_id, full_name, email, phone, company_name, message, preferred_contact,
    locale, source_path, consent, ip_hash
  ) values (
    v_submission,
    btrim(payload ->> 'full_name'),
    lower(btrim(payload ->> 'email')),
    btrim(payload ->> 'phone'),
    nullif(btrim(payload ->> 'company_name'), ''),
    nullif(btrim(payload ->> 'message'), ''),
    coalesce((payload ->> 'preferred_contact')::public.contact_method, 'email'),
    v_locale,
    left(payload ->> 'source_path', 300),
    coalesce((payload ->> 'consent')::boolean, false),
    v_ip
  )
  returning id, reference into v_request_id, v_reference;

  for v_item in select value from jsonb_array_elements(v_items)
  loop
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;

    if v_product_id is not null then
      -- Catalog item: name and SKU are taken from the database, never from the client.
      select
        case v_locale
          when 'ar' then coalesce(p.name_ar, p.name_fr)
          when 'en' then coalesce(p.name_en, p.name_fr)
          else p.name_fr
        end,
        p.sku
      into v_name, v_sku
      from public.products p
      where p.id = v_product_id and p.status = 'published';

      if not found then
        raise exception 'invalid_product' using errcode = '22023';
      end if;
    else
      -- Custom item (e.g. bespoke printing job): free-text label from the customer.
      v_name := btrim(v_item ->> 'label');
      v_sku := null;
    end if;

    insert into public.quotation_items (
      quotation_request_id, product_id, product_name_snapshot, product_sku_snapshot,
      quantity, specifications, sort_order
    ) values (
      v_request_id,
      v_product_id,
      v_name,
      v_sku,
      (v_item ->> 'quantity')::integer,
      nullif(btrim(v_item ->> 'specifications'), ''),
      v_index
    );
    v_index := v_index + 1;
  end loop;

  return v_reference;
end;
$$;

revoke execute on function public.submit_contact_inquiry(jsonb, text) from public;
revoke execute on function public.submit_quotation_request(jsonb, text) from public;
grant execute on function public.submit_contact_inquiry(jsonb, text) to anon, authenticated;
grant execute on function public.submit_quotation_request(jsonb, text) to anon, authenticated;
