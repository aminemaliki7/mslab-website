import type { TemplateKey } from "@/features/print-on-demand/placeholder-views";
import { PRODUCT_LAYERS } from "./product-layers.generated";
import { GARMENT_STYLE_TOKEN, TSHIRT_LAYERS } from "./tshirt-layers.generated";

/**
 * MSLAB's vector garment templates (docs/TSHIRT_SVG_MOCKUP.md), split around the artwork:
 * - "under": drop shadow + fabric colour;
 * - "over": lighting, folds, texture, seams, stitching and collar.
 * Each part is a standalone SVG drawn through <image> (or onto a canvas). The browser rasterizes
 * and caches it once per colour, so dragging a layer does not recompute the fabric filters.
 */
export type GarmentScene = "front" | "back";
type Parts = { under: string; over: string };

const LAYERS: Record<TemplateKey, Partial<Record<GarmentScene, Parts>>> = { tshirt: TSHIRT_LAYERS, ...PRODUCT_LAYERS };
const FALLBACK = "#FFFFFF";
const cache = new Map<string, { under: string; over: string }>();

/** CSS custom properties for a fabric colour: dark fabrics get more sheen, light ones less. */
export function garmentStyle(hex: string): string {
  const color = /^#[0-9a-f]{6}$/i.test(hex) ? hex : FALLBACK;
  const n = Number.parseInt(color.slice(1), 16);
  const luma = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  const dark = 1 - luma;
  const f = (v: number) => v.toFixed(2);
  return `--garment-color:${color};--shade-strength:${f(1 - 0.1 * dark)};--highlight-strength:${f(0.35 + 0.5 * dark)};--texture-strength:${f(0.55 + 0.2 * dark)}`;
}

const toDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Image URLs of the garment's two parts in the given colour. */
export function garmentImages(template: TemplateKey, scene: GarmentScene, hex: string): { under: string; over: string } {
  const key = `${template}|${scene}|${hex.toUpperCase()}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const style = garmentStyle(hex);
  const parts = LAYERS[template][scene] ?? LAYERS[template].front!;
  const images = { under: toDataUrl(parts.under.replace(GARMENT_STYLE_TOKEN, style)), over: toDataUrl(parts.over.replace(GARMENT_STYLE_TOKEN, style)) };
  if (cache.size > 48) cache.clear();
  cache.set(key, images);
  return images;
}
