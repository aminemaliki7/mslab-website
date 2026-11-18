/**
 * Studio design specification (ADR-026): what the visitor composed, sent with the quotation
 * request as JSON and validated here on the server. Pure module (shared with the editor).
 *
 * The stored version (StoredDesign) is built by the server action: option ids are resolved to
 * names from the database (never trusted from the browser), and print sizes / resolutions are
 * computed from the view's real printable size when MSLAB has entered it.
 */
import { z } from "zod";
import { MOCKUP_KEYS } from "./mockup-keys";
import { FONT_KEYS, VIEW_KEYS, type FontKey, type ViewKey } from "./studio";

export const MAX_LAYERS = 20;
export const MAX_DESIGN_CHARS = 60_000;

/** Artwork the editor can place and preview (decision C1: PDF is placed as a frame, not rendered). */
export const EDITOR_FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"] as const;
export type EditorFileType = (typeof EDITOR_FILE_TYPES)[number];

const finite = (min: number, max: number) => z.number().finite().min(min).max(max);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/).transform((v) => v.toUpperCase());
const uuidOrNull = z.uuid().nullable().catch(null);

const layerBase = {
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  view: z.enum(VIEW_KEYS),
  x: finite(-1, 2),
  y: finite(-1, 2),
  w: finite(0.01, 4),
  rotation: finite(-360, 360),
};

export const imageLayerSchema = z.object({
  ...layerBase,
  kind: z.literal("image"),
  /** Height / width of the artwork. */
  aspect: finite(0.01, 100),
  file: z.object({
    name: z.string().trim().min(1).max(255),
    type: z.enum(EDITOR_FILE_TYPES),
    /** Detected from the file's bytes (null for PDF). */
    width: z.number().int().min(1).max(100000).nullable(),
    height: z.number().int().min(1).max(100000).nullable(),
  }),
});

export const textLayerSchema = z.object({
  ...layerBase,
  kind: z.literal("text"),
  aspect: finite(0.01, 100),
  text: z.string().trim().min(1).max(120),
  font: z.enum(FONT_KEYS as [FontKey, ...FontKey[]]),
  color: hex,
});

export const layerSchema = z.discriminatedUnion("kind", [imageLayerSchema, textLayerSchema]);
export type Layer = z.infer<typeof layerSchema>;
export type ImageLayer = z.infer<typeof imageLayerSchema>;
export type TextLayer = z.infer<typeof textLayerSchema>;

/** As sent by the browser. */
export const designInputSchema = z.object({
  version: z.literal(1),
  product: z.enum(MOCKUP_KEYS),
  colorId: uuidOrNull,
  /** Placeholder visuals only (no configured colours): the swatch the visitor picked. */
  colorHex: hex.nullable().catch(null),
  sizeId: uuidOrNull,
  materialId: uuidOrNull,
  techniqueId: uuidOrNull,
  layers: z.array(layerSchema).max(MAX_LAYERS),
});
export type DesignInput = z.infer<typeof designInputSchema>;

/** Parse the hidden form field. Invalid or empty → null (the request is still accepted). */
export function parseDesignField(raw: FormDataEntryValue | null): DesignInput | null {
  if (typeof raw !== "string" || !raw || raw.length > MAX_DESIGN_CHARS) return null;
  try {
    const parsed = designInputSchema.safeParse(JSON.parse(raw));
    return parsed.success && parsed.data.layers.length > 0 ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Stored in custom_request_details.design and shown in the admin. */
export type StoredDesign = {
  version: 1;
  product: string;
  /** The product's printable sides came from MSLAB's configuration (false = placeholder visual). */
  configured: boolean;
  color: { name: string | null; hex: string } | null;
  size: string | null;
  material: string | null;
  technique: string | null;
  minDpi: number | null;
  views: Array<{ view: ViewKey; printMm: { w: number; h: number } | null }>;
  layers: Array<
    Layer & {
      /** Physical placement (null when the printable size is unknown). */
      mm: { centerX: number; centerY: number; width: number; height: number } | null;
      /** Raster images only, when the printable size is known. */
      dpi: number | null;
      insideArea: boolean;
    }
  >;
};
