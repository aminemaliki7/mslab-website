# MSLAB — Positioning & website direction

_Decided 2026-11-19 with the owner; revised 2026-11-21 (printing-first, three audiences, six core services). Source of truth for copy, page priorities and CTAs._

## 1. Positioning statement
MSLAB is a **Moroccan printing, reprographics and custom-production company** serving
**businesses, institutions and individuals**: a reliable production partner for custom printing,
personalized products and corporate orders.

- **Promise:** Votre idée. Votre design. Notre production. / Your idea. Your design. Our production.
- **Supporting line:** Impression & production sur mesure. / Printing & custom production.
- **Hard constraint:** bulk orders only, quoted per project. MSLAB does not sell single
  customized items or retail products. No cart, no "buy now", no unit prices. Every journey
  ends in a quote.

## 2. Core services (owner-confirmed; `src/config/production-lines.ts`)
1. Printing & reprographics.
2. Custom apparel & personalized products (including collections under the customer's brand).
3. Corporate & promotional merchandise.
4. Business stationery & office supplies.
5. Books, brochures, flyers & printed materials.
6. Custom packaging & bulk production.

The same six lines appear, in this order, on the homepage, Services, the production page, About
and the footer, in French, Arabic and English.

**Digital Solutions (separate division, owner request 2026-11-21).** Corporate websites, e-commerce
websites, custom web applications, business management platforms, UI/UX design, website
maintenance and support. Own landing page (`/fr/services/solutions-digitales`,
`/en/services/digital-solutions`; service record in `supabase/seed/positioning_content.sql`),
its own tinted band on the homepage and Services page, quote-based like everything else. Not a
production line and not in the catalogue. No portfolio, clients, prices or delivery times until
MSLAB provides real ones.

Not offered (owner, 2026-11-19): 3D printing and signage.
Not known, never invented: minimum order quantities, prices, lead times, capacity, equipment,
certifications. MOQ is an optional per-product field (`products.min_order_quantity`), shown
only when set.

## 3. Customer profiles
| Journey | Who | Typical need | Entry CTA → destination |
|---|---|---|---|
| **Businesses & institutions** | Companies, administrations, schools, hotels, agencies, associations | Printed matter, uniforms, merchandise, stationery, packaging, recurring orders | « Demander un devis entreprise » → `/devis` |
| **Individuals & creators** (project-based) | Individuals, brands and entrepreneurs, artists/creators, event and group projects | A print run, collection, merch or event order in quantity | « Démarrer un projet de production » → production page form |

Individuals are served **in quantity, on quotation** — never one item bought online.

## 4. Problems solved
1. One production partner for several product types instead of coordinating many suppliers.
2. The same identity applied consistently across textile, objects, print and packaging.
3. From an idea and specifications to finished products: quote, validation, production, tracking.

## 5. Homepage narrative (five-second test)
1. Hero — promise + lead naming the product families and the three audiences (businesses,
   institutions, individuals) + "bulk orders only, quoted" note + CTAs (production quote / services).
2. How your project comes to life — animated six-stage journey (quote request → review &
   quotation → approval → production → packaging → delivery), right after the hero.
3. What we print and produce — the six core services.
   Then the Digital Solutions band (web division).
4. What MSLAB simplifies — the three problems above.
5. About, client logos.

## 6. Changes by page
| Page | Change |
|---|---|
| Home | Narrative above; live proof asks for a *brand* name, not a personal name. |
| Services | Production capabilities first, then the other (supply) services from the database. |
| Production page (`impression-a-la-demande` slug kept for URL stability) | Renamed « Production sur mesure »; bulk-only notice; FAQ on quantities and MOQ; no "gift" wording. |
| Catalogue / product | MOQ shown when set; bulk/customization copy; quote CTAs only. |
| Forms | Quantity no longer defaults to 1; quick picks start at volume; project type options for corporate / collection / private label. |
| Footer, meta, JSON-LD descriptions | Production-first wording in fr/ar/en. |

## 7. Copy rules
Professional, concrete, short. No "bring your ideas to life", "unlimited possibilities",
"one-stop", superlatives or invented figures. Prefer: Demander un devis de production ·
Démarrer un projet de production · Voir nos capacités · Discuter de votre projet.
