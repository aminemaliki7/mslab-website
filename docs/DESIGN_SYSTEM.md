# MSLAB Design System

_Status: Milestone 1. The palette is **provisional** (ADR-018) until MSLAB supplies its logo and brand colors. Swap the raw values in `src/app/globals.css`; components only use semantic tokens, so nothing else changes._

## 0. Current direction — "Atelier" (2026-11-19, supersedes §1 and the raw values in §2)
Owner brief: a calm, airy fashion-house feel (reference: minimal white page, large light capitals, rounded photographic tiles, charcoal pill button), applied to a bulk production partner.

- **Color — owner brand palette (2026-11-19):**
  - **Deep Teal `#0B6E8A`** — primary brand (logo), links, focus, teal-mist tiles `#E3EEF1`.
  - **White `#FFFFFF`** — page background and almost every section (owner: white on most sections). **Soft Ivory `#F7F6F2`** — only small boxes (contact details, tracking form, gallery frames); tiles `#ECEAE3`.
  - **Midnight Navy `#193642`** — premium contrast: text (11.8:1 on ivory) and dark bands (process, brand journey, CTA, footer).
  - Muted text slate `#5B6779` (5.3:1 on ivory). The logo keeps its own exact colours (`#0B6E8A`, `#0E1A2B`, light teal `#5BA7BC` on dark).
  - **No gold** (owner, 2026-11-19). Main calls to action: Deep Teal pill, white text; on navy bands: white pill, navy text. Numerals and small accents on navy: logo light teal `#5BA7BC`.
  - Muted text slate `#5B6779` (5.7:1 on white). Rejected: a "Mediterranean Craft" blue/cream/terracotta palette (2026-11-19).
- **Type:** Jost (Futura lineage) for text, IBM Plex Sans Arabic for Arabic, and **Anton — the logo's "Lab" face — for brand moments only**: `.type-poster` (hero, page titles) and step numerals. Bold (Jost 600) for card and item titles. Smaller, calm scale: body 15px / 1.7; hero max ~4.25rem in Anton; section headings `.type-display` light sentence case, max 2rem; navigation and buttons `.type-caps` small spaced capitals. Archivo is kept only as a studio design font (not preloaded).
- **Shape:** buttons are full pills; fields 12 px; cards and tiles 20 px (kept compact: two product cards per row on phones). Copy is short: one line per idea. No shadows except the white paging buttons on the hero tile.
- **Structure:** a 1 px charcoal hairline under the header and above the footer, inside the page margins. Index lists keep their 2 px opening rule.
- **Hero:** title, lead, two pill CTAs (quote / order tracking), a « Voir tout le catalogue » link and, under it, the printer's control strip (the four process inks C·M·Y·K, `ControlStrip variant="process"`) — beside an object collage: one large pageable tile showing real catalogue products (featured first, photos only; each opens its product page, `components/home/catalogue-collage.tsx`) above two fixed tiles, « Votre idée » (T-shirt tech pack) and « Notre production » (heat-press illustration on #9C0D29). Since 2026-11-25 the studio mockups and the brand-name field are no longer in the hero (`live-proof.tsx` was removed). This is the one bold moment; everything else stays quiet.
- **Homepage after the hero (2026-11-25):** « Trois activités » on the ivory band — three image cards (production: the red heat-press illustration shown whole on #9C0D29; catalogue: owner-supplied corporate kit; digital: Unsplash — `src/assets/divisions/CREDITS.md`) marked with the process inks C·M·Y — then the **3D printing** section (`components/home/print-3d.tsx`, ink K): text beside a short product film (`public/media/3d-printing/`, 11.6 s, 1280×720, ~1.1 MB WebM / 1.6 MB MP4). Edit: the assembled stand (owner's own white-background photo, cut out locally, on a charcoal spotlight backdrop, slow push-in, small C·M·Y·K control-strip mark bottom-left) → « print pass » wipe (four process-ink bands sweep across and cover the cut) → the owner's printer timelapse at 2.8×, graded cool with a vignette → wipe → the stand pulling back to its exact opening frame (seamless loop). No text or logo in the film; poster = frame 0. Never use the model author's photos. The clip loads only when on screen, pauses off screen, waits for a click under reduced motion / Save-Data, and has no visible control or caption: tapping/clicking the clip (or Enter on keyboard focus) pauses and plays it (WCAG 2.2.2).
- **Product photos (2026-11-19):** owner-supplied mockups in `src/assets/production/`, registered in `src/config/photos.ts`. Every product image carries the MSLAB logo — blank mockups and the three photos (heat press, mug press, event kits, where the previous mark was erased first) — applied by `scripts/brand-mockups.mjs` (perspective warp on flat surfaces, cylinder wrap on the mug, multiply blend so print takes the surface shading; the logo's own on-dark variant on black cloth). Never publish watermarked stock previews (a "dreamstime" stationery set was removed). Not used: 3D printing and signage photos (not offered). Placement carries meaning: hero tiles = "Votre idée" (T-shirt tech pack) · "Votre design" (live preview) · "Notre production" (owner's red heat-press illustration, shown whole on its own red #9C0D29); business card = corporate kit (owner photo, used as is); brands card = shopping bag; process band = mug press.
- **Motion:** only the collage swap when the visitor pages (and the existing scroll reveals, all disabled for reduced motion).

## 1. Direction (previous, Milestone 1)
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
| `primary` / `primary-hover` / `on-primary` | ink-900 / ink-700 / white | Dark footer and ink surfaces |
| `accent` / `accent-hover` / `accent-soft` | cyan-700 `#0B6E8A` / `#085870` / `#E7F2F5` | Links, active nav, eyebrow, focus, primary and accent buttons |
| `focus` | cyan-700 | `:focus-visible` outline (2px, offset 2px) |
| `danger`, `success`, `warning` (+ `-soft`) | `#B42318`, `#1E7A46`, `#8A5A00` | Status only — never decorative |

Rules: one primary button per view region; use brand cyan for filled primary actions; status colors only for status.

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

## 9. Logo (revised 2026-11-16)
- **Mark:** a wavy ribbon "ms" (rounded arches with narrow slots; the S is a rounded block cut by one slot from the right and one from the left) in cyan `#0B6E8A`, "Lab" below in Anton (SIL Open Font License, converted to outlines) in ink `#0E1A2B`, and a cyan signature dot.
- **Inverted** (dark backgrounds, e.g. footer): light cyan `#5BA7BC` shapes and dot, white "Lab".
- **Files:** `public/brand/mslab-logo.svg` (full logo), `public/brand/mslab-mark.svg` ("ms" only), `public/brand/mslab-logo-512.png`, `public/brand/og-default.png` (share image), `src/app/icon.svg` + `src/app/apple-icon.png` (icons). In React: `Wordmark` / `LogoMark` in `components/layout/wordmark.tsx`.
- **Trademark:** the shapes follow a reference logo supplied by the owner; check for conflicts with that brand before print or signage use.

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
| `ProductArt` (notebook, pen, book, binder, stapler, paper, print, generic supplies) | `product-art.tsx` | Products without photos (cards, gallery). Chosen by `resolveProductVisual` (`src/features/catalog/visual.ts`): an uploaded photo always wins; otherwise the drawing MSLAB picked (`visual_key`), else keywords in the French slug |
| `ProductPlaceholderIllustration` | `index.tsx` | Neutral fallback icon (no longer used on public pages) |

The four homepage activities are **picture cards**: illustration first, then number, label and link.

Page headers accept an `illustration` prop (shown from `md` up). Pass a width class when giving an illustration a `className`; without one it fills its container.

**Motion** (`src/app/globals.css`): slow and subtle — `anim-float` (6–8 s), `anim-print` (7 s sheet output loop, fully visible ~85% of the time), `anim-draw` / `anim-draw-loop` (strokes), `anim-grow-x` (text lines composing, mirrored in RTL), `.reveal` (slide-up on scroll via CSS scroll-driven animations — transform only, never opacity, so text keeps full contrast; no JavaScript; content is simply in place where unsupported). Cards lift 2 px on hover. **Logo intro**: on the first page of a visit the header logo's sheet appears whole, then its corner turns over along the fold line and lands as the cyan flap (~1.3 s total). A tiny inline script in `app/[lang]/layout.tsx` sets `<html class="logo-intro">` once per browser session (`sessionStorage`); skipped under reduced motion.
Accessibility: everything is disabled for `prefers-reduced-motion: reduce` (durations and delays zeroed; reveals not applied). Never animate text content or anything essential to understanding a page.

### Print-on-demand mockup studio
`components/print-on-demand/mockups.tsx` draws eleven products as original SVG (T-shirt, hoodie, tote bag, mug, box, notebook, sticker, business card, flyer, poster, letterhead), each with a print area. `mockup-studio.tsx` places the visitor's image (object URL — nothing is uploaded for the preview) or text in that area with size / position sliders (always LTR) and product colors; "Utiliser ce produit" fills the request form's product type and hands the file to the uploader (`mockup-handoff.ts`). Which products appear, and their order, is set in `/admin/print-on-demand` (`mockup_products` table). The preview is labelled as indicative: final formats and colors are confirmed with the quote.
