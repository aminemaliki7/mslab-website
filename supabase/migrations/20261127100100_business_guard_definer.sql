-- Fix for 20261127100000: the column guard runs with the caller's rights, and the caller
-- (authenticated) may not execute private.business_rpc_on(). The guard therefore failed with
-- "permission denied" on every UPDATE, also for columns that are meant to stay editable.
-- Running it as SECURITY DEFINER keeps business_rpc_on() private.

create or replace function private.business_protect_columns()
returns trigger
language plpgsql
security definer
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
