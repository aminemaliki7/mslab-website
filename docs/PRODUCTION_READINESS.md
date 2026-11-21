# Production Readiness Review (Milestone 9)

_Review date: 2026-11-14 · Branch `feat/foundation` · Nothing has been deployed._

Legend: ✅ done and verified · 🟡 done, needs owner review · ⛔ **launch blocker** · 👤 owner action (dashboard/DNS/billing) · ⏭ post-launch

## 1. Verdict
The **application is technically ready** (features complete, 233 automated tests passing, security and performance targets met). **Launch is blocked by content and owner actions**, not by code: real company information, legal texts, production infrastructure and an email provider.

## 2. Launch blockers ⛔
| # | Item | Why it blocks | Who |
|---|---|---|---|
| B1 | Legal documents (8 pages, fr/ar/en) | Drafted in `src/content/legal/` against Loi 09-08 / 31-08 / 53-05; status `draft` → noindex + provisional notice. Missing facts are visible placeholders. Checklist: `LEGAL_CONTENT_CHECKLIST.md` | MSLAB (facts) + lawyer (validation) |
| B2 | Verified company information in **/admin/settings** | Contact page/footer show nothing without phone, email, address; WhatsApp buttons stay hidden | MSLAB |
| B3 | Real services, categories and products | `supabase/seed/initial_catalog.sql` sets up the six categories and 18 product types with photos; run it on production. References, sizes, MOQ and more photos to be added by MSLAB in the admin | MSLAB |
| B4 | Production Supabase project (**Free plan**, ADR-020) + Vercel Pro project + env vars | Runbook §2–3. The free organization already has 2 active projects (`hirely`, `mslab-dev`) — production needs a slot: decision pending (see §6) | 👤 owner |
| B5 | Domain name + DNS | Canonical URLs, sitemap, email sender | 👤 owner |
| B6 | Disable public sign-ups in Supabase Auth (dev **and** prod) | Prevents account creation by strangers (RLS still blocks admin access, but accounts should not exist) | 👤 owner — dev status not yet confirmed |

## 3. Strongly recommended before launch 🟡
| Item | Status |
|---|---|
| Email provider (Resend/Brevo/Postmark) + verified domain | Not chosen. Without it, MSLAB must check the admin dashboard for new requests (badge counts + "email not sent" notice). |
| Native review of Arabic and English UI text | Machine-assisted translations written by the developer (`src/i18n/dictionaries/*.json`). |
| Logo trademark check before print/signage | Logo approved for web (ADR-019). |
| Signed-in admin E2E run | Tests exist (`tests/e2e/admin.spec.ts`); run with an owner-provided test account via `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`. Owner confirmed manual login works. |
| Move the repository out of OneDrive | OneDrive breaks local `next build` (EPERM). Does not affect Vercel builds. |

## 4. Engineering checklist
### Functionality
| Area | Status |
|---|---|
| Public site fr/ar/en, localized URLs, RTL | ✅ Playwright: 30 pages × 3 viewports |
| Catalog: categories, search, filters, pagination, product pages | ✅ |
| Quotation (multi-product + custom items, quote list) and contact | ✅ JS (Playwright) and no-JS (HTTP tests) paths |
| Admin: auth, dashboard, products+images, categories, services, quotations, inquiries, settings | ✅ built; guard tests ✅; signed-in flows verified manually by owner (login) — full flows 🟡 |
| Language enable/disable, legal pages from settings | ✅ |

### Security
| Item | Status |
|---|---|
| RLS on all tables; anon cannot read customer data; quote items immutable | ✅ 34 SQL role checks + 11 integration tests |
| Public submissions only via key-guarded RPCs, rate limit, idempotency, honeypot, min fill time | ✅ |
| Admin authorization in every page/action (`requireAdmin`), no public registration UI | ✅ |
| Security headers (CSP without nonces, frame-ancestors none, nosniff, referrer, permissions, COOP, HSTS on prod) | ✅ verified by Playwright |
| No secrets in browser bundles or git history | ✅ scanned |
| Dependencies | ✅ prod: 0 vulnerabilities · dev-only: 7 moderate (ESLint tooling) |
| Uploads: type sniffed from bytes, 5 MB, admin-only Storage policies, no SVG | ✅ |

### SEO
| Item | Status |
|---|---|
| Per-page localized metadata, canonical, hreflang (enabled locales), OG/Twitter | ✅ |
| `sitemap.xml` (48 URLs in dev data), `robots.txt` (production-only crawling) | ✅ |
| JSON-LD: Organization (verified fields only), Product, BreadcrumbList | ✅ |
| Runtime-created entity pages return 200 for not-found/redirect (streaming) | 🟡 documented in `ROUTING_STRATEGY.md`; `noindex` + meta refresh mitigate |

### Accessibility & performance
| Item | Status |
|---|---|
| axe WCAG 2.2 AA (12 templates × 3 viewports): no serious/critical issues | ✅ |
| Skip link, landmarks, labels, focus management on form errors | ✅ |
| Throttled mobile: LCP 0.4–1.1 s, CLS 0 | ✅ `scripts/perf-check.mjs` |

### Operations
| Item | Status |
|---|---|
| CI (lint, types, unit, build, E2E, prod audit) | ✅ `.github/workflows/ci.yml` — needs 2 repo variables (runbook §1) |
| Vercel config (`vercel.json` region `cdg1`, Node `engines`) | ✅ |
| Runbook: setup, release, rollback, key rotation | ✅ `DEPLOYMENT_RUNBOOK.md` |
| Error monitoring beyond Vercel logs | ⏭ optional (e.g. Sentry) — not added to avoid an unrequested dependency/vendor |
| Data retention / purge job (Loi 09-08) | ⏭ blocked on MSLAB's retention decision |
| Analytics (consent-aware) | ✅ GTM `GTM-NZGP5ZDF` loads only after opt-in (ADR-024) |
| Password-reset page for admins | ⏭ reset via Supabase dashboard for now |

## 6. Supabase Free plan (ADR-020)
| Risk | Mitigation |
|---|---|
| Project paused after inactivity | Daily keep-alive workflow (`supabase-keepalive.yml`) + failure alert in GitHub Actions |
| No automatic backups | Manual weekly backup routine (runbook §7); data dumps handled as personal data |
| Usage limits (DB size, storage, egress) | Image size guidance, monthly usage check; upgrade if limits are approached |
| 2 active projects per free organization | **Open decision:** where production lives (options below) |

Options for the project slot:
1. **Pause or delete `hirely`** (another product) to free a slot for `mslab-prod`.
2. **Use a second free organization** (separate owner account/organization) for `mslab-prod`.
3. **Promote `mslab-dev` to production** after removing sample/test data, and do development on a local Supabase stack (Docker) instead — dev and prod must not share a database once real customer data exists.

## 5. Known limitations (accepted)
- CSP allows `'unsafe-inline'` scripts/styles (trade-off to keep static pre-rendering; see `SECURITY_STRATEGY.md` §7a).
- Admin UI in French, English or Arabic (RTL), chosen by each admin (ADR-015, revised 2026-11-16); Arabic content fields are RTL.
- Service images cannot be uploaded yet (services render without images).
- If a product in a visitor's saved quote list is unpublished, the error does not name which product.
