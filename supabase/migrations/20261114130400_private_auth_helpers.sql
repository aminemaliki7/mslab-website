-- Hardening (Supabase security advisor 0028/0029): authorization helpers should not be
-- callable through the REST API (/rest/v1/rpc/is_admin). Move them to the non-exposed
-- `private` schema. Policies reference functions by OID, so they keep working unchanged.

alter function public.is_admin() set schema private;
alter function public.is_owner() set schema private;

-- Policies are evaluated with the caller's role, which needs USAGE on the schema and
-- EXECUTE on the helpers — but nothing else in `private` (app_config stays revoked).
grant usage on schema private to anon, authenticated;
revoke execute on function private.is_admin() from public;
revoke execute on function private.is_owner() from public;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_owner() to anon, authenticated;
