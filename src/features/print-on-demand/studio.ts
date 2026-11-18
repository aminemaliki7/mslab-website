/**
 * MSLAB Studio configuration types (ADR-026). Pure module: shared by server queries, the
 * editor, the server action and the admin. Configuration is entered by MSLAB in
 * /admin/print-on-demand/studio/<product>; nothing here describes a real product.
 */
import type { MockupKey } from "./mockup-keys";

/** Products with a Studio configuration (photos, print areas, verified options). */
export const STUDIO_PRODUCTS = ["tshirt", "hoodie", "mug", "tote", "notebook"] as const satisfies readonly MockupKey[];
export type StudioProductKey = (typeof STUDIO_PRODUCTS)[number];
export const isStudioProduct = (key: string): key is StudioProductKey => (STUDIO_PRODUCTS as readonly string[]).includes(key);

/** Printable sides. Which ones exist for a product depends only on the views MSLAB adds. */
export const VIEW_KEYS = ["front", "back", "left_sleeve", "right_sleeve", "wrap"] as const;
export type ViewKey = (typeof VIEW_KEYS)[number];

export const OPTION_KINDS = ["color", "size", "material", "technique"] as const;
export type OptionKind = (typeof OPTION_KINDS)[number];

/** Fonts the visitor can use: the site's own fonts (decision D1), loaded by lib/fonts.ts. */
export const STUDIO_FONTS = {
  archivo: { label: "Archivo", css: "var(--font-archivo), system-ui, sans-serif", weight: 700 },
  geist: { label: "Geist", css: "var(--font-geist), system-ui, sans-serif", weight: 700 },
  mono: { label: "Geist Mono", css: "var(--font-geist-mono), ui-monospace, monospace", weight: 600 },
  arabic: { label: "IBM Plex Sans Arabic", css: "var(--font-plex-arabic), system-ui, sans-serif", weight: 600 },
} as const;
export type FontKey = keyof typeof STUDIO_FONTS;
export const FONT_KEYS = Object.keys(STUDIO_FONTS) as FontKey[];

/** One printable side as the editor draws it. Coordinates are in the image's pixels. */
export type StudioView = {
  key: ViewKey;
  src: string;
  width: number;
  height: number;
  area: { x: number; y: number; w: number; h: number };
  /** White = product (recoloring with the chosen colour). */
  mask: string | null;
  /** Grey-level relief map: the artwork follows the fabric folds (feDisplacementMap). */
  displacement: string | null;
  /** Real printable size in millimetres (null = MSLAB has not entered it). */
  printMm: { w: number; h: number } | null;
};

export type StudioOption = { id: string; kind: OptionKind; name: string; hex: string | null };

export type StudioProductConfig = {
  key: StudioProductKey;
  views: StudioView[];
  options: Record<OptionKind, StudioOption[]>;
  minDpi: number | null;
};

export const emptyOptions = (): Record<OptionKind, StudioOption[]> => ({ color: [], size: [], material: [], technique: [] });
