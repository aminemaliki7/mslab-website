/**
 * Builds the designed product photos of the PUBLIC CATALOGUE, printed with MSLAB's own identity:
 *   scripts/catalogue-mockups/artwork.mjs     → design/catalogue-mockups/artwork/*.svg (editable)
 * + the catalogue's own blank photos           (public/catalog/products/*.webp, read only)
 * → public/catalog/mockups/<category>/<product>/<product>-<view>.webp
 *
 * MSLAB Studio is NOT involved: its blank templates live in public/mockups/ and are never read
 * or written here. The Flyers base is a copy of the catalogue's sheet-stack blank, kept in
 * design/catalogue-mockups/bases/.
 *
 *   node scripts/build-catalogue-mockups.mjs            # every product
 *   node scripts/build-catalogue-mockups.mjs mugs tees  # only ids containing these words
 *
 * Surfaces were measured on the 1200 × 900 blanks: corners are the artwork's top-left,
 * top-right, bottom-right, bottom-left. See design/catalogue-mockups/README.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { ARTWORK } from "./catalogue-mockups/artwork.mjs";
import { composite } from "./catalogue-mockups/compositor.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ART_DIR = resolve(ROOT, "design/catalogue-mockups/artwork");
const BLANK = (name) => resolve(ROOT, "public/catalog/products", name);
const BASE = (name) => resolve(ROOT, "design/catalogue-mockups/bases", name);
const OUT = (path) => resolve(ROOT, "public/catalog/mockups", path);

// Editable sources first: one standalone SVG per artwork.
mkdirSync(ART_DIR, { recursive: true });
const ART = {};
for (const [name, make] of Object.entries(ARTWORK)) {
  ART[name] = make();
  writeFileSync(resolve(ART_DIR, `${name}.svg`), ART[name]);
}

/** Top sheet of the A4 stack (letterhead blank, and its copy for flyers). */
const SHEET_TOP = [[242, 112], [790, 64], [1093, 586], [456, 713]];
/** Leaning business card. */
const CARD_FRONT = [[527, 277], [1068, 330], [1023, 657], [466, 583]];
/** Studio's clip of the peeled sticker (placeholder-views.ts), in photo coordinates. */
const STICKER_CLIP = "M595.2 753.6A313.5 313.5 0 1 1 912 411.2L843.2 456L779.2 488L715.2 536L667.2 600L635.2 664L611.2 720Z";

export const MOCKUPS = [
  {
    id: "business-cards",
    out: "printing/business-cards/business-cards-front-back.webp",
    base: BLANK("business-cards.webp"),
    layers: [
      // Contact side on the stack (its far corner is soft in the photo: the luminance mask trims it).
      { svg: ART["mslab-business-card-back"], quad: [[135, 245], [735, 168], [857, 255], [297, 401]], exclude: [CARD_FRONT], lumRange: [0.82, 0.985] },
      { svg: ART["mslab-business-card-front"], quad: CARD_FRONT, lumRange: [0.6, 0.995], opacity: 0.98 },
    ],
  },
  {
    id: "stickers",
    out: "printing/stickers/stickers-round-diecut.webp",
    base: BLANK("stickers.webp"),
    // Circle of the sticker; the peeled fold stays blank (clip).
    layers: [{ svg: ART["mslab-sticker"], quad: [[286.5, 126.5], [913.5, 126.5], [913.5, 753.5], [286.5, 753.5]], clipSvg: STICKER_CLIP, lumRange: [0.5, 1.01], opacity: 0.97 }],
  },
  {
    // Screen print on white jersey: the print bends with the folds (displacement).
    // Base: MSLAB's vector T-shirt template rendered sharp (bases/tshirt-white-front.webp, from a
    // copy of the Studio template). The blank photo was soft and had white patches over the
    // sides and hem.
    id: "custom-t-shirts",
    out: "apparel/t-shirts/t-shirts-front-print.webp",
    base: BASE("tshirt-white-front.webp"),
    layers: [{ svg: ART["mslab-tshirt-print"], quad: [[445, 215], [755, 215], [755, 587], [445, 587]], displace: 1.4, lumRange: [0.5, 1.01], opacity: 0.94, shadeMin: 0.55 }],
  },
  {
    // Black hoodie, front: tone-on-tone embroidery on the wearer's left chest.
    id: "custom-hoodies",
    out: "apparel/hoodies/hoodies-front-embroidery.webp",
    base: BLANK("custom-hoodies.webp"),
    layers: [{ svg: ART["mslab-hoodie-chest"], quad: [[628, 300], [728, 300], [728, 367], [628, 367]], mode: "embroidery", displace: 0.8, ref: 0.1, shadeMin: 0.7, shadeMax: 1.15, shadeStrength: 0.45, opacity: 0.97 }],
  },
  {
    id: "custom-hoodies-back",
    out: "apparel/hoodies/hoodies-back-print.webp",
    base: BLANK("custom-hoodies-back.webp"),
    layers: [{ svg: ART["mslab-hoodie-back"], quad: [[478, 380], [718, 380], [718, 678], [478, 678]], displace: 1.2, ref: 0.1, shadeMin: 0.65, shadeMax: 1.15, shadeStrength: 0.45, opacity: 0.9 }],
  },
  {
    // Sublimation on a glazed mug: cylinder wrap, the glaze highlight stays on top.
    id: "custom-mugs",
    out: "merchandise/mugs/mugs-wrap-print.webp",
    base: BLANK("custom-mugs.webp"),
    layers: [{ svg: ART["mslab-mug-wrap"], polygon: [[350, 165], [786, 165], [786, 735], [350, 735]], mapping: "cylinder", cylinder: { cx: 567, radius: 222, top: 165, bottom: 735, arc: 1.08 }, place: [0, 0.05, 1, 0.95], lumRange: [0.45, 1.01], gloss: 0.975, opacity: 0.97 }],
  },
  {
    id: "letterhead",
    out: "stationery/letterhead/letterhead-a4.webp",
    base: BLANK("letterhead.webp"),
    layers: [{ svg: ART["mslab-letterhead"], quad: SHEET_TOP, lumRange: [0.6, 1.01], rasterWidth: 2100 }],
  },
  {
    // Spiral coils are darker than the sheet: the luminance range keeps them on top of the print.
    id: "custom-notebooks",
    out: "stationery/notebooks/notebooks-spiral-notepad.webp",
    base: BLANK("custom-notebooks.webp"),
    layers: [{ svg: ART["mslab-notepad"], quad: [[553, 93], [1036, 184], [734, 788], [188, 641]], lumRange: [0.82, 1.01] }],
  },
  {
    // The Flyers product had no photo: same sheet-stack blank (copied into design/…/bases).
    id: "flyers",
    out: "printed-materials/flyers/flyers-a4-stack.webp",
    base: BASE("flyers-sheet-stack.webp"),
    layers: [{ svg: ART["mslab-flyer"], quad: SHEET_TOP, lumRange: [0.6, 1.01], rasterWidth: 2100, opacity: 0.98 }],
  },
  {
    // Outside of a letter-fold leaflet laid open: inside flap · back panel · front cover.
    id: "leaflets",
    out: "printed-materials/leaflets/leaflets-trifold.webp",
    base: BLANK("leaflets.webp"),
    layers: [
      { svg: ART["mslab-leaflet-panel-1"], quad: [[108, 108], [378, 138], [452, 741], [156, 760]], lumRange: [0.55, 1.01], shadeStrength: 0.9 },
      { svg: ART["mslab-leaflet-panel-2"], quad: [[378, 138], [667, 93], [754, 697], [452, 741]], lumRange: [0.55, 1.01] },
      { svg: ART["mslab-leaflet-panel-3"], quad: [[667, 93], [955, 47], [1062, 688], [754, 697]], lumRange: [0.55, 1.01], opacity: 0.98 },
    ],
  },
  {
    id: "brochures-catalogs",
    out: "printed-materials/brochures-catalogs/brochures-catalogs-cover.webp",
    base: BLANK("brochures-catalogs.webp"),
    layers: [{ svg: ART["mslab-brochure-cover"], quad: [[192, 182], [748, 100], [1088, 640], [466, 727]], lumRange: [0.6, 0.985], rasterWidth: 2100 }],
  },
  {
    // One-colour print on kraft (multiply); the black tape band and the hand stay on top.
    id: "custom-mailer-boxes",
    out: "packaging/mailer-boxes/mailer-boxes-kraft-print.webp",
    base: BLANK("custom-mailer-boxes.webp"),
    // Artwork top = the hinge edge (T→R); its bottom = the front tuck flap (L→B).
    layers: [{ svg: ART["mslab-mailer-box-lid"], quad: [[585, 55], [997, 345], [548, 748], [109, 403]], lumRange: [0.42, 0.8], mode: "multiply", opacity: 0.9 }],
  },
  {
    // Corporate kit (blank supplied by the owner 2026-11-23, 1200 × 1600): every item printed.
    id: "corporate-kits",
    out: "merchandise/corporate-kits/corporate-kits-set.webp",
    base: BASE("corporate-kit-blank.webp"),
    layers: [
      // Large table flag: its top-left corner is under the hand flag and its pole.
      {
        svg: ART["mslab-kit-table-flag"], quad: [[248, 717], [1105, 915], [930, 1515], [30, 1260]],
        exclude: [[[160, 688], [536, 774], [461, 1036], [94, 961]], [[152, 676], [198, 688], [26, 1288], [0, 1278]]],
        lumRange: [0.5, 1.01], displace: 1.2, opacity: 0.95,
      },
      { svg: ART["mslab-kit-hand-flag"], quad: [[185, 712], [530, 780], [455, 1030], [105, 955]], lumRange: [0.85, 1.01], displace: 1.5, opacity: 0.95 },
      { svg: ART["mslab-kit-tshirt"], quad: [[745, 185], [965, 175], [968, 425], [748, 435]], lumRange: [0.6, 1.01], displace: 1.4, opacity: 0.94, shadeMin: 0.55 },
      // Bottles and mug are seen slightly from above: the print bows with the rims (ellipse).
      { svg: ART["mslab-kit-bottle-logo"], polygon: [[117, 318], [261, 318], [261, 576], [117, 576]], mapping: "cylinder", cylinder: { cx: 188.5, radius: 72, top: 330, bottom: 560, arc: 1.0, ellipse: 6 }, lumRange: [0.5, 1.01], opacity: 0.96 },
      { svg: ART["mslab-kit-bottle-band"], polygon: [[294, 338], [442, 338], [442, 604], [294, 604]], mapping: "cylinder", cylinder: { cx: 368, radius: 73.5, top: 362, bottom: 590, arc: 1.55, ellipse: 6 }, lumRange: [0.5, 1.01], gloss: 0.97, opacity: 0.97 },
      { svg: ART["mslab-kit-mug"], polygon: [[517, 532], [707, 532], [707, 752], [517, 752]], mapping: "cylinder", cylinder: { cx: 611.5, radius: 94, top: 552, bottom: 738, arc: 1.0, ellipse: 16 }, lumRange: [0.5, 1.01], gloss: 0.975, opacity: 0.97 },
      { svg: ART["mslab-kit-pen"], quad: [[900, 792], [1030, 818], [1027, 834], [897, 808]], lumRange: [0.55, 1.01], opacity: 0.95, rasterWidth: 1650 },
    ],
  },
  {
    // Canvas tote (blank supplied by the owner 2026-11-23, 832 × 1248), front panel below the hem.
    id: "custom-tote-bags",
    out: "merchandise/tote-bags/tote-bags-canvas-print.webp",
    base: BASE("tote-bag-blank.webp"),
    layers: [{ svg: ART["mslab-tote-front"], quad: [[222, 540], [612, 535], [616, 905], [210, 915]], lumRange: [0.3, 1.01], displace: 0.5, opacity: 0.92, shadeMin: 0.5 }],
  },
  {
    id: "custom-paper-bags",
    out: "packaging/paper-bags/paper-bags-front.webp",
    base: BLANK("custom-paper-bags.webp"),
    layers: [{ svg: ART["mslab-paper-bag"], quad: [[402, 241], [747, 275], [728, 772], [381, 713]], lumRange: [0.5, 0.995] }],
  },
];

const filter = process.argv.slice(2);
for (const m of MOCKUPS) {
  if (filter.length && !filter.some((f) => m.id.includes(f))) continue;
  const t0 = Date.now();
  const { data, width, height } = await composite(m.base, m.layers);
  const file = OUT(m.out);
  mkdirSync(dirname(file), { recursive: true });
  await sharp(data, { raw: { width, height, channels: 3 } }).webp({ quality: 86, effort: 6 }).toFile(file);
  // Square thumbnail cropped to the product (white margins trimmed): small square slots such
  // as the homepage production lines (src/config/photos.ts).
  const trimmed = await sharp(data, { raw: { width, height, channels: 3 } }).trim({ background: "#ffffff", threshold: 12 }).png().toBuffer();
  await sharp(trimmed)
    .resize(560, 560, { fit: "contain", background: "#ffffff" })
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: "#ffffff" })
    .webp({ quality: 86, effort: 6 })
    .toFile(file.replace(/\.webp$/, "-square.webp"));
  console.log(`${m.id.padEnd(22)} → public/catalog/mockups/${m.out}  (+ square, ${Date.now() - t0} ms)`);
}
