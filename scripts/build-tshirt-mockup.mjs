/**
 * Builds public/mockups/svg/tshirt.svg — MSLAB's vector T-shirt mockup template.
 *
 *   node scripts/build-tshirt-mockup.mjs
 *
 * The SVG is fully self-contained and editable on its own; this script exists so the geometry
 * (silhouette, seams, stitching, print areas) stays consistent when it is adjusted.
 * Documentation: docs/TSHIRT_SVG_MOCKUP.md
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/mockups/svg/tshirt.svg");

/* ------------------------------------------------------------------ helpers */
const r = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${r(p[0])} ${r(p[1])}`;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const norm = (a) => {
  const l = Math.hypot(a[0], a[1]);
  return [a[0] / l, a[1] / l];
};
const ID = (p) => p;
/** Mirror to the wearer's left side, with a small deterministic irregularity (no perfect symmetry). */
const MJ = (p) => {
  const [x, y] = p;
  if (x === 600 || y <= 171) return [1200 - x, y];
  return [1200 - x + 2.2 * Math.sin(x * 0.05 + y * 0.031), y + 2 * Math.sin(y * 0.043 - x * 0.02)];
};

/** Path from tokens: ["M", p, "C", c1, c2, p, "L", p, "Q", c, p, "Z"]. */
function d(tokens, T = ID) {
  return tokens.map((t) => (typeof t === "string" ? t : pt(T(t)))).join(" ");
}
/** Translate every point of a token list. */
const shift = (tokens, v) => tokens.map((t) => (typeof t === "string" ? t : add(t, v)));

function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

/* ----------------------------------------------------------------- geometry */
// 11.5 px = 1 cm (size M flat measurements: body 52 cm, length 72 cm, sleeve 21 cm).
const PX_PER_CM = 11.5;
const HPS = [494, 170]; // high point shoulder (viewer's left)
const SP = [335, 207]; // shoulder point
const CT = [112, 300]; // cuff, top corner
const CB = [190, 490]; // cuff, bottom corner
const UA = [299, 454]; // underarm
const SIDE0 = [304, 468];
const HEM = [298, 1003];
const HC = [600, 1012]; // hem, centre

// Silhouette, viewer's left half, from HPS to hem centre (each entry: c1, c2, end).
const LEFT_CHAIN = [
  [[440, 177], [388, 192], SP],
  [[265, 226], [186, 262], CT],
  [[135, 364], [161, 428], CB],
  [[232, 474], [278, 460], UA],
  [[303, 453], [304, 460], SIDE0],
  [[300, 640], [295, 830], HEM],
  [[420, 1009], [520, 1012], HC],
];
const ARMHOLE = [[350, 290], [343, 395]]; // SP -> UA controls
const NECK_TOP = { a: [706, 170], c1: [655, 192], c2: [545, 192], b: HPS }; // back collar fold (R -> L)

function chainForward(start, chain, T) {
  return `M ${pt(T(start))} ` + chain.map(([c1, c2, e]) => `C ${pt(T(c1))} ${pt(T(c2))} ${pt(T(e))}`).join(" ");
}
function chainReversed(start, chain, T) {
  // walks the same curve backwards, beginning at the chain's end point
  const pts = [start, ...chain.map((s) => s[2])];
  let out = "";
  for (let i = chain.length - 1; i >= 0; i--) {
    const [c1, c2] = chain[i];
    out += ` C ${pt(T(c2))} ${pt(T(c1))} ${pt(T(pts[i]))}`;
  }
  return out;
}

const neckTop = `C ${pt(NECK_TOP.c1)} ${pt(NECK_TOP.c2)} ${pt(NECK_TOP.b)} Z`;
const SILHOUETTE = `${chainForward(HPS, LEFT_CHAIN, ID)}${chainReversed(HPS, LEFT_CHAIN, MJ)} ${neckTop}`;

// Body panel (without sleeves): shoulder -> armhole -> side -> hem, both halves.
const BODY_CHAIN = [
  LEFT_CHAIN[0],
  [ARMHOLE[0], ARMHOLE[1], UA],
  LEFT_CHAIN[4],
  LEFT_CHAIN[5],
  LEFT_CHAIN[6],
];
const BODY = `${chainForward(HPS, BODY_CHAIN, ID)}${chainReversed(HPS, BODY_CHAIN, MJ)} ${neckTop}`;

const sleeveTokens = [
  "M", SP,
  "C", LEFT_CHAIN[1][0], LEFT_CHAIN[1][1], CT,
  "C", LEFT_CHAIN[2][0], LEFT_CHAIN[2][1], CB,
  "C", LEFT_CHAIN[3][0], LEFT_CHAIN[3][1], UA,
  "C", ARMHOLE[1], ARMHOLE[0], SP,
  "Z",
];
const SLEEVE_L = d(sleeveTokens);
const SLEEVE_R = d(sleeveTokens, MJ);

const armholeTokens = ["M", SP, "C", ARMHOLE[0], ARMHOLE[1], UA];
const shoulderTokens = ["M", HPS, "C", [440, 177], [388, 192], SP];
const sideTokens = ["M", [309, 472], "C", [305, 640], [300, 830], [303, 1000]];
const leftEdgeTokens = ["M", SIDE0, "C", [300, 640], [295, 830], HEM];

// Hem (full width, unjittered right side is fine: everything is clipped to the silhouette).
const hemTokens = (dy) => [
  "M", [250, 1003 + dy], "L", [298, 1003 + dy],
  "C", [420, 1009 + dy], [520, 1012 + dy], [600, 1012 + dy],
  "C", [680, 1012 + dy], [780, 1009 + dy], [902, 1003 + dy],
  "L", [950, 1003 + dy],
];

// Cuff, viewer's left. Offsets move inward (towards the shoulder).
const CUFF_DIR = norm([CB[0] - CT[0], CB[1] - CT[1]]);
const SLEEVE_U = norm([CT[0] - SP[0], CT[1] - SP[1]]); // along the sleeve, towards the cuff
const SLEEVE_V = [SLEEVE_U[1], -SLEEVE_U[0]]; // across the sleeve, downwards
const IN = mul(SLEEVE_U, -1);
const cuffTokens = (off) => {
  const o = mul(IN, off);
  const a = add(add(CT, o), mul(CUFF_DIR, -30));
  const b = add(add(CB, o), mul(CUFF_DIR, 30));
  return ["M", a, "L", add(CT, o), "C", add([135, 364], o), add([161, 428], o), add(CB, o), "L", b];
};

// Neckline (front view).
const BACK_TOP = [HPS, [545, 192], [655, 192], [706, 170]];
const BACK_INNER = [[512, 177], [555, 217], [645, 217], [688, 177]];
const FRONT_OUTER_L = [HPS, [496, 236], [540, 268], [600, 268]];
const FRONT_OUTER_R = [[600, 268], [660, 268], [704, 236], [706, 170]];
const FRONT_INNER_L = [[512, 177], [518, 226], [552, 246], [600, 246]];
const FRONT_INNER_R = [[600, 246], [648, 246], [682, 226], [688, 177]];
const cub = (c) => `C ${pt(c[1])} ${pt(c[2])} ${pt(c[3])}`;
const cubRev = (c) => `C ${pt(c[2])} ${pt(c[1])} ${pt(c[0])}`;

const FRONT_COLLAR = `M ${pt(HPS)} ${cub(FRONT_OUTER_L)} ${cub(FRONT_OUTER_R)} L 688 177 ${cubRev(FRONT_INNER_R)} ${cubRev(FRONT_INNER_L)} Z`;
const BACK_COLLAR_INSIDE = `M ${pt(HPS)} ${cub(BACK_TOP)} L 688 177 ${cubRev(BACK_INNER)} Z`;
const NECK_INTERIOR = `M 512 177 ${cub(BACK_INNER)} ${cubRev(FRONT_INNER_R)} ${cubRev(FRONT_INNER_L)} Z`;
const FRONT_OUTER_D = (dy) =>
  `M ${pt(add(HPS, [-6, dy * 0.3]))} C ${pt(add([496, 236], [-6, dy]))} ${pt(add([540, 268], [0, dy]))} ${pt(add([600, 268], [0, dy]))} C ${pt(add([660, 268], [0, dy]))} ${pt(add([704, 236], [6, dy]))} ${pt(add([706, 170], [6, dy * 0.3]))}`;
const FRONT_INNER_D = `M 512 177 ${cub(FRONT_INNER_L)} ${cub(FRONT_INNER_R)}`;
const BACK_INNER_D = (dy) => `M ${pt(add(BACK_INNER[0], [-4, dy]))} C ${pt(add(BACK_INNER[1], [0, dy]))} ${pt(add(BACK_INNER[2], [0, dy]))} ${pt(add(BACK_INNER[3], [4, dy]))}`;

// Neckline (back view): outer face of the back collar.
const BACK_SEAM = [[495, 176], [542, 220], [658, 220], [705, 176]];
const BACK_VIEW_COLLAR = `M ${pt(HPS)} ${cub(BACK_TOP)} L 705 176 ${cubRev(BACK_SEAM)} Z`;
const BACK_SEAM_D = (dy) => `M ${pt(add(BACK_SEAM[0], [-3, dy * 0.4]))} C ${pt(add(BACK_SEAM[1], [0, dy]))} ${pt(add(BACK_SEAM[2], [0, dy]))} ${pt(add(BACK_SEAM[3], [3, dy * 0.4]))}`;

/** Rib knit: lines across the collar band, from the outer to the inner edge (same parametrisation). */
function ribPair(outer, inner, n) {
  const dark = [];
  const light = [];
  outer.forEach((o, s) => {
    const i = inner[s];
    for (let k = 0; k < n; k++) {
      const t1 = (k + 0.25) / n;
      const t2 = (k + 0.75) / n;
      dark.push(`M${pt(bez(...o, t1))}L${pt(bez(...i, t1))}`);
      light.push(`M${pt(bez(...o, t2))}L${pt(bez(...i, t2))}`);
    }
  });
  return `<path class="rib-dark" d="${dark.join("")}"/><path class="rib-light" d="${light.join("")}"/>`;
}

/* ------------------------------------------------------------ print areas */
// Sleeve frame: origin at the shoulder point, U along the sleeve, V across it.
function sleeveArea(side) {
  const u0 = 96;
  const u1 = 211;
  const v0 = 34;
  const v1 = 172;
  const w = u1 - u0;
  const h = v1 - v0;
  let S;
  let U;
  let V;
  if (side === "viewer-left") {
    S = SP;
    U = SLEEVE_U;
    V = SLEEVE_V;
  } else {
    S = [1200 - SP[0], SP[1]];
    U = [-SLEEVE_U[0], SLEEVE_U[1]];
    V = [-SLEEVE_V[0], SLEEVE_V[1]];
  }
  const P = (u, v) => add(add(S, mul(U, u)), mul(V, v));
  // Local x always points right on screen, local y down: the artwork stays upright, tilted with the sleeve.
  let origin;
  let xAxis;
  if (side === "viewer-left") {
    origin = P(u1, v0);
    xAxis = mul(U, -1);
  } else {
    origin = P(u0, v0);
    xAxis = U;
  }
  const yAxis = V;
  const corners = [origin, add(origin, mul(xAxis, w)), add(add(origin, mul(xAxis, w)), mul(yAxis, h)), add(origin, mul(yAxis, h))];
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  return {
    w,
    h,
    corners,
    matrix: [xAxis[0], xAxis[1], yAxis[0], yAxis[1], origin[0], origin[1]].map((n) => Math.round(n * 10000) / 10000),
    rotation: Math.round((Math.atan2(xAxis[1], xAxis[0]) * 180) / Math.PI * 100) / 100,
    bbox: { x: r(Math.min(...xs)), y: r(Math.min(...ys)), width: r(Math.max(...xs) - Math.min(...xs)), height: r(Math.max(...ys) - Math.min(...ys)) },
  };
}
const rectArea = (x, y, w, h) => ({
  w,
  h,
  corners: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
  matrix: [1, 0, 0, 1, x, y],
  rotation: 0,
  bbox: { x, y, width: w, height: h },
});

// Wearer's left sleeve is on the viewer's right in a front view (industry convention).
const AREAS = {
  front: { view: "front", ...rectArea(428, 305, 345, 460) },
  back: { view: "back", ...rectArea(428, 262, 345, 460) },
  "left-sleeve": { view: "front", ...sleeveArea("viewer-right") },
  "right-sleeve": { view: "front", ...sleeveArea("viewer-left") },
};
const polygon = (a) => `M ${a.corners.map(pt).join(" L ")} Z`;
const mm = (px) => Math.round((px / PX_PER_CM) * 10);

/* ------------------------------------------------------------------ colours */
const PRESETS = {
  white: { hex: "#F4F4F1", shade: 1, highlight: 0.35, texture: 0.55 },
  black: { hex: "#1F1F22", shade: 0.9, highlight: 0.8, texture: 0.75 },
  navy: { hex: "#1E2A47", shade: 0.95, highlight: 0.85, texture: 0.7 },
  red: { hex: "#B4232D", shade: 1, highlight: 0.6, texture: 0.65 },
  "royal-blue": { hex: "#2457B0", shade: 1, highlight: 0.65, texture: 0.65 },
  grey: { hex: "#A7A9AC", shade: 1, highlight: 0.55, texture: 1 },
  beige: { hex: "#D9C8AB", shade: 1, highlight: 0.45, texture: 0.6 },
  "forest-green": { hex: "#2B4A36", shade: 0.95, highlight: 0.8, texture: 0.7 },
};
const DEFAULT = PRESETS.white;

/* ---------------------------------------------------------------- SVG parts */
const userSpace = 'filterUnits="userSpaceOnUse" x="-60" y="-60" width="1320" height="1320"';
const blur = (id, s) => `<filter id="${id}" ${userSpace} color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${s}"/></filter>`;

const css = `
.mslab-tee{--garment-color:${DEFAULT.hex};--shade-strength:${DEFAULT.shade};--highlight-strength:${DEFAULT.highlight};--texture-strength:${DEFAULT.texture};--drop-shadow-strength:1}
${Object.entries(PRESETS)
  .map(([k, p]) => `.mslab-tee[data-color="${k}"]{--garment-color:${p.hex};--shade-strength:${p.shade};--highlight-strength:${p.highlight};--texture-strength:${p.texture}}`)
  .join("\n")}
.mslab-tee .garment-fill{fill:var(--garment-color)}
.mslab-tee .layer-shading,.mslab-tee .layer-sleeves-shade{opacity:var(--shade-strength)}
.mslab-tee .layer-highlights,.mslab-tee .layer-sleeves-light{opacity:var(--highlight-strength)}
.mslab-tee .layer-texture{opacity:var(--texture-strength)}
.mslab-tee .layer-shadows{opacity:var(--drop-shadow-strength)}
.mslab-tee .view-back{display:none}
.mslab-tee[data-view="back"] .view-front{display:none}
.mslab-tee[data-view="back"] .view-back{display:inline}
.mslab-tee .print-area-guide{display:none}
.mslab-tee[data-guides="on"] .print-area-guide{display:inline}
.stitch{fill:none;stroke:#000;stroke-opacity:.34;stroke-width:1.5;stroke-dasharray:5.5 3.4;stroke-linecap:round}
.stitch-lit{fill:none;stroke:#fff;stroke-opacity:.28;stroke-width:.9;stroke-dasharray:5.5 3.4;stroke-linecap:round}
.seam{fill:none;stroke:#000;stroke-opacity:.24;stroke-width:1.6;stroke-linecap:round}
.seam-lit{fill:none;stroke:#fff;stroke-opacity:.22;stroke-width:1.1;stroke-linecap:round}
.rib-dark{fill:none;stroke:#000;stroke-opacity:.13;stroke-width:1.3}
.rib-light{fill:none;stroke:#fff;stroke-opacity:.14;stroke-width:1}
.fold{fill:none;stroke:#000;stroke-linecap:round}
.glow{fill:none;stroke:#fff;stroke-linecap:round}
`;

const defs = `
  <style>${css}</style>

  <!-- Shared shapes -->
  <path id="shape-garment" d="${SILHOUETTE}"/>
  <path id="shape-body" d="${BODY}"/>
  <path id="shape-sleeve-viewer-left" d="${SLEEVE_L}"/>
  <path id="shape-sleeve-viewer-right" d="${SLEEVE_R}"/>
  <path id="shape-neck-interior" d="${NECK_INTERIOR}"/>
  <path id="shape-front-collar" d="${FRONT_COLLAR}"/>
  <path id="shape-back-collar-inside" d="${BACK_COLLAR_INSIDE}"/>
  <path id="shape-back-collar-outside" d="${BACK_VIEW_COLLAR}"/>

  <!-- Clipping -->
  <clipPath id="clip-garment"><use href="#shape-garment"/></clipPath>
  <clipPath id="clip-body"><use href="#shape-body"/></clipPath>
  <clipPath id="clip-sleeve-viewer-left"><use href="#shape-sleeve-viewer-left"/></clipPath>
  <clipPath id="clip-sleeve-viewer-right"><use href="#shape-sleeve-viewer-right"/></clipPath>
  <clipPath id="clip-neck-interior"><use href="#shape-neck-interior"/></clipPath>
  <clipPath id="clip-front-collar"><use href="#shape-front-collar"/></clipPath>
  <clipPath id="clip-back-collar-inside"><use href="#shape-back-collar-inside"/></clipPath>
  <clipPath id="clip-back-collar-outside"><use href="#shape-back-collar-outside"/></clipPath>

  <!-- Printable areas (clip paths in garment coordinates) -->
  ${Object.entries(AREAS)
    .map(([k, a]) => `<clipPath id="print-area-${k}"><path id="print-area-${k}-shape" d="${polygon(a)}"/></clipPath>`)
    .join("\n  ")}

  <!-- Blurs -->
  ${blur("fx-blur-1", 1)}
  ${blur("fx-blur-2", 2.2)}
  ${blur("fx-blur-5", 5)}
  ${blur("fx-blur-9", 9)}
  ${blur("fx-blur-14", 14)}
  ${blur("fx-blur-24", 24)}
  ${blur("fx-blur-40", 40)}

  <!-- Cotton jersey: fine grain (dark + light flecks) -->
  <filter id="fx-cotton-grain" filterUnits="userSpaceOnUse" x="0" y="0" width="1200" height="1200" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.95 0.7" numOctaves="2" seed="17" result="noise"/>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.2 0 0 0 -1.1" result="dark"/>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 -2.2 0 0 1.08" result="light"/>
    <feMerge><feMergeNode in="dark"/><feMergeNode in="light"/></feMerge>
  </filter>
  <!-- Yarn slub: long horizontal irregularities along the knit courses -->
  <filter id="fx-cotton-slub" filterUnits="userSpaceOnUse" x="0" y="0" width="1200" height="1200" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.007 0.11" numOctaves="3" seed="5" result="noise"/>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.85" result="dark"/>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 -1.6 0 0 0.75" result="light"/>
    <feMerge><feMergeNode in="dark"/><feMergeNode in="light"/></feMerge>
  </filter>
  <!-- Knit structure (visible when zoomed in) -->
  <pattern id="pat-jersey-knit" patternUnits="userSpaceOnUse" width="3.2" height="4.2">
    <path d="M0 0 L1.6 4.2 L3.2 0" fill="none" stroke="#000" stroke-width="0.55" stroke-opacity="0.5"/>
  </pattern>
  <!-- Printed artwork follows the knit: a very small displacement -->
  <filter id="fx-print-on-fabric" filterUnits="userSpaceOnUse" x="0" y="0" width="1200" height="1200" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.009 0.014" numOctaves="1" seed="3" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>

  <!-- Shading gradients (black/white over the fabric colour: any colour keeps its relief) -->
  <linearGradient id="grad-body-horizontal" gradientUnits="userSpaceOnUse" x1="296" y1="0" x2="904" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity=".2"/>
    <stop offset=".07" stop-color="#000" stop-opacity=".1"/>
    <stop offset=".2" stop-color="#000" stop-opacity=".025"/>
    <stop offset=".4" stop-color="#000" stop-opacity="0"/>
    <stop offset=".62" stop-color="#000" stop-opacity="0"/>
    <stop offset=".8" stop-color="#000" stop-opacity=".05"/>
    <stop offset=".93" stop-color="#000" stop-opacity=".13"/>
    <stop offset="1" stop-color="#000" stop-opacity=".24"/>
  </linearGradient>
  <linearGradient id="grad-body-vertical" gradientUnits="userSpaceOnUse" x1="0" y1="170" x2="0" y2="1012">
    <stop offset="0" stop-color="#000" stop-opacity=".03"/>
    <stop offset=".12" stop-color="#000" stop-opacity="0"/>
    <stop offset=".6" stop-color="#000" stop-opacity="0"/>
    <stop offset=".9" stop-color="#000" stop-opacity=".05"/>
    <stop offset="1" stop-color="#000" stop-opacity=".1"/>
  </linearGradient>
  ${sleeveGradients()}
  <linearGradient id="grad-neck-interior" gradientUnits="userSpaceOnUse" x1="0" y1="180" x2="0" y2="248">
    <stop offset="0" stop-color="#000" stop-opacity=".62"/>
    <stop offset=".45" stop-color="#000" stop-opacity=".46"/>
    <stop offset="1" stop-color="#000" stop-opacity=".34"/>
  </linearGradient>
  <linearGradient id="grad-back-collar-inside" gradientUnits="userSpaceOnUse" x1="0" y1="172" x2="0" y2="210">
    <stop offset="0" stop-color="#000" stop-opacity=".02"/>
    <stop offset=".55" stop-color="#000" stop-opacity=".08"/>
    <stop offset="1" stop-color="#000" stop-opacity=".24"/>
  </linearGradient>
  <linearGradient id="grad-back-collar-outside" gradientUnits="userSpaceOnUse" x1="0" y1="172" x2="0" y2="210">
    <stop offset="0" stop-color="#000" stop-opacity=".1"/>
    <stop offset=".3" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".12"/>
  </linearGradient>
  <radialGradient id="rad-light-chest-left" gradientUnits="userSpaceOnUse" cx="515" cy="440" r="290" gradientTransform="translate(515 440) scale(.78 1) translate(-515 -440)">
    <stop offset="0" stop-color="#fff" stop-opacity=".2"/>
    <stop offset=".55" stop-color="#fff" stop-opacity=".07"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="rad-light-chest-right" gradientUnits="userSpaceOnUse" cx="705" cy="455" r="230" gradientTransform="translate(705 455) scale(.72 1) translate(-705 -455)">
    <stop offset="0" stop-color="#fff" stop-opacity=".1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="rad-light-lower" gradientUnits="userSpaceOnUse" cx="480" cy="790" r="230" gradientTransform="translate(480 790) scale(.65 1) translate(-480 -790)">
    <stop offset="0" stop-color="#fff" stop-opacity=".08"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="rad-light-back-left" gradientUnits="userSpaceOnUse" cx="500" cy="380" r="200" gradientTransform="translate(500 380) scale(1 1.05) translate(-500 -380)">
    <stop offset="0" stop-color="#fff" stop-opacity=".15"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="rad-light-back-right" gradientUnits="userSpaceOnUse" cx="705" cy="385" r="180">
    <stop offset="0" stop-color="#fff" stop-opacity=".08"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
`;

function sleeveGradients() {
  const out = [];
  for (const side of ["viewer-left", "viewer-right"]) {
    const S = side === "viewer-left" ? SP : [1200 - SP[0], SP[1]];
    const U = side === "viewer-left" ? SLEEVE_U : [-SLEEVE_U[0], SLEEVE_U[1]];
    const V = side === "viewer-left" ? SLEEVE_V : [-SLEEVE_V[0], SLEEVE_V[1]];
    const a = add(add(S, mul(U, 120)), mul(V, -6));
    const b = add(add(S, mul(U, 120)), mul(V, 214));
    const along = (id) => `id="${id}" gradientUnits="userSpaceOnUse" x1="${r(a[0])}" y1="${r(a[1])}" x2="${r(b[0])}" y2="${r(b[1])}"`;
    out.push(`<linearGradient ${along(`grad-sleeve-shade-${side}`)}>
    <stop offset="0" stop-color="#000" stop-opacity=".16"/>
    <stop offset=".07" stop-color="#000" stop-opacity="0"/>
    <stop offset=".5" stop-color="#000" stop-opacity="0"/>
    <stop offset=".82" stop-color="#000" stop-opacity=".12"/>
    <stop offset="1" stop-color="#000" stop-opacity=".26"/>
  </linearGradient>`);
    out.push(`<linearGradient ${along(`grad-sleeve-light-${side}`)}>
    <stop offset="0" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".08" stop-color="#fff" stop-opacity="${side === "viewer-left" ? ".26" : ".18"}"/>
    <stop offset=".24" stop-color="#fff" stop-opacity=".1"/>
    <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>`);
    // Along the sleeve: the cap near the armhole is fuller, the cuff flatter.
    const c = add(S, mul(V, 100));
    const e = add(add(S, mul(U, 245)), mul(V, 100));
    out.push(`<linearGradient id="grad-sleeve-length-${side}" gradientUnits="userSpaceOnUse" x1="${r(c[0])}" y1="${r(c[1])}" x2="${r(e[0])}" y2="${r(e[1])}">
    <stop offset="0" stop-color="#000" stop-opacity=".1"/>
    <stop offset=".22" stop-color="#000" stop-opacity="0"/>
    <stop offset=".86" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".07"/>
  </linearGradient>`);
  }
  return out.join("\n  ");
}

/* ------------------------------------------------------------- layer bodies */
const garmentFill = (cls = "") => `<use href="#shape-garment" class="garment-fill ${cls}" fill="${DEFAULT.hex}"/>`;

function dropShadow(prefix) {
  return `<g id="${prefix}shadows" class="layer-shadows">
      <g filter="url(#fx-blur-24)"><use href="#shape-garment" fill="#000" fill-opacity=".16" transform="translate(5 16)"/></g>
      <g filter="url(#fx-blur-5)"><use href="#shape-garment" fill="#000" fill-opacity=".12" transform="translate(1 4)"/></g>
    </g>`;
}

function garmentBase(prefix) {
  return `<g id="${prefix}garment-base">
      ${garmentFill()}
    </g>`;
}

function artworkSlots(prefix, keys) {
  return `<g id="${prefix}printable-areas" data-role="artwork-slots">
      ${keys
        .map((k) => {
          const a = AREAS[k];
          return `<g id="slot-${k}" class="print-slot" clip-path="url(#print-area-${k})" filter="url(#fx-print-on-fabric)" data-print-area="${k}" data-width="${a.w}" data-height="${a.h}">
        <g id="artwork-${k}" class="artwork-layer" transform="matrix(${a.matrix.join(" ")})" data-local-width="${a.w}" data-local-height="${a.h}"><!-- customer artwork: local box 0 0 ${a.w} ${a.h} --></g>
      </g>`;
        })
        .join("\n      ")}
    </g>`;
}

function texture(prefix) {
  return `<g id="${prefix}fabric-texture" class="layer-texture" clip-path="url(#clip-garment)">
      <rect width="1200" height="1200" filter="url(#fx-cotton-grain)" opacity=".22"/>
      <rect width="1200" height="1200" filter="url(#fx-cotton-slub)" opacity=".055"/>
      <rect width="1200" height="1200" fill="url(#pat-jersey-knit)" opacity=".03"/>
    </g>`;
}

const armL = d(armholeTokens);
const armR = d(armholeTokens, MJ);

function frontShading() {
  return `<g id="fabric-shading" class="layer-shading">
      <g clip-path="url(#clip-body)">
        <rect x="250" y="150" width="700" height="900" fill="url(#grad-body-horizontal)"/>
        <rect x="250" y="150" width="700" height="900" fill="url(#grad-body-vertical)"/>
      </g>
      <g clip-path="url(#clip-garment)">
        <!-- edge falloff: the fabric turns away from the light at the silhouette -->
        <g filter="url(#fx-blur-9)"><use href="#shape-garment" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="16"/></g>
        <!-- collar cast shadow -->
        <g filter="url(#fx-blur-5)"><path class="fold" d="${FRONT_OUTER_D(9)}" stroke-opacity=".17" stroke-width="12"/></g>
        <!-- sleeves cast onto the body along the armholes -->
        <g clip-path="url(#clip-body)" filter="url(#fx-blur-9)">
          <path class="fold" d="${armL}" stroke-opacity=".2" stroke-width="22"/>
          <path class="fold" d="${armR}" stroke-opacity=".17" stroke-width="20"/>
        </g>
        <!-- underarm depth -->
        <g filter="url(#fx-blur-9)">
          <ellipse cx="309" cy="462" rx="34" ry="19" transform="rotate(-32 309 462)" fill="#000" fill-opacity=".3"/>
          <ellipse cx="892" cy="461" rx="31" ry="18" transform="rotate(30 892 461)" fill="#000" fill-opacity=".26"/>
        </g>
        <!-- drag folds from the underarms -->
        <g filter="url(#fx-blur-5)">
          <path class="fold" d="M 312 478 C 346 506 382 528 432 548" stroke-opacity=".12" stroke-width="13"/>
          <path class="fold" d="M 315 522 C 338 560 362 598 388 636" stroke-opacity=".07" stroke-width="12"/>
          <path class="fold" d="M 887 482 C 853 510 821 536 776 559" stroke-opacity=".11" stroke-width="13"/>
          <path class="fold" d="M 884 534 C 864 572 848 606 834 648" stroke-opacity=".06" stroke-width="12"/>
        </g>
        <!-- long body folds -->
        <g filter="url(#fx-blur-14)">
          <path class="fold" d="M 372 700 C 382 800 388 900 381 1000" stroke-opacity=".11" stroke-width="24"/>
          <path class="fold" d="M 640 790 C 655 866 668 934 688 1006" stroke-opacity=".08" stroke-width="28"/>
          <path class="fold" d="M 836 610 C 830 720 836 860 852 1000" stroke-opacity=".1" stroke-width="22"/>
          <path class="fold" d="M 520 560 C 528 610 532 650 530 700" stroke-opacity=".03" stroke-width="30"/>
        </g>
        <!-- hem: ripples, turned-up band and fabric thickness -->
        <g filter="url(#fx-blur-5)">
          <ellipse cx="442" cy="992" rx="9" ry="24" fill="#000" fill-opacity=".09" transform="rotate(-6 442 992)"/>
          <ellipse cx="573" cy="996" rx="8" ry="20" fill="#000" fill-opacity=".06"/>
          <ellipse cx="748" cy="993" rx="9" ry="23" fill="#000" fill-opacity=".08" transform="rotate(5 748 993)"/>
          <ellipse cx="861" cy="990" rx="8" ry="22" fill="#000" fill-opacity=".07" transform="rotate(-4 861 990)"/>
        </g>
        <g filter="url(#fx-blur-2)">
          <path class="fold" d="${d(hemTokens(-28))}" stroke-opacity=".12" stroke-width="4"/>
        </g>
        <path class="fold" d="${d(hemTokens(0))}" stroke-opacity=".3" stroke-width="3.5"/>
      </g>
    </g>`;
}

function backShading() {
  return `<g id="back-fabric-shading" class="layer-shading">
      <g clip-path="url(#clip-body)">
        <rect x="250" y="150" width="700" height="900" fill="url(#grad-body-horizontal)"/>
        <rect x="250" y="150" width="700" height="900" fill="url(#grad-body-vertical)"/>
      </g>
      <g clip-path="url(#clip-garment)">
        <g filter="url(#fx-blur-9)"><use href="#shape-garment" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="16"/></g>
        <g filter="url(#fx-blur-5)"><path class="fold" d="${BACK_SEAM_D(8)}" stroke-opacity=".13" stroke-width="10"/></g>
        <g clip-path="url(#clip-body)" filter="url(#fx-blur-9)">
          <path class="fold" d="${armL}" stroke-opacity=".18" stroke-width="20"/>
          <path class="fold" d="${armR}" stroke-opacity=".18" stroke-width="20"/>
        </g>
        <g filter="url(#fx-blur-9)">
          <ellipse cx="309" cy="462" rx="32" ry="18" transform="rotate(-32 309 462)" fill="#000" fill-opacity=".26"/>
          <ellipse cx="892" cy="461" rx="33" ry="19" transform="rotate(30 892 461)" fill="#000" fill-opacity=".28"/>
        </g>
        <!-- centre back valley and lower-back folds -->
        <g filter="url(#fx-blur-24)">
          <path class="fold" d="M 601 280 C 603 460 597 660 600 1000" stroke-opacity=".045" stroke-width="54"/>
        </g>
        <g filter="url(#fx-blur-5)">
          <path class="fold" d="M 313 482 C 343 512 372 534 414 556" stroke-opacity=".09" stroke-width="12"/>
          <path class="fold" d="M 887 486 C 856 514 828 538 790 556" stroke-opacity=".1" stroke-width="12"/>
        </g>
        <g filter="url(#fx-blur-14)">
          <path class="fold" d="M 420 720 C 430 830 425 930 418 1004" stroke-opacity=".07" stroke-width="24"/>
          <path class="fold" d="M 762 680 C 754 790 762 900 780 1004" stroke-opacity=".07" stroke-width="24"/>
          <path class="fold" d="M 352 600 C 356 700 350 820 344 940" stroke-opacity=".05" stroke-width="20"/>
        </g>
        <g filter="url(#fx-blur-5)">
          <ellipse cx="512" cy="994" rx="8" ry="21" fill="#000" fill-opacity=".07"/>
          <ellipse cx="676" cy="993" rx="9" ry="23" fill="#000" fill-opacity=".08" transform="rotate(4 676 993)"/>
          <ellipse cx="842" cy="991" rx="8" ry="20" fill="#000" fill-opacity=".06"/>
        </g>
        <g filter="url(#fx-blur-2)">
          <path class="fold" d="${d(hemTokens(-28))}" stroke-opacity=".12" stroke-width="4"/>
        </g>
        <path class="fold" d="${d(hemTokens(0))}" stroke-opacity=".3" stroke-width="3.5"/>
      </g>
    </g>`;
}

function sleeves(prefix, variant) {
  const cuffL = (o) => d(cuffTokens(o));
  const cuffR = (o) => d(cuffTokens(o), MJ);
  const wrinklesL =
    variant === "front"
      ? `<path class="fold" d="M 270 452 C 254 420 242 390 238 352" stroke-opacity=".08" stroke-width="13"/>
          <path class="fold" d="M 214 318 C 200 356 190 392 186 430" stroke-opacity=".05" stroke-width="16"/>`
      : `<path class="fold" d="M 262 456 C 250 428 236 398 226 366" stroke-opacity=".08" stroke-width="13"/>`;
  const wrinklesR =
    variant === "front"
      ? `<path class="fold" d="M 930 446 C 950 410 968 382 990 360" stroke-opacity=".08" stroke-width="12"/>
          <path class="fold" d="M 1000 296 C 1008 336 1016 374 1020 414" stroke-opacity=".045" stroke-width="16"/>`
      : `<path class="fold" d="M 936 450 C 952 420 966 392 980 362" stroke-opacity=".08" stroke-width="13"/>
          <path class="fold" d="M 990 300 C 998 340 1006 378 1012 418" stroke-opacity=".05" stroke-width="16"/>`;
  const glowL =
    variant === "front"
      ? `<path class="glow" d="M 283 446 C 266 416 255 388 251 352" stroke-opacity=".1" stroke-width="9"/>`
      : `<path class="glow" d="M 276 450 C 263 422 250 394 240 362" stroke-opacity=".09" stroke-width="9"/>`;
  const glowR =
    variant === "front"
      ? `<path class="glow" d="M 944 452 C 962 418 980 392 1002 372" stroke-opacity=".08" stroke-width="9"/>`
      : `<path class="glow" d="M 950 456 C 966 426 980 398 994 370" stroke-opacity=".08" stroke-width="9"/>`;

  return `<g id="${prefix}sleeves">
      <g class="layer-sleeves-shade">
        <use href="#shape-sleeve-viewer-left" fill="url(#grad-sleeve-shade-viewer-left)"/>
        <use href="#shape-sleeve-viewer-right" fill="url(#grad-sleeve-shade-viewer-right)"/>
        <use href="#shape-sleeve-viewer-left" fill="url(#grad-sleeve-length-viewer-left)"/>
        <use href="#shape-sleeve-viewer-right" fill="url(#grad-sleeve-length-viewer-right)"/>
        <g clip-path="url(#clip-sleeve-viewer-left)">
          <g filter="url(#fx-blur-5)">${wrinklesL}</g>
          <g filter="url(#fx-blur-2)"><path class="fold" d="${cuffL(27)}" stroke-opacity=".13" stroke-width="4"/></g>
          <path class="fold" d="${cuffL(0)}" stroke-opacity=".3" stroke-width="3.5"/>
        </g>
        <g clip-path="url(#clip-sleeve-viewer-right)">
          <g filter="url(#fx-blur-5)">${wrinklesR}</g>
          <g filter="url(#fx-blur-2)"><path class="fold" d="${cuffR(27)}" stroke-opacity=".13" stroke-width="4"/></g>
          <path class="fold" d="${cuffR(0)}" stroke-opacity=".3" stroke-width="3.5"/>
        </g>
      </g>
      <g class="layer-sleeves-light">
        <use href="#shape-sleeve-viewer-left" fill="url(#grad-sleeve-light-viewer-left)"/>
        <use href="#shape-sleeve-viewer-right" fill="url(#grad-sleeve-light-viewer-right)"/>
        <g clip-path="url(#clip-sleeve-viewer-left)">
          <g filter="url(#fx-blur-5)">${glowL}</g>
          <g filter="url(#fx-blur-2)"><path class="glow" d="${cuffL(9)}" stroke-opacity=".16" stroke-width="7"/></g>
          <!-- the sleeve cap is fuller just beside the armhole seam -->
          <g filter="url(#fx-blur-5)"><path class="glow" d="${d(shift(armholeTokens, [-9, 2]))}" stroke-opacity=".13" stroke-width="10"/></g>
        </g>
        <g clip-path="url(#clip-sleeve-viewer-right)">
          <g filter="url(#fx-blur-5)">${glowR}</g>
          <g filter="url(#fx-blur-2)"><path class="glow" d="${cuffR(9)}" stroke-opacity=".14" stroke-width="7"/></g>
          <g filter="url(#fx-blur-5)"><path class="glow" d="${d(shift(armholeTokens, [-9, 2]), MJ)}" stroke-opacity=".1" stroke-width="10"/></g>
        </g>
      </g>
    </g>`;
}

function seams(prefix) {
  const lines = (T) => `
        <path class="seam" d="${d(armholeTokens, T)}"/>
        <path class="seam-lit" d="${d(shift(armholeTokens, [-1.6, 0.4]), T)}"/>
        <path class="seam" d="${d(shift(shoulderTokens, [0, 4]), T)}" stroke-opacity=".12"/>
        <path class="seam" d="${d(sideTokens, T)}" stroke-opacity=".1"/>`;
  return `<g id="${prefix}seams" clip-path="url(#clip-garment)">${lines(ID)}${lines(MJ)}
    </g>`;
}

function stitchPair(dStr) {
  return `<path class="stitch" d="${dStr}"/><path class="stitch-lit" d="${dStr}" transform="translate(-.6 -.9)"/>`;
}

function stitching(prefix, variant) {
  const neck =
    variant === "front"
      ? `${stitchPair(FRONT_OUTER_D(7))}`
      : `${stitchPair(BACK_SEAM_D(7))}${stitchPair(BACK_SEAM_D(13))}`;
  return `<g id="${prefix}stitching">
      <g clip-path="url(#clip-garment)">
        ${stitchPair(d(hemTokens(-15)))}
        ${stitchPair(d(hemTokens(-22)))}
        ${neck}
      </g>
      <g clip-path="url(#clip-sleeve-viewer-left)">
        ${stitchPair(d(cuffTokens(15)))}
        ${stitchPair(d(cuffTokens(22)))}
      </g>
      <g clip-path="url(#clip-sleeve-viewer-right)">
        ${stitchPair(d(cuffTokens(15), MJ))}
        ${stitchPair(d(cuffTokens(22), MJ))}
      </g>
    </g>`;
}

function frontNeckline() {
  return `<g id="neckline">
      <!-- inside of the garment, seen through the neck opening -->
      <use href="#shape-neck-interior" class="garment-fill" fill="${DEFAULT.hex}"/>
      <use href="#shape-neck-interior" fill="url(#grad-neck-interior)"/>
      <g clip-path="url(#clip-neck-interior)">
        <!-- shoulder-to-shoulder neck tape -->
        <path d="${BACK_INNER_D(3)} L 700 196 L 500 196 Z" fill="none"/>
        <path class="fold" d="${BACK_INNER_D(10)}" stroke-opacity=".1" stroke-width="13"/>
        ${stitchPair(BACK_INNER_D(5))}
        ${stitchPair(BACK_INNER_D(15))}
        <g filter="url(#fx-blur-2)"><path class="fold" d="${FRONT_INNER_D}" stroke-opacity=".35" stroke-width="5"/></g>
      </g>
      <!-- inside face of the back collar -->
      <use href="#shape-back-collar-inside" class="garment-fill" fill="${DEFAULT.hex}"/>
      <use href="#shape-back-collar-inside" fill="url(#grad-back-collar-inside)"/>
      <g clip-path="url(#clip-back-collar-inside)">
        ${ribPair([BACK_TOP], [BACK_INNER], 46)}
        <path class="glow" d="M ${pt(BACK_TOP[0])} ${cub(BACK_TOP)}" stroke-opacity=".3" stroke-width="2.2"/>
      </g>
      <!-- front rib collar -->
      <use href="#shape-front-collar" class="garment-fill" fill="${DEFAULT.hex}"/>
      <g clip-path="url(#clip-front-collar)">
        ${ribPair([FRONT_OUTER_L, FRONT_OUTER_R], [FRONT_INNER_L, FRONT_INNER_R], 34)}
        <g class="layer-shading"><g filter="url(#fx-blur-2)"><path class="fold" d="M ${pt(HPS)} ${cub(FRONT_OUTER_L)} ${cub(FRONT_OUTER_R)}" stroke-opacity=".2" stroke-width="6"/></g></g>
        <g class="layer-highlights"><g filter="url(#fx-blur-1)"><path class="glow" d="${FRONT_INNER_D}" stroke-opacity=".5" stroke-width="4"/></g></g>
      </g>
      <path class="seam" d="M ${pt(HPS)} ${cub(FRONT_OUTER_L)} ${cub(FRONT_OUTER_R)}" stroke-opacity=".26"/>
      <path class="fold" d="${FRONT_INNER_D}" stroke-opacity=".28" stroke-width="1.2"/>
    </g>`;
}

function backNeckline() {
  return `<g id="back-neckline">
      <use href="#shape-back-collar-outside" class="garment-fill" fill="${DEFAULT.hex}"/>
      <use href="#shape-back-collar-outside" fill="url(#grad-back-collar-outside)"/>
      <g clip-path="url(#clip-back-collar-outside)">
        ${ribPair([BACK_TOP], [BACK_SEAM], 48)}
        <g class="layer-highlights"><g filter="url(#fx-blur-1)"><path class="glow" d="M ${pt(add(HPS, [0, 3]))} C 545 195 655 195 706 173" stroke-opacity=".45" stroke-width="3.5"/></g></g>
      </g>
      <path class="seam" d="M ${pt(BACK_SEAM[0])} ${cub(BACK_SEAM)}" stroke-opacity=".26"/>
    </g>`;
}

function highlights(prefix, variant) {
  const shoulderGlow = (T, o) => `<path class="glow" d="${d(shift(shoulderTokens, [0, 12]), T)}" stroke-opacity="${o}" stroke-width="18"/>`;
  const front =
    variant === "front"
      ? `<g clip-path="url(#clip-body)">
          <rect x="250" y="150" width="700" height="900" fill="url(#rad-light-chest-left)"/>
          <rect x="250" y="150" width="700" height="900" fill="url(#rad-light-chest-right)"/>
          <rect x="250" y="150" width="700" height="900" fill="url(#rad-light-lower)"/>
        </g>
        <g filter="url(#fx-blur-5)">
          <path class="glow" d="M 320 464 C 354 490 390 510 440 530" stroke-opacity=".13" stroke-width="9"/>
          <path class="glow" d="M 880 466 C 850 492 818 516 772 540" stroke-opacity=".09" stroke-width="9"/>
        </g>
        <g filter="url(#fx-blur-9)">
          <path class="glow" d="M 396 690 C 408 800 412 900 405 1000" stroke-opacity=".11" stroke-width="14"/>
          <path class="glow" d="M 662 784 C 676 862 688 930 708 1004" stroke-opacity=".07" stroke-width="16"/>
          <path class="glow" d="M 816 616 C 810 720 815 860 830 1000" stroke-opacity=".06" stroke-width="12"/>
        </g>
        <g filter="url(#fx-blur-2)">
          <ellipse cx="457" cy="990" rx="5" ry="18" fill="#fff" fill-opacity=".14"/>
          <ellipse cx="763" cy="991" rx="5" ry="18" fill="#fff" fill-opacity=".1"/>
        </g>`
      : `<g clip-path="url(#clip-body)">
          <rect x="250" y="150" width="700" height="900" fill="url(#rad-light-back-left)"/>
          <rect x="250" y="150" width="700" height="900" fill="url(#rad-light-back-right)"/>
          <rect x="250" y="150" width="700" height="900" fill="url(#rad-light-lower)"/>
        </g>
        <g filter="url(#fx-blur-9)">
          <path class="glow" d="M 442 716 C 452 826 447 926 440 1004" stroke-opacity=".09" stroke-width="14"/>
          <path class="glow" d="M 740 684 C 732 790 740 900 758 1004" stroke-opacity=".07" stroke-width="14"/>
        </g>`;
  return `<g id="${prefix}highlights" class="layer-highlights">
      <g clip-path="url(#clip-garment)">
        ${front}
        <g filter="url(#fx-blur-9)">
          ${shoulderGlow(ID, ".2")}
          ${shoulderGlow(MJ, ".12")}
          <path class="glow" d="${d(leftEdgeTokens)}" stroke-opacity=".08" stroke-width="7" transform="translate(9 0)"/>
        </g>
        <g filter="url(#fx-blur-2)">
          <path class="glow" d="${d(hemTokens(-8))}" stroke-opacity=".14" stroke-width="5"/>
        </g>
      </g>
    </g>`;
}

function guides(prefix, keys) {
  return `<g id="${prefix}print-area-guides" class="print-area-guide" pointer-events="none">
      ${keys
        .map((k) => `<use href="#print-area-${k}-shape" fill="#2F6BFF" fill-opacity=".08" stroke="#2F6BFF" stroke-width="2" stroke-dasharray="8 6" vector-effect="non-scaling-stroke"/>`)
        .join("\n      ")}
    </g>`;
}

/* ----------------------------------------------------------------- metadata */
const meta = {
  schema: "mslab.mockup/1",
  product: "tshirt",
  name: "Regular-fit crew-neck T-shirt",
  viewBox: [0, 0, 1200, 1200],
  pxPerCm: PX_PER_CM,
  views: ["front", "back"],
  colorVariable: "--garment-color",
  colorPresets: Object.fromEntries(Object.entries(PRESETS).map(([k, p]) => [k, p.hex])),
  sleeveConvention: "left/right = the wearer's left/right (wearer's left sleeve is on the viewer's right in the front view)",
  printAreas: Object.fromEntries(
    Object.entries(AREAS).map(([k, a]) => [
      k,
      {
        view: a.view,
        clipPath: `print-area-${k}`,
        artworkGroup: `artwork-${k}`,
        width: a.w,
        height: a.h,
        sizeMm: { width: mm(a.w), height: mm(a.h) },
        rotationDeg: a.rotation,
        transform: a.matrix,
        corners: a.corners.map((c) => [r(c[0]), r(c[1])]),
        bbox: a.bbox,
      },
    ]),
  ),
};

/* --------------------------------------------------------------------- SVG */
const FRONT_KEYS = ["front", "left-sleeve", "right-sleeve"];
// Layers below the artwork ("under") and above it ("over"), per view.
const PARTS = {
  front: {
    under: () => [dropShadow(""), garmentBase("")],
    over: () => [frontShading(), sleeves("", "front"), texture(""), seams(""), stitching("", "front"), frontNeckline(), highlights("", "front")],
  },
  back: {
    under: () => [dropShadow("back-"), garmentBase("back-")],
    over: () => [backShading(), sleeves("back-", "back"), texture("back-"), seams("back-"), stitching("back-", "back"), backNeckline(), highlights("back-", "back")],
  },
};
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  MSLAB Studio · T-shirt mockup template (regular-fit crew neck) · generated by scripts/build-tshirt-mockup.mjs
  Root attributes:  data-view="front|back"   data-color="white|black|navy|red|royal-blue|grey|beige|forest-green"
                    data-guides="on" shows the printable areas.
  Custom colour: set the CSS custom property "garment-color" (written with two leading hyphens)
                 on the root element; see the documentation.
  Artwork goes into #artwork-front, #artwork-back, #artwork-left-sleeve, #artwork-right-sleeve
  (local coordinates 0..width × 0..height; they are already clipped and lit by the garment).
  Documentation: docs/TSHIRT_SVG_MOCKUP.md
-->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"
     id="mslab-tshirt" class="mslab-tee" viewBox="0 0 1200 1200" width="1200" height="1200"
     data-view="front" data-color="white" role="img" aria-labelledby="mslab-tshirt-title">
  <title id="mslab-tshirt-title">Blank crew-neck T-shirt</title>
  <desc>Vector mockup of a regular-fit crew-neck cotton T-shirt, front and back views, with printable areas for the front, back and both sleeves.</desc>
  <metadata id="mslab-mockup-meta">${JSON.stringify(meta)}</metadata>
  <defs>${defs}
  </defs>

  <g id="view-front" class="view-front" data-view-key="front">
    ${PARTS.front.under().join("\n    ")}
    ${artworkSlots("", FRONT_KEYS)}
    ${PARTS.front.over().join("\n    ")}
    ${guides("", FRONT_KEYS)}
  </g>

  <g id="view-back" class="view-back" data-view-key="back" display="none">
    ${PARTS.back.under().join("\n    ")}
    ${artworkSlots("back-", ["back"])}
    ${PARTS.back.over().join("\n    ")}
    ${guides("back-", ["back"])}
  </g>
</svg>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`wrote ${OUT} (${(svg.length / 1024).toFixed(1)} KB)`);

/* ------------------------------------------------- Studio modules (website) */
// 1. Print areas per Studio side (pure data, also used on the server).
const STUDIO_SIDES = [
  { key: "front", area: "front", crop: { x: 60, y: 110, w: 1080, h: 960 } },
  { key: "back", area: "back", crop: { x: 60, y: 110, w: 1080, h: 960 } },
  // wearer's left sleeve = viewer's right in the front view
  { key: "left_sleeve", area: "left-sleeve", crop: { x: 660, y: 120, w: 540, h: 480 } },
  { key: "right_sleeve", area: "right-sleeve", crop: { x: 0, y: 120, w: 540, h: 480 } },
];
const round4 = (n) => Math.round(n * 10000) / 10000;
const sides = STUDIO_SIDES.map((s) => {
  const a = AREAS[s.area];
  const [, , , , ox, oy] = a.matrix;
  return {
    key: s.key,
    scene: a.view,
    area: { x: round4(ox), y: round4(oy), w: a.w, h: a.h },
    ...(a.rotation ? { transform: `rotate(${a.rotation} ${round4(ox)} ${round4(oy)})` } : {}),
    crop: s.crop,
  };
});
const BANNER = "// Generated by scripts/build-tshirt-mockup.mjs from public/mockups/svg/tshirt.svg. Do not edit by hand.\n";
const areasModule = `${BANNER}/** Printable sides of MSLAB's vector T-shirt template, in the template's 1200 × 1200 space. */
export const TSHIRT_TEMPLATE = ${JSON.stringify({ w: 1200, h: 1200, sides }, null, 2)} as const;
`;
writeFileSync(resolve(ROOT, "src/features/print-on-demand/tshirt-template.generated.ts"), areasModule);

// 2. Garment layers as standalone SVG documents (drawn as images under and over the artwork).
const STYLE_TOKEN = "__GARMENT_STYLE__";
const underDefs = `<style>${css}</style><path id="shape-garment" d="${SILHOUETTE}"/>${blur("fx-blur-5", 5)}${blur("fx-blur-24", 24)}`;
const doc = (body, d) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200" class="mslab-tee" style="${STYLE_TOKEN}"><defs>${d}</defs>${body.join("")}</svg>`
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n\s*/g, "\n");
const layers = {
  front: { under: doc(PARTS.front.under(), underDefs), over: doc(PARTS.front.over(), defs) },
  back: { under: doc(PARTS.back.under(), underDefs), over: doc(PARTS.back.over(), defs) },
};
const layersModule = `${BANNER}/** The T-shirt template split around the artwork: "under" (shadow + fabric colour) and "over" (lighting, texture, seams, collar). */
export const GARMENT_STYLE_TOKEN = ${JSON.stringify(STYLE_TOKEN)};

export const TSHIRT_LAYERS = ${JSON.stringify(layers, null, 2)} as const;
`;
mkdirSync(resolve(ROOT, "src/components/print-on-demand/garment"), { recursive: true });
writeFileSync(resolve(ROOT, "src/components/print-on-demand/garment/tshirt-layers.generated.ts"), layersModule);
console.log(`studio modules written (layers ${(layersModule.length / 1024).toFixed(1)} KB)`);
console.log(JSON.stringify(sides, null, 1));
