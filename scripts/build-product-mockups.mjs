/**
 * Builds MSLAB's vector mockup templates for the non-garment products (and the hoodie):
 * public/mockups/svg/<product>.svg + the Studio modules
 *   src/features/print-on-demand/product-templates.generated.ts   (print areas, pure data)
 *   src/components/print-on-demand/garment/product-layers.generated.ts (under/over layers)
 *
 *   node scripts/build-product-mockups.mjs
 *
 * Same architecture as the T-shirt (scripts/build-tshirt-mockup.mjs, docs/TSHIRT_SVG_MOCKUP.md):
 * "under" = shadow + product colour, artwork, "over" = black/white lighting, texture, details.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200;
const H = 900;

/* ----------------------------------------------------------------- shared */
const blurF = (id, s) =>
  `<filter id="${id}" filterUnits="userSpaceOnUse" x="-100" y="-100" width="1400" height="1100" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${s}"/></filter>`;
const grainF = (id, freq, seed, k = 2.2) =>
  `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${k} 0 0 0 ${-k / 2}" result="d"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 ${-k} 0 0 ${k / 2 - 0.02}" result="l"/><feMerge><feMergeNode in="d"/><feMergeNode in="l"/></feMerge></filter>`;

const CSS = (hex) => `
.mslab-mockup{--garment-color:${hex};--shade-strength:1;--highlight-strength:.5;--texture-strength:.6;--drop-shadow-strength:1}
.mslab-mockup .garment-fill{fill:var(--garment-color)}
.mslab-mockup .garment-stroke{stroke:var(--garment-color)}
.mslab-mockup .layer-shading{opacity:var(--shade-strength)}
.mslab-mockup .layer-highlights{opacity:var(--highlight-strength)}
.mslab-mockup .layer-texture{opacity:var(--texture-strength)}
.mslab-mockup .layer-shadows{opacity:var(--drop-shadow-strength)}
.stitch{fill:none;stroke:#000;stroke-opacity:.32;stroke-width:1.5;stroke-dasharray:5.5 3.4;stroke-linecap:round}
.seam{fill:none;stroke:#000;stroke-opacity:.22;stroke-width:1.6;stroke-linecap:round}
.fold{fill:none;stroke:#000;stroke-linecap:round}
.glow{fill:none;stroke:#fff;stroke-linecap:round}`;

const COMMON_FILTERS = [
  blurF("fx-blur-2", 2),
  blurF("fx-blur-5", 5),
  blurF("fx-blur-9", 9),
  blurF("fx-blur-14", 14),
  blurF("fx-blur-24", 24),
  grainF("fx-grain-cotton", "0.95 0.7", 17),
  grainF("fx-grain-paper", "1.15 1.15", 9, 1.8),
  grainF("fx-grain-weft", "0.9 0.1", 4, 2.6),
  grainF("fx-grain-warp", "0.1 0.9", 6, 2.6),
  grainF("fx-grain-fibre", "0.03 0.5", 12, 2.4),
  grainF("fx-mottle", "0.012 0.016", 21, 1.6),
].join("");

const fill = (d, extra = "") => `<path d="${d}" class="garment-fill" fill="#FFFFFF"${extra}/>`;
const shadeG = (blur, body) => `<g filter="url(#fx-blur-${blur})">${body}</g>`;
const fold = (d, o, w) => `<path class="fold" d="${d}" stroke-opacity="${o}" stroke-width="${w}"/>`;
const glow = (d, o, w) => `<path class="glow" d="${d}" stroke-opacity="${o}" stroke-width="${w}"/>`;
const lin = (id, x1, y1, x2, y2, stops) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join("")}</linearGradient>`;
const rad = (id, cx, cy, r, stops, sx = 1, sy = 1) =>
  `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}" gradientTransform="translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})">${stops
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join("")}</radialGradient>`;
const texture = (layers) =>
  `<g class="layer-texture" clip-path="url(#clip-product)">${layers.map(([f, o]) => `<rect width="${W}" height="${H}" filter="url(#${f})" opacity="${o}"/>`).join("")}</g>`;
const dropShadow = (shape, dy = 14, o = 0.16) =>
  `<g class="layer-shadows"><g filter="url(#fx-blur-24)"><use href="#${shape}" fill="#000" fill-opacity="${o}" transform="translate(4 ${dy})"/></g><g filter="url(#fx-blur-5)"><use href="#${shape}" fill="#000" fill-opacity=".1" transform="translate(1 3)"/></g></g>`;
const floor = (cx, cy, rx, ry, o = 0.22) =>
  `<g class="layer-shadows" filter="url(#fx-blur-14)"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="${o}"/></g>`;

/** Mirror a left-half chain (c1, c2, end) to a closed symmetric outline around x = 600. */
function mirrored(start, chain, top) {
  const m = (p) => [W - p[0], p[1]];
  const P = (p) => `${p[0]} ${p[1]}`;
  let d = `M ${P(start)} ` + chain.map(([a, b, e]) => `C ${P(a)} ${P(b)} ${P(e)}`).join(" ");
  const pts = [start, ...chain.map((s) => s[2])];
  for (let i = chain.length - 1; i >= 0; i--) d += ` C ${P(m(chain[i][1]))} ${P(m(chain[i][0]))} ${P(m(pts[i]))}`;
  return `${d} ${top} Z`;
}
const mirrorD = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${W - Number(x)} ${y}`);

/* --------------------------------------------------------------- products */
const P = {};

/* Hoodie: front, hood down, kangaroo pocket. */
{
  const body = mirrored(
    [520, 205],
    [
      [[470, 210], [430, 220], [395, 236]],
      [[340, 330], [285, 560], [262, 738]],
      [[258, 760], [253, 785], [251, 802]],
      [[280, 812], [312, 815], [340, 812]],
      [[341, 795], [341, 770], [343, 748]],
      [[360, 620], [385, 470], [403, 398]],
      [[402, 500], [398, 680], [398, 782]],
      [[399, 800], [400, 825], [401, 846]],
      [[470, 849], [540, 850], [600, 850]],
    ],
    "Q 600 300 520 205",
  );
  const hood = "M 474 238 C 448 150 512 92 600 90 C 688 92 752 150 726 238 Z";
  const lining = "M 516 214 C 510 146 558 118 600 118 C 642 118 690 146 684 214 Q 640 268 600 272 Q 560 268 516 214 Z";
  const sleeveL = "M 395 236 C 340 330 285 560 262 738 C 258 760 253 785 251 802 C 280 812 312 815 340 812 C 341 795 341 770 343 748 C 360 620 385 470 403 398 C 405 330 400 280 395 236 Z";
  const cuffL = "M 255 768 Q 300 778 342 772";
  const ribs = (x1, x2, y1, y2, step) => {
    let s = "";
    for (let x = x1; x <= x2; x += step) s += `M${x} ${y1}L${x + 1} ${y2}`;
    return `<path d="${s}" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="1.4"/>`;
  };
  P.hoodie = {
    color: "#0E1A2B",
    defs: `<path id="shape-product" d="${body}"/><path id="shape-hood" d="${hood}"/>
      <clipPath id="clip-product"><use href="#shape-product"/><use href="#shape-hood"/></clipPath>
      <clipPath id="clip-body"><use href="#shape-product"/></clipPath>
      ${lin("g-h", 400, 0, 800, 0, [[0, "#000", 0.2], [0.18, "#000", 0.04], [0.45, "#000", 0], [0.7, "#000", 0.02], [0.9, "#000", 0.1], [1, "#000", 0.22]])}
      ${lin("g-v", 0, 200, 0, 850, [[0, "#000", 0.02], [0.6, "#000", 0], [1, "#000", 0.1]])}
      ${lin("g-sl", 250, 0, 405, 0, [[0, "#000", 0.24], [0.3, "#000", 0], [0.75, "#000", 0.05], [1, "#000", 0.24]])}
      ${lin("g-sr", 950, 0, 795, 0, [[0, "#000", 0.26], [0.3, "#000", 0], [0.75, "#000", 0.05], [1, "#000", 0.22]])}
      ${rad("r-chest", 540, 420, 260, [[0, "#fff", 0.16], [1, "#fff", 0]], 0.8, 1)}`,
    under: `${dropShadow("shape-product")}
      ${fill(hood)}<path d="${hood}" fill="#000" fill-opacity=".12"/>
      ${fill(lining)}<path d="${lining}" fill="#000" fill-opacity=".42"/>
      ${shadeG(9, `<path d="M 530 214 Q 600 250 670 214" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="18"/>`)}
      <use href="#shape-product" class="garment-fill" fill="#FFFFFF"/>`,
    over: `<g class="layer-shading" clip-path="url(#clip-body)">
        <rect x="380" y="180" width="440" height="700" fill="url(#g-h)"/><rect width="${W}" height="${H}" fill="url(#g-v)"/>
        <path d="${sleeveL}" fill="url(#g-sl)"/><path d="${mirrorD(sleeveL)}" fill="url(#g-sr)"/>
        ${shadeG(9, `<use href="#shape-product" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="16"/>`)}
        ${shadeG(9, fold("M 395 236 C 405 330 400 280 403 398", 0.22, 16) + fold(mirrorD("M 395 236 C 405 330 400 280 403 398"), 0.2, 16))}
        ${shadeG(5, fold("M 520 210 Q 600 300 680 210", 0.22, 12) + fold("M 300 520 Q 330 540 360 528", 0.12, 12) + fold("M 290 580 Q 322 596 352 588", 0.1, 10) + fold("M 905 520 Q 872 542 842 530", 0.12, 12) + fold("M 912 600 Q 880 612 850 606", 0.1, 10))}
        ${shadeG(5, fold("M 462 604 L 738 604", 0.22, 8) + fold("M 470 604 Q 440 650 434 712", 0.28, 7) + fold("M 730 604 Q 760 650 766 712", 0.28, 7))}
        ${shadeG(14, fold("M 470 690 C 480 730 476 760 470 790", 0.08, 24) + fold("M 735 680 C 726 730 730 760 736 790", 0.08, 24))}
        ${shadeG(2, fold("M 404 790 Q 600 798 796 790", 0.24, 4) + fold(cuffL, 0.24, 4) + fold(mirrorD(cuffL), 0.24, 4))}
        ${ribs(404, 796, 794, 846, 7)}${ribs(254, 340, 774, 812, 7)}${ribs(860, 946, 774, 812, 7)}
      </g>
      ${texture([["fx-grain-cotton", 0.14], ["fx-mottle", 0.12]])}
      <g clip-path="url(#clip-body)">
        <path class="seam" d="M 458 600 L 742 600 L 770 772 M 430 772 L 458 600"/>
        <path class="stitch" d="M 463 607 L 737 607"/>
        <path class="stitch" d="M 520 212 Q 600 290 680 212" transform="translate(0 8)"/>
        <path class="seam" d="M 395 236 C 405 330 400 280 403 398"/><path class="seam" d="${mirrorD("M 395 236 C 405 330 400 280 403 398")}"/>
      </g>
      <g>
        <circle cx="574" cy="268" r="6" fill="#000" fill-opacity=".45"/><circle cx="626" cy="268" r="6" fill="#000" fill-opacity=".45"/>
        <path d="M 574 268 C 572 320 570 360 566 404" class="garment-stroke" stroke="#FFFFFF" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M 626 268 C 628 316 631 352 634 398" class="garment-stroke" stroke="#FFFFFF" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M 574 268 C 572 320 570 360 566 404 M 626 268 C 628 316 631 352 634 398" stroke="#000" stroke-opacity=".22" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M 572 268 C 570 320 568 360 564 404 M 624 268 C 626 316 629 352 632 398" stroke="#fff" stroke-opacity=".2" stroke-width="2" fill="none"/>
        <rect x="560" y="398" width="12" height="26" rx="3" fill="#C9CCD1"/><rect x="628" y="392" width="12" height="26" rx="3" fill="#C9CCD1"/>
      </g>
      <g class="layer-highlights" clip-path="url(#clip-product)">
        <rect width="${W}" height="${H}" fill="url(#r-chest)"/>
        ${shadeG(9, glow("M 520 222 Q 450 228 405 250", 0.2, 16) + glow("M 330 330 C 300 450 285 560 275 700", 0.12, 14) + glow("M 530 104 C 560 96 600 94 640 98", 0.12, 10))}
      </g>`,
    area: { x: 485, y: 315, w: 230, h: 230 },
  };
}

/* Tote bag: cotton canvas, two handles. */
{
  const bag = "M 375 330 L 825 330 L 838 828 Q 600 838 362 828 Z";
  const handle = (dx) => `M ${461 + dx} 335 C ${452 + dx} 128 ${748 - dx} 128 ${739 - dx} 335 L ${705 - dx} 335 C ${712 - dx} 172 ${488 + dx} 172 ${495 + dx} 335 Z`;
  P.tote = {
    color: "#E9DDC7",
    defs: `<path id="shape-product" d="${bag}"/><path id="shape-handle" d="${handle(0)}"/>
      <clipPath id="clip-product"><use href="#shape-product"/><use href="#shape-handle"/></clipPath>
      <clipPath id="clip-bag"><use href="#shape-product"/></clipPath>
      ${lin("g-h", 362, 0, 838, 0, [[0, "#000", 0.16], [0.12, "#000", 0.03], [0.5, "#000", 0], [0.88, "#000", 0.04], [1, "#000", 0.18]])}
      ${lin("g-v", 0, 330, 0, 835, [[0, "#000", 0.08], [0.15, "#000", 0], [0.8, "#000", 0.02], [1, "#000", 0.14]])}
      ${rad("r-c", 560, 560, 260, [[0, "#fff", 0.14], [1, "#fff", 0]], 0.9, 1)}`,
    under: `${dropShadow("shape-product", 16, 0.18)}
      ${fill(handle(12), ' transform="translate(0 6)"')}<path d="${handle(12)}" transform="translate(0 6)" fill="#000" fill-opacity=".28"/>
      ${fill(handle(0))}
      <use href="#shape-product" class="garment-fill" fill="#FFFFFF"/>`,
    over: `<g class="layer-shading" clip-path="url(#clip-product)">
        <path d="${handle(0)}" fill="#000" fill-opacity=".05"/>
        ${shadeG(5, glow("M 478 330 C 470 150 730 150 722 330", 0, 1) + fold("M 495 335 C 488 172 712 172 705 335", 0.18, 6))}
      </g>
      <g class="layer-shading" clip-path="url(#clip-bag)">
        <rect width="${W}" height="${H}" fill="url(#g-h)"/><rect width="${W}" height="${H}" fill="url(#g-v)"/>
        ${shadeG(9, `<use href="#shape-product" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="14"/>`)}
        ${shadeG(5, fold("M 375 362 L 825 362", 0.16, 6) + fold("M 498 380 Q 520 420 528 470", 0.1, 10) + fold("M 702 380 Q 680 425 668 480", 0.1, 10))}
        ${shadeG(14, fold("M 430 520 C 440 620 436 720 426 820", 0.08, 26) + fold("M 772 500 C 764 610 768 720 780 822", 0.08, 26))}
        ${shadeG(2, fold("M 362 826 Q 600 836 838 826", 0.26, 4))}
      </g>
      ${texture([["fx-grain-weft", 0.16], ["fx-grain-warp", 0.16], ["fx-mottle", 0.12]])}
      <g clip-path="url(#clip-product)">
        <path class="stitch" d="M 376 354 L 824 354"/><path class="stitch" d="M 384 345 L 384 820 M 816 345 L 816 820"/>
        <path class="stitch" d="M 467 335 C 458 135 742 135 733 335 M 489 335 C 482 166 718 166 711 335"/>
        <path class="stitch" d="M 465 340 h 26 v 34 h -26 Z M 465 340 l 26 34 M 491 340 l -26 34 M 709 340 h 26 v 34 h -26 Z M 709 340 l 26 34 M 735 340 l -26 34"/>
      </g>
      <g class="layer-highlights" clip-path="url(#clip-product)">
        <rect width="${W}" height="${H}" fill="url(#r-c)"/>
        ${shadeG(9, glow("M 440 520 C 450 620 448 720 440 820", 0.08, 14) + glow("M 470 300 C 470 170 560 150 600 150", 0.14, 10))}
      </g>`,
    area: { x: 440, y: 420, w: 320, h: 330 },
  };
}

/* Mug: ceramic, handle on the right. */
{
  const body = "M 400 215 A 190 34 0 0 0 780 215 L 780 712 C 780 742 710 765 590 765 C 470 765 400 742 400 712 Z";
  const handle = "M 776 300 C 905 288 918 566 776 606 L 776 556 C 868 528 860 344 776 346 Z";
  P.mug = {
    color: "#FFFFFF",
    defs: `<path id="shape-product" d="${body}"/><path id="shape-handle" d="${handle}"/>
      <clipPath id="clip-product"><use href="#shape-product"/><use href="#shape-handle"/><ellipse cx="590" cy="215" rx="190" ry="34"/></clipPath>
      <clipPath id="clip-body"><use href="#shape-product"/></clipPath>
      ${lin("g-cyl", 400, 0, 780, 0, [[0, "#000", 0.3], [0.1, "#000", 0.08], [0.2, "#000", 0], [0.6, "#000", 0], [0.85, "#000", 0.14], [1, "#000", 0.38]])}
      ${lin("g-gloss", 400, 0, 780, 0, [[0, "#fff", 0], [0.13, "#fff", 0], [0.17, "#fff", 0.75], [0.22, "#fff", 0.1], [0.3, "#fff", 0], [0.88, "#fff", 0], [0.92, "#fff", 0.22], [0.96, "#fff", 0]])}
      ${lin("g-in", 0, 185, 0, 245, [[0, "#000", 0.5], [1, "#000", 0.2]])}
      ${lin("g-hd", 776, 0, 912, 0, [[0, "#000", 0.3], [0.45, "#000", 0.02], [1, "#000", 0.3]])}`,
    under: `${floor(590, 768, 230, 26, 0.3)}
      ${fill(handle)}${fill(body)}
      <ellipse cx="590" cy="215" rx="190" ry="34" class="garment-fill" fill="#FFFFFF"/>`,
    over: `<g class="layer-shading">
        <path d="${handle}" fill="url(#g-hd)"/>
        ${shadeG(5, `<path d="M 776 300 C 905 288 918 566 776 606" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="6"/>`)}
        <g clip-path="url(#clip-body)"><rect width="${W}" height="${H}" fill="url(#g-cyl)"/>
          ${shadeG(9, fold("M 400 736 C 470 762 710 762 780 736", 0.18, 22) + fold("M 778 330 L 778 590", 0.2, 14))}
        </g>
        <ellipse cx="590" cy="216" rx="176" ry="28" class="garment-fill" fill="#FFFFFF"/>
        <ellipse cx="590" cy="216" rx="176" ry="28" fill="url(#g-in)"/>
        ${shadeG(5, `<path d="M 420 222 A 170 26 0 0 0 760 222" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="8"/>`)}
      </g>
      <g class="layer-highlights">
        <g clip-path="url(#clip-body)"><rect width="${W}" height="${H}" fill="url(#g-gloss)"/></g>
        <ellipse cx="590" cy="215" rx="190" ry="34" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>
        ${shadeG(5, glow("M 800 318 C 870 322 880 420 870 470", 0.35, 6))}
      </g>`,
    area: { x: 455, y: 300, w: 270, h: 360 },
  };
}

/* Shipping box: kraft corrugated, three faces. */
{
  const front = "M 330 350 L 760 350 L 760 800 L 330 800 Z";
  const top = "M 330 350 L 480 240 L 910 240 L 760 350 Z";
  const side = "M 760 350 L 910 240 L 910 690 L 760 800 Z";
  P.box = {
    color: "#D9B382",
    defs: `<path id="shape-product" d="M 330 350 L 480 240 L 910 240 L 910 690 L 760 800 L 330 800 Z"/>
      <clipPath id="clip-product"><use href="#shape-product"/></clipPath>
      <clipPath id="clip-front"><path d="${front}"/></clipPath>
      ${lin("g-f", 0, 350, 0, 800, [[0, "#fff", 0.04], [1, "#000", 0.1]])}
      ${lin("g-s", 760, 0, 910, 0, [[0, "#000", 0.26], [1, "#000", 0.34]])}`,
    under: `${floor(620, 802, 330, 22, 0.32)}${dropShadow("shape-product", 10, 0.12)}
      <use href="#shape-product" class="garment-fill" fill="#FFFFFF"/>`,
    over: `<g class="layer-shading">
        <path d="${front}" fill="url(#g-f)"/><path d="${side}" fill="url(#g-s)"/>
        <path d="M 405 295 L 835 295" stroke="#000" stroke-opacity=".35" stroke-width="2.5"/>
        ${shadeG(2, fold("M 407 299 L 833 299", 0.12, 4))}
        <path d="M 760 350 L 760 800" stroke="#000" stroke-opacity=".3" stroke-width="2"/>
        ${shadeG(9, `<path d="${front}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="12"/>`)}
      </g>
      ${texture([["fx-grain-paper", 0.3], ["fx-grain-fibre", 0.22], ["fx-mottle", 0.2]])}
      <g class="layer-highlights">
        <path d="${top}" fill="#fff" fill-opacity=".22"/>
        <path d="M 330 350 L 760 350 L 910 240" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.5"/>
        <path d="M 330 350 L 330 800" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>
      </g>`,
    area: { x: 370, y: 395, w: 350, h: 360 },
  };
}

/* Notebook: hardcover, elastic band, page block. */
{
  const cover = "M 380 110 L 812 110 Q 830 110 830 128 L 830 782 Q 830 800 812 800 L 380 800 Z";
  let lines = "";
  for (let i = 0; i < 7; i++) lines += `M 386 ${806 + i * 2} L ${818 + i * 1.5} ${806 + i * 2}M ${834 + i * 1.5} 120 L ${834 + i * 1.5} ${790 + i * 2}`;
  P.notebook = {
    color: "#0E1A2B",
    defs: `<path id="shape-product" d="${cover}"/>
      <clipPath id="clip-product"><use href="#shape-product"/></clipPath>
      ${lin("g-c", 380, 0, 830, 0, [[0, "#000", 0.3], [0.1, "#000", 0.06], [0.11, "#fff", 0.06], [0.4, "#000", 0], [1, "#000", 0.12]])}
      ${rad("r-c", 560, 330, 330, [[0, "#fff", 0.12], [1, "#fff", 0]])}`,
    under: `${dropShadow("shape-product", 14, 0.2)}
      <path d="M 386 120 L 836 120 Q 846 120 846 132 L 846 800 Q 846 814 832 814 L 386 814 Z" fill="#F4F1EA"/>
      <path d="${lines}" stroke="#000" stroke-opacity=".12" stroke-width="1"/>
      <use href="#shape-product" class="garment-fill" fill="#FFFFFF"/>`,
    over: `<g class="layer-shading" clip-path="url(#clip-product)">
        <rect width="${W}" height="${H}" fill="url(#g-c)"/>
        ${shadeG(2, fold("M 424 110 L 424 800", 0.4, 3))}
        ${shadeG(9, `<use href="#shape-product" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="12"/>`)}
      </g>
      ${texture([["fx-grain-paper", 0.1], ["fx-mottle", 0.15]])}
      <g>
        ${shadeG(5, `<rect x="772" y="104" width="22" height="702" fill="#000" fill-opacity=".35"/>`)}
        <rect x="768" y="104" width="20" height="702" fill="#18191C"/>
        <rect x="768" y="104" width="20" height="702" fill="url(#g-c)" opacity=".6"/>
        <path d="M 772 104 L 772 806" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>
      </g>
      <g class="layer-highlights" clip-path="url(#clip-product)">
        <rect width="${W}" height="${H}" fill="url(#r-c)"/>
        <path d="M 428 110 L 428 800" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>
        <path d="M 380 111 L 812 111" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>
      </g>`,
    area: { x: 460, y: 210, w: 280, h: 380 },
  };
}

/* Business cards: one card on top of a second (dark) card. */
{
  const card = (x, y) => `M ${x + 10} ${y} L ${x + 590} ${y} Q ${x + 600} ${y} ${x + 600} ${y + 10} L ${x + 600} ${y + 378} Q ${x + 600} ${y + 388} ${x + 590} ${y + 388} L ${x + 10} ${y + 388} Q ${x} ${y + 388} ${x} ${y + 378} L ${x} ${y + 10} Q ${x} ${y} ${x + 10} ${y} Z`;
  const t = "rotate(-6 570 444)";
  P["business-card"] = {
    color: "#FFFFFF",
    defs: `<path id="shape-product" d="${card(270, 250)}" transform="${t}"/>
      <clipPath id="clip-product"><use href="#shape-product"/></clipPath>
      ${lin("g-c", 270, 250, 870, 640, [[0, "#fff", 0.1], [0.5, "#000", 0], [1, "#000", 0.08]])}`,
    under: `<g class="layer-shadows" filter="url(#fx-blur-14)"><path d="${card(350, 300)}" transform="rotate(8 650 494) translate(6 12)" fill="#000" fill-opacity=".22"/></g>
      <path d="${card(350, 300)}" transform="rotate(8 650 494)" fill="#0E1A2B"/>
      <path d="M 410 580 H 520 M 410 600 H 480" transform="rotate(8 650 494)" stroke="#fff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>
      ${dropShadow("shape-product", 10, 0.2)}
      <path d="${card(270, 253)}" transform="${t}" fill="#000" fill-opacity=".25"/>
      <use href="#shape-product" class="garment-fill" fill="#FFFFFF"/>`,
    over: `<g class="layer-shading" clip-path="url(#clip-product)"><rect width="${W}" height="${H}" fill="url(#g-c)"/>
        ${shadeG(5, `<use href="#shape-product" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="6"/>`)}</g>
      ${texture([["fx-grain-paper", 0.08]])}
      <g class="layer-highlights"><path d="M 280 250 L 860 250" transform="${t}" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></g>`,
    area: { x: 270, y: 250, w: 600, h: 388 },
    transform: t,
  };
}

/* Flyer: A-format sheet lying flat, slight corner lift. */
{
  const sheet = "M 360 70 L 840 70 L 840 712 Q 832 742 800 749 L 360 749 Z";
  P.flyer = {
    color: "#0B6E8A",
    defs: `<path id="shape-product" d="${sheet}"/>
      <clipPath id="clip-product"><use href="#shape-product"/></clipPath>
      ${lin("g-s", 360, 70, 840, 749, [[0, "#fff", 0.08], [0.5, "#000", 0], [1, "#000", 0.1]])}`,
    under: `${dropShadow("shape-product", 12, 0.2)}<use href="#shape-product" class="garment-fill" fill="#FFFFFF"/>`,
    over: `<g class="layer-shading" clip-path="url(#clip-product)"><rect width="${W}" height="${H}" fill="url(#g-s)"/>
        ${shadeG(14, fold("M 760 760 Q 820 720 850 650", 0.14, 30))}
        ${shadeG(24, fold("M 600 80 L 600 740", 0.035, 70))}</g>
      ${texture([["fx-grain-paper", 0.09]])}
      <g class="layer-highlights" clip-path="url(#clip-product)">${shadeG(9, glow("M 800 744 Q 828 736 838 708", 0.35, 8))}
        <path d="M 361 71 L 839 71" stroke="#fff" stroke-opacity=".4" stroke-width="2"/></g>`,
    area: { x: 360, y: 70, w: 480, h: 679 },
  };
}

/* Poster: hanging on wooden rails with a cord. */
{
  const sheet = "M 370 130 L 830 130 L 830 790 L 370 790 Z";
  const bar = (y) => `<rect x="350" y="${y}" width="500" height="22" rx="4" fill="#BE915C"/><rect x="350" y="${y}" width="500" height="22" rx="4" fill="url(#g-wood)"/><path d="M 354 ${y + 3} H 846" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`;
  P.poster = {
    color: "#F2C14E",
    defs: `<path id="shape-product" d="${sheet}"/>
      <clipPath id="clip-product"><use href="#shape-product"/></clipPath>
      ${lin("g-wood", 0, 0, 0, 22, [[0, "#fff", 0.15], [0.5, "#000", 0], [1, "#000", 0.3]])}
      ${lin("g-p", 370, 0, 830, 0, [[0, "#000", 0.06], [0.3, "#000", 0], [0.5, "#000", 0.03], [0.7, "#000", 0], [1, "#000", 0.08]])}`,
    under: `<path d="M 372 125 L 600 40 L 828 125" fill="none" stroke="#6B6257" stroke-width="3"/><circle cx="600" cy="40" r="6" fill="#55504A"/>
      ${dropShadow("shape-product", 14, 0.18)}<use href="#shape-product" class="garment-fill" fill="#FFFFFF"/>`,
    over: `<g class="layer-shading" clip-path="url(#clip-product)"><rect width="${W}" height="${H}" fill="url(#g-p)"/>
        ${shadeG(14, fold("M 370 150 L 830 150", 0.1, 20) + fold("M 370 772 L 830 772", 0.1, 20))}</g>
      ${texture([["fx-grain-paper", 0.09]])}
      <g class="layer-shadows" filter="url(#fx-blur-5)"><rect x="352" y="126" width="500" height="22" fill="#000" fill-opacity=".25" transform="translate(0 6)"/><rect x="352" y="782" width="500" height="22" fill="#000" fill-opacity=".25" transform="translate(0 6)"/></g>
      ${bar(120)}${bar(780)}
      <g class="layer-highlights" clip-path="url(#clip-product)">${shadeG(24, glow("M 520 160 L 520 760", 0.12, 60))}</g>`,
    area: { x: 370, y: 142, w: 460, h: 636 },
  };
}

/* ------------------------------------------------------------------ output */
const STYLE_TOKEN = "__GARMENT_STYLE__";
const defsFor = (p) => `<style>${CSS(p.color)}</style>${COMMON_FILTERS}${p.defs}`;
const compact = (s) => s.replace(/\n\s*/g, "\n");
const areaShape = (a, t) => `<path d="M ${a.x} ${a.y} h ${a.w} v ${a.h} h ${-a.w} Z"${t ? ` transform="${t}"` : ""}/>`;
const layers = {};
const templates = {};

mkdirSync(resolve(ROOT, "public/mockups/svg"), { recursive: true });
for (const [key, p] of Object.entries(P)) {
  const a = p.area;
  const place = `${p.transform ? `${p.transform} ` : ""}translate(${a.x} ${a.y})`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- MSLAB Studio mockup template: ${key}. Generated by scripts/build-product-mockups.mjs. See docs/TSHIRT_SVG_MOCKUP.md (same structure). -->
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="mslab-${key}" class="mslab-mockup" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${key} mockup">
<defs>${defsFor(p)}<clipPath id="print-area-front">${areaShape(a, p.transform)}</clipPath></defs>
<g id="garment-base">${p.under}</g>
<g id="printable-areas"><g id="slot-front" clip-path="url(#print-area-front)" data-print-area="front" data-width="${a.w}" data-height="${a.h}"><g id="artwork-front" transform="${place}" data-local-width="${a.w}" data-local-height="${a.h}"></g></g></g>
<g id="lighting">${p.over}</g>
</svg>
`;
  writeFileSync(resolve(ROOT, `public/mockups/svg/${key}.svg`), compact(svg));
  const doc = (body) => compact(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="mslab-mockup" style="${STYLE_TOKEN}"><defs>${defsFor(p)}</defs>${body}</svg>`);
  layers[key] = { front: { under: doc(p.under), over: doc(p.over) } };
  templates[key] = {
    w: W,
    h: H,
    thumb: { x: 0, y: 0, w: W, h: H },
    sides: [{ key: "front", scene: "front", area: a, ...(p.transform ? { transform: p.transform } : {}), crop: { x: 0, y: 0, w: W, h: H } }],
  };
}

const BANNER = "// Generated by scripts/build-product-mockups.mjs. Do not edit by hand.\n";
writeFileSync(
  resolve(ROOT, "src/features/print-on-demand/product-templates.generated.ts"),
  `${BANNER}/** Printable sides of MSLAB's vector product templates (1200 × 900 space). */\nexport const PRODUCT_TEMPLATES = ${JSON.stringify(templates, null, 2)} as const;\n`,
);
writeFileSync(
  resolve(ROOT, "src/components/print-on-demand/garment/product-layers.generated.ts"),
  `${BANNER}/** Product templates split around the artwork ("under" / "over"); style token: __GARMENT_STYLE__. */\nexport const PRODUCT_LAYERS = ${JSON.stringify(layers)} as const;\n`,
);
console.log("built:", Object.keys(P).join(", "));
