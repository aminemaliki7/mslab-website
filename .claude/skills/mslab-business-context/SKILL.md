---
name: mslab-business-context
description: MSLAB business context and content-integrity rules. Use whenever writing or reviewing user-facing copy, page content, product/service descriptions, contact details, structured data, or any decision that depends on what MSLAB sells, who its customers are, or how it presents itself.
---

# MSLAB Business Context

## Objective
Keep every piece of the website faithful to what MSLAB actually is and does, and steer the site toward its goal: **qualified B2B inquiries and quotation requests**.

## When to use
- Writing or editing any visible text (headings, CTAs, page sections, empty states, emails).
- Adding services, categories, products, contact details, opening hours, legal mentions.
- Writing JSON-LD, Open Graph, or meta descriptions.
- Deciding page priorities, CTAs, or conversion paths.

## Positioning (owner, 2026-11-19) — read docs/POSITIONING.md first
- Bulk custom production only: never single items, gifts or retail; every journey ends in a quote.
- Production lines available now: apparel & textile, promotional/corporate merchandise, printing & stationery, packaging, private label & creator collections.
- Two journeys: For businesses (B2B) and For brands & creators (project owners, not individual shoppers).
- MOQ: optional `products.min_order_quantity`; never invent a value.

## What is known (verified, from the project brief)
- MSLAB is a **Moroccan company**.
- Business areas:
  1. Printing and printing services
  2. Office supplies and stationery
  3. Books and related products
  4. Business-to-business services and customer inquiries
- Languages: **French (primary/default)**, **Arabic (RTL)**, **English**.
- Goal: present identity, activities, services, products and business information professionally; generate qualified inquiries; make services easy to discover.
- Contact channels planned: contact form, quotation request, WhatsApp.

## What is NOT known (must not be invented)
Legal name and form, ICE / RC / IF / Patente numbers, address and city, phone, WhatsApp number, email addresses, opening hours, founding year, team size, logo and brand colors, the concrete list of services and printing techniques, product list and brands, delivery zones, payment terms, minimum order quantities, lead times, prices, client references, testimonials, certifications, social media URLs, domain name.

The authoritative list lives in `docs/PROJECT_OVERVIEW.md` → *Missing information*. When you need one of these:
1. Read it from `src/config/business.ts` (planned single source of truth for verified facts).
2. If absent, render nothing or a neutral fallback (e.g. hide the phone row) — **never a fake value** like `+212 6 00 00 00 00` or "10+ years of experience".
3. Add or keep a `TODO(content): <what is needed>` marker and mention it in your final summary.

## Content guidelines
- **Tone:** professional, clear, service-oriented, B2B. Short sentences. No hype words ("best in Morocco", "#1", "leader") unless MSLAB provides proof.
- **French first.** Write French copy as the source; Arabic and English are translations of the same meaning, not separate marketing. Arabic should be Modern Standard Arabic unless MSLAB decides otherwise (open question).
- **Every page has one primary CTA**: "Demander un devis" (quote) or "Nous contacter". WhatsApp is a secondary CTA.
- Prices: the catalog shows **availability, not prices**, until MSLAB confirms a pricing policy.
- Products describe what a buyer needs to request a quote: name, category, brand (if known), format/specs, availability, images.
- Do not use stock photos that imply real MSLAB premises, staff, or clients.

## Workflow
1. Identify which business area the content belongs to.
2. Check `src/config/business.ts` / dictionaries for verified facts.
3. Draft French copy; flag any claim that needs evidence.
4. Add `fr`, `ar`, `en` dictionary keys together (see `mslab-multilingual`).
5. List any missing information in your response.

## Quality requirements
- Zero fabricated facts. A reviewer must be able to trace every factual claim to the brief or to content MSLAB supplied.
- Each page answers: what does MSLAB offer here, for whom, and how do I request it?
- CTA leads to a working contact or quote path in the current locale.

## Security / compliance
- Moroccan personal-data law **Loi 09-08** (CNDP) applies to inquiry data: forms need a clear consent statement and a privacy notice page; collect only what is needed. Legal text must be validated by MSLAB — do not draft it as final.
- Never publish customer names, inquiries or emails on the site.
