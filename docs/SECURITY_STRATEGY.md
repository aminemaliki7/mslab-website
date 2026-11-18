# Security Strategy

## 1. Assets & threats
| Asset | Threats | Primary controls |
|---|---|---|
| Inquiry data (names, emails, phones, messages) | Data leak, scraping, unauthorized access | RLS (no anon read), admin-only DAL, no PII in URLs/logs, retention policy |
| Catalog integrity | Defacement via unauthorized writes | RLS write = `is_admin()`, `requireAdmin()` in actions, audit log |
| Admin accounts | Credential stuffing, session theft | Supabase Auth, MFA, sign-up disabled, httpOnly cookies, rate limits |
| Secrets (keys) | Leak to client bundle / repo / chat | env split, `server-only`, `.gitignore`, no secret key at runtime |
| Forms | Spam, abuse, injection | Zod + DB checks, honeypot, fill-time, ip_hash rate limit, RPC entry point |
| Uploaded images | Malicious files, storage abuse | admin-only, MIME/size allowlist, generated paths |
| Availability | Bot floods | Vercel platform protections, rate limit, cached pages |

```mermaid
flowchart LR
  subgraph Untrusted
    B[Browser]
  end
  subgraph Server["Next.js server (trusted)"]
    PX[proxy.ts<br/>locale + session refresh]
    SA[Server Actions<br/>Zod + requireAdmin]
    DAL[features/* queries]
  end
  subgraph Supabase
    RLS{{RLS policies}}
    RPC[submit_inquiry<br/>SECURITY DEFINER]
    T[(tables)]
  end
  B --> PX --> SA & DAL
  SA -->|admin session JWT| RLS --> T
  DAL -->|publishable key| RLS
  SA -->|publishable key| RPC --> T
```
Every arrow into Supabase is subject to RLS or a hardened definer function; nothing uses the secret key in request paths.

## 2. Authentication & authorization
- Supabase Auth, email + password for admins; **public sign-ups disabled** (dashboard setting — owner action); TOTP MFA recommended for all admins and required for `owner`.
- Membership: `admin_users` table (not user-editable metadata).
- `requireAdmin()` (DAL) uses `supabase.auth.getUser()` (verifies token with Auth) then `is_admin()`; called at the top of **every** admin page and server action.
- `proxy.ts` only refreshes cookies for `/admin/*`; it is not an authorization layer (Server Functions can bypass matchers).
- Session-dependent UI rendered behind `<Suspense>`; never cached with `'use cache'` (use `'use cache: private'` only if needed).
- Logout clears the session server-side.

### Implemented in M6
- `proxy.ts` refreshes Supabase cookies for `/admin/*` only and adds `X-Robots-Tag: noindex, nofollow`.
- `features/admin/auth.ts`: `getAdmin()` (React `cache`) = `auth.getUser()` + active `admin_profiles` row; `requireAdmin()` is called by the panel layout **and** by every admin page and server action.
- Login (`signIn`): one generic error for every failure; a valid non-admin account is signed out immediately. No registration page exists.
- Uploads: real type detected from file bytes (JPEG/PNG/WebP/AVIF), 5 MB max, server-generated paths, Storage RLS enforces admin + folder.
- Admin search terms are sanitized before PostgREST `or()` filters (`features/admin/search.ts`).
- Verified without credentials: all 15 admin URLs redirect to `/admin/login` with no data in the HTML; DB role checks for settings, quotation notes/status, image rows, immutable quote items.
### Hardening (security review 2026-11-19, migration `20261119100000_admin_auth_hardening.sql`)
- **MFA required for every admin** (stricter than "owner only"): after the password, `/admin/mfa` links an authenticator app (TOTP) the first time, then asks for its 6-digit code. `requireAdmin()` accepts only `aal2` sessions (`requirePendingMfa()` guards the MFA page), and `private.is_admin()` / `is_owner()` also require the JWT claim `aal = 'aal2'`, so a password-only session cannot read customer data through the API. Lost device: an owner removes the user's MFA factor in the Supabase dashboard (Authentication → Users).
- **Per-IP attempt limit** on admin sign-in and MFA codes: 8 failures in 15 minutes from one hashed IP → "Trop de tentatives" (`public.admin_auth_guard`, key-gated like the form RPCs, `features/admin/auth-guard.ts`). Needed because Supabase Auth only sees the server's IP. Fails open (logged) if the function is missing.
- **httpOnly session cookies**: `lib/supabase/session-cookie.ts` forces `httpOnly`, `secure` (production) and `SameSite=Lax` on the Supabase auth cookies (server client and proxy refresh). Nothing in the browser reads the session.
- Dashboard (owner action, per project): enable *Leaked password protection* (Authentication → Passwords) and keep *Allow new users to sign up* off.
- Not yet verified: signed-in flows (needs an admin account — see DATABASE_SCHEMA §7). Password reset is done from the Supabase dashboard for now.

## 3. Row Level Security
- Enabled on all `public` tables; per-command policies; see `DATABASE_SCHEMA.md` §5.
- `security definer` functions: `set search_path = ''`, fully-qualified names, minimal grants, input validation inside.
- **RLS test matrix** (run on local stack before each schema PR):

| Case | Expected |
|---|---|
| anon selects unpublished product | 0 rows |
| anon selects `inquiries` | error / 0 rows |
| anon inserts into `inquiries` directly | denied |
| anon calls `submit_inquiry` valid payload | 1 row, reference returned |
| anon calls `submit_inquiry` 6× in 10 min same ip_hash | 6th raises `rate_limited` |
| authenticated non-admin updates product | denied |
| admin updates product | allowed |
| editor deletes inquiry | denied; owner allowed |
| anon uploads to `catalog` bucket | denied |

- Run Supabase security advisors after each migration.

## 4. Input validation & output encoding
- Zod schemas for every server action, search params and route params; reject unknown keys (`.strict()`).
- DB `CHECK` constraints mirror critical limits (defense in depth).
- React escapes output; **no `dangerouslySetInnerHTML`** except JSON-LD serialized with `<` escaped.
- Emails: user input escaped; plain-text part always included; headers never built from raw user input (reply-to validated as email).
- Phone normalization to E.164; emails lower-cased and validated.

## 5. Anti-spam for public forms

_Implemented in M5_ (`features/inquiries/actions.ts`): honeypot field `website` and min fill time (3 s, set client-side as `startedAt`; absent without JS) → **silent drop** with a generic success; Zod validation (`schema.ts`, unit-tested); per-IP-hash rate limit + idempotent `submissionId` inside the RPCs; RPCs callable only with the server key. The client IP is read from `x-forwarded-for` / `x-real-ip`, which is trustworthy on Vercel (set by the platform) but spoofable when self-hosted without a proxy — revisit if hosting changes. Notification outcomes are written back through `record_submission_notification` (same key guard).

1. Honeypot field (visually hidden, `tabindex=-1`, `autocomplete=off`).
2. Signed render timestamp (HMAC with server secret) — reject submissions faster than 3 s or older than 24 h.
3. `ip_hash = sha256(ip ‖ IP_HASH_SALT)` rate limit inside `submit_inquiry`.
4. Idempotent `submission_id` prevents double-submits.
5. Escalation path if spam persists: Cloudflare Turnstile (privacy-friendlier CAPTCHA) — requires approval, consent review.

## 6. Secrets & environment
- `src/lib/env.ts` validates env with Zod; `serverEnv` module imports `server-only`.
- Only `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are public.
- `.env*` git-ignored; `.env.example` lists names only.
- QA check: search `.next/static` for secret variable names/values before release.
- Any secret exposed in chat, logs or commits → rotate immediately.

## 7a. Implemented in M8
- Headers set in `next.config.ts` on every route: CSP (without nonces — see below), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`; HSTS on Vercel production only; `X-Powered-By` removed; `X-Robots-Tag: noindex` on every non-production deployment.
- **CSP trade-off:** nonce-based CSP forces dynamic rendering of every page (bundled Next docs), which would discard the Cache Components static shells. We use the documented "without nonces" policy: `script-src 'self' 'unsafe-inline'`, everything else locked to `'self'` (+ the Supabase Storage origin for images). Production additionally allows the Google Tag Manager loader and Google Analytics collection endpoints required by container `GTM-NZGP5ZDF`; development and preview deployments do not. `frame-ancestors 'none'`, `form-action 'self'`, and `object-src 'none'` remain enforced. Revisit with SRI/nonces if a stricter policy becomes a requirement.
- Secret scan of `.next/static` (browser bundles): no secret values or names (`FORM_SUBMISSION_KEY`, `IP_HASH_SALT`, secret-key names).
- `npm audit --omit=dev`: 0 vulnerabilities. Dev-only: 7 moderate in ESLint tooling (`minimatch`), not shipped.
- Playwright verifies headers and the absence of CSP violations on 30 pages × 3 viewports.

## 7. HTTP security headers (next.config.ts `headers()`)
| Header | Value (initial) |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data: https://<project>.supabase.co; connect-src 'self' https://<project>.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` (+ nonce strategy for scripts if needed — verify against Next 16 CSP guide) |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (production only) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `X-Robots-Tag` | `noindex` on preview deployments and `/admin` |

## 8. File uploads (admin)
- Allowed: `image/jpeg`, `image/png`, `image/webp`, `image/avif`; ≤ 5 MB; verify magic bytes server-side, not just the extension.
- Path generated server-side: `products/<productId>/<uuid>.<ext>`; original filename never used.
- SVG uploads **not allowed** (script risk).

## 9. Privacy (Morocco — Loi 09-08, CNDP)
- Consent checkbox + link to privacy policy on every form; consent stored (`consent = true`, timestamp = `created_at`).
- Data minimization: only fields needed to answer the inquiry.
- Retention: define with MSLAB (e.g. closed inquiries purged after N months, spam after 30 days) → scheduled purge.
- CNDP declaration/authorization for processing customer data is an **MSLAB legal responsibility** — flagged, not handled in code.
- The only third-party tracker is Google Tag Manager (production only), loaded after explicit analytics consent (ADR-024, `components/consent/`). Any new tag or storage key must be added to the Cookie Policy inventory (`src/content/legal/cookies.ts`).

## 10. Operational security
- GitHub: branch protection on `main`, required checks, 2FA for maintainers.
- Vercel: deployment protection on previews; separate Supabase project for preview/staging.
- Dependency hygiene: `npm audit` in CI (non-blocking at first), Dependabot/Renovate.
- Backups: Supabase daily backups (plan-dependent) — confirm plan with owner.
