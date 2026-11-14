---
name: mslab-supabase
description: MSLAB Supabase integration — Postgres schema and SQL migrations, Row Level Security policies, is_admin() and submit_inquiry functions, Storage buckets, Supabase Auth for admins, typed clients (public cookie-less, session-bound server, never service role in request paths), generated types and caching with Cache Components. Use for any database, storage, auth, or data-access-layer work.
---

# MSLAB Supabase

## Objective
A secure, typed, cache-friendly data layer where **Row Level Security is the last line of defense** and secrets never leave the server.

## When to use
Schema changes, migrations, RLS policies, SQL functions, storage buckets, admin authentication, Supabase client code, type generation.

## Hard rules
- **Never apply migrations to a remote project, reset a database, or change project settings** unless the user explicitly asks in the current conversation. Write migrations as files; the user applies them (`supabase db push`) after review.
- **Never print or commit keys.** Use `.env.local` (git-ignored) and Vercel env settings.
- **RLS enabled on every table in `public`**, including join/translation tables. `FORCE ROW LEVEL SECURITY` is not needed for normal roles but policies must exist for every access path.
- The secret/service-role key is **not used in request paths**. If a script truly needs it (e.g. seeding), it lives in `scripts/` and is run locally.

## Clients (`src/lib/supabase/`)
| File | Client | Use |
|---|---|---|
| `public.ts` | `createClient` from `@supabase/supabase-js` with publishable key, `persistSession: false`, **no cookies** | Public catalog reads inside `'use cache'` functions; `submit_inquiry` RPC |
| `server.ts` | `createServerClient` from `@supabase/ssr` with `cookies()` | Admin pages/actions (session-bound, RLS as the admin user) |
| `admin-session.ts` | `getAdminUser()` / `requireAdmin()` | DAL: `supabase.auth.getUser()` (validates JWT with Auth server) + `is_admin()` check; redirects to `/admin/login` |
| `../../proxy.ts` | `createServerClient` in proxy | Refresh admin session cookies on `/admin/*` only |

- Cookie-reading code cannot run inside `'use cache'`; that is why public reads use the cookie-less client.
- Session-dependent UI sits behind `<Suspense>` (Cache Components requirement).
- `import 'server-only'` in every file except the browser client (avoid a browser client entirely unless a feature needs it).

## Schema & migrations
- Source of truth: `docs/DATABASE_SCHEMA.md` + `supabase/migrations/<timestamp>_<name>.sql`.
- Each migration: idempotent where reasonable, enables RLS, creates policies, indexes FKs, adds `updated_at` trigger, comments tables.
- Naming: snake_case, plural tables, `<table>_<cols>_idx`, `<table>_<col>_check`.
- Use enums for fixed vocabularies (`locale_code`, `product_availability`, `inquiry_type`, `inquiry_status`, `admin_role`).
- After schema changes: `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts` (or `--project-id` when the user approves).

## Functions
- `public.is_admin()` — `stable`, `security definer`, `set search_path = ''`, returns whether `auth.uid()` is in `public.admin_users`. Used in all admin policies. Revoke execute from `anon` is not required (returns false) but keep it lean.
- `public.submit_inquiry(payload jsonb)` — `security definer`, `set search_path = ''`, granted to `anon, authenticated`; validates, rate-limits by `ip_hash`, inserts `inquiries` + `quote_request_items` atomically, returns reference. Tables themselves grant no insert to `anon`.
- `public.search_products(...)` — `stable`, `security invoker` (RLS applies), returns published rows only.

## Storage
- Bucket `catalog`: **public read**, write/update/delete only when `public.is_admin()`; path prefix `products/` or `categories/`; size limit 5 MB; allowed MIME types set on the bucket.
- Bucket `inquiry-attachments` (future): private, insert via signed URL only, read admin-only.

## Auth
- Supabase Auth used **only for admins** (email + password; MFA TOTP recommended). Public sign-up disabled in project settings (user must do this in the dashboard).
- Admin membership = row in `admin_users` (created manually or by an owner), not a client-editable claim.
- Password reset/confirm route: `/admin/auth/confirm` (token hash exchange).

## Workflow
1. Update `docs/DATABASE_SCHEMA.md` (entity, constraints, policies).
2. Write migration SQL; include RLS + policies + indexes in the same file.
3. Test locally (`npx supabase start`, `npx supabase db reset`) — never against production.
4. Regenerate types; update queries/actions; run `tsc`.
5. Run Supabase advisors (security + performance) and fix findings.

## Quality requirements
- Every policy has a matching test case (anon / authenticated non-admin / admin) in the RLS checklist in `docs/SECURITY_STRATEGY.md`.
- No `select *` in app code.
- Indexes on all FKs and on `(locale, slug)`.

## Security
- Use `auth.getUser()` (or `getClaims()` with verified JWT) on the server — never trust `getSession()` alone for authorization.
- `security definer` functions always set `search_path = ''` and fully qualify names.
- Never expose `admin_users`, `inquiries`, `inquiry_notes` to `anon`.
