# Studio: customer experience audit and plan

_2026-11-24. Complements docs/STUDIO.md (ADR-026), which stays the technical reference._

## 1. Audit

**Works (kept as is)**
- 14 supports (`mockup_products`, admin-ordered): T-shirt, hoodie (front + back), tote, mug, box, notebook, sticker, business card, flyer, folded card, catalogue, poster, letterhead, banner.
- Blank mockups in `public/mockups/photos` and `public/mockups/svg` are never modified: the customer's layers are drawn on top in SVG (`studio/stage.tsx`) and clipped to the print area; tilted products use a flat matrix mapping, not a fake 3D render.
- Image layers (PNG, JPG, WebP, SVG, PDF) identified from their bytes (`file-sniff.ts`), 15 MB max, 12 layers; text layers in the site fonts; move, resize, rotate, nudge, reorder, delete, undo/redo.
- "Use this design" exports one PNG mockup per side, attaches the original files unchanged and a JSON design spec; uploads go to the private bucket with a single-use ticket; the server re-validates everything (`design.ts`, `resolve-design.ts`); the admin sees a Studio design panel.

**Confusing / incomplete**
1. The Studio is a section in the middle of the production page (after hero, lines, journey); there is no dedicated address, no steps, no progress.
2. The product is chosen *below* the stage, after the editing tools.
3. No quantity, no project summary; after "Use this design" the visitor is scrolled to a form further down that asks again for the product.
4. Nothing survives a refresh.
5. The production form below the Studio asks for colours and sides again in its own drop-downs.

**Data reality (dev database, 2026-11-24)**
- `studio_products` has the 5 keys but `studio_views` and `studio_options` are **empty**: no verified photo, print size, colour, size, material or technique is configured. `production_options` is empty too.
- So the Studio cannot honestly offer per-product sizes, materials or paper types. Configuration = quantity + the parameters to specify (spec templates, phase 4 of docs/CX_AUDIT_AND_PLAN.md) + the existing drawing colours for recolourable placeholders. When MSLAB fills `/admin/print-on-demand/studio/<product>`, the configured options appear automatically (existing code path).
- "Bâche / banderole" is an active support although signage is listed as not offered (docs/POSITIONING.md): owner to confirm (deactivate in /admin/print-on-demand if needed).

## 2. Plan (no new dependency, no migration)
1. **Dedicated page** `/{fr,ar,en}/studio` (`?product=<support>` preselects). Positioning: « Donnez vie à votre idée avant la production. » All Studio links point to it; the production page keeps a short Studio band.
2. **Five steps** with a progress bar that always shows where you are and what is done: Produit → Configuration → Personnalisation → Aperçu → Devis. Every completed step can be reopened; the editor stays mounted, so nothing is lost when going back.
3. **Product step**: supports grouped by category (textile, objects, stationery, print, packaging), filter chips, consistent 4:3 cards with category and "visual customization" label; an "other product" path straight to the request.
4. **Configuration step**: quantity (required), configured options when MSLAB has entered them, the "what you specify" checklist for that kind of product, free notes.
5. **Workspace**: tools left, large preview centre, project summary right (desktop); sequential on phones with a bottom action bar.
6. **Preview step**: every customized side, read only, with the summary and "edit" shortcuts.
7. **Request step**: the existing production request form on the same page, pre-filled (product, quantity, notes) and receiving the design, original files and mockups through the existing hand-off. Server validation, anti-spam, rate limit, submission id, upload tickets untouched.
8. **Persistence**: `sessionStorage` keeps step, product, quantity, notes, colour/options and text layers (never files); after a reload the visitor is told which images to add again.

## 3. Implementation status (2026-11-24)

| Area | Done | Files |
|---|---|---|
| Page & links | `/{fr,ar,en}/studio` (static, in the sitemap); menu, homepage, About, services, product pages, quote page and the production page's hero tiles and band point to it; `?product=<support>` opens on that support's configuration | `app/[lang]/(site)/studio/page.tsx`, `i18n/routes.ts` (`studioHref`), `sitemap.ts` |
| Flow | Five steps, progress bar (phones: "step n of 5" + bar), completed steps reopenable, project summary with "edit" links and "still to do" list, sticky back/continue bar on phones (WhatsApp button lifted above it) | `components/print-on-demand/studio/studio-flow.tsx` |
| Editor | Controlled product, read-only preview mode, snapshot for the summary, controller for the hand-off, restore of text layers; standalone behaviour unchanged | `studio/studio-editor.tsx` |
| Request | Same page, same form and server action; product, quantity and notes filled from the steps (or a one-line description of the prepared project), design + original files + mockups attached by the existing hand-off; saved project cleared on success | `custom-request-form.tsx` (`onSubmitted`), `forms/quick-picks.tsx` (`fillField` closes suggestion lists) |

**Tested (headless Chromium, dev server):** invalid file rejected by content; PNG added, removed and replaced; hoodie back view; going back and forth keeps quantity and layers; reload restores step, product, quantity, notes and text layers; business cards via `?product=` with specifications only; category filter; "other product" path; 375 px without overflow; full submission accepted (dev reference MSQ-2026-000062: design, 1 artwork, 2 mockups). Production build: product step interactive in 0.34 s (desktop) / 1.8 s (phone, 4G + 4× CPU).

**Owner input needed:** per-product photos, print areas, colours, sizes, materials and techniques in `/admin/print-on-demand/studio/<product>` (the configuration step then shows them automatically); the "Tote bag" mockup photo looks like a paper bag; whether "Bâche / banderole" should stay active.

## 4. Switched off (2026-11-24)

At the owner's request the Studio is hidden for now with one switch, `STUDIO_ENABLED = false` in
`src/config/features.ts` (code kept). Effects: no menu entry, no hero brand preview or
"Continuer dans le studio" (the homepage shows the activities illustration), no Studio links in
the division cards, product pages, quote page or production page (whose Studio section, hero
point and two Studio FAQ answers are hidden), `/studio` answers a real 404 from `proxy.ts` and
leaves the sitemap. Set it back to `true` to restore everything. Content stored in the database
is not covered by the switch: the T-shirt product description still mentions the studio.
