/**
 * Print maths for Studio layers. Pure, dependency-free (unit-tested directly).
 *
 * Layer coordinates are fractions of the view's printable area: x/y = layer centre
 * (0–1 = inside the area horizontally/vertically), w = layer width as a share of the area
 * width. An image layer's height follows its aspect ratio (height / width).
 */

export type AreaPx = { w: number; h: number };
export type PrintMm = { w: number; h: number };
export type Box = { x: number; y: number; w: number; h: number; rotation: number };

/** Layer box in area pixels (centre x/y, width, height). */
export function layerBoxPx(layer: { x: number; y: number; w: number; aspect: number; rotation: number }, area: AreaPx): Box {
  const w = layer.w * area.w;
  return { x: layer.x * area.w, y: layer.y * area.h, w, h: w * layer.aspect, rotation: layer.rotation };
}

/** Axis-aligned bounds of a rotated box. */
export function rotatedBounds(box: Box): { left: number; top: number; right: number; bottom: number } {
  const r = (box.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(r));
  const sin = Math.abs(Math.sin(r));
  const halfW = (box.w * cos + box.h * sin) / 2;
  const halfH = (box.w * sin + box.h * cos) / 2;
  return { left: box.x - halfW, top: box.y - halfH, right: box.x + halfW, bottom: box.y + halfH };
}

/** True when the (rotated) layer stays inside the printable area, with a 0.5 px tolerance. */
export function insideArea(box: Box, area: AreaPx): boolean {
  const b = rotatedBounds(box);
  return b.left >= -0.5 && b.top >= -0.5 && b.right <= area.w + 0.5 && b.bottom <= area.h + 0.5;
}

/** Physical placement in millimetres, when MSLAB has entered the printable size. */
export function layerMm(layer: { x: number; y: number; w: number; aspect: number }, print: PrintMm) {
  const w = layer.w * print.w;
  return {
    centerX: round1(layer.x * print.w),
    centerY: round1(layer.y * print.h),
    width: round1(w),
    height: round1(w * layer.aspect),
  };
}

/** Effective resolution of a raster image printed at `widthMm`. */
export function effectiveDpi(pixelWidth: number, widthMm: number): number {
  return widthMm > 0 ? Math.round(pixelWidth / (widthMm / 25.4)) : 0;
}

/** Keep a layer's centre inside the area (it may still overhang; that is flagged, not hidden). */
export function clampCenter(value: number): number {
  return Math.min(1, Math.max(0, value));
}

const round1 = (n: number) => Math.round(n * 10) / 10;
