# MSLAB Website — Claude Code Guide

@AGENTS.md

MSLAB is a Moroccan company working in **printing services, office supplies & stationery, books, and B2B services**. This repository is its public website, product catalog, inquiry/quotation system and private admin back office.

The primary business goal is to **generate qualified B2B inquiries** and make MSLAB's services easy to discover in **French (primary), Arabic (RTL) and English**.

> Read `docs/PROJECT_OVERVIEW.md` first, then `docs/SYSTEM_ARCHITECTURE.md`. The docs are the source of truth for architecture decisions; update them in the same change when a decision changes.

---

## 1. Non-negotiable rules

1. **Never invent business information.** No made-up prices, phone numbers, addresses, statistics, client logos, testimonials, certifications, years of experience or services. If content is missing, use an explicit placeholder from `src/config/business.ts` (planned) marked `TODO(content)` and list it in `docs/PROJECT_OVERVIEW.md` → *Missing information*.
2. **This is Next.js 16.4 — not the version in your training data.** Before using any Next.js API, read the matching guide in `node_modules/next/dist/docs/`. Notable differences: `proxy.ts` (not `middleware.ts`), `cacheComponents` + `'use cache'`, `next/root-params`, `updateTag`, `catchError`, `PageProps`/`LayoutProps` global helpers, async `params`/`searchParams`/`cookies()`/`headers()`.
3. **Secrets never reach the client.** Only `NEXT_PUBLIC_*` variables may be read in Client Components. Never print, log, commit or paste secret values. `.env*` is git-ignored — keep it that way.
4. **Every Supabase table has RLS enabled.** No table ships without policies reviewed against `docs/DATABASE_SCHEMA.md`.
5. **Do not run migrations against a remote Supabase project, deploy, or change production infrastructure** unless the user explicitly asks in this conversation.
6. **Do not commit or push** unless asked. Work on a feature branch, never directly on `main` once it has commits.

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.4 App Router, React 19.3, Turbopack |
| Language | TypeScript 5, `strict` |
| Styling | Tailwind CSS 4 (CSS-first `@theme`, no `tailwind.config`) via `@tailwindcss/turbopack` |
| Data | Supabase Postgres + Storage + Auth (admin only) |
| Validation | Zod (to be added as a direct dependency) |
| i18n | Built-in: `app/[lang]` + JSON dictionaries + `next/root-params` (no i18n library) |
| Email | Transactional provider via HTTP API (provider TBD — see docs) |
| Hosting | Vercel; source on GitHub `aminemaliki7/mslab-website` |

Avoid adding dependencies. Justify every new package in the PR description and in `docs/SYSTEM_ARCHITECTURE.md` → *Dependency register*.

## 3. Repository layout (target)

```
src/
  app/
    [lang]/                 # public site root layout (fr | ar | en), sets <html lang dir>
      (site)/               # marketing + catalog pages
    admin/                  # back-office root layout (not localized, French UI)
    sitemap.ts  robots.ts
  proxy.ts                  # locale negotiation, localized-path rewrites, admin session refresh
  components/
    ui/                     # design-system primitives (Button, Input, Card…) — no data access
    layout/                 # Header, Footer, LanguageSwitcher, WhatsAppButton
    catalog/  forms/  admin/
  features/                 # domain modules: catalog, inquiries, admin-auth
    <feature>/
      queries.ts            # server-only reads ('use cache' + cacheTag)
      actions.ts            # 'use server' mutations (validate → authorize → write → updateTag)
      schema.ts             # Zod schemas shared by form + action
      types.ts
  i18n/                     # locales, dictionaries/{fr,ar,en}.json, route map, helpers
  lib/
    supabase/               # server.ts, public.ts (cookie-less), admin-session.ts
    env.ts                  # validated env access (server/public split)
    seo.ts  utils.ts
  config/                   # business.ts, site.ts (verified business facts only)
supabase/
  migrations/               # SQL migrations (reviewed, applied manually)
  seed.sql                  # local-only seed, no real customer data
docs/                       # architecture documentation
```

Path alias: `@/*` → `src/*`.

## 4. Development standards

### Architecture
- **Server Components by default.** Add `'use client'` only for interactivity (forms with pending state, menus, image gallery). Keep client components small and leaf-level.
- **Data access lives in `features/*/queries.ts` and `actions.ts`**, marked `import 'server-only'`. Pages and components never build Supabase queries inline.
- Public catalog reads use the **cookie-less public client** inside `'use cache'` with `cacheLife(...)` and `cacheTag('catalog' | 'product:<id>' | 'category:<id>')`. Admin mutations call `updateTag(...)`.
- Anything reading `cookies()`/`headers()` (admin session) sits behind `<Suspense>`; never `await` the session at the top level of a layout.
- Locale is read with `lang()` from `next/root-params` in server code; Client Components receive the strings they need as props.

### TypeScript
- `strict`, no `any`, no non-null `!` on env vars (use `lib/env.ts`). Prefer `unknown` + narrowing.
- Generate DB types with Supabase CLI into `src/lib/supabase/database.types.ts`; never hand-edit.
- Discriminated unions for action results: `{ ok: true, data } | { ok: false, fieldErrors?, formError? }`.

### Validation & errors
- **Every server action validates input with Zod on the server**, even if the client validated too. Authorization is checked inside every admin action — never rely on `proxy.ts` alone.
- Expected failures return typed results; unexpected failures throw and are caught by `error.tsx` / `catchError` boundaries. Never leak raw DB errors or stack traces to users.
- Provide `loading.tsx` or `<Suspense>` fallbacks with skeletons sized like the final content (no layout shift).

### UI, accessibility, responsive
- Mobile-first. Test at 360px, 768px, 1280px.
- **RTL-safe styling only:** logical utilities (`ms-* me-* ps-* pe-* start-* end-* text-start border-s`) — never `ml-*/mr-*/left-*/right-*/text-left` for directional layout. Mirror directional icons with `rtl:-scale-x-100`.
- WCAG 2.2 AA: semantic landmarks, one `<h1>` per page, labels on every field, visible focus, contrast ≥ 4.5:1, keyboard-operable menus, `alt` on every content image (localized).

### SEO & performance
- `generateMetadata` on every page: localized title/description, canonical, `alternates.languages` (fr, ar, en, x-default → fr), Open Graph.
- JSON-LD (`Organization`, `Product`, `BreadcrumbList`) only with verified data.
- `next/image` for all images with explicit sizes; `next/font` for fonts (Latin + Arabic subsets).
- Targets: LCP < 2.5s, CLS < 0.1, INP < 200ms on mobile.

### Security
- RLS on every table; admin checks through `public.is_admin()`; public inquiry writes only via the `submit_inquiry` RPC (see `docs/SECURITY_STRATEGY.md`).
- Forms: honeypot + minimum-fill-time + per-IP-hash rate limit; consent checkbox; no raw IP stored.
- Uploaded images: validate MIME + size server-side; admin-only write to the `catalog` bucket.

## 5. Git workflow
- Branches: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>` from `main`.
- Conventional Commits (`feat(catalog): add category page`). Small, reviewable PRs.
- Each PR: passes `npm run lint` and `npx tsc --noEmit` and `npm run build`; includes screenshots for UI in fr + ar (RTL) at mobile width; updates docs when architecture changes.
- Vercel preview deployment per PR; `main` deploys to production only after review.

## 6. Commands

```bash
npm run dev          # dev server (Turbopack) — also regenerates AGENTS.md and route types
npm run lint         # ESLint (next core-web-vitals + typescript)
npx tsc --noEmit     # type check (run `npx next typegen` first if route types are stale)
npm run build        # production build — must pass before any PR
```

## 7. Skills and agents

Project skills live in `.claude/skills/` and load automatically when relevant:

| Skill | Use for |
|---|---|
| `mslab-business-context` | Any content, copy, or business-facing decision |
| `mslab-ui-design` | Components, layouts, styling, RTL, accessibility |
| `mslab-catalog-management` | Products, categories, images, search/filter, admin CRUD |
| `mslab-multilingual` | Locales, dictionaries, localized routes, RTL |
| `mslab-contact-system` | Contact/quote forms, WhatsApp, inquiry pipeline, email |
| `mslab-seo` | Metadata, hreflang, sitemap, structured data |
| `mslab-supabase` | Schema, migrations, RLS, storage, auth, typed clients |
| `mslab-deployment` | Vercel, env vars, GitHub, release checks |

Subagents in `.claude/agents/`: `architect`, `frontend-developer`, `backend-developer`, `seo-specialist`, `qa-engineer`.

## 8. Current status

Phase 1 (architecture & foundation) — docs and Claude configuration only. The `src/app` template from `create-next-app` is intentionally untouched; it is replaced in Phase 2 (see `docs/DEVELOPMENT_ROADMAP.md`).
