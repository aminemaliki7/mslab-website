---
name: mslab-deployment
description: MSLAB build, release and environment management — Vercel projects and preview deployments, environment variables per environment, GitHub branching and PR checks, domain/DNS, Supabase environments, and pre-release checklists. Use when touching env vars, CI, build config, next.config.ts, domains, or preparing a release.
---

# MSLAB Deployment

## Objective
Predictable, reversible releases: every PR gets a working preview, production only changes through reviewed merges to `main`, and no secret is ever exposed.

## When to use
Environment variables, `next.config.ts`, GitHub Actions, Vercel settings, domains, release preparation, rollback.

## Hard rules
- **Do not deploy, promote, change Vercel/Supabase/DNS settings, or create env vars on a remote platform unless the user explicitly asks** in the current conversation.
- Never print secret values; refer to variables by name.
- Never commit `.env*` files. Provide `.env.example` with names and comments only.

## Environments
| Env | Git | Vercel | Supabase | Indexing |
|---|---|---|---|---|
| Local | any branch | `next dev` | local stack (`supabase start`) or dev project | n/a |
| Preview | PR branches | Preview deployments | **separate dev/staging project** (never production data) | blocked (robots + `X-Robots-Tag`) |
| Production | `main` | Production | production project | allowed |

## Environment variables (names only)
| Name | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | public | canonical origin (domain TBD) |
| `NEXT_PUBLIC_SUPABASE_URL` | public | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | RLS-restricted key |
| `SUPABASE_SECRET_KEY` | server, scripts only | not used at runtime |
| `EMAIL_PROVIDER_API_KEY` | server | provider TBD |
| `EMAIL_FROM` / `INQUIRY_NOTIFICATION_TO` | server | needs verified domain |
| `IP_HASH_SALT` | server | random, per environment |

Access through `src/lib/env.ts`, which validates with Zod at startup and splits `serverEnv` (server-only) from `publicEnv`.

## CI (GitHub Actions, Phase 2)
On every PR: `npm ci` → `npm run lint` → `npx next typegen && npx tsc --noEmit` → `npm run build` → (later) Playwright smoke tests against the Vercel preview URL.
Branch protection on `main`: PR required, checks green, linear history.

## Release checklist
- [ ] Build passes locally and in CI.
- [ ] Migrations reviewed and applied to production **by the user** before the code that needs them is merged.
- [ ] Env vars present in Vercel Production (names verified, values never echoed).
- [ ] fr/ar/en smoke test on the preview: home, catalog, product, contact submit, quote submit, admin login.
- [ ] `robots.txt` correct for production; preview is `noindex`.
- [ ] Sitemap reachable; Search Console (owner action).
- [ ] Rollback plan: Vercel "Instant Rollback" to the previous deployment; DB migrations are additive (no destructive change in the same release).

## Next.js config notes
- `next.config.ts` already sets `cacheComponents: true`, `partialPrefetching: true` and a Turbopack Tailwind loader. Do not remove them without updating `docs/SYSTEM_ARCHITECTURE.md`.
- Add `images.remotePatterns` for the Supabase Storage host only (exact hostname, `/storage/v1/object/public/catalog/**`).
- Security headers (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`) via `headers()` in `next.config.ts` — see `docs/SECURITY_STRATEGY.md`.

## Quality requirements
- Zero build warnings treated as acceptable without a note.
- Preview URL in every PR description.

## Security
- Vercel Deployment Protection on previews (recommended).
- Rotate any key that was ever pasted into chat, logs, or a commit.
- Least privilege: GitHub and Vercel access limited to maintainers.
