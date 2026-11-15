# Deployment Runbook

How to take the MSLAB website from this repository to production. **Every step that creates infrastructure, spends money, changes DNS or deploys is an owner action** — the code never deploys itself.

Status of each prerequisite: see `PRODUCTION_READINESS.md`.

## 0. Environments

| | Development | Preview (per PR) | Production |
|---|---|---|---|
| Code | any branch, local | PR branches | `main` |
| Hosting | `next dev` / `next start` | Vercel Preview | Vercel Production |
| Database | Supabase `mslab-dev` (eu-west-3) | Supabase `mslab-dev` | **new** Supabase project `mslab-prod` |
| Initial catalog (`supabase/seed/initial_catalog.sql`) | yes | yes | yes, once at setup |
| Indexing | blocked | blocked (`robots.txt` + `X-Robots-Tag`) | allowed |

## 1. Repository (GitHub)
1. Create `main` on GitHub from the reviewed branch (the remote currently only has `feat/foundation`): open a PR `feat/foundation → main`, review, merge.
2. Settings → Branches → protect `main`: require PR, require the **CI** workflow to pass.
3. Settings → Secrets and variables → Actions → **Variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (dev project values; public, RLS-protected).

## 2. Production Supabase project
1. Create project `mslab-prod`, region **eu-west-3 (Paris)** (closest to Morocco, same as Vercel `cdg1`).
   - **Plan: Free** (owner decision, ADR-020). Consequences and mitigations:
     - *Pausing after inactivity* → `.github/workflows/supabase-keepalive.yml` reads one public row daily. Set the repository variables `KEEPALIVE_SUPABASE_URL` and `KEEPALIVE_SUPABASE_PUBLISHABLE_KEY` to the **production** project. If a pause still happens, restore the project from the dashboard (the site shows empty contact details and catalog errors until then).
     - *No automatic backups* → manual backup routine (§7).
     - *Usage limits* (database size, file storage, egress — see Supabase's current pricing page): keep product images reasonably sized (the upload limit is 5 MB; prefer ~200–500 KB WebP), watch Usage in the dashboard monthly.
     - *Active project limit (2 per free organization)* → see `PRODUCTION_READINESS.md` B4 for how production fits next to existing projects.
2. Apply the schema from the repository (Supabase CLI):
   ```bash
   npx supabase login
   npx supabase link --project-ref <prod-ref>
   npx supabase db push
   ```
   This applies `supabase/migrations/*` in order. **Do not** run anything from `supabase/seed/` on production.
3. Generate the per-environment secrets locally (never reuse dev values):
   ```bash
   node -e "const c=require('crypto');const k=c.randomBytes(32).toString('hex');console.log('FORM_SUBMISSION_KEY='+k);console.log('IP_HASH_SALT='+c.randomBytes(32).toString('hex'));console.log('SHA256='+c.createHash('sha256').update(k).digest('hex'))"
   ```
   Store `FORM_SUBMISSION_KEY` and `IP_HASH_SALT` in Vercel (step 3). In the Supabase SQL editor of **production**:
   ```sql
   insert into private.app_config (key, value) values ('submission_key_sha256', '<SHA256 value>')
   on conflict (key) do update set value = excluded.value, updated_at = now();
   ```
4. Authentication settings:
   - Sign In / Providers → **disable "Allow new users to sign up"**.
   - URL configuration → Site URL `https://<domain>`; redirect URLs `https://<domain>/admin/**`.
   - Enable MFA (TOTP) and require it for the owner account.
5. First owner: Authentication → Users → Add user (owner's email + password chosen by the owner), then:
   ```sql
   insert into public.admin_profiles (id, role) values ('<auth user id>', 'owner');
   ```
6. Advisors → Security / Performance: no errors expected (two intentional warnings documented in `DATABASE_SCHEMA.md`).

## 3. Vercel project
1. Import the GitHub repository. Framework preset: Next.js. Node: from `engines` (≥ 20.9). Region `cdg1` comes from `vercel.json`.
2. Plan: a commercial website requires a **Pro** plan (Hobby is for non-commercial use).
3. Environment variables (names only — values from the right Supabase project):

| Name | Production | Preview | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://<domain>` | (leave empty) | canonical URLs, sitemap, OG |
| `NEXT_PUBLIC_SUPABASE_URL` | prod project | dev project | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | prod | dev | publishable key (`sb_publishable_…`) |
| `FORM_SUBMISSION_KEY` | prod secret | dev secret | must match the hash stored in that project |
| `IP_HASH_SALT` | prod secret | dev secret | |
| `EMAIL_PROVIDER` | `resend` (once chosen) | unset | unset = emails disabled, leads still stored |
| `EMAIL_PROVIDER_API_KEY` | secret | unset | |
| `EMAIL_FROM` | `MSLAB <no-reply@<domain>>` | unset | domain must be verified at the provider |
| `INQUIRY_NOTIFICATION_TO` | MSLAB inbox | unset | |

   Mark every non-`NEXT_PUBLIC_` variable as **Sensitive**.
4. Settings → Deployment Protection: protect Preview deployments (Vercel Authentication).

## 4. Domain and email DNS
1. Vercel → Domains → add `<domain>` (+ `www` redirect). Set the DNS records Vercel shows.
2. Email provider: add its SPF/DKIM (and DMARC) records for the sending domain; verify in the provider dashboard.

## 5. First release
1. Merge to `main` → Vercel builds Production. The build reads the **production** database (empty catalog is fine: pages show their empty states).
2. Smoke test on the production URL (5 minutes):
   - `/` redirects to `/fr`; `/fr`, `/ar`, `/en` render; Arabic is right-to-left.
   - `/admin/login` → sign in as owner → dashboard.
   - Settings: enter verified company facts; check footer/contact page.
   - Create a category and a product with an image; publish; check `/fr/catalogue`.
   - Submit the contact form and a quote **from a real browser**; check both appear in admin and the notification emails arrive (if the provider is configured).
   - `https://<domain>/robots.txt` allows crawling; `/sitemap.xml` lists pages; response headers include `Content-Security-Policy` and `Strict-Transport-Security`.
3. Google Search Console: verify the domain, submit `https://<domain>/sitemap.xml`.

## 6. Rollback
- Code: Vercel → Deployments → previous production deployment → **Instant Rollback**.
- Database: migrations are additive; if one must be undone, write a new forward migration. Restore from the latest manual backup (§7) only as a last resort.
- Content mistakes: fix in the admin (changes are live immediately via cache tags).

## 7. Backups (free plan — manual)
The free plan has no automatic backups. At least **weekly**, and before every production migration:
```bash
npx supabase link --project-ref <prod-ref>
npx supabase db dump --linked -f mslab-schema.sql
npx supabase db dump --linked --data-only -f mslab-data.sql
```
- The data dump contains **customer personal data** (Loi 09-08): store it encrypted, outside the repository and outside CI, and delete old copies according to the retention policy.
- Product images live in Storage (`catalog` bucket); keep the original image files MSLAB uploads, or download the bucket from the dashboard periodically.
- Restore: create/reset a project, `npx supabase db push` (schema from the repo), then load the data dump with `psql`.

## 8. Routine operations
- New database change: add a migration file → apply to dev → PR → after merge, `npx supabase db push` to production **before or together with** the code that needs it.
- Rotate `FORM_SUBMISSION_KEY`: generate a new key, update the hash in `private.app_config`, then the Vercel variable, then redeploy.
- Test data cleanup (dev only): `supabase/seed/remove_test_submissions.sql`.
- Before production builds on this machine: if the repository stays in OneDrive, delete `.next/` first (see `TECHNICAL_AUDIT.md` §8a).
