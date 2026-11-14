# MSLAB Design System

_Status: Milestone 1. The palette is **provisional** (ADR-018) until MSLAB supplies its logo and brand colors. Swap the raw values in `src/app/globals.css`; components only use semantic tokens, so nothing else changes._

## 1. Direction
"Ink on paper": an editorial, print-trade look suited to a printing / stationery / books company. Hairline rules instead of shadows, a single accent color, generous whitespace, strong type hierarchy. No gradients, no decorative illustrations, no stock "AI" visuals.

## 2. Color tokens (`@theme` in `src/app/globals.css`)
| Semantic token (Tailwind class) | Raw value | Use |
|---|---|---|
| `fg` (`text-fg`) | ink-900 `#0E1A2B` | Body text, headings |
| `fg-muted` | slate-500 `#5B6779` | Secondary text (≥ 5:1 on white & paper) |
| `fg-subtle` | slate-400 `#67717F` | Meta, numbering, SKUs (AA: 4.95:1 on white, 4.57:1 on paper) |
| `bg` | `#FFFFFF` | Page background |
| `surface` | paper-50 `#F7F6F2` | Section bands, page headers |
| `surface-strong` | paper-100 `#EFEDE6` | Skeletons, neutral badges |
| `line` / `line-strong` | `#E3E1DA` / `#C9C6BC` | Dividers / form control borders |
| `primary` / `primary-hover` / `on-primary` | ink-900 / ink-700 / white | Primary buttons, dark footer |
| `accent` / `accent-hover` / `accent-soft` | cyan-700 `#0B6E8A` / `#085870` / `#E7F2F5` | Links, active nav, eyebrow, focus |
| `focus` | cyan-700 | `:focus-visible` outline (2px, offset 2px) |
| `danger`, `success`, `warning` (+ `-soft`) | `#B42318`, `#1E7A46`, `#8A5A00` | Status only — never decorative |

Rules: one primary button per view region; accent is for interaction cues, not large fills; status colors only for status.

## 3. Typography
| Role | Font | Notes |
|---|---|---|
| Latin UI & headings | Geist (`--font-geist`) | kept from the original project |
| Arabic | IBM Plex Sans Arabic (`--font-plex-arabic`) | applied via `:lang(ar)`; line-height 1.8 |
| Numbers / codes | Geist Mono | SKUs, references, numbering |

Heading sizes (`<Heading size>`): `display` 36→60px, `xl` 30→36px, `lg` 24→30px, `md` 20→24px, `sm` 18px — all semibold, tight tracking, `text-balance`. Body 16px/1.6; `Lead` 18px muted. Eyebrow: 12px uppercase with letter-spacing (disabled in Arabic, where uppercase/tracking do not apply).

## 4. Spacing & layout
- 4px base grid (Tailwind default scale).
- `Container`: max 1200px (`75rem`), gutters 16 / 24 / 32px (mobile / sm / lg).
- `Section`: 64px vertical padding mobile, 96px desktop; `tone="surface"` for paper bands.
- Header height 72px, sticky, hairline bottom border.
- Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Navigation collapses below `lg`.

## 5. Shape, elevation, motion
- Radius: controls 6px (`--radius-control`), cards 10px (`--radius-card`), badges full.
- Elevation: borders by default; one soft shadow only for overlays (mobile menu, floating WhatsApp button).
- Motion: 150ms color/transform transitions with `--ease-out-soft`; everything disabled under `prefers-reduced-motion`.

## 6. RTL rules
- `<html dir="rtl">` for Arabic is set by `app/[lang]/layout.tsx`.
- Logical utilities only (`ms/me/ps/pe/start/end/border-s/border-e/text-start`).
- Directional icons (`ArrowIcon`, `ChevronIcon`) get `rtl:-scale-x-100`.
- Latin brand names, phone numbers, e-mails and codes are wrapped in `<bdi dir="ltr">` / `dir="ltr"`.

## 7. Components (`src/components`)
| Component | File | Notes |
|---|---|---|
| `Button`, `ButtonLink`, `buttonClasses` | `ui/button.tsx` | variants `primary · secondary · accent · ghost`, sizes `sm · md · lg`. Don't pass display utilities via `className` — wrap instead |
| `Container`, `Section`, `Heading`, `Eyebrow`, `Lead`, `Card`, `Badge`, `Skeleton` | `ui/layout.tsx` | |
| `Field`, `Input`, `Textarea`, `Select`, `Checkbox` | `ui/form.tsx` | `Field` wires label, hint, error, `aria-invalid`, `aria-describedby`; supports `dir` for Arabic content fields |
| `Breadcrumbs` | `ui/breadcrumbs.tsx` | `aria-current="page"` on last item |
| Icons | `ui/icons.tsx` | inline SVG, decorative (`aria-hidden`) |
| `Header`, `NavLinks`, `MobileNav`, `LanguageSwitcher` | `layout/*` | path-aware parts wrapped in `<Suspense>` with static fallbacks |
| `Footer` | `layout/footer.tsx` | contact column rendered only when verified settings exist |
| `WhatsAppButton` | `layout/whatsapp-button.tsx` | hidden until a verified number exists |
| `Wordmark` | `layout/wordmark.tsx` | text placeholder until the logo is supplied (TODO(brand)) |
| `PageHeader` | `layout/page-header.tsx` | single `h1` + lead |
| `CtaBand` | `layout/cta-band.tsx` | closing ink band: quote (accent), contact (`inverse`), WhatsApp only with a verified number |
| `ServiceCard`, `ProductCard` | `catalog/*` | whole card is one link; product card shows SKU, never price |
| `RichText`, `toLines` | `content/rich-text.tsx` | safe plain-text renderer for admin content (paragraphs, `- ` bullet lists, no HTML) |
| `ArrowLink` | `ui/arrow-link.tsx` | secondary link with RTL-mirrored arrow; external URLs open in a new tab |
| Hero crop marks | `app/[lang]/(site)/page.tsx` | print registration marks framing the hero (decorative, `aria-hidden`) |

Button variants also include `inverse` and `inverseGhost` for dark backgrounds.

## 8. Accessibility baseline
Skip link → `#main`; landmarks (`header`, `nav` with labels, `main`, `footer`); `aria-current` on active nav and language; visible focus everywhere; touch targets ≥ 40px in navigation; color contrast AA for all text tokens (fg-subtle darkened in M8 after axe flagged it).

## 9. Logo (ADR-019)
Original SVG created for the project (no prior MSLAB logo existed):
- **Mark:** a sheet of paper in ink `#0E1A2B` with its top-right corner folded (accent cyan `#0B6E8A`), carrying a white "M" monogram — a direct reference to printing, paper and documents.
- **Lockup:** mark + "MSLAB" in Geist Bold, tight tracking. Always LTR, also on Arabic pages.
- **Inverted** (dark backgrounds, e.g. footer): white sheet, ink monogram, same cyan fold.
- **Clear space:** at least half the mark's width around the lockup. **Minimum size:** 16 px (favicon) for the mark, 24 px height for the lockup.
- **Files:** `public/brand/mslab-mark.svg` (mark), `public/brand/mslab-logo.svg` (lockup, wordmark as text — outline the text in a vector editor before print use), `src/app/icon.svg` (favicon). In React: `LogoMark` / `Wordmark` in `components/layout/wordmark.tsx`.

The palette (§2) is built from the same ink/cyan pair, so no color change was needed.

## 10. Open brand items
Trademark check of the logo before print/signage use (logo approved 2026-11-14), whether to keep Geist, photography direction, OG share image (M8).

## 11. Illustrations and motion
**Illustrations** (`src/components/illustrations/index.tsx`): original inline-SVG line drawings in the brand palette, decorative only (`aria-hidden`), ≈1–2 KB each — chosen over GIFs/photos for weight, sharpness and honesty (they never depict real premises, staff, clients or products).

**Goal:** a visitor understands MSLAB's activities from the pictures alone, in any language. Scenes use recognizable everyday objects (printer, flyers, business cards, books, pencil cup, sticky notes, supply carton) and contain no text. They never claim unconfirmed services (no delivery trucks, no people, no premises).

| Illustration | File | Used on |
|---|---|---|
| `HeroScene`: printer printing a flyer + business cards, books, pencil cup/ruler/sticky note, supply carton with paper reams | `scenes.tsx` | Homepage hero: first element on phones (compact), beside the text on desktop |
| `PrintShopIllustration`: printer, flyers, business cards | `scenes.tsx` | "Printing" picture card, Services header |
| `StationeryIllustration`: notebook, pencil cup, ruler, sticky note, stapler | `scenes.tsx` | "Office supplies" picture card, Catalog header |
| `LibraryIllustration`: book row, stack, open book | `scenes.tsx` | "Books" picture card, About header |
| `BusinessSupplyIllustration`: supply carton (reams, folders) + purchase order | `scenes.tsx` | "Business services" picture card |
| `ChecklistIllustration` (clipboard ticking itself) | `index.tsx` | Quote header |
| `EnvelopeIllustration` (letter rising) | `index.tsx` | Contact header |
| `LostSheetIllustration` | `index.tsx` | 404 page |
| `ProductArt` (notebook, pen, book, binder, stapler, paper, print, generic supplies) | `product-art.tsx` | Products without photos (cards, gallery). Drawing chosen from keywords in the French slug (`productArtKind`); an uploaded photo always wins |
| `ProductPlaceholderIllustration` | `index.tsx` | Neutral fallback icon (no longer used on public pages) |

The four homepage activities are **picture cards**: illustration first, then number, label and link.

Page headers accept an `illustration` prop (shown from `md` up). Pass a width class when giving an illustration a `className`; without one it fills its container.

**Motion** (`src/app/globals.css`): slow and subtle — `anim-float` (6–8 s), `anim-print` (7 s sheet output loop, fully visible ~85% of the time), `anim-draw` / `anim-draw-loop` (strokes), `anim-grow-x` (text lines composing, mirrored in RTL), `.reveal` (slide-up on scroll via CSS scroll-driven animations — transform only, never opacity, so text keeps full contrast; no JavaScript; content is simply in place where unsupported). Cards lift 2 px on hover.
Accessibility: everything is disabled for `prefers-reduced-motion: reduce` (durations and delays zeroed; reveals not applied). Never animate text content or anything essential to understanding a page.
