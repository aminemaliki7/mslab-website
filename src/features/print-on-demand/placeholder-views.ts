/**
 * Placeholder visuals used while MSLAB has not configured a product's Studio views: MSLAB's
 * vector templates (public/mockups/svg) or the original SVG drawings (sticker, letterhead).
 * They show the principle only — no print size
 * or resolution is ever derived from them.
 * Pure module: shared by the client mockups and the server action.
 */
import type { MockupKey } from "./mockup-keys";
import type { ViewKey } from "./studio";
import { PRODUCT_TEMPLATES } from "./product-templates.generated";
import { TSHIRT_TEMPLATE } from "./tshirt-template.generated";

/** Products drawn from one of MSLAB's vector templates (public/mockups/svg/<key>.svg). */
export type TemplateKey = "tshirt" | keyof typeof PRODUCT_TEMPLATES;

type Area = { x: number; y: number; w: number; h: number };

export type PlaceholderPhoto = {
  kind: "photo";
  src: string;
  w: number;
  h: number;
  area: { x: number; y: number; w: number; h: number };
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

function template(key: TemplateKey, data: { w: number; h: number; sides: readonly TemplateSide[] }, thumb: Area): PlaceholderTemplate {
  return { kind: "template", template: key, w: data.w, h: data.h, thumb, sides: data.sides, area: data.sides[0]!.area };
}
const productTemplate = (key: keyof typeof PRODUCT_TEMPLATES) => template(key, PRODUCT_TEMPLATES[key], PRODUCT_TEMPLATES[key].thumb);

const drawing = (x: number, y: number, w: number, h: number, extra: Partial<PlaceholderDrawing> = {}): PlaceholderDrawing => ({
  kind: "drawing",
  w: 240,
  h: 240,
  area: { x, y, w, h },
  ...extra,
});

export const PLACEHOLDERS: Record<MockupKey, Placeholder> = {
  tshirt: template("tshirt", TSHIRT_TEMPLATE, { x: -40, y: 100, w: 1280, h: 960 }),
  hoodie: productTemplate("hoodie"),
  mug: productTemplate("mug"),
  tote: productTemplate("tote"),
  poster: productTemplate("poster"),
  "business-card": productTemplate("business-card"),
  box: productTemplate("box"),
  notebook: productTemplate("notebook"),
  flyer: productTemplate("flyer"),
  sticker: drawing(58, 52, 124, 124, { circle: { cx: 120, cy: 114, r: 72 } }),
  letterhead: drawing(72, 30, 44, 30),
};

/** Printable sides of an unconfigured product (a template has several; photos and drawings one). */
export function placeholderSides(key: MockupKey): { view: ViewKey; area: Area }[] {
  const p = PLACEHOLDERS[key];
  return p.kind === "template" ? p.sides.map((s) => ({ view: s.key, area: s.area })) : [{ view: "front", area: p.area }];
}
