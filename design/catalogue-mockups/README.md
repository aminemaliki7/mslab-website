# Catalogue mockups (public catalogue only)

Product photos of the **public catalogue**, printed with MSLAB's own identity: the ribbon "ms" +
"Lab" + dot logo (exact paths of `src/components/layout/wordmark.tsx`), the site palette
(`src/app/globals.css`) and only verified facts (site settings: phone, Errachidia address;
the promise from `docs/POSITIONING.md`).

**MSLAB Studio is separate.** Its blank, editable templates live in `public/mockups/` and are
never read or written by this pipeline. The catalogue's own blanks (`public/catalog/products/`)
are read only and stay unchanged.

## Files

| Path | What |
|---|---|
| `scripts/catalogue-mockups/artwork.mjs` | Artwork definitions (logo, palette, copy) |
| `design/catalogue-mockups/artwork/*.svg` | Generated, standalone editable artwork (one per printed surface) |
| `design/catalogue-mockups/bases/flyers-sheet-stack.webp` | Copy of the A4 sheet-stack blank used for the Flyers product (it had no photo) |
| `scripts/catalogue-mockups/compositor.mjs` | Puts artwork on a blank photo: perspective / cylinder mapping, surface masks, light transfer from the photo, fabric displacement, kraft multiply, embroidery |
| `scripts/build-catalogue-mockups.mjs` | Measured surfaces per product, builds everything |
| `public/catalog/mockups/<category>/<product>/*.webp` | Finished catalogue images (1200 × 900 WebP) |
| `public/catalog/mockups/…/*-square.webp` | 600 × 600 crops on the product, for small square slots: the homepage / Services "What we print and produce" lines (`src/config/photos.ts`, `src/config/production-lines.ts`) |
| `supabase/migrations/20261123120000_catalogue_designed_mockups.sql` | Points `product_images` at the finished images (+ alt text fr/ar/en) |

## Transparent backgrounds (cut-outs)

Products photographed on a plain backdrop are exported as **transparent WebP** (`*-cutout.webp`,
`*-cutout-square.webp`; `scripts/catalogue-mockups/cutout.mjs`): the backdrop is removed, the
product keeps its own soft shadow and sits on the card tile, its hover tint and the product
gallery colour (owner request 2026-11-23). Per product, `cutout` options cover the hard cases:
`seeds` (the hole inside the mug handle), `exclude` (areas the backdrop fill must not enter: the
paper stacks, the glazed mug body), `minRel` (dark sides of the paper bag stay solid), `fadeZones`
(the mailer box photo fades to white at its sides), `lighter` (the white outline around the hoodie
photo). Where the backdrop is not uniform (the tote on a sunlit wall, the book in a small scene)
the silhouette is traced by hand (`polygons`) and given a soft drop shadow. The corporate kit is a
scene (objects on a table) and keeps its photo. The T-shirt and the hoodie use photos supplied by
the owner on 2026-11-23 (`bases/`). Migrations `20261123170000`, `20261123180000` and
`20261123190000` point the catalogue at the cut-outs.

## Rebuild

```bash
node scripts/build-catalogue-mockups.mjs            # every product
node scripts/build-catalogue-mockups.mjs mugs       # one product (id substring)
```

The SVGs are regenerated from `artwork.mjs` on every build: edit `artwork.mjs` (or edit an SVG
in Affinity/Illustrator and port the change back). Text uses Windows system fonts — Century
Gothic (stands in for Jost) and Bahnschrift condensed (for Anton headlines) — because the web
fonts are not installed for the SVG renderer; the logo itself is outlines.

## Products

| Product | Image | Technique shown |
|---|---|---|
| Business cards | `printing/business-cards/business-cards-front-back.webp` | Teal front with white logo, contact back on the stack |
| Stickers | `printing/stickers/stickers-round-diecut.webp` | Round die-cut, ring text, peeled fold left blank |
| T-shirts | `apparel/t-shirts/t-shirts-front-print.webp` | Screen print following the folds |
| Hoodies | `apparel/hoodies/hoodies-front-print-cutout.webp` | Grey heather hoodie (owner photo, 2026-11-23) with a centre-chest print |
| Mugs | `merchandise/mugs/mugs-wrap-print.webp` | Cylinder wrap, glaze highlight kept |
| Letterhead | `stationery/letterhead/letterhead-a4.webp` | A4 letterhead with a sample letter |
| Notebooks | `stationery/notebooks/notebooks-spiral-notepad.webp` | Notepad sheet under the spiral |
| Flyers | `printed-materials/flyers/flyers-a4-stack.webp` | Full-bleed A4 flyer on a stack |
| Leaflets | `printed-materials/leaflets/leaflets-trifold.webp` | Tri-fold, three panels in perspective |
| Brochures & catalogues | `printed-materials/brochures-catalogs/brochures-catalogs-cover.webp` | Stapled catalogue cover |
| Mailer boxes | `packaging/mailer-boxes/mailer-boxes-kraft-print.webp` | One-colour print on kraft under the tape |
| Paper bags | `packaging/paper-bags/paper-bags-front.webp` | Front panel print |
| Corporate kits | `merchandise/corporate-kits/corporate-kits-set.webp` | Bottles (logo; wrapped teal band), T-shirt, mug, pen, hand flag and table flag |
| Tote bags | `merchandise/tote-bags/tote-bags-canvas-print.webp` | Two-colour screen print on natural canvas (the MSLAB event photo stays as a second view) |

Corporate kits and tote bags use blanks supplied by the owner on 2026-11-23
(`bases/corporate-kit-blank.webp`, `bases/tote-bag-blank.webp`; migration
`20261123150000_catalogue_kit_tote_mockups.sql`). Posters, document printing, office supplies and
books already had finished photos and are unchanged.
