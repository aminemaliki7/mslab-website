# Mobile Experience — Audit (Phase A) and Implementation Plan

_Audit date: 2026-11-15 · Branch `feat/catalog-architecture` · Read-only: no code changed during the audit._

## 1. Method
- **Code inspection** of every route, layout and shared component (list in §2).
- **Automated measurement** with the project's Playwright (Chromium, mobile emulation with touch for widths < 768): **193 page loads** — 17 French routes × 8 viewports (320×568, 375×812, 393×852, 430×932, 360×800, 412×915, 768×1024, 1440×900), 16 Arabic routes × 3 viewports, 9 English routes × 1 viewport. Per load: horizontal overflow and the elements causing it, touch-target sizes, input font sizes, broken images, console/hydration errors, `<h1>` count, page length.
- **Interaction checks**: mobile menu in portrait and landscape, background scroll, keyboard close.
- **Not measured** (needs action): signed-in admin screens (no test account in this session — reviewed from code), Lighthouse/throttled performance on the production build (Phase E), real iPhone/Android devices (owner, before release).

## 2. Inventory

**Public routes (fr/ar/en, localized URLs):** home · about · services index · service detail ×4 · print on demand · catalogue · category · search results (`?q=`) · product · contact · quote · order tracking · legal notice · privacy · 404 (catch-all) · `loading`/`error` states.
**Admin routes (French only):** login · dashboard · products (list, new, edit + images) · categories (list, edit) · services (list, new, edit) · quotations (list, detail) · inquiries (list, detail) · print on demand (options, mockups, portfolio + edit) · settings.

**Shared components touched by mobile work:** `layout/header`, `mobile-nav`, `language-switcher`, `footer`, `whatsapp-button`, `page-header`, `cta-band`, `ui/breadcrumbs`, `ui/button`, `ui/form`, `forms/*` (contact, quote, consent), `catalog/*` (category-nav, search form, listing, card, gallery, pagination), `print-on-demand/*` (studio, showcase, request form, uploader, tracking), `content/client-logos`, `admin/ui` (`DataTable`), `admin/admin-nav`, admin forms.

## 3. What already works (keep)
| Area | Evidence |
|---|---|
| No JS or hydration errors | 0 errors across 193 loads |
| Images | 0 broken; `next/image` with explicit sizes; logos/illustrations are SVG or small WebP |
| Structure | Every route returns 200 and has exactly one `<h1>` |
| iOS zoom on focus | All inputs/selects/textareas compute to **16 px** (no auto-zoom) |
| Viewport units | Admin and full-height layouts already use `dvh`, not `100vh` |
| Text scaling | `-webkit-text-size-adjust: 100%` set |
| Motion | `prefers-reduced-motion` zeroes animations; reveals are CSS-only |
| RTL | Logical utilities enforced by a unit test; Arabic layouts mirror correctly |
| Header | Compact 72 px, sticky, logo sized correctly, 44 px menu button, closes on Escape and on navigation |

## 4. Findings (prioritized)

### P1 — broken or blocking
| # | Finding | Where | Evidence |
|---|---|---|---|
| M1 | **Mobile menu runs off-screen in landscape** and cannot scroll: bottom links and the "Demander un devis" button are unreachable | `layout/mobile-nav.tsx` | 568×320 & 812×375: panel bottom 357 px > viewport, `overflow: visible` |
| M2 | **Page scrolls behind the open menu** (no scroll lock), so the menu and page drift apart | `mobile-nav.tsx` | `scrollY` changes while open |
| M3 | **Horizontal overflow at 320 px** on the print-on-demand studio (+8 px) and the product page (+5 px): non-wrapping buttons (`whitespace-nowrap`) inside grid columns | `mockup-studio.tsx`, `products/[product]/page.tsx`, `ui/button.tsx` | 2 of 193 loads |
| M4 | **No safe-area support**: viewport lacks `viewport-fit=cover`; nothing uses `env(safe-area-inset-*)`. Floating WhatsApp button (`bottom-4`) sits under the iPhone home indicator; in landscape the notch can cover header edges once full-bleed is enabled | `[lang]/layout.tsx`, `whatsapp-button.tsx`, `header.tsx` | code |

### P2 — usability on touch
| # | Finding | Where | Evidence (375 px) |
|---|---|---|---|
| M5 | **Footer links are 16–18 px tall** (every page; worst targets on the site) | `layout/footer.tsx` | 55×18, 93×16 … |
| M6 | **Breadcrumb links 20 px tall** | `ui/breadcrumbs.tsx` | 47×20 |
| M7 | **Consent checkbox 16×16** (label not enlarging the hit area) | `forms/form-parts.tsx` | contact, quote, POD |
| M8 | **Studio controls small**: range sliders 16 px tall, color swatches 32×32 | `mockup-studio.tsx` | POD page |
| M9 | **Catalogue: first product appears ~1.3 screens down** — page header + vertical category list + search box that repeats the category choice as a `<select>`; one large card per row | `catalog/page.tsx`, `category-nav.tsx`, `catalog-search-form.tsx`, `product-listing.tsx` | screenshot |
| M10 | **Product page actions** not full-width on phones; the main CTA scrolls away | `products/[product]/page.tsx` | screenshot |
| M11 | **Long mobile pages**: print on demand 11.6 screens, home 8.6 | POD page, homepage | page length |
| M12 | **No pressed (`:active`) states** on buttons/cards — touch gives no feedback; default grey tap highlight on Android | `ui/button.tsx`, cards, `globals.css` | code |
| M13 | **Admin lists scroll sideways on phones**: one shared `DataTable` with `min-w-[40rem]` | `admin/ui.tsx` (all list pages) | code |
| M14 | **Admin mobile chrome**: "Déconnexion" is a small text button; "Voir le site" hidden below `lg`; nav strip has no scroll affordance | `admin/(panel)/layout.tsx`, `admin-nav.tsx` | code |

### P3 — polish
| # | Finding | Where |
|---|---|---|
| M15 | Category links 40 px, About-page service chips 34 px, desktop language switcher 28 px (meets WCAG 2.2 AA 24 px, below the 44 px goal) | `category-nav.tsx`, about page, `language-switcher.tsx` |
| M16 | Headings step at `sm:` only; a fluid `clamp()` scale would avoid the jump between 375 and 640 px | `ui/layout.tsx` (`headingSizes`) |
| M17 | `scroll-padding-top: 5rem` hard-coded; should follow the header height variable | `globals.css` |
| M18 | Honeypot positioned with `-start-[10000px]`: harmless today, but a physical-direction trap if styles change; use the `sr-only`-style pattern | `forms/form-parts.tsx` |

**Bottom navigation bar — evaluated, not recommended.** The site has 4 sections + 1 primary action; the header menu already covers them in one tap, and a bottom bar would compete with the WhatsApp button and iOS home indicator. Instead: a **contextual sticky action bar on the product page** only (M10).

## 5. Implementation plan

Each phase ends with: lint, typecheck, unit tests, the new mobile test suite (B0), screenshots fr + ar at 375 px, and a desktop check at 1440 px.

### Phase B — Foundation
| Step | Change | Files |
|---|---|---|
| B0 | Turn the audit script into a committed Playwright spec `tests/e2e/mobile.spec.ts`: 8 viewports × key routes; fails on overflow, JS errors, inputs < 16 px, targets < 24 px | `tests/e2e/`, `playwright.config.ts` (projects) |
| B1 | `viewport`: `width=device-width, initial-scale=1, viewport-fit=cover`; keep zoom allowed (accessibility) | `[lang]/layout.tsx`, `admin/layout.tsx` |
| B2 | Tokens in `globals.css`: `--header-h`, `--safe-top/right/bottom/left` (from `env()`), `scroll-padding-top: var(--header-h)`; `-webkit-tap-highlight-color: transparent` + visible `:active` styles; `touch-action: manipulation` on controls | `globals.css` |
| B3 | Container side padding includes `env(safe-area-inset-left/right)` (landscape notch) | `ui/layout.tsx` (`Container`) |
| B4 | Fluid heading scale with `clamp()` for `display`/`xl`/`lg` (same max sizes as today on desktop) | `ui/layout.tsx` |
| B5 | Buttons: allow wrapping below `sm` (fixes M3 at the source) with balanced text; `:active` pressed state | `ui/button.tsx` |

### Phase C — Shared components
| Step | Change | Files |
|---|---|---|
| C1 | Mobile menu: full-height panel under the header (`max-h: calc(100dvh - var(--header-h))`, scrollable), body scroll lock while open, focus moves into the panel and returns to the button, safe-area bottom padding | `mobile-nav.tsx` |
| C2 | Footer: link rows ≥ 44 px on touch (padding, not font size), legal links spaced, safe-area bottom padding | `footer.tsx` |
| C3 | Breadcrumbs: 44 px tall hit areas; horizontal scroll with fade instead of wrapping on very small screens | `ui/breadcrumbs.tsx` |
| C4 | Forms: consent row tappable as a whole (label padding, 24 px checkbox), honeypot pattern fix, submit buttons full-width on phones, `enterkeyhint`/`autocomplete`/`inputmode` audit (email, tel, numeric quantity) | `forms/*`, `ui/form.tsx`, POD and quote forms |
| C5 | WhatsApp button: `bottom: max(1rem, env(safe-area-inset-bottom))`, hidden while the menu is open, never covering a sticky action bar | `whatsapp-button.tsx` |

### Phase D — Pages
| Step | Change | Files |
|---|---|---|
| D1 | **Catalogue (keeps cards, drawings, motion):** on phones, categories become a horizontal scrolling chip row under the search field; the duplicate category `<select>` is hidden when chips are shown; **2-column grid from 360 px** with the same card design at a compact size; page header lead shortened on phones | `catalog/*`, `catalog/page.tsx`, `[category]/page.tsx` |
| D2 | **Product page:** full-width actions on phones + sticky bottom bar ("Demander un devis" / add to quote) appearing once the main buttons scroll out; safe-area aware | `products/[product]/page.tsx`, new `catalog/product-action-bar.tsx` |
| D3 | **Print on demand:** studio preview first and sticky-at-top while adjusting on phones; 44 px slider thumbs and swatches; product picker as a horizontal scroll row on phones (shorter page); FAQ and form unchanged | `mockup-studio.tsx`, `pod-showcase.tsx`, `print-on-demand.tsx` |
| D4 | **Homepage:** tighten section spacing on phones (`py-12` instead of `py-16`), hero CTA visible in the first screen at 375×667 | `(site)/page.tsx`, `ui/layout.tsx` (`Section`) |
| D5 | **Services, about, contact, quote, tracking, legal, 404:** verify against B0 suite; chips ≥ 44 px on About | respective pages |
| D6 | **Admin:** `DataTable` renders stacked cards below `md` (same data/actions, no horizontal scroll); sign-out as a proper button, "Voir le site" visible on phones; nav strip with edge fade; admin forms single-column on phones; image upload grid 2 columns | `admin/ui.tsx`, `admin/(panel)/layout.tsx`, `admin-nav.tsx`, admin forms |

### Phase E — Platform, performance, accessibility
- iOS: keyboard + sticky bar interaction (bar hidden while an input is focused), landscape notch, `dvh` checks; Android: tap highlight, select/date controls, density.
- Production-build performance run (`scripts/perf-check.mjs`, throttled Pixel 7) on every key route incl. print on demand; Lighthouse mobile on home, catalogue, product, POD (targets 90/95/95/95).
- Accessibility: axe suite (existing) + focus order in menu and sticky bar.

### Phase F — QA
- Full B0 mobile suite + existing E2E (a11y, i18n/RTL, forms, POD) + production build.
- Signed-in admin run at 375 px (needs `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`).
- **Owner:** real-device check on one iPhone (Safari) and one Android phone (Chrome) before release.

## 6. Decisions needed from MSLAB
1. **Catalogue on phones: 2 products per row** (recommended — faster browsing, same card design) or keep 1 per row?
2. **Sticky "Demander un devis" bar on product pages** (recommended) — yes/no?
3. **Admin test account** for the signed-in mobile checks (set `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` locally; never shared in chat).
