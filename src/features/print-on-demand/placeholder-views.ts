/**
 * Placeholder visuals used while MSLAB has not configured a product's Studio views: product
 * photos on a plain white background (public/mockups/photos) or MSLAB's vector templates
 * (public/mockups/svg). The `drawing` kind remains supported for future drawn products.
 * They show the principle only — no print size
 * or resolution is ever derived from them.
 * Pure module: shared by the client mockups and the server action.
 */
import type { MockupKey } from "./mockup-keys";
import type { ViewKey } from "./studio";
import { PRODUCT_TEMPLATES } from "./product-templates.generated";

/** Products drawn from one of MSLAB's vector templates (public/mockups/svg/<key>.svg). */
export type TemplateKey = "tshirt" | keyof typeof PRODUCT_TEMPLATES;

type Area = { x: number; y: number; w: number; h: number };

export type PlaceholderPhoto = {
  kind: "photo";
  src: string;
  w: number;
  h: number;
  area: { x: number; y: number; w: number; h: number };
  /** SVG transform of the print area (a matrix follows a product photographed at an angle). */
  transform?: string;
  /** SVG path in print-area coordinates the design is clipped to (e.g. a peeled round sticker). */
  clip?: string;
  /** Dark product (black hoodie): the design is laid on top instead of multiplied into it. */
  dark?: boolean;
  /** Further printable sides, each its own 1200 × 900 photo (the main photo is the front). */
  sides?: readonly { key: ViewKey; src: string; area: Area }[];
};

export type PlaceholderDrawing = {
  kind: "drawing";
  w: 240;
  h: 240;
  area: { x: number; y: number; w: number; h: number };
  /** SVG transform applied to the print area (e.g. a tilted business card). */
  transform?: string;
  /** Round sticker: the area is clipped to this circle. */
  circle?: { cx: number; cy: number; r: number };
};

/** One printable side of a vector garment template. */
export type TemplateSide = {
  key: ViewKey;
  /** Which view of the garment is drawn (the sleeves are printed on the front view). */
  scene: "front" | "back";
  /** Print area; for a rotated side, (x, y) is its top-left corner and `transform` rotates around it. */
  area: Area;
  transform?: string;
  /** Part of the template shown in the editor for this side. */
  crop: Area;
};

export type PlaceholderTemplate = {
  kind: "template";
  template: TemplateKey;
  w: number;
  h: number;
  /** 4:3 frame used by product cards and thumbnails. */
  thumb: Area;
  sides: readonly TemplateSide[];
  /** The first side's area (single-area previews: homepage, product cards). */
  area: Area;
};

export type Placeholder = PlaceholderPhoto | PlaceholderDrawing | PlaceholderTemplate;


/** A 1200 × 900 product photo from public/mockups/photos/<key>.webp. */
const photo = (key: string, area: Area, transform?: string, clip?: string): PlaceholderPhoto => ({
  kind: "photo",
  src: `/mockups/photos/${key}.webp`,
  w: 1200,
  h: 900,
  area,
  ...(transform ? { transform } : {}),
  ...(clip ? { clip } : {}),
});
/** Print area on a tilted surface: the w × h area is mapped onto it by `matrix`. */
const tilted = (key: string, w: number, h: number, matrix: string) => photo(key, { x: 0, y: 0, w, h }, `matrix(${matrix})`);

export const PLACEHOLDERS: Record<MockupKey, Placeholder> = {
  tshirt: photo("tshirt", { x: 510, y: 210, w: 290, h: 350 }),
  // Black hoodie: chest above the kangaroo pocket; the back photo carries a large back print.
  hoodie: {
    ...photo("hoodie", { x: 482, y: 285, w: 230, h: 225 }),
    dark: true,
    sides: [{ key: "back", src: "/mockups/photos/hoodie-back.webp", area: { x: 470, y: 380, w: 250, h: 310 } }],
  },
  mug: photo("mug", { x: 412, y: 245, w: 310, h: 400 }),
  // Paper shopping bag: the front panel leans slightly and recedes to the right.
  tote: tilted("tote", 242, 270, "0.9955 0.095 -0.0408 0.9992 449.7 331"),
  poster: tilted("poster", 265, 586, "1 0.0083 0.006 1 468.7 140.7"),
  "business-card": tilted("business-card", 475, 277, "0.9936 0.1132 -0.1662 0.9861 557.8 298.8"),
  // Lid of a mailer box held at an angle; the area stays clear of the black tape band.
  box: tilted("box", 200, 300, "0.7746 0.6381 -0.5097 0.8639 551.3 182.4"),
  notebook: tilted("notebook", 440, 538, "0.9785 0.2064 -0.5122 0.8589 547.5 159.6"),
  flyer: tilted("flyer", 252, 512, "0.9906 -0.1365 0.1353 0.9908 404.3 180.6"),
  // Round sticker with a peeled edge: the design follows the circle and stops at the fold.
  sticker: photo(
    "sticker",
    { x: 285, y: 125, w: 630, h: 630 },
    undefined,
    "M310.2 628.6A313.5 313.5 0 1 1 627 286.2L558.2 331L494.2 363L430.2 411L382.2 475L350.2 539L326.2 595Z",
  ),
  letterhead: tilted("letterhead", 514, 529, "0.9897 -0.1429 0.418 0.9084 280.1 165.7"),
  "folded-card": tilted("folded-card", 273, 570, "0.9785 0.2064 0.0098 1 430.4 146.6"),
  catalog: tilted("catalog", 502, 521, "0.9898 -0.1424 0.493 0.87 247.6 221.6"),
  banner: photo("banner", { x: 200, y: 300, w: 796, h: 280 }),
};

/** Printable sides of an unconfigured product (a template has several; photos and drawings one). */
export function placeholderSides(key: MockupKey): { view: ViewKey; area: Area }[] {
  const p = PLACEHOLDERS[key];
  if (p.kind === "template") return p.sides.map((s) => ({ view: s.key, area: s.area }));
  const extra = p.kind === "photo" ? (p.sides ?? []).map((s) => ({ view: s.key, area: s.area })) : [];
  return [{ view: "front", area: p.area }, ...extra];
}
