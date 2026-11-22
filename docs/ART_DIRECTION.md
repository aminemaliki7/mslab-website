# MSLAB — Art Direction

_2026-11-15 · Stage 2 (direction) and Stage 3 (homepage reference). Supersedes `DESIGN_SYSTEM.md` §1 and §3 where they differ; tokens and components there remain valid._

## 1. Positioning
**"Votre idée. Votre design. Notre production."** MSLAB is a production partner: it prints, personalizes and supplies. The site must show production capability first, then the catalogue and supplies.

## 2. Concept: the press proof ("bon à tirer")
Every print job passes through a proof: a sheet with trim marks and a color control strip, checked before production. The site borrows that object. It is specific to MSLAB's trade, it explains the service (you see your design before it is produced), and it builds on what already exists (the folded-sheet logo, ink and paper colors, crop marks).

**The one signature element** is the homepage **live proof**: the visitor types a name and sees it on MSLAB products immediately, then continues in the studio with the same text. Everything else stays quiet.

## 3. Identity (refined, not replaced)
| Element | Decision | Reason |
|---|---|---|
| Logo | Unchanged (folded sheet + M, wordmark in Geist Bold) | Approved 2026-11-14; already says "print" |
| Ink `#0E1A2B`, paper `#F7F6F2`, white | Unchanged | Brand base |
| Cyan `#0B6E8A` | Stays the only interaction color | It is the logo's fold, and process cyan |
| Process magenta `#C2255C`, yellow `#F2C14E` | **New, control strip only** | Authentic print vernacular; never used for UI fills, text or buttons |
| Typeface | **Archivo** (variable weight + width) replaces Geist for text and headings | One family, two voices: normal width for reading, expanded bold (`.type-display`) for headings — the look of job tickets and print-shop signage, with Swiss grotesque discipline |
| Arabic | IBM Plex Sans Arabic, unchanged; display headings use weight 600 without width/tracking changes | Archivo has no Arabic |
| Mono | Geist Mono for references and SKUs only | They are codes |

## 4. Rules
- **Structure carries meaning.** Numbers only on real sequences (the 3 order steps). A 2 px ink rule opens an index or list; hairlines separate rows.
- **Indexes over card grids** for services and text lists. Cards are reserved for products (the animated catalogue cards are unchanged).
- **No uppercase eyebrow labels** on new sections; headings speak for themselves.
- **Left-aligned** composition on a 12-column grid; only the logo strip is centred.
- **Square corners** on proof/sheet objects (they are paper); existing 6/10 px radii stay on controls and product cards.
- **No gradients, glows, glass, stock imagery, statistics, testimonials.** Product visuals are the existing drawings and mockups until photos exist.
- **Motion:** one load moment (trim marks land on the proof), reactions to the visitor's action (typing updates products), the existing catalogue card motion. Nothing else animates on scroll in new sections.
- **Control strip:** once under the homepage hero. Not a repeating divider.

## 5. Homepage (reference implementation)
1. **Hero** — tagline, one sentence per line, in display type; one-sentence description; quote and contact buttons; live proof on the right (below on phones); control strip.
2. **Ce que nous produisons** — services as an index: name in display type, summary, drawing; print on demand first.
3. **Comment ça marche** — ink band, three numbered steps, button to the studio.
4. **Le catalogue** — category links, featured product cards (unchanged).
5. **Qui sommes-nous / Pourquoi MSLAB** — owner-managed text; hidden while empty.
6. **Contact band.**

Files: `src/app/[lang]/(site)/page.tsx`, `src/components/home/live-proof.tsx`, `src/components/home/control-strip.tsx`, `src/components/print-on-demand/proof-text.ts`, `.type-display` and process colors in `globals.css`, `src/lib/fonts.ts`.

## 6. Stage 4 — applying the direction (after approval)
| Area | Change |
|---|---|
| `PageHeader`, section headings | `.type-display`, left-aligned, 2 px rule; drop uppercase eyebrows |
| Services index + service pages | Same index rows as the homepage; body text in a reading column |
| Print on demand | Re-align the redesigned page to this system (left-aligned hero, display type, proof framing around the studio) |
| Catalogue, category, product | Typography and headers only; cards, drawings, motion unchanged; "Illustration" caption (catalog plan step 3) |
| About, contact, quote, tracking, legal, 404 | Headers, form framing as "sheets", consistent buttons |
| Header, footer, CTA band | Display type for band headings; footer as an index |
| Admin | Typography follows automatically; usability work stays in `MOBILE_AUDIT_AND_PLAN.md` (tables as cards on phones) |
| Mobile | Phases B–F of `MOBILE_AUDIT_AND_PLAN.md` run with Stage 5 |
