# Catalogue photos

Product photos in `products/`, used by `supabase/seed/initial_catalog.sql`.

`mockups/`: the catalogue's blank product photos printed with MSLAB's own logo, colours and
promise (built by `scripts/build-catalogue-mockups.mjs` from MSLAB's blanks below; sources and
method in `design/catalogue-mockups/README.md`). They replace the blanks in the catalogue only
(migration `20261123120000_catalogue_designed_mockups.sql`); the blanks in `products/` and the
Studio templates in `public/mockups/` are unchanged.

- MSLAB's own photos (supplied by the owner on 2026-11-19 and 2026-11-20; see `public/mockups/CREDITS.md` and `src/config/photos.ts`): every file except the two below. Copied or converted to WebP, at most 1200 px wide.
- `document-printing.webp`: photo by Beatriz Pérez Moya on Unsplash, https://unsplash.com/photos/XN4T2PVUUgk ("A stack of thick folders on a white surface"). Unsplash License (free to use, including commercially; attribution not required but given). Cropped to 4:3 on the right, 1200 × 900, downloaded 2026-11-21 with the owner's approval.
- `office-supplies.webp`: photo by Fiona Murray-deGraaff on Unsplash, https://unsplash.com/photos/wFJYe_LC1vM ("A notepad, pen and paper clips on a white surface"). Unsplash License. Centred 4:3 crop, 1200 × 900, downloaded 2026-11-21 with the owner's approval.
