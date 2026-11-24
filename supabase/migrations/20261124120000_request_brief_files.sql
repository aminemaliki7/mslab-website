-- Requirements file ("cahier des charges") as the first step of every quote request
-- (docs/CX_AUDIT_AND_PLAN.md, 2026-11-24). A visitor who already has a document describing the
-- need sends it with contact details instead of filling the detailed form.
--
-- * quotation_files.role gains 'brief' (the requirements file, shown first in the admin).
-- * The private custom-uploads bucket also accepts Word (.docx) and Excel (.xlsx) documents.
--   File types are still identified from their bytes by the site and again in the admin.
-- * submit_brief_request: one function for the three request kinds (catalog, custom, digital).
--   It stores the request without the detailed rows (items / details) and requires at least one
--   brief file uploaded with a valid, unused ticket. The three existing submit_* functions are
--   unchanged: a request filled in through the form follows exactly the same path as before.

alter table public.quotation_files drop constraint if exists quotation_files_role_check;
alter table public.quotation_files
  add constraint quotation_files_role_check check (role in ('artwork', 'mockup', 'brief'));

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/heic', 'image/svg+xml',
  'application/pdf', 'application/postscript', 'application/illustrator',
  'image/vnd.adobe.photoshop', 'application/x-photoshop',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
where id = 'custom-uploads';

create or replace function public.submit_brief_request(payload jsonb, submission_key text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission uuid;
  v_ticket uuid;
  v_kind public.request_kind;
  v_ip text := nullif(payload ->> 'ip_hash', '');
  v_request_id uuid;
  v_reference text;
  v_attached integer;
begin
  perform private.check_submission_key(submission_key);

  begin
    v_submission := (payload ->> 'submission_id')::uuid;
    v_ticket := (payload ->> 'upload_ticket')::uuid;
    v_kind := (payload ->> 'kind')::public.request_kind;
  exception when invalid_text_representation then
    raise exception 'invalid_payload' using errcode = '22023';
  end;
  if v_submission is null or v_ticket is null or v_kind is null
     or jsonb_typeof(payload -> 'files') is distinct from 'array'
     or jsonb_array_length(payload -> 'files') not between 1 and 3 then
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

  insert into public.quotation_requests (
    submission_id, kind, full_name, email, phone, company_name, message, preferred_contact,
    locale, source_path, consent, ip_hash
  ) values (
    v_submission,
    v_kind,
    btrim(payload ->> 'full_name'),
    lower(btrim(payload ->> 'email')),
    btrim(payload ->> 'phone'),
    nullif(btrim(payload ->> 'company_name'), ''),
    nullif(btrim(payload ->> 'message'), ''),
    coalesce((payload ->> 'preferred_contact')::public.contact_method, 'email'),
    coalesce(payload ->> 'locale', 'fr'),
    left(payload ->> 'source_path', 300),
    coalesce((payload ->> 'consent')::boolean, false),
    v_ip
  )
  returning id, reference into v_request_id, v_reference;

  update private.upload_tickets
  set used_at = now(), quotation_request_id = v_request_id
  where id = v_ticket and used_at is null and created_at > now() - interval '24 hours';
  if not found then
    raise exception 'brief_missing' using errcode = '22023';
  end if;

  -- Only requirements files ("<n>-mslab-brief-<name>") still listed in the form are attached.
  insert into public.quotation_files (quotation_request_id, storage_path, original_name, mime_type, size_bytes, role)
  select
    v_request_id,
    o.name,
    left(coalesce(nullif(regexp_replace(split_part(o.name, '/', 2), '^[0-9]+-mslab-brief-', ''), ''), 'document'), 255),
    o.metadata ->> 'mimetype',
    nullif(o.metadata ->> 'size', '')::bigint,
    'brief'
  from storage.objects o
  where o.bucket_id = 'custom-uploads'
    and o.name like v_ticket::text || '/%'
    and split_part(o.name, '/', 2) ~ '^[0-9]+-mslab-brief-'
    and o.name in (select jsonb_array_elements_text(payload -> 'files'))
  order by o.name
  limit 3;
  get diagnostics v_attached = row_count;

  -- No file actually uploaded: nothing describes the need, the whole request is rolled back.
  if v_attached = 0 then
    raise exception 'brief_missing' using errcode = '22023';
  end if;

  return v_reference;
end;
$$;
revoke execute on function public.submit_brief_request(jsonb, text) from public;
grant execute on function public.submit_brief_request(jsonb, text) to anon, authenticated;
