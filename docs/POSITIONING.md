# MSLAB — Positioning & website direction

_Decided 2026-11-19 with the owner. Source of truth for copy, page priorities and CTAs._

## 1. Positioning statement
MSLAB is a **custom production partner**: it manufactures customized products **in quantity**
for businesses, organizations, brands and creators — textile and apparel, promotional
merchandise, printing and stationery, packaging, and private-label collections.

- **Promise:** Votre idée. Votre design. Notre production. / Your idea. Your design. Our production.
- **Supporting line:** Production sur mesure, en série. / Custom production. Built at scale.
- **Hard constraint:** bulk orders only. MSLAB does not sell single customized items, gifts or
  retail products. No cart, no "buy now", no unit prices. Every journey ends in a quote.

## 2. Owner-confirmed capabilities (2026-11-19)
Available now, in bulk: textile & apparel · promotional / corporate merchandise · printing &
stationery · packaging & branded products · private-label & creator collections.
Secondary (verified resale activity, kept below production): office supplies, school
stationery, books — framed as supplies for organizations, ordered in volume.

Not known, never invented: minimum order quantities, prices, lead times, capacity, equipment.
MOQ is an optional per-product field (`products.min_order_quantity`), shown only when set.

## 3. Customer profiles
| Journey | Who | Typical need | Entry CTA → destination |
|---|---|---|---|
| **For businesses** (B2B) | Companies, administrations, schools, agencies, hotels, restaurants, associations | Corporate merch, uniforms, printed matter, packaging, recurring orders, supplies | « Demander un devis entreprise » → `/devis` |
| **For brands & creators** (B2C, project-based) | Independent fashion brands, entrepreneurs launching a range, artists/creators doing merch, organizers of large events | A collection or merch run under their own brand | « Démarrer un projet de production » → production page form |

B2C here means a person **with a production project**, never an individual buying one item.

## 4. Problems solved
1. One production partner for several product types instead of coordinating many suppliers.
2. The same identity applied consistently across textile, objects, print and packaging.
3. From an idea and specifications to finished products: quote, validation, production, tracking.

## 5. Homepage narrative (five-second test)
1. Hero — promise + "custom production, in quantity" lead naming the product families and
   the two audiences + "bulk orders only" note + CTAs (production quote / capabilities).
2. Two journeys — For businesses / For brands & creators.
3. Production capabilities — the five lines.
4. How a production project works — brief → quote → production & tracking.
5. What MSLAB simplifies — the three problems above.
6. Supplies for organizations — catalogue (secondary).
7. About, client logos, closing CTA.

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
