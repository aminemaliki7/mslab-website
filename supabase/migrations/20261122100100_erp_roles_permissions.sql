-- MSLAB ERP — Phase 0.2: staff, departments, roles and permissions (docs/ERP_ARCHITECTURE.md §3).
--
-- Before this migration every policy used private.is_admin(): any active admin account could read
-- every customer and request. This migration
--   1. extends admin_profiles into the staff table (+ departments),
--   2. adds roles / permissions / role_permissions / staff_roles,
--   3. adds private.is_staff(), private.can(), private.can_all() (MFA / aal2 still required),
--   4. REWRITES EVERY EXISTING POLICY from is_admin() to a named permission,
--   5. maps the existing accounts: owner → Administrator, editor → Website editor.
-- Behaviour for the current owner is unchanged (Administrator holds every permission).
--
-- Rules enforced in the database:
--   * The 'administrator' role implicitly holds every permission (also future ones).
--   * System roles cannot be deleted and their key cannot change.
--   * At least one ACTIVE member must keep the Administrator role (no lock-out).
--   * Assigning roles needs roles.manage; editing staff profiles needs staff.manage.
--   * Staff accounts are attached to an existing Supabase Auth user through
--     public.attach_staff_by_email (no service-role key in the app, ADR-027 D2).

-- ─── 1. Staff table extension + departments ────────────────────────────────────
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 120),
  description text check (char_length(description) <= 500),
  manager_id uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index departments_manager_id_idx on public.departments (manager_id);
create trigger departments_updated_at before update on public.departments
  for each row execute function public.set_updated_at();

alter table public.admin_profiles
  add column email public.email_address,
  add column kind text not null default 'employee' check (kind in ('employee', 'associate')),
  add column job_title text check (char_length(job_title) <= 120),
  add column phone public.phone_e164,
  add column department_id uuid references public.departments (id) on delete set null;
create index admin_profiles_department_id_idx on public.admin_profiles (department_id);
comment on column public.admin_profiles.role is 'Legacy (before ADR-027). Access now comes from staff_roles; kept for compatibility.';

-- Existing accounts: copy the sign-in e-mail (read-only for the app; auth.users is not exposed).
update public.admin_profiles p set email = lower(u.email)
from auth.users u
where u.id = p.id and u.email is not null and p.email is null;

-- ─── 2. Roles & permissions ──────────────────────────────────────────────────
create type public.permission_scope as enum ('all', 'assigned');

create table public.permissions (
  key text primary key check (key ~ '^[a-z]+(\.[a-z_]+)+$' and char_length(key) <= 80),
  module text not null check (char_length(module) <= 40),
  sort_order integer not null default 0
);
comment on table public.permissions is 'Permission catalogue (ADR-027). Rows come from migrations only; labels live in the admin dictionary.';

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 500),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  scope public.permission_scope not null default 'all',
  primary key (role_id, permission_key)
);
create index role_permissions_permission_key_idx on public.role_permissions (permission_key);

create table public.staff_roles (
  staff_id uuid not null references public.admin_profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.admin_profiles (id) on delete set null,
  primary key (staff_id, role_id)
);
create index staff_roles_role_id_idx on public.staff_roles (role_id);
create index staff_roles_assigned_by_idx on public.staff_roles (assigned_by);

insert into public.permissions (key, module, sort_order) values
  ('overview.read',            'overview', 10),
  ('staff.read',               'company',  20),
  ('staff.manage',             'company',  21),
  ('roles.manage',             'company',  22),
  ('audit.read',               'company',  23),
  ('requests.read',            'sales',    30),
  ('requests.read.custom',     'sales',    31),
  ('requests.read.digital',    'sales',    32),
  ('requests.manage',          'sales',    33),
  ('requests.delete',          'sales',    34),
  ('messages.read',            'sales',    40),
  ('messages.manage',          'sales',    41),
  ('messages.delete',          'sales',    42),
  ('site.content.manage',      'website',  50),
  ('settings.company.read',    'settings', 60),
  ('settings.company.manage',  'settings', 61);

-- Role names are the defaults proposed in ERP_ARCHITECTURE §3.2; the Administrator can rename
-- them (except the key) and create others.
insert into public.roles (key, name, description, is_system) values
  ('administrator',  'Administrateur',      'Accès complet à toute la plateforme.', true),
  ('manager',        'Direction',           'Suit l''ensemble de l''activité de l''entreprise.', true),
  ('sales',          'Commercial',          'Clients, demandes, devis et commandes.', true),
  ('production',     'Production',          'Ordres de fabrication et matières.', true),
  ('inventory',      'Stock & achats',      'Stock, fournisseurs et achats.', true),
  ('designer',       'Designer',            'Maquettes et validations clients.', true),
  ('developer',      'Développeur',         'Projets digitaux assignés.', true),
  ('accounting',     'Comptabilité',        'Factures, paiements et dépenses.', true),
  ('website_editor', 'Éditeur du site',     'Contenu du site public.', true);

-- Administrator: implicit (see private.staff_can). Other roles, for the modules that exist today;
-- later phases add their own permissions and grants.
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
join (values
  ('manager', 'overview.read'), ('manager', 'staff.read'), ('manager', 'audit.read'),
  ('manager', 'requests.read'), ('manager', 'requests.manage'),
  ('manager', 'messages.read'), ('manager', 'messages.manage'),
  ('manager', 'site.content.manage'), ('manager', 'settings.company.read'),
  ('sales', 'overview.read'), ('sales', 'staff.read'),
  ('sales', 'requests.read'), ('sales', 'requests.manage'),
  ('sales', 'messages.read'), ('sales', 'messages.manage'),
  ('production', 'overview.read'), ('production', 'staff.read'), ('production', 'requests.read.custom'),
  ('inventory', 'overview.read'), ('inventory', 'staff.read'),
  ('designer', 'overview.read'), ('designer', 'staff.read'), ('designer', 'requests.read.custom'),
  ('developer', 'overview.read'), ('developer', 'staff.read'), ('developer', 'requests.read.digital'),
  ('accounting', 'overview.read'), ('accounting', 'staff.read'), ('accounting', 'settings.company.read'),
  ('website_editor', 'overview.read'), ('website_editor', 'staff.read'), ('website_editor', 'site.content.manage')
) as g(role_key, permission_key) on g.role_key = r.key
join public.permissions p on p.key = g.permission_key;

-- Existing accounts.
insert into public.staff_roles (staff_id, role_id)
select a.id, r.id
from public.admin_profiles a
join public.roles r on r.key = case a.role when 'owner' then 'administrator' else 'website_editor' end;

-- ─── 3. Authorization helpers (schema private: not callable through the API) ─────
-- staff_can: does this ACTIVE staff member hold the permission (any scope / scope all)?
create or replace function private.staff_can(p_user uuid, p_permission text, p_all_scope boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles a
    join public.staff_roles sr on sr.staff_id = a.id
    join public.roles r on r.id = sr.role_id
    left join public.role_permissions rp
      on rp.role_id = r.id and rp.permission_key = p_permission
      and (not p_all_scope or rp.scope = 'all')
    where a.id = p_user and a.is_active
      and (r.key = 'administrator' or rp.role_id is not null)
  );
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    and exists (select 1 from public.admin_profiles where id = (select auth.uid()) and is_active);
$$;

create or replace function private.can(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    and private.staff_can((select auth.uid()), p_permission, false);
$$;

create or replace function private.can_all(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    and private.staff_can((select auth.uid()), p_permission, true);
$$;

-- Legacy helpers keep their OIDs; is_owner now means "Administrator".
create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can('roles.manage');
$$;

revoke execute on function private.staff_can(uuid, text, boolean) from public, anon, authenticated;
revoke execute on function private.is_staff() from public;
revoke execute on function private.can(text) from public;
revoke execute on function private.can_all(text) from public;
grant execute on function private.is_staff() to anon, authenticated;
grant execute on function private.can(text) to anon, authenticated;
grant execute on function private.can_all(text) to anon, authenticated;

-- ─── 4. Integrity guards ─────────────────────────────────────────────────────
create or replace function private.assert_administrator_remains()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.staff_roles sr
    join public.roles r on r.id = sr.role_id and r.key = 'administrator'
    join public.admin_profiles a on a.id = sr.staff_id and a.is_active
  ) then
    raise exception 'last_administrator' using errcode = 'P0001',
      hint = 'At least one active member must keep the Administrator role.';
  end if;
  return null;
end;
$$;
revoke execute on function private.assert_administrator_remains() from public, anon, authenticated;

create trigger staff_roles_keep_administrator after delete or update on public.staff_roles
  for each statement execute function private.assert_administrator_remains();
create trigger admin_profiles_keep_administrator after delete or update of is_active on public.admin_profiles
  for each statement execute function private.assert_administrator_remains();

create or replace function private.protect_system_roles()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.is_system then
    raise exception 'system_role' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and (
    (old.is_system and (new.key is distinct from old.key or not new.is_system))
    or (not old.is_system and new.is_system)
  ) then
    raise exception 'system_role' using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' and new.is_system and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'system_role' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;
revoke execute on function private.protect_system_roles() from public, anon, authenticated;
create trigger roles_protect_system before insert or update or delete on public.roles
  for each row execute function private.protect_system_roles();

-- The Administrator role's permissions are implicit: rows for it would be misleading.
create or replace function private.no_administrator_grants()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.roles where id = new.role_id and key = 'administrator') then
    raise exception 'administrator_implicit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function private.no_administrator_grants() from public, anon, authenticated;
create trigger role_permissions_no_administrator before insert or update on public.role_permissions
  for each row execute function private.no_administrator_grants();

-- ─── 5. RLS for the new tables ───────────────────────────────────────────────
alter table public.departments enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff_roles enable row level security;
revoke all on public.departments, public.permissions, public.roles, public.role_permissions, public.staff_roles from anon;
revoke truncate on public.departments, public.permissions, public.roles, public.role_permissions, public.staff_roles from authenticated;
revoke insert, update, delete on public.permissions from authenticated;

create policy "departments: staff reads" on public.departments
  for select to authenticated using ((select private.is_staff()));
create policy "departments: staff managers insert" on public.departments
  for insert to authenticated with check ((select private.can('staff.manage')));
create policy "departments: staff managers update" on public.departments
  for update to authenticated using ((select private.can('staff.manage'))) with check ((select private.can('staff.manage')));
create policy "departments: staff managers delete" on public.departments
  for delete to authenticated using ((select private.can('staff.manage')));

create policy "permissions: staff reads" on public.permissions
  for select to authenticated using ((select private.is_staff()));

create policy "roles: staff reads" on public.roles
  for select to authenticated using ((select private.is_staff()));
create policy "roles: administrators insert" on public.roles
  for insert to authenticated with check ((select private.can('roles.manage')) and not is_system);
create policy "roles: administrators update" on public.roles
  for update to authenticated using ((select private.can('roles.manage'))) with check ((select private.can('roles.manage')));
create policy "roles: administrators delete" on public.roles
  for delete to authenticated using ((select private.can('roles.manage')) and not is_system);

create policy "role_permissions: staff reads" on public.role_permissions
  for select to authenticated using ((select private.is_staff()));
create policy "role_permissions: administrators insert" on public.role_permissions
  for insert to authenticated with check ((select private.can('roles.manage')));
create policy "role_permissions: administrators update" on public.role_permissions
  for update to authenticated using ((select private.can('roles.manage'))) with check ((select private.can('roles.manage')));
create policy "role_permissions: administrators delete" on public.role_permissions
  for delete to authenticated using ((select private.can('roles.manage')));

create policy "staff_roles: read own or staff directory" on public.staff_roles
  for select to authenticated
  using (staff_id = (select auth.uid()) or (select private.can('staff.read')));
create policy "staff_roles: administrators insert" on public.staff_roles
  for insert to authenticated with check ((select private.can('roles.manage')));
create policy "staff_roles: administrators delete" on public.staff_roles
  for delete to authenticated using ((select private.can('roles.manage')));

-- ─── 6. Rewrite of every existing policy ─────────────────────────────────────
-- admin_profiles (staff). Inserts only through attach_staff_by_email.
drop policy "admin_profiles: read own or as admin" on public.admin_profiles;
drop policy "admin_profiles: owner inserts" on public.admin_profiles;
drop policy "admin_profiles: owner updates" on public.admin_profiles;
drop policy "admin_profiles: owner deletes others" on public.admin_profiles;
create policy "admin_profiles: read own or staff directory" on public.admin_profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.can('staff.read')));
create policy "admin_profiles: staff managers update" on public.admin_profiles
  for update to authenticated using ((select private.can('staff.manage'))) with check ((select private.can('staff.manage')));
create policy "admin_profiles: administrators delete others" on public.admin_profiles
  for delete to authenticated using ((select private.can('roles.manage')) and id <> (select auth.uid()));
revoke insert on public.admin_profiles from authenticated;

-- Website content: public reads published rows; staff read drafts; site.content.manage writes.
do $$
declare
  t text;
begin
  foreach t in array array['categories', 'products', 'product_images', 'services', 'portfolio_items',
                           'production_options', 'studio_views', 'studio_options'] loop
    execute format('drop policy if exists %I on public.%I', t || ': admin inserts', t);
    execute format('drop policy if exists %I on public.%I', t || ': admin updates', t);
    execute format('drop policy if exists %I on public.%I', t || ': admin deletes', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.can(''site.content.manage'')))', t || ': content managers insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.can(''site.content.manage''))) with check ((select private.can(''site.content.manage'')))', t || ': content managers update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.can(''site.content.manage'')))', t || ': content managers delete', t);
  end loop;
  foreach t in array array['mockup_products', 'studio_products', 'site_settings'] loop
    execute format('drop policy if exists %I on public.%I', t || ': admin updates', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.can(''site.content.manage''))) with check ((select private.can(''site.content.manage'')))', t || ': content managers update', t);
  end loop;
end;
$$;

drop policy "categories: public reads published" on public.categories;
create policy "categories: public reads published" on public.categories
  for select to anon, authenticated using (is_published or (select private.is_staff()));
drop policy "products: public reads published" on public.products;
create policy "products: public reads published" on public.products
  for select to anon, authenticated using (status = 'published' or (select private.is_staff()));
drop policy "product_images: public reads images of published products" on public.product_images;
create policy "product_images: public reads images of published products" on public.product_images
  for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_images.product_id and p.status = 'published')
    or (select private.is_staff())
  );
drop policy "services: public reads published" on public.services;
create policy "services: public reads published" on public.services
  for select to anon, authenticated using (status = 'published' or (select private.is_staff()));
drop policy "portfolio_items: public reads published" on public.portfolio_items;
create policy "portfolio_items: public reads published" on public.portfolio_items
  for select to anon, authenticated using (status = 'published' or (select private.is_staff()));
drop policy "production_options: public reads active" on public.production_options;
create policy "production_options: public reads active" on public.production_options
  for select to anon, authenticated using (is_active or (select private.is_staff()));
drop policy "mockup_products: public reads active" on public.mockup_products;
create policy "mockup_products: public reads active" on public.mockup_products
  for select to anon, authenticated using (is_active or (select private.is_staff()));
drop policy "studio_views: public reads active" on public.studio_views;
create policy "studio_views: public reads active" on public.studio_views
  for select to anon, authenticated using (is_active or (select private.is_staff()));
drop policy "studio_options: public reads active" on public.studio_options;
create policy "studio_options: public reads active" on public.studio_options
  for select to anon, authenticated using (is_active or (select private.is_staff()));

-- Customer requests (quotation_requests + children). Designers / production see custom requests,
-- developers digital ones; children follow the parent row's visibility (RLS applies inside EXISTS).
drop policy "quotation_requests: admin reads" on public.quotation_requests;
drop policy "quotation_requests: admin updates" on public.quotation_requests;
drop policy "quotation_requests: owner deletes" on public.quotation_requests;
create policy "quotation_requests: staff reads by permission" on public.quotation_requests
  for select to authenticated
  using (
    (select private.can('requests.read'))
    or (kind = 'custom' and (select private.can('requests.read.custom')))
    or (kind = 'digital' and (select private.can('requests.read.digital')))
  );
create policy "quotation_requests: request managers update" on public.quotation_requests
  for update to authenticated using ((select private.can('requests.manage'))) with check ((select private.can('requests.manage')));
create policy "quotation_requests: request deleters delete" on public.quotation_requests
  for delete to authenticated using ((select private.can('requests.delete')));

do $$
declare
  t text;
begin
  foreach t in array array['quotation_items', 'custom_request_details', 'digital_request_details',
                           'quotation_files', 'quotation_status_events'] loop
    execute format('drop policy if exists %I on public.%I', t || ': admin reads', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.quotation_requests r where r.id = %I.quotation_request_id))',
      t || ': staff reads with the request', t, t);
  end loop;
end;
$$;

-- Contact messages.
drop policy "inquiries: admin reads" on public.inquiries;
drop policy "inquiries: admin updates" on public.inquiries;
drop policy "inquiries: owner deletes" on public.inquiries;
create policy "inquiries: message readers read" on public.inquiries
  for select to authenticated using ((select private.can('messages.read')));
create policy "inquiries: message managers update" on public.inquiries
  for update to authenticated using ((select private.can('messages.manage'))) with check ((select private.can('messages.manage')));
create policy "inquiries: message deleters delete" on public.inquiries
  for delete to authenticated using ((select private.can('messages.delete')));

-- Storage: catalog bucket (public images) and custom-uploads (customer files).
drop policy "catalog: admin reads objects" on storage.objects;
drop policy "catalog: admin uploads" on storage.objects;
drop policy "catalog: admin updates" on storage.objects;
drop policy "catalog: admin deletes" on storage.objects;
create policy "catalog: staff reads objects" on storage.objects
  for select to authenticated using (bucket_id = 'catalog' and (select private.is_staff()));
create policy "catalog: content managers upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'catalog' and (select private.can('site.content.manage'))
    and (storage.foldername(name))[1] = any (array['products', 'categories', 'services', 'portfolio', 'studio'])
  );
create policy "catalog: content managers update" on storage.objects
  for update to authenticated
  using (bucket_id = 'catalog' and (select private.can('site.content.manage')))
  with check (bucket_id = 'catalog' and (select private.can('site.content.manage')));
create policy "catalog: content managers delete" on storage.objects
  for delete to authenticated using (bucket_id = 'catalog' and (select private.can('site.content.manage')));

drop policy "custom-uploads: admin reads" on storage.objects;
drop policy "custom-uploads: admin deletes" on storage.objects;
create policy "custom-uploads: staff reads files of visible requests" on storage.objects
  for select to authenticated
  using (bucket_id = 'custom-uploads' and exists (select 1 from public.quotation_files f where f.storage_path = objects.name));
create policy "custom-uploads: request deleters delete" on storage.objects
  for delete to authenticated using (bucket_id = 'custom-uploads' and (select private.can('requests.delete')));

-- ─── 7. RPCs for the app ─────────────────────────────────────────────────────
-- Effective permission keys of the signed-in member (empty unless active staff with MFA).
create or replace function public.my_permissions()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not private.is_staff() then '{}'::text[]
    else coalesce(
      (select array_agg(p.key order by p.sort_order)
       from public.permissions p
       where private.staff_can((select auth.uid()), p.key, false)),
      '{}'::text[])
  end;
$$;
revoke execute on function public.my_permissions() from public, anon;
grant execute on function public.my_permissions() to authenticated;

-- Attach an existing Supabase Auth user (created or invited from the Supabase dashboard) as a
-- staff member, without roles: the member can sign in (after MFA) but sees nothing until an
-- Administrator assigns roles.
create or replace function public.attach_staff_by_email(p_email text, p_full_name text, p_kind text default 'employee')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_email text := lower(btrim(p_email));
begin
  if not private.can('staff.manage') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_kind not in ('employee', 'associate') or char_length(btrim(coalesce(p_full_name, ''))) not between 2 and 120 then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;
  select u.id into v_user from auth.users u where lower(u.email) = v_email limit 1;
  if v_user is null then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.admin_profiles where id = v_user) then
    raise exception 'already_staff' using errcode = '23505';
  end if;
  insert into public.admin_profiles (id, full_name, email, kind, role, is_active)
  values (v_user, btrim(p_full_name), v_email, p_kind, 'editor', true);
  return v_user;
end;
$$;
revoke execute on function public.attach_staff_by_email(text, text, text) from public, anon;
grant execute on function public.attach_staff_by_email(text, text, text) to authenticated;

-- ─── 8. Audit ────────────────────────────────────────────────────────────────
create trigger audit_departments after insert or update or delete on public.departments
  for each row execute function audit.capture('id');
create trigger audit_roles after insert or update or delete on public.roles
  for each row execute function audit.capture('id');
create trigger audit_role_permissions after insert or update or delete on public.role_permissions
  for each row execute function audit.capture('role_id', 'permission_key');
create trigger audit_staff_roles after insert or update or delete on public.staff_roles
  for each row execute function audit.capture('staff_id', 'role_id');

-- Audit readers (need private.can, hence here rather than in the audit migration).
create or replace function public.audit_timeline(p_table text, p_row_id text)
returns table (occurred_at timestamptz, actor_id uuid, actor_name text, action text, changes jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can('audit.read') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select l.occurred_at, l.actor_id, coalesce(a.full_name, a.email::text), l.action, l.changes
    from audit.log l
    left join public.admin_profiles a on a.id = l.actor_id
    where l.table_name = p_table and l.row_id = p_row_id
    order by l.occurred_at desc
    limit 200;
end;
$$;

create or replace function public.recent_activity(p_limit integer default 50, p_before timestamptz default null, p_actor uuid default null)
returns table (id bigint, occurred_at timestamptz, actor_id uuid, actor_name text, table_name text, row_id text, action text, changes jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can('audit.read') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select l.id, l.occurred_at, l.actor_id, coalesce(a.full_name, a.email::text), l.table_name, l.row_id, l.action, l.changes
    from audit.log l
    left join public.admin_profiles a on a.id = l.actor_id
    where (p_before is null or l.occurred_at < p_before)
      and (p_actor is null or l.actor_id = p_actor)
    order by l.occurred_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;
revoke execute on function public.audit_timeline(text, text) from public, anon;
revoke execute on function public.recent_activity(integer, timestamptz, uuid) from public, anon;
grant execute on function public.audit_timeline(text, text) to authenticated;
grant execute on function public.recent_activity(integer, timestamptz, uuid) to authenticated;
