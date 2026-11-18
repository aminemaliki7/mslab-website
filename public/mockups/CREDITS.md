# Studio mockups

Every product preview uses MSLAB's own vector templates in `svg/` (no third-party photos):

- `svg/tshirt.svg`: built by `scripts/build-tshirt-mockup.mjs` (docs/TSHIRT_SVG_MOCKUP.md).
- `svg/<product>.svg` (hoodie, tote, mug, box, notebook, business-card, flyer, poster): built by `scripts/build-product-mockups.mjs`.

Print areas are defined in those scripts. They reach the site through `src/features/print-on-demand/placeholder-views.ts`.
