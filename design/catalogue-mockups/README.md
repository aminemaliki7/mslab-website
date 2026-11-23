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
| Hoodies | `apparel/hoodies/hoodies-front-embroidery.webp`, `hoodies-back-print.webp` | Left-chest embroidery; large back print |
| Mugs | `merchandise/mugs/mugs-wrap-print.webp` | Cylinder wrap, glaze highlight kept |
| Letterhead | `stationery/letterhead/letterhead-a4.webp` | A4 letterhead with a sample letter |
| Notebooks | `stationery/notebooks/notebooks-spiral-notepad.webp` | Notepad sheet under the spiral |
| Flyers | `printed-materials/flyers/flyers-a4-stack.webp` | Full-bleed A4 flyer on a stack |
| Leaflets | `printed-materials/leaflets/leaflets-trifold.webp` | Tri-fold, three panels in perspective |
| Brochures & catalogues | `printed-materials/brochures-catalogs/brochures-catalogs-cover.webp` | Stapled catalogue cover |
| Mailer boxes | `packaging/mailer-boxes/mailer-boxes-kraft-print.webp` | One-colour print on kraft under the tape |
| Paper bags | `packaging/paper-bags/paper-bags-front.webp` | Front panel print |

Posters, document printing, tote bags, corporate kits, office supplies and books already had
finished photos and are unchanged.
