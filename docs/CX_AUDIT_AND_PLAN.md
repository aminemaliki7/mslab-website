# Customer experience audit and implementation plan

_2026-11-24. Audit of the rendered site (production www.mslab.ma and local dev on the mslab-dev
database) and of the codebase, followed by the plan implemented on `feat/foundation`._

## 1. What exists and works (kept)

| Area | State |
|---|---|
| Stack | Next.js 16.4 App Router, Cache Components, Supabase (RLS), fr / ar (RTL) / en, Tailwind 4. |
| Catalogue | 18 published products in 6 categories (= the 6 production lines), every card has a real image, a drawing fallback replaces any image that fails to load (no broken icons), search by name/SKU, pagination, empty and loading states. |
| Product page | Gallery, MOQ only when set, quote CTA, "add to my quote request" list, sticky mobile action bar, admin-managed specifications (none filled yet). |
| Studio | On the production page: 14 supports, image/text layers, undo/redo, verified options, "Utiliser ce design dans ma demande" hands the design, original files and mockups to the production form on the same page. |
| Quotes | Three working forms: catalogue (multi-product list), custom production (product type, quantity, colours, sides, design availability, dimensions, material, deadline, files), digital project (types, features, existing site, deadline, optional budget). Server-side Zod, honeypot, minimum fill time, per-IP rate limit, submission id against double submits, reference number on success, order tracking. |
| SEO | Localized canonical + hreflang, JSON-LD with verified fields only, sitemap/robots, real 404/308 decided in proxy. |

## 2. Problems found (customer point of view)

1. **Three businesses, one undifferentiated menu.** The header reads Services / Solutions digitales / Catalogue / À propos / Contact. "Services" mixes production lines and supply services; nothing tells a visitor that MSLAB also *supplies* office/school stationery and books (those service pages exist but are only reachable from a chip list on About).
2. **Homepage.** The hero explains production well but never says MSLAB has three activities. The only secondary CTA ("Voir nos services") scrolls to production lines. The digital band duplicates what a division overview should say. The journey describes production only ("Production", "Emballage") although the page also sells digital work.
3. **Catalogue confusion.** Every product looks the same: a visitor cannot tell a standard supply (Fournitures de bureau) from a product made with their logo, and nothing says "not in the catalogue? we produce it to order". Cards show no category and no call to action. No sorting.
4. **Product pages are thin.** Specifications are empty for all 18 products; a visitor does not know what they will be asked (sizes, paper, finish, binding…). No link to the Studio from products the Studio supports.
5. **Studio purpose.** Title "Visualisez votre design" without saying what it is for, what you can do, or that the preview is indicative until the section's small print. The homepage field "Écrivez le nom de votre marque" does not say it opens a studio.
6. **Quote page** offers only two of the three request types (catalogue, digital); custom production is only on the production page. Nothing explains what happens after sending. The confirmation shows the reference but no summary of what was sent and no contact option.
7. **About** repeats two different lists of activities (6 production lines + 6 database services with different names). It does not explain the approach or how to work with MSLAB. Company facts from settings show "mslab" in lower case and **"Ouvert 24 h/24"** (doubtful, see §5).
8. **Contact vs quote** is explained only at the bottom of the contact page. Phone shown unformatted (+212670367005) in footer, contact and About.
9. **Digital Solutions** lists six services in one line each: no problem solved, audience, deliverables, nor the difference between development, hosting, deployment and maintenance. No real work shown.

## 3. Plan (phases)

| Phase | Changes |
|---|---|
| 2. Positioning & navigation | Header with three division menus (Production, Catalogue, Solutions digitales) + À propos, Contact, CTA "Demander un devis"; keyboard/touch accessible disclosure menus on desktop, accordions in the mobile sheet. Services page becomes the hub of the three divisions (URL kept). Footer grouped by division. |
| 3. Homepage | Hero lead and two CTAs (Découvrir nos solutions / Demander un devis); new "Trois activités" section; journey rewritten to the six commercial steps (new `home` variant, same animation system); production lines kept; FAQ built on known facts only; closing contact band. |
| 4. Catalogue | Offer types: *Produit disponible* / *Personnalisable* (per product, `src/config/catalog-offers.ts`), *Sur mesure* card in every listing; offer filter + sort; cards show category, badge and CTA; category-specific "what you specify" templates on product pages (`src/config/product-spec-templates.ts`), no invented values; Studio link for supported products. |
| 5. Studio & quotes | Studio intro "Créez votre aperçu avant production" with what you can do and the indicative-preview note; `?studio=<support>` preselects a support; quote page gets the three request types; "what happens next" steps before submitting; confirmation shows reference, summary, next step and contact options. |
| 6. Digital & trust | Digital services with problem / audience / deliverables, anchors per service, "what is included" (development, deployment, hosting, maintenance); About organised around the three divisions and the approach; contact page states contact vs quote first; phone formatted consistently. |
| 7. QA | lint, typecheck, unit tests, build, browser checks at 360 / 768 / 1280 px, console errors. |

## 4. Constraints respected
No schema change (offer type and spec templates live in config until the owner wants them in the
admin; see §5). No invented prices, quantities, lead times, clients, testimonials or portfolio.
Existing validations, anti-spam, notifications and tracking untouched.

## 5. Missing business information (owner input needed)
- **Opening hours**: settings say "Ouvert 24 h/24". Confirm or correct in /admin/settings.
- **Company name** in settings is "mslab" (lower case) for both trade and legal name: confirm the legal form and RC display.
- **Digital portfolio**: real client projects, screenshots and permission to show them.
- **Supplies**: which office/school items and book titles are stocked or sourced, so they can be published as *Produit disponible* catalogue items.
- **Production facts** per product (paper weights, textile references, printing techniques, MOQ) to fill the admin specifications.
- **Hosting**: whether MSLAB hosts client sites or only deploys on the client's account.
- **Offer type in the admin**: if wanted, add `products.offer_type` (migration + admin field) and drop the config map.

## 6. Implementation status (2026-11-24)

| Phase | Done | Main files |
|---|---|---|
| 2. Navigation | Division menus (desktop disclosure, mobile accordion), footer production column, services hub | `components/layout/navigation.ts`, `nav-links.tsx`, `mobile-nav.tsx`, `header.tsx`, `footer.tsx`, `services/page.tsx` |
| 3. Homepage | Hero lead + two CTAs, three divisions, `home` journey (six commercial steps), FAQ, closing band | `(site)/page.tsx`, `components/home/divisions.tsx`, `project-journey.tsx` |
| 4. Catalogue | Offer legend, type filter, sort, card badge/category/CTA, custom production card, product spec templates, Studio deep link (`?studio=`) | `config/catalog-offers.ts`, `config/product-spec-templates.ts`, `catalog/product-listing.tsx`, `product-card.tsx`, `offer-badge.tsx`, `products/[product]/page.tsx`, `features/catalog/*` |
| 5. Studio & quotes | Studio intro (4 steps + indicative note), quote page with three request types, next steps before submit, confirmation with summary and contact options | `print-on-demand.tsx`, `quote/page.tsx`, `forms/request-confirmation.tsx`, `forms/request-flow.ts`, the three forms |
| 6. Trust | Digital services need/audience/deliverables + anchors, scope section, mslab.ma project; About around divisions, audiences and approach; contact vs quote first; phone formatted everywhere | `digital-solutions.tsx`, `about/page.tsx`, `contact/page.tsx`, `lib/phone.ts` |

Dictionary additions live under the `cx` key in fr/ar/en. No migration, no schema change.

## 7. Requirements file first (2026-11-24)

Every quote request (catalogue, custom production, digital) now starts with a choice:
**« J'envoie mon fichier »** (default) or **« Je remplis le formulaire »**. With a file, the visitor
only adds an optional message and contact details; the detailed form is not sent.

- Database: migration `20261124120000_request_brief_files.sql` (applied to **mslab-dev only**):
  `quotation_files.role` gains `brief`; the private `custom-uploads` bucket also accepts Word and
  Excel; new `submit_brief_request` RPC (same submission key, idempotency, IP rate limit as the
  other RPCs) stores the request without item/detail rows and refuses it unless at least one
  requirements file uploaded with a valid, unused ticket is attached. The three existing submit
  RPCs are unchanged. **Apply the same migration to production before deploying this code.**
- Files: PDF, DOCX, XLSX, JPG, PNG, 3 × 15 MB, identified from their bytes (`file-sniff.ts`:
  Office documents are ZIPs whose entries name `word/` or `xl/`), uploaded straight to the
  private bucket with the existing single-use ticket (stored as `<n>-mslab-brief-<name>`).
- Code: `features/inquiries/brief.ts` (Zod), `brief-actions.ts` (server action, e-mail
  `notifyBriefRequest`), `components/forms/brief-or-form.tsx` (choice + brief form, both forms
  stay mounted), `FileUploader` `variant="brief"`. The catalogue form opens on « formulaire »
  when a product is preselected or already in the quote list; the Studio keeps its own flow.
- Admin: the files panel shows for any request with files; requirements files are labelled
  « Cahier des charges », with a note when the request has no detail rows.
