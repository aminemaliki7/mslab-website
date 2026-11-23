/**
 * Background removal for catalogue photos: the product keeps its own shadow but sits on
 * whatever colour the page gives it (card tile, hover tint, product gallery), instead of a
 * white or grey rectangle.
 *
 * Runs on the printed image (on a blank, white paper is too close to the white background):
 * - background colour = median of the photo border;
 * - background = flood fill from the border (and `seeds`, for enclosed holes) over pixels close
 *   to that colour or darker but neutral (shadows, down to `minRel` × the background), never
 *   crossing a step in brightness larger than `edgeTol` (product edges);
 * - background pixels become a black shadow whose opacity follows how much darker than the
 *   background they are; product pixels stay opaque; the silhouette edge is softened 1 px.
 */
import sharp from "sharp";

const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** @returns {Promise<{ alpha: Uint8Array, width: number, height: number, bgLum: number }>} */
export async function backgroundMask(input, { tol = 0.045, edgeTol = 0.03, shadowGain = 1.15, maxShadow = 0.55, minRel = 0.8, lightTint = 1.01, lighter = 0, fadeZones = [], fadeK = 100, seeds = [], exclude = [] } = {}) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const L = new Float32Array(N), C = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    L[i] = lum(r, g, b);
    C[i] = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  }
  // Background brightness: median of a 3 px frame.
  const border = [];
  for (let x = 0; x < W; x += 2) for (const y of [0, 1, 2, H - 3, H - 2, H - 1]) border.push(L[y * W + x]);
  for (let y = 0; y < H; y += 2) for (const x of [0, 1, 2, W - 3, W - 2, W - 1]) border.push(L[y * W + x]);
  border.sort((a, b) => a - b);
  const bgLum = border[Math.floor(border.length / 2)];

  // Candidate: near the background brightness, or a neutral shadow darker than it.
  const blocked = new Uint8Array(N);
  for (const poly of exclude) {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    for (let y = Math.max(0, Math.min(...ys) | 0); y <= Math.min(H - 1, Math.max(...ys)); y++)
      for (let x = Math.max(0, Math.min(...xs) | 0); x <= Math.min(W - 1, Math.max(...xs)); x++) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const [xi, yi] = poly[i], [xj, yj] = poly[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) blocked[y * W + x] = 1;
      }
  }
  // Shadows darker than minRel × background stay part of the product (dark sides of objects).
  // lightTint: very light pixels count as background even when tinted (a hand fading to white).
  // lighter: pixels up to this much lighter than the backdrop too (a white outline around a cut-out photo).
  const candidate = (i) => !blocked[i] && (C[i] < 0.08 || L[i] >= lightTint) && L[i] >= bgLum * minRel && (Math.abs(L[i] - bgLum) < tol || L[i] < bgLum || (L[i] > bgLum && L[i] - bgLum < lighter));

  const bg = new Uint8Array(N);
  const stack = [];
  const push = (i) => { if (!bg[i] && candidate(i)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  // Enclosed background (e.g. inside a mug handle) is not reachable from the border: seed it.
  for (const [sx, sy] of seeds) push(Math.round(sy) * W + Math.round(sx));
  while (stack.length) {
    const i = stack.pop();
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (!bg[j] && candidate(j) && Math.abs(L[j] - L[i]) < edgeTol) { bg[j] = 1; stack.push(j); }
    }
  }

  const alpha = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (!bg[i]) { alpha[i] = 255; continue; }
    const shadow = Math.min(maxShadow, Math.max(0, ((bgLum - L[i]) / bgLum) * shadowGain));
    alpha[i] = Math.round(shadow * 255);
  }
  // Soft silhouette: product pixels within 2 px of the background (anti-aliased edges, the
  // hands fading out around the mailer box) are as opaque as they differ from the background
  // colour; applyMask then removes the background colour from them (no white fringe).
  const bgRGB = [0, 1, 2].map((c) => {
    const v = [];
    for (let x = 0; x < W; x += 2) for (const y of [0, 1, 2, H - 3, H - 2, H - 1]) v.push(data[(y * W + x) * 3 + c]);
    v.sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  });
  const band = new Uint8Array(N);
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    const i = y * W + x;
    if (bg[i]) continue;
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (bg[i + dy * W + dx]) { near = true; break; }
    if (!near) continue;
    const diff = Math.max(...[0, 1, 2].map((c) => Math.abs(data[i * 3 + c] - bgRGB[c]))) / 255;
    alpha[i] = Math.round(255 * Math.min(1, Math.max(0.08, diff / 0.14)));
    band[i] = 1;
  }
  // Fade zones (a product that fades to the white backdrop in the photo): white → transparency,
  // opaque once the darkest channel is fadeK below white.
  const inPoly = (x, y, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  for (const zone of fadeZones) {
    const xs = zone.map((p) => p[0]), ys = zone.map((p) => p[1]);
    for (let y = Math.max(0, Math.min(...ys)); y <= Math.min(H - 1, Math.max(...ys)); y++)
      for (let x = Math.max(0, Math.min(...xs)); x <= Math.min(W - 1, Math.max(...xs)); x++) {
        const i = y * W + x;
        if (bg[i] || !inPoly(x, y, zone)) continue;
        const minC = Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
        const a = Math.min(1, Math.max(0, (bgRGB[0] - minC) / fadeK));
        if (a < 1) { alpha[i] = Math.min(alpha[i], Math.round(a * 255)); band[i] = 1; }
      }
  }
  return { alpha, isBackground: bg, band, bgRGB, width: W, height: H, bgLum };
}

/**
 * Applies a mask to a composited RGB image: product pixels keep their colour, background pixels
 * become a black shadow of the mask's opacity. Returns RGBA raw data.
 */
export function applyMask(rgb, mask) {
  const { alpha, isBackground, band, bgRGB, width: W, height: H } = mask;
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const shadow = isBackground[i];
    const a = alpha[i] / 255;
    for (let c = 0; c < 3; c++) {
      let v = shadow ? 0 : rgb[i * 3 + c];
      // Edge pixels: un-mix the background colour so no light fringe shows on the tile.
      if (!shadow && band[i] && a > 0) v = (v - (1 - a) * bgRGB[c]) / a;
      out[i * 4 + c] = Math.max(0, Math.min(255, Math.round(v)));
    }
    out[i * 4 + 3] = alpha[i];
  }
  return out;
}
