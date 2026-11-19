// Places the MSLAB logo on the owner's blank mockups (2026-11-19).
// Usage: node scripts/brand-mockups.mjs <project dir> <mockups dir> <out dir>
// Then copy the reviewed results into src/assets/production/ (see src/config/photos.ts).
// - Flat surfaces: perspective (homography) warp into the surface quad, chosen blend mode.
// - Mug: cylindrical wrap around the mug axis.
// Output: <outDir>/<name>.jpg (reviewed before being copied into the project).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const project = process.argv[2];
const mockDir = process.argv[3];
const outDir = process.argv[4];
fs.mkdirSync(outDir, { recursive: true });

const LOGO_SVG = fs.readFileSync(path.join(project, "public/brand/mslab-logo.svg"), "utf8");
const variant = (accent, ink) => LOGO_SVG.replaceAll("#0B6E8A", accent).replaceAll("#0E1A2B", ink);

async function rasterLogo(svg, width) {
  const { data, info } = await sharp(Buffer.from(svg), { density: 600 })
    .resize({ width })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

// ── Homography (maps unit square / rect corners to quad) ──────────────────
function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}
/** H such that H·src = dst for 4 point pairs. Returns 3x3 as flat [a..h,1]. */
function homography(src, dst) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  return [...solve(A, b), 1];
}
const apply = (H, x, y) => {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
};

/** Point on a surface quad (TL, TR, BR, BL) at unit coords (u, v), perspective-correct. */
function surfacePoint(quad, u, v) {
  const H = homography([[0, 0], [1, 0], [1, 1], [0, 1]], quad);
  return apply(H, u, v);
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Logo quad centred at (cu, cv) on the surface, `wFrac` of the surface width, logo aspect kept. */
function logoQuad(quad, cu, cv, wFrac, aspect) {
  const uLen = (dist(quad[0], quad[1]) + dist(quad[3], quad[2])) / 2;
  const vLen = (dist(quad[0], quad[3]) + dist(quad[1], quad[2])) / 2;
  const hFrac = (wFrac * uLen) / aspect / vLen;
  const u0 = cu - wFrac / 2, u1 = cu + wFrac / 2, v0 = cv - hFrac / 2, v1 = cv + hFrac / 2;
  return [surfacePoint(quad, u0, v0), surfacePoint(quad, u1, v0), surfacePoint(quad, u1, v1), surfacePoint(quad, u0, v1)];
}

function sample(logo, x, y) {
  if (x < 0 || y < 0 || x > logo.w - 1 || y > logo.h - 1) return null;
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, logo.w - 1), y1 = Math.min(y0 + 1, logo.h - 1);
  const fx = x - x0, fy = y - y0;
  const out = [0, 0, 0, 0];
  for (const [xx, yy, wgt] of [[x0, y0, (1 - fx) * (1 - fy)], [x1, y0, fx * (1 - fy)], [x0, y1, (1 - fx) * fy], [x1, y1, fx * fy]]) {
    const i = (yy * logo.w + xx) * 4;
    for (let k = 0; k < 4; k++) out[k] += logo.data[i + k] * wgt;
  }
  return out;
}

/**
 * Composite `logo` into base (raw RGB) inside `dstQuad`.
 * mode: "multiply" (ink on light surfaces) | "fabric" (light print on dark cloth, keeps folds).
 */
function warpOnto(base, logo, dstQuad, mode = "multiply", opacity = 1) {
  const H = homography(dstQuad, [[0, 0], [logo.w, 0], [logo.w, logo.h], [0, logo.h]]);
  const xs = dstQuad.map((p) => p[0]), ys = dstQuad.map((p) => p[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs))), maxX = Math.min(base.w - 1, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys))), maxY = Math.min(base.h - 1, Math.ceil(Math.max(...ys)));
  let lumSum = 0, lumN = 0;
  if (mode === "fabric") {
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const i = (y * base.w + x) * 3;
      lumSum += (base.data[i] + base.data[i + 1] + base.data[i + 2]) / 3;
      lumN++;
    }
  }
  const meanLum = lumN ? lumSum / lumN : 1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      // 2x2 supersampling for clean edges
      let acc = [0, 0, 0, 0];
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const [sx, sy] = apply(H, x + ox, y + oy);
        const s = sample(logo, sx, sy);
        if (s) acc = acc.map((v, k) => v + s[k] / 4);
      }
      const a = (acc[3] / 255) * opacity;
      if (a <= 0.002) continue;
      const i = (y * base.w + x) * 3;
      for (let k = 0; k < 3; k++) {
        const b = base.data[i + k];
        let v;
        if (mode === "multiply") v = (b * acc[k]) / 255;
        else {
          // fabric: logo colour shaded by the cloth's local light (folds stay visible)
          const lum = (base.data[i] + base.data[i + 1] + base.data[i + 2]) / 3;
          const shade = Math.min(1.15, Math.max(0.55, 0.7 + 0.3 * (lum / meanLum)));
          v = acc[k] * shade;
        }
        base.data[i + k] = Math.round(b * (1 - a) + Math.min(255, v) * a);
      }
    }
  }
}

/** Mug: wrap the logo around a vertical cylinder (axis cx, radius r), centred at cy. */
function wrapOnMug(base, logo, { cx, r, cy, widthPx }) {
  const heightPx = (widthPx * logo.h) / logo.w;
  const thetaMax = Math.asin(Math.min(0.95, widthPx / 2 / r)); // half-angle covered by the logo
  const arcHalf = r * thetaMax;
  for (let y = Math.floor(cy - heightPx / 2); y <= Math.ceil(cy + heightPx / 2); y++) {
    for (let x = Math.floor(cx - widthPx / 2); x <= Math.ceil(cx + widthPx / 2); x++) {
      let acc = [0, 0, 0, 0];
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const dx = (x + ox - cx) / r;
        if (Math.abs(dx) >= 1) continue;
        const arc = r * Math.asin(dx); // distance along the surface
        const u = ((arc + arcHalf) / (2 * arcHalf)) * logo.w;
        const v = ((y + oy - (cy - heightPx / 2)) / heightPx) * logo.h;
        const s = sample(logo, u, v);
        if (s) acc = acc.map((val, k) => val + s[k] / 4);
      }
      const a = acc[3] / 255;
      if (a <= 0.002) continue;
      const i = (y * base.w + x) * 3;
      for (let k = 0; k < 3; k++) {
        const b = base.data[i + k];
        base.data[i + k] = Math.round(b * (1 - a) + ((b * acc[k]) / 255) * a);
      }
    }
  }
}


/**
 * Erase a printed mark inside a rotated ellipse: each pixel is rebuilt from samples on a ring
 * just outside it (inverse-distance weighted), plus light grain so cloth and paper keep texture.
 */
function erase(base, { cx, cy, rx, ry, angle = 0, margin = 1.15, grain = 3, minLum = 0 }) {
  const a = (angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const RX = rx * margin, RY = ry * margin;
  const ring = [];
  for (let k = 0; k < 96; k++) {
    const t = (k / 96) * Math.PI * 2;
    const ex = RX * 1.12 * Math.cos(t), ey = RY * 1.12 * Math.sin(t);
    const x = Math.round(cx + ex * ca - ey * sa), y = Math.round(cy + ex * sa + ey * ca);
    if (x < 0 || y < 0 || x >= base.w || y >= base.h) continue;
    const i = (y * base.w + x) * 3;
    // minLum: on paper, skip dark samples (binding, clips) so they do not bleed into the fill
    if ((base.data[i] + base.data[i + 1] + base.data[i + 2]) / 3 < minLum) continue;
    ring.push([x, y, base.data[i], base.data[i + 1], base.data[i + 2]]);
  }
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
  const R = Math.max(RX, RY) * 1.2;
  for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) {
    for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
      if (x < 0 || y < 0 || x >= base.w || y >= base.h) continue;
      const dx = x - cx, dy = y - cy;
      const lx = (dx * ca + dy * sa) / RX, ly = (-dx * sa + dy * ca) / RY;
      const r = Math.hypot(lx, ly);
      if (r > 1.1) continue;
      let wsum = 0;
      const c = [0, 0, 0];
      for (const [px, py, pr, pg, pb] of ring) {
        const w = 1 / ((px - x) ** 2 + (py - y) ** 2 + 1) ** 1.5;
        wsum += w;
        c[0] += pr * w; c[1] += pg * w; c[2] += pb * w;
      }
      const n = rnd() * grain;
      const blend = r <= 1 ? 1 : 1 - (r - 1) / 0.1; // feathered edge
      const i = (y * base.w + x) * 3;
      for (let k = 0; k < 3; k++) {
        const v = c[k] / wsum + n;
        base.data[i + k] = Math.round(base.data[i + k] * (1 - blend) + Math.max(0, Math.min(255, v)) * blend);
      }
    }
  }
}

/** Quad for a logo centred at (cx, cy): half-width along (ux, uy), half-height along (vx, vy). */
const quadFrom = (cx, cy, u, v) => [
  [cx - u[0] - v[0], cy - u[1] - v[1]],
  [cx + u[0] - v[0], cy + u[1] - v[1]],
  [cx + u[0] + v[0], cy + u[1] + v[1]],
  [cx - u[0] + v[0], cy - u[1] + v[1]],
];

/** A logo on a printed circle seen on a slanted bag: rx/ry = the circle's on-screen half axes. */
function bagQuad(cx, cy, rx, ry, slope, aspect, fill = 0.9) {
  const trueW = 2 * ry * fill;
  const halfW = (trueW * (rx / ry)) / 2;
  const halfH = trueW / aspect / 2;
  return quadFrom(cx, cy, [halfW, halfW * slope], [0, halfH]);
}

/** A logo lying on paper seen from above at an angle: rotation in degrees, vertical squash. */
function paperQuad(cx, cy, width, angle, squash, aspect) {
  const a = (angle * Math.PI) / 180;
  const hw = width / 2, hh = (width / aspect / 2) * squash;
  return quadFrom(cx, cy, [hw * Math.cos(a), hw * Math.sin(a)], [-hh * Math.sin(a), hh * Math.cos(a)]);
}

async function load(file) {
  const { data, info } = await sharp(path.join(mockDir, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
async function save(base, name) {
  const out = path.join(outDir, `${name}.jpg`);
  await sharp(base.data, { raw: { width: base.w, height: base.h, channels: 3 } }).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
  console.log("wrote", out);
}

(async () => {
  const color = await rasterLogo(variant("#0B6E8A", "#0E1A2B"), 1600);
  const light = await rasterLogo(variant("#5BA7BC", "#FFFFFF"), 1600); // logo's own on-dark variant
  const white = await rasterLogo(variant("#FFFFFF", "#FFFFFF"), 1600);
  const ASPECT = color.w / color.h;

  // Book cover (perspective, multiply)
  {
    const b = await load("07affa0229093b50f92166a3687a8995.jpg");
    const cover = [[238, 197], [533, 210], [567, 621], [262, 679]];
    warpOnto(b, color, logoQuad(cover, 0.52, 0.4, 0.5, ASPECT), "multiply");
    await save(b, "blank-book");
  }
  // Shopping bag front (perspective, multiply)
  {
    const b = await load("fddc25310334878169a066bfc156fb34.jpg");
    const front = [[301, 588], [611, 598], [612, 1062], [303, 1135]];
    warpOnto(b, color, logoQuad(front, 0.5, 0.36, 0.56, ASPECT), "multiply");
    await save(b, "paper-shopping-bag");
  }
  // Kraft mailer box lid (perspective; one-colour teal print, multiply), clear of the black tape
  {
    const b = await load("8b4db0f85fc547b5fc63497987ba591a.jpg");
    // Lid corners: left (40,690), top (318,232), right (672,500), front (285,885). The long edge
    // nearest the viewer runs front→right, so the logo's baseline is parallel to it:
    // TL=left, TR=top, BR=right, BL=front. The tape covers v > ~0.85 (along that edge).
    const lid = [[40, 690], [318, 232], [672, 500], [285, 885]];
    const tealOnly = await rasterLogo(variant("#0B6E8A", "#0B6E8A"), 1600);
    warpOnto(b, tealOnly, logoQuad(lid, 0.46, 0.44, 0.34, ASPECT), "multiply", 0.95);
    await save(b, "kraft-mailer-box");
  }
  // Mug (cylindrical wrap)
  {
    const b = await load("6ef987aeca521942d3ecfb9728b7fc62.jpg");
    wrapOnMug(b, color, { cx: 562, r: 258, cy: 585, widthPx: 300 });
    await save(b, "white-mug");
  }
  // Black hoodies: chest logo on the front, large back print (fabric blend, logo's on-dark colours)
  {
    const b = await load("193349136cadebc700106d5a9d654c4e.jpg");
    const rect = (cx, cy, w) => {
      const h = w / ASPECT;
      return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
    };
    warpOnto(b, light, rect(141, 152, 62), "fabric");
    warpOnto(b, light, rect(588, 168, 104), "fabric");
    await save(b, "black-hoodie-views");
  }
  // Hoodie technical sketch (tech pack: flat colour logo, front chest + back)
  {
    const b = await load("6a0973e773dcb81b7d1d220bd1115a4d.jpg");
    const rect = (cx, cy, w) => {
      const h = w / ASPECT;
      return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
    };
    warpOnto(b, color, rect(192, 168, 66), "multiply");
    warpOnto(b, color, rect(548, 205, 118), "multiply");
    await save(b, "hoodie-technical-sketch");
  }
  // T-shirt technical sketch (front chest + back)
  {
    const b = await load("8186b8b029750539fb014e47798ae99e.jpg");
    const rect = (cx, cy, w) => {
      const h = w / ASPECT;
      return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
    };
    warpOnto(b, color, rect(186, 300, 78), "multiply");
    warpOnto(b, color, rect(551, 330, 150), "multiply");
    await save(b, "tshirt-technical-sketch");
  }
  // Framed posters: three printed posters (navy / deep teal / ivory) carrying the logo
  {
    const b = await load("b01a15ed7c14c639ca5a805621e3c3bc.jpg");
    const frames = [
      { q: [[101, 128], [362, 128], [362, 540], [101, 540]], bg: [0x19, 0x36, 0x42], logo: light },
      { q: [[501, 373], [761, 373], [761, 786], [501, 786]], bg: [0x0b, 0x6e, 0x8a], logo: white },
      { q: [[906, 602], [1167, 602], [1167, 1014], [906, 1014]], bg: [0xf7, 0xf6, 0xf2], logo: color },
    ];
    for (const f of frames) {
      const [[x0, y0], , [x1, y1]] = f.q;
      // poster paper: flat colour, keeping a little of the photo's light falloff
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = (y * b.w + x) * 3;
        const lum = (b.data[i] + b.data[i + 1] + b.data[i + 2]) / 3 / 225;
        for (let k = 0; k < 3; k++) b.data[i + k] = Math.round(Math.min(255, f.bg[k] * (0.9 + 0.1 * lum)));
      }
      const w = (x1 - x0) * 0.62;
      const h = w / ASPECT;
      const cx = (x0 + x1) / 2, cy = y0 + (y1 - y0) * 0.42;
      warpOnto(b, f.logo, [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]], "normal");
    }
    await save(b, "framed-posters");
  }
// Heat press: a fresh white MSLAB transfer on the blue garment lying on the platen.
  {
    const b = await load("baf2a8d646f40407a2e29961bc26cbc3.jpg");
    warpOnto(b, white, paperQuad(515, 712, 215, -6, 0.78, ASPECT), "fabric", 0.94);
    await save(b, "heat-press-garment");
  }
  // Mug press: clean the manufacturer's mark off the mug base, print MSLAB in its place.
  {
    const b = await load("49b52834f4697713e9b61050f3328df9.jpg");
    erase(b, { cx: 256, cy: 470, rx: 44, ry: 27, angle: -24, grain: 1.5 });
    erase(b, { cx: 222, cy: 451, rx: 6, ry: 6, grain: 1 }); // stray dot of the old mark
    warpOnto(b, color, paperQuad(254, 474, 96, -24, 0.82, ASPECT), "multiply");
    await save(b, "mug-press");
  }
  // Event kits: every tote and document carries MSLAB instead of the previous organisation's mark.
  {
    const b = await load("928465dffdd1db0b191f8ebcbbe0855c.jpg");
    const bags = [
      { cx: 561, cy: 827, rx: 72, ry: 108, slope: 0.3, angle: 8, margin: 1.2 },
      { cx: 378, cy: 594, rx: 46, ry: 75, slope: 0.25 },
      { cx: 285, cy: 482, rx: 24, ry: 57, slope: 0.2 },
      { cx: 190, cy: 402, rx: 20, ry: 47, slope: 0.18 },
      { cx: 118, cy: 354, rx: 18, ry: 42, slope: 0.15 },
      { cx: 75, cy: 316, rx: 11, ry: 28, slope: 0.12 },
      { cx: 48, cy: 297, rx: 8, ry: 24, slope: 0.1 },
      { cx: 18, cy: 262, rx: 8, ry: 19, slope: 0.1 },
    ];
    for (const g of bags) erase(b, { cx: g.cx, cy: g.cy, rx: g.rx, ry: g.ry, angle: g.angle ?? 0, margin: g.margin ?? 1.12, grain: 3 });
    for (const g of bags) warpOnto(b, color, bagQuad(g.cx, g.cy, g.rx, g.ry, g.slope, ASPECT), "multiply");
    const docs = [
      { cx: 220, cy: 862, rx: 64, ry: 47, angle: -12, width: 120, squash: 0.78 },
      { cx: 125, cy: 659, rx: 54, ry: 25, angle: -12, width: 92, squash: 0.7 },
      { cx: 213, cy: 725, rx: 18, ry: 11, angle: -12, width: 30, squash: 0.75 },
      { cx: 124, cy: 550, rx: 15, ry: 10, angle: -10, width: 26, squash: 0.75 },
    ];
    for (const d of docs) {
      erase(b, { cx: d.cx, cy: d.cy, rx: d.rx, ry: d.ry, angle: d.angle, margin: 1.18, grain: 1.5, minLum: 200 });
      warpOnto(b, color, paperQuad(d.cx, d.cy, d.width, d.angle, d.squash, ASPECT), "multiply");
    }
    await save(b, "event-tote-bags");
  }
})();
