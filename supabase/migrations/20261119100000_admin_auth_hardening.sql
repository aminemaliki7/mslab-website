-- Admin sign-in hardening (docs/SECURITY_STRATEGY.md §2, security review 2026-11-19).
--
-- 1. Per-IP limit on failed admin sign-in and MFA attempts. The site calls Supabase Auth from its
--    own server, so Supabase's built-in per-IP limits only ever see the server's address; this
--    counter uses the visitor's hashed IP instead (same hashing as the public forms).
-- 2. Admin rights in RLS require a session upgraded with MFA (JWT claim aal = 'aal2'): a stolen
--    password alone (aal1 session) can no longer read customer data through the API.

-- ─── 1. Failed-attempt counter ───────────────────────────────────────────────
create table private.admin_auth_failures (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index admin_auth_failures_ip_created on private.admin_auth_failures (ip_hash, created_at);
alter table private.admin_auth_failures enable row level security;
revoke all on private.admin_auth_failures from public, anon, authenticated;

-- record_failure = false: raise 'rate_limited' after 8 failures in 15 minutes from this IP.
-- record_failure = true: count one failure (old rows are pruned after a day).
create or replace function public.admin_auth_guard(submission_key text, ip_hash text, record_failure boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip text := nullif(ip_hash, '');
begin
  perform private.check_submission_key(submission_key);
  if v_ip is null then
    return;
  end if;
  if record_failure then
    insert into private.admin_auth_failures (ip_hash) values (v_ip);
    delete from private.admin_auth_failures where created_at < now() - interval '1 day';
    return;
  end if;
  if (
    select count(*) from private.admin_auth_failures f
    where f.ip_hash = v_ip and f.created_at > now() - interval '15 minutes'
  ) >= 8 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
end;
$$;
revoke execute on function public.admin_auth_guard(text, text, boolean) from public;
grant execute on function public.admin_auth_guard(text, text, boolean) to anon, authenticated;

-- ─── 2. Admin = active profile AND an MFA-verified session ──────────────────
-- create or replace keeps the functions' OIDs, so every existing policy uses the new rule.
-- "admin_profiles: read own" (id = auth.uid()) does not use these helpers, so an aal1 session
-- can still read its own profile to reach the MFA step.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    and exists (
      select 1 from public.admin_profiles
      where id = (select auth.uid()) and is_active
    );
$$;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    and exists (
      select 1 from public.admin_profiles
      where id = (select auth.uid()) and is_active and role = 'owner'
    );
$$;
