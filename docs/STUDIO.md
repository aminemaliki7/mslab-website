# MSLAB Studio (ADR-026)

The customisation tool on its own page, `/fr/studio` (`/ar/studio`, `/en/studio`), as a five-step project: product, configuration, customization, preview, quote request. Customer-experience decisions: docs/STUDIO_CX_PLAN.md.

## 1. Principles
- **No invented production data.** Product photos, printable areas, colours, sizes, materials, printing techniques and the minimum resolution are entered by MSLAB in `/admin/print-on-demand/studio/<product>`. Until a product has a configured side, the Studio shows a **placeholder** visual (one of MSLAB's vector templates, or an SVG drawing for the sticker and letterhead). It then exposes no specification and computes no print size.
- **Photo placeholders (T-shirt, business card, flyer, poster, letterhead, notebook, folded card, catalogue, banner).** The last three were added on 2026-11-20 (migration `20261120120000_mockup_products_photo_mockups.sql`). `public/mockups/photos/<product>.webp` (see `public/mockups/CREDITS.md`). One front side each, not recolourable; on tilted products the print area is mapped onto the surface with an SVG `matrix(...)` transform (stage, cards and exported mockup).
- **Vector product templates (hoodie, tote bag, mug, box).** `scripts/build-product-mockups.mjs` builds `public/mockups/svg/<product>.svg` for the hoodie, tote bag, mug, box, notebook, business card, flyer and poster:
  - one front side each, in a 1200 × 900 frame (the business card's area is rotated with the card);
  - recolourable, with the same under/over layering as the T-shirt;
  - it also writes `product-templates.generated.ts` and `garment/product-layers.generated.ts`. The sticker and letterhead stay SVG drawings.
- **Vector garment template (T-shirt, not used since 2026-11-20: replaced by the photo).** `public/mockups/svg/tshirt.svg` (docs/TSHIRT_SVG_MOCKUP.md) was the T-shirt placeholder:
  - four sides (front, back, left sleeve, right sleeve); the sleeves are shown close up, with a print area rotated along the sleeve;
  - recolourable with the drawing swatches;
  - the artwork is drawn between the fabric colour and the lighting layers, so folds, texture and seams fall on the print.
  - `scripts/build-tshirt-mockup.mjs` regenerates the SVG and two modules: `features/print-on-demand/tshirt-template.generated.ts` (sides, areas, crops: shared with the server, `placeholderSides()`) and `components/print-on-demand/garment/tshirt-layers.generated.ts` (the under/over layers, drawn as cached SVG images by `garment/garment-template.ts`).
- **A mockup is not a production file.** Three outputs are kept separate:
  1. **Interactive preview**: `components/print-on-demand/studio/stage.tsx` (SVG, in the browser).
  2. **High-resolution mockup**: `studio/export-mockup.ts`. The side is redrawn on a canvas at the photo's own resolution (drawings at 1600 px) with the real web fonts, then uploaded as `mslab-mockup-<product>-<side>.png`, with the file role `mockup`.
  3. **Production material**: the customer's **original files, uploaded unchanged** (role `artwork`), plus the **design spec** stored in `custom_request_details.design`. The spec holds the layers per side, their position, size and rotation, physical millimetres and resolution when the printable size is known, the text, font and colour, and the chosen options.
- No new dependency. Everything is SVG and Canvas 2D.

## 2. Flow
1. The visitor adds layers (images: PNG, JPG, WebP, SVG or PDF; text in the site's fonts) on each configured side.
   - They move, resize and rotate them directly, with arrow-key nudging and undo/redo (`studio/editor-state.ts`).
   - Layers are clipped to the printable area; a layer that overflows is flagged.
   - The DPI is shown when MSLAB has entered the real print size, and flagged when below the minimum MSLAB set.
2. **Use this design in my request** sends the hand-off (`mockup-handoff.ts`) to the request form:
   - a hidden `studioDesign` field;
   - the original files (each attached once; they count towards the visitor's 5 files);
   - fresh mockups (up to 5, not counted, replacing earlier ones).
3. The server action (`features/print-on-demand/actions.ts`) re-validates the design with Zod (`design.ts`). `resolve-design.ts` then:
   - replaces option ids with the names from MSLAB's configuration (ids that are unknown or inactive are dropped);
   - drops layers on sides the product does not have;
   - computes millimetres and DPI from the configured print size only.
4. The admin quotation page shows a **Studio design** panel (`components/admin/studio-design-panel.tsx`) with:
   - the options and, for each side, every element with its placement, rotation and resolution;
   - the mockups (shown inline only when the bytes are a verified PNG).
   Every file is checked against its **real content** (first 64 KB, `features/admin/file-check.ts`).

## 3. Security
- File types are identified from their bytes (`file-sniff.ts`), never from the name or the declared type: in the editor, in the request uploader, and again in the admin.
- SVG is accepted as artwork. It is rendered only through `<image>` in the visitor's own browser (scripts never run), and the admin only downloads it, never renders it inline.
- Uploads go straight from the browser to the private bucket with a single-use ticket (ADR-021). A ticket now accepts up to 10 objects (5 artwork + 5 mockups).

## 4. What MSLAB must provide (per product: T-shirt, hoodie, mug, tote bag, notebook)
- **Photos of MSLAB's own products** (or licensed, non-AI templates):
  - one per printable side, straight on, at least 2000 px wide, even lighting;
  - ideally a white or light item, so it can be recoloured through a mask.
- Optional **colour mask** (greyscale, white = product) and **relief map** (greyscale), each the same size as the photo.
- **Printable area** in the photo's pixels and its **real size in mm**.
- **Available colours** (name + hex), **sizes**, **materials**, **printing techniques**: only the ones really offered.
- **Minimum resolution** (DPI) MSLAB accepts.

## 5. Not implemented / limits
- **Automatic print-ready file export** (layout PDF at print size, bleed, colour profile): this needs MSLAB's production specifications (phase 3).
- PDF artwork is not previewed (decision C1): it appears as a frame.
- The relief map is applied in the live preview, not in the exported mockup.
- Single size per request in the design; a per-size quantity breakdown goes in the description.
- Per-colour photos (separate photos for dark garments) are not supported yet; colours are shown by recolouring through the mask.

## 6. Database (migration `20261118150000_studio_configuration.sql`, not yet applied)
`studio_products` (5 keys, `min_dpi`), `studio_views` (photo, mask, relief map, area, size in mm), `studio_options` (colour / size / material / technique), `custom_request_details.design` (jsonb), `quotation_files.role` (`artwork` | `mockup`). The migration also allows SVG in `custom-uploads`, adds the `studio/` folder to the catalog bucket, and updates `submit_custom_request`.

After applying it, regenerate `src/lib/supabase/database.types.ts`. Until then, the code reads these tables through an untyped client and falls back to the placeholders.
