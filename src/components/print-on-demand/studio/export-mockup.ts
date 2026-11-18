"use client";

import { layerBoxPx } from "@/features/print-on-demand/design-geometry";
import { STUDIO_FONTS } from "@/features/print-on-demand/studio";
import type { EditorLayer } from "./editor-state";
import { isLight, type Asset } from "./stage";
import { garmentImages } from "../garment/garment-template";
import { areaTransform, viewFrame, type EditorView } from "./views";

/**
 * High-resolution product mockup (output 2 of 3, ADR-026): the side redrawn on a canvas at the
 * photo's own resolution (drawings: 1600 px), with the real web fonts. It is a visual for the
 * quotation — NOT a production file: the customer's original files and the design spec are.
 * The relief map (displacement) is shown live in the editor but not applied here.
 */
const MAX_WIDTH = 3000;
const DRAWING_WIDTH = 1600;

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image failed: ${src.slice(0, 60)}`));
    img.src = src;
  });
}

/** "var(--font-archivo), …" → the font family names the page actually loaded. */
function fontFamily(css: string): string {
  const variable = /var\((--[\w-]+)\)/.exec(css)?.[1];
  const resolved = variable ? getComputedStyle(document.documentElement).getPropertyValue(variable).trim() : "";
  return resolved || "system-ui, sans-serif";
}

/** Parse "rotate(a cx cy)" (the only transform placeholder drawings use). */
function applyRotate(ctx: CanvasRenderingContext2D, transform: string | undefined, s: number) {
  const m = transform ? /rotate\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\)/.exec(transform) : null;
  if (!m) return;
  const [a, cx, cy] = [Number(m[1]), Number(m[2]) * s, Number(m[3]) * s];
  ctx.translate(cx, cy);
  ctx.rotate((a * Math.PI) / 180);
  ctx.translate(-cx, -cy);
}

export async function exportMockup({
  stage,
  view,
  layers,
  assets,
  tint,
  color,
}: {
  /** The interactive stage (used to serialize drawn placeholder products). */
  stage: SVGSVGElement;
  view: EditorView;
  layers: EditorLayer[];
  assets: Map<string, Asset>;
  tint: string | null;
  /** Colour of drawn placeholder products and garment templates. */
  color: string;
}): Promise<Blob> {
  // Templates are exported at the editor's crop (a sleeve is shown close up).
  const frame = viewFrame(view);
  const s = view.base.kind === "photo" ? Math.min(1, MAX_WIDTH / view.base.w) : DRAWING_WIDTH / frame.w;
  const W = Math.round(frame.w * s);
  const H = Math.round(frame.h * s);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.save();
  ctx.translate(-frame.x * s, -frame.y * s);
  const garment = view.base.kind === "template" ? garmentImages(view.base.template, view.base.scene, color) : null;
  const full = { w: view.base.w * s, h: view.base.h * s };

  // 1. Product.
  if (view.base.kind === "photo") {
    ctx.drawImage(await loadImage(view.base.src, true), 0, 0, W, H);
  } else if (garment) {
    ctx.drawImage(await loadImage(garment.under), 0, 0, full.w, full.h);
  } else {
    const drawing = stage.querySelector("[data-base] svg");
    if (!drawing) throw new Error("drawing not found");
    const clone = drawing.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(W));
    clone.setAttribute("height", String(H));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
    try {
      ctx.drawImage(await loadImage(url), 0, 0, W, H);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // 2. Product colour through the configured mask (luminance → alpha, multiplied).
  if (view.mask && tint) {
    const mask = await loadImage(view.mask, true);
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const octx = off.getContext("2d")!;
    octx.drawImage(mask, 0, 0, W, H);
    const data = octx.getImageData(0, 0, W, H);
    const n = Number.parseInt(tint.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    for (let i = 0; i < data.data.length; i += 4) {
      const lum = data.data[i]!;
      data.data[i] = r;
      data.data[i + 1] = g;
      data.data[i + 2] = b;
      data.data[i + 3] = lum;
    }
    octx.putImageData(data, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  }

  // 3. Layers, clipped to the printable area.
  const area = view.area;
  ctx.save();
  applyRotate(ctx, areaTransform(view), s);
  ctx.translate(area.x * s, area.y * s);
  ctx.beginPath();
  if (view.base.kind === "drawing" && view.base.circle) {
    ctx.arc((view.base.circle.cx - area.x) * s, (view.base.circle.cy - area.y) * s, view.base.circle.r * s, 0, Math.PI * 2);
  } else {
    ctx.rect(0, 0, area.w * s, area.h * s);
  }
  ctx.clip();
  const light = tint ? isLight(tint) : true;
  if (view.base.kind === "photo") {
    if (light) ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.95;
  }

  for (const layer of layers) {
    const box = layerBoxPx(layer, area);
    const w = box.w * s;
    const h = box.h * s;
    ctx.save();
    ctx.translate(box.x * s, box.y * s);
    ctx.rotate((box.rotation * Math.PI) / 180);
    if (layer.kind === "text") {
      const font = STUDIO_FONTS[layer.font];
      const spec = `${font.weight} ${h / 1.15}px ${fontFamily(font.css)}`;
      await document.fonts.load(spec, layer.text).catch(() => undefined);
      ctx.font = spec;
      ctx.fillStyle = layer.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Same as SVG textLength: the text fills the layer width exactly.
      const measured = ctx.measureText(layer.text).width;
      if (measured > 0) ctx.scale(w / measured, 1);
      ctx.fillText(layer.text, 0, 0);
    } else {
      const asset = layer.asset ? assets.get(layer.asset) : undefined;
      if (asset && layer.file.type !== "application/pdf") {
        ctx.drawImage(await loadImage(asset.url), -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = "#F3F1EC";
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.setLineDash([12, 8]);
        ctx.strokeStyle = "#8A8F98";
        ctx.lineWidth = Math.max(2, W / 600);
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = "#5B6270";
        ctx.font = `600 ${Math.min(w, h) * 0.22}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("PDF", 0, 0);
      }
    }
    ctx.restore();
  }
  ctx.restore();

  // 4. Garment template: lighting, folds and texture over the print.
  if (garment) ctx.drawImage(await loadImage(garment.over), 0, 0, full.w, full.h);
  ctx.restore();

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png"));
}
