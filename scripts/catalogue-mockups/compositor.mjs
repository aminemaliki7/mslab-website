/**
 * Mockup compositor for the public catalogue (scripts/build-catalogue-mockups.mjs).
 *
 * Puts flat SVG artwork onto a blank product photo the way a print would sit on it:
 * - geometry: perspective (homography from the artwork rectangle to a 4-corner surface) or
 *   a cylinder wrap (mugs), with optional fabric displacement that bends the print along folds;
 * - surface: a polygon, a luminance range (keeps the background, spiral, tape… unprinted) and
 *   an optional clip path (peeled sticker fold);
 * - light: the photo's own shading is transferred onto the ink (folds, curvature, shadows),
 *   so a print darkens in the creases and keeps the paper/fabric texture;
 * - ink: "print" (opaque ink lit by the photo), "multiply" (one-colour ink on kraft/coloured
 *   stock), "embroidery" (raised thread with bevel and stitch texture).
 * Every pixel is supersampled 2 × 2 for clean edges.
 */
import sharp from "sharp";

const SS = [
  [0.25, 0.25],
  [0.75, 0.25],
  [0.25, 0.75],
  [0.75, 0.75],
];

/** Homography mapping the unit square (0,0)(1,0)(1,1)(0,1) to quad p0..p3. */
function squareToQuad([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]) {
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det;
  const h = (dx1 * dy3 - dx3 * dy1) / det;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}

function invert3([a, b, c, d, e, f, g, h, i]) {
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

async function rasterizeSvg(svg, width) {
  const { data, info } = await sharp(Buffer.from(svg), { density: 300 })
    .resize({ width })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** Bilinear sample of premultiplied-free RGBA artwork at (u, v) ∈ [0,1]². */
function sampleArt(art, u, v, out) {
  const x = u * (art.w - 1), y = v * (art.h - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, art.w - 1), y1 = Math.min(y0 + 1, art.h - 1);
  const fx = x - x0, fy = y - y0;
  const d = art.data;
  let r = 0, g = 0, b = 0, a = 0;
  for (const [xx, yy, wgt] of [[x0, y0, (1 - fx) * (1 - fy)], [x1, y0, fx * (1 - fy)], [x0, y1, (1 - fx) * fy], [x1, y1, fx * fy]]) {
    const i = (yy * art.w + xx) * 4;
    const al = (d[i + 3] / 255) * wgt;
    r += d[i] * al; g += d[i + 1] * al; b += d[i + 2] * al; a += al;
  }
  out[0] = a > 0 ? r / a : 0; out[1] = a > 0 ? g / a : 0; out[2] = a > 0 ? b / a : 0; out[3] = a;
}

/**
 * @param {string} basePath blank photo (read only)
 * @param {Array} layers see build script
 * @returns {Promise<Buffer>} RGB raw buffer + info
 */
export async function composite(basePath, layers) {
  const { data: base, info } = await sharp(basePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const out = Buffer.from(base);
  const L = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) L[i] = lum(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
  const { data: blurred } = await sharp(basePath).removeAlpha().greyscale().blur(5).raw().toBuffer({ resolveWithObject: true });
  const LB = (x, y) => blurred[clamp(Math.round(y), 0, H - 1) * W + clamp(Math.round(x), 0, W - 1)] / 255;

  for (const layer of layers) {
    const art = await rasterizeSvg(layer.svg, layer.rasterWidth ?? 1600);
    const clip = layer.clipSvg
      ? (await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><path d="${layer.clipSvg}" fill="#fff"/></svg>`)).greyscale().raw().toBuffer())
      : null;
    const poly = layer.quad ?? layer.polygon;
    const exclude = layer.exclude ?? [];
    const [lo, hi] = layer.lumRange ?? [0, 1.01];
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const bx0 = Math.max(0, Math.floor(Math.min(...xs))), bx1 = Math.min(W - 1, Math.ceil(Math.max(...xs)));
    const by0 = Math.max(0, Math.floor(Math.min(...ys))), by1 = Math.min(H - 1, Math.ceil(Math.max(...ys)));

    // Reference brightness of the bare surface: the print is lit relative to it.
    let ref = layer.ref;
    if (!ref) {
      const vals = [];
      for (let y = by0; y <= by1; y += 3) for (let x = bx0; x <= bx1; x += 3) {
        const l = L[y * W + x];
        if (pointInPolygon(x, y, poly) && l >= lo && l <= hi) vals.push(l);
      }
      vals.sort((a, b) => a - b);
      ref = vals[Math.floor(vals.length * 0.6)] ?? 0.9;
    }

    // Luminance mask, 3 × 3 majority vote: isolated pixels just outside the range (edge glints,
    // JPEG-ish noise in the blanks) must not punch holes in the print.
    const inRange = new Uint8Array(W * H);
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) { const l = L[y * W + x]; inRange[y * W + x] = l >= lo && l <= hi ? 1 : 0; }
    const surface = (x, y) => {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += inRange[clamp(y + dy, 0, H - 1) * W + clamp(x + dx, 0, W - 1)];
      return n >= 5;
    };

    let mapUV;
    if (layer.mapping === "cylinder") {
      // arc: half-angle covered by the artwork (rad). ellipse: half minor axis of the rims when
      // the object is seen from above (px) — horizontal lines of the print bow down at the front.
      // top/bottom: print band at the front-centre of the object.
      const { cx, radius, top, bottom, arc, ellipse = 0 } = layer.cylinder;
      mapUV = (x, y) => {
        const s = (x - cx) / radius;
        if (s <= -1 || s >= 1) return null;
        const theta = Math.asin(s);
        const bow = ellipse * (Math.cos(theta) - 1);
        return [(theta + arc) / (2 * arc), (y - bow - top) / (bottom - top)];
      };
    } else {
      const Hinv = invert3(squareToQuad(layer.quad));
      mapUV = (x, y) => {
        const w = Hinv[6] * x + Hinv[7] * y + Hinv[8];
        return [(Hinv[0] * x + Hinv[1] * y + Hinv[2]) / w, (Hinv[3] * x + Hinv[4] * y + Hinv[5]) / w];
      };
    }
    // Artwork placement inside the surface (fractions of the surface): [u0, v0, u1, v1].
    const [pu0, pv0, pu1, pv1] = layer.place ?? [0, 0, 1, 1];
    const disp = layer.displace ?? 0;
    const mode = layer.mode ?? "print";
    const opacity = layer.opacity ?? 0.96;
    const s = [0, 0, 0, 0];

    for (let y = by0; y <= by1; y++) {
      for (let x = bx0; x <= bx1; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (const [ox, oy] of SS) {
          const px = x + ox, py = y + oy;
          if (!pointInPolygon(px, py, poly)) continue;
          if (exclude.some((e) => pointInPolygon(px, py, e))) continue;
          let qx = px, qy = py;
          if (disp) {
            // Fabric: the print follows the folds (gradient of the blurred photo).
            qx += disp * (LB(px + 2, py) - LB(px - 2, py)) * 10;
            qy += disp * (LB(px, py + 2) - LB(px, py - 2)) * 10;
          }
          const uv = mapUV(qx, qy);
          if (!uv) continue;
          const u = (uv[0] - pu0) / (pu1 - pu0), v = (uv[1] - pv0) / (pv1 - pv0);
          if (u < 0 || u > 1 || v < 0 || v > 1) continue;
          sampleArt(art, u, v, s);
          r += s[0] * s[3]; g += s[1] * s[3]; b += s[2] * s[3]; a += s[3];
        }
        if (a <= 0) continue;
        const i = y * W + x;
        const l = L[i];
        if (!surface(x, y)) continue;
        let alpha = (a / 4) * opacity;
        if (clip) alpha *= clip[i] / 255;
        if (alpha <= 0.001) continue;
        const ir = r / a, ig = g / a, ib = b / a;
        const o = i * 3;
        let nr, ng, nb;
        if (mode === "multiply") {
          nr = (base[o] * ir) / 255; ng = (base[o + 1] * ig) / 255; nb = (base[o + 2] * ib) / 255;
        } else {
          // Light transfer: darker than the bare surface → shadowed ink; brighter → lit ink.
          const shade = clamp(l / ref, layer.shadeMin ?? 0.35, layer.shadeMax ?? 1.12);
          const k = layer.shadeStrength ?? 1;
          const sh = 1 + (shade - 1) * k;
          nr = ir * sh; ng = ig * sh; nb = ib * sh;
          if (mode === "embroidery") {
            // Raised thread: bevel from the artwork alpha + fine diagonal stitch texture.
            const uv = mapUV(x + 0.5, y + 0.5);
            const stitch = 1 + 0.07 * Math.sin((x + y) * 1.9) + 0.04 * Math.sin((x - y) * 0.7);
            let bevel = 1;
            if (uv) {
              const e = 1.6;
              const au = (dx, dy) => {
                const uv2 = mapUV(x + 0.5 + dx, y + 0.5 + dy);
                if (!uv2) return 0;
                sampleArt(art, (uv2[0] - pu0) / (pu1 - pu0), (uv2[1] - pv0) / (pv1 - pv0), s);
                return s[3];
              };
              bevel = 1 + 0.35 * (au(-e, -e) - au(e, e));
            }
            nr *= stitch * bevel; ng *= stitch * bevel; nb *= stitch * bevel;
          }
          if (layer.gloss) {
            // Glossy surfaces (mug glaze): keep the photo's specular highlight on top of the ink.
            const spec = clamp((l - layer.gloss) / (1 - layer.gloss), 0, 1) * 0.85;
            nr += (255 - nr) * spec; ng += (255 - ng) * spec; nb += (255 - nb) * spec;
          }
        }
        out[o] = clamp(Math.round(base[o] * (1 - alpha) + nr * alpha), 0, 255);
        out[o + 1] = clamp(Math.round(base[o + 1] * (1 - alpha) + ng * alpha), 0, 255);
        out[o + 2] = clamp(Math.round(base[o + 2] * (1 - alpha) + nb * alpha), 0, 255);
      }
    }
    // Later layers read the updated photo (e.g. a card leaning on a printed stack).
    out.copy(base);
    for (let i = 0; i < W * H; i++) L[i] = lum(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
  }
  return { data: out, width: W, height: H };
}
