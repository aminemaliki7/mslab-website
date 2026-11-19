# MSLAB — Project Overview

_Last updated: 2026-11-14 · Phase 1 (Architecture & Foundation)_

## 1. Purpose
MSLAB is a **Moroccan company**. The website must present its identity, activities, services, products and business information professionally, and above all **generate qualified business inquiries** while making MSLAB's services easy to discover.

> **Positioning (2026-11-19):** MSLAB is a bulk custom-production partner for businesses, brands and creators. See [POSITIONING.md](POSITIONING.md) for the confirmed production lines, journeys and copy rules; supplies below are a secondary activity.

## 2. Business areas (verified from brief)
| # | Area | Website expression |
|---|---|---|
| 1 | Printing and printing services | Services pages + quotation requests |
| 2 | Office supplies and stationery | Product catalog (categories, products, availability) |
| 3 | Books and related products | Product catalog |
| 4 | B2B services and customer inquiries | Contact, quotation, WhatsApp, admin inquiry handling |

No other services, products, figures or claims are known. See §6.

## 3. Audiences
- **B2B buyers** (companies, administrations, schools, professionals) looking for printing, supplies or books — primary.
- **Individual customers** — secondary (to be confirmed by MSLAB).
- **MSLAB staff** — manage catalog and inquiries in the admin area.

## 4. Languages
| Locale | Role | Direction |
|---|---|---|
| `fr` | Primary / default, source language for content | LTR |
| `ar` | Full support | **RTL** |
| `en` | Full support | LTR |

## 5. Scope
**In scope (v1):** homepage, about, services, product catalog with categories, product pages, search & filter, contact form, quotation request, WhatsApp contact, email notifications, admin (auth, products, categories, images, inquiries), multilingual SEO.

**Out of scope (v1, unless decided otherwise):** online payment, cart/checkout, customer accounts, public prices, artwork file upload for print quotes, blog, live chat, ERP/stock sync.

## 6. Missing business information (blocking content, not architecture)
Nothing below may be invented. Each item is needed from MSLAB:

| Item | Needed for | Priority |
|---|---|---|
| Legal company name, legal form | Footer, legal notice, JSON-LD | High |
| ICE / RC / IF numbers (if to be displayed) | Legal notice | Medium |
| Address(es), city, Google Maps location | Contact, LocalBusiness JSON-LD | High |
| Phone number(s) | Contact, header | High |
| **WhatsApp business number** | WhatsApp integration (hidden until provided) | High |
| Email for inquiries + sender domain | Notifications | High |
| Domain name | Canonical URLs, email sender verification | High |
| Logo (SVG), brand colors, typography preference | Design system | High |
| Detailed list of printing services (techniques, formats, products) | Services pages | High |
| Initial product categories and products (+ images, brands) | Catalog seed | High |
| Opening hours | Contact, JSON-LD | Medium |
| About text: history, mission, values (only true facts) | About page | Medium |
| Delivery zones / lead times / minimum quantities policy | Services, FAQ | Medium |
| Pricing policy (show prices or not) | Catalog | Medium |
| Social media profile URLs | Footer, `sameAs` | Low |
| Real client references/testimonials (with permission) | Optional trust section | Low |
| Legal documents: company identifiers (RC, ICE, registered office), CNDP reference, retention periods, payment/quote/BAT/delivery/claim/refund terms, email provider, competent court — full list in `LEGAL_CONTENT_CHECKLIST.md` | 8 legal pages (drafts, shown as « à compléter » markers) | High (before launch) |
| Legal review of the 8 legal documents by a Moroccan lawyer, then status → `validated` | Legal pages indexing | High (before launch) |
| Arabic register preference (MSA vs Darija) and numerals (Latin vs Arabic-Indic) | Arabic content | Medium |
| Admin users (who manages the catalog and inquiries) | Admin accounts | Medium |
| Data retention period for inquiries | Security/privacy | Medium |
| Studio: photos of MSLAB products per printable side, print areas (px + mm), colours, sizes, materials, printing techniques, minimum DPI (docs/STUDIO.md §4) | Studio editor (placeholder visuals until then) | High |

## 7. Success criteria
- Visitors can reach a contact or quote action from any page in ≤ 1 click.
- Inquiries are stored reliably and MSLAB is notified within a minute.
- All public pages available and indexed in fr/ar/en with correct hreflang.
- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO = 100.
- Staff can add/edit a product with images in all three languages without developer help.

## 8. Documentation map
| Doc | Content |
|---|---|
| `TECHNICAL_AUDIT.md` | State of the repository at project start |
| `SYSTEM_ARCHITECTURE.md` | Modules, data flow, tech decisions, dependency register |
| `DATABASE_SCHEMA.md` | Entities, relationships, constraints, RLS |
| `ROUTING_STRATEGY.md` | URL structure, localization, proxy behavior |
| `SECURITY_STRATEGY.md` | Threat model and controls |
| `DEVELOPMENT_ROADMAP.md` | Phases, deliverables, acceptance criteria |
