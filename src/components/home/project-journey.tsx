import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated journey (a timeline of stages). A glowing dot travels the line, the line fills behind
 * it, each stage lights up as the dot reaches it (with a small icon animation), completed stages
 * stay lit, the last stage ends with a success tick, then the cycle fades out and restarts.
 *
 * Two step sets (`variant`):
 * - "production" — How your project comes to life (6): document sent, quote lines, approval tick,
 *   printed sheet, packed box, delivery truck.
 * - "web" — How a web project works (5): idea bulb, quote lines, design artboard, code being
 *   typed, rocket launch.
 * - "home" — How to work with MSLAB (6, every division): request sent, product picked from a
 *   grid, request reviewed (magnifier), quote written, approval tick, delivery truck.
 *
 * - CSS only (no JavaScript, no dependency): every animation of a journey shares one 15 s cycle,
 *   so all parts stay in sync; keyframes are generated below from one timing table, scoped per
 *   variant (`.jr-v-<variant>`) so two journeys can never interfere.
 * - Below `lg`: step cards in a two-column grid under a progress bar; from `lg`: one row. In Arabic
 *   the journey runs right to left (the truck faces left). Motion uses transform/opacity (plus small stroke draws) — no layout work.
 * - prefers-reduced-motion: nothing moves; the finished journey is shown (every stage lit).
 * - The list is plain text for assistive technologies; the drawings are decorative.
 */

type Step = { title: string; body: string };
type Variant = "production" | "web" | "home";

const CYCLE_S = 15;
const START = 2; // % of the cycle: dot appears at stage 1
const LAST = 72; // % of the cycle: dot reaches the last stage
const HOLD = 4; // % the dot rests on each stage
const SUCCESS_UNTIL = 86; // everything stays lit until here
const FADED = 94; // then fades out, resets while invisible, and starts again

const pct = (n: number) => `${Math.round(n * 100) / 100}%`;

/** Position p ∈ [0, 1] along the track → transform of an element as large as the track. */
const along = (p: number) => {
  const k = Math.round((p - 1) * 1000) / 1000;
  return `transform:translate(calc(${k} * 100% * var(--jx)),calc(${k} * 100% * var(--jy)))`;
};

/** Icon animation while a stage is active: [moment within the stage 0–1, declarations]. */
type Fx = { cls: string; rest: string; frames: Array<[number, string]> };
const ty = (px: number) => `transform:translateY(${px}px)`;
const tx = (px: number) => `transform:translateX(${px}px)`;
const scale = (s: number) => `transform:scale(${s})`;
/** Quote lines written one after another (shared by both journeys). */
const quoteLines = (prefix: string): Fx[] =>
  ["a", "b", "c"].map((s, k) => ({
    cls: `${prefix}${s}`,
    rest: "transform:scaleX(1)",
    frames: [[0, "transform:scaleX(0)"], [0.12 + k * 0.14, "transform:scaleX(0)"], [0.34 + k * 0.14, "transform:scaleX(1)"]],
  }));

const FX: Record<Variant, Fx[][]> = {
  production: [
    // 1. Document submitted: the sheet lifts twice, as if sent.
    [{ cls: "jr-fx-0", rest: ty(0), frames: [[0, ty(0)], [0.18, ty(-3)], [0.36, ty(0)], [0.54, ty(-3)], [0.72, ty(0)]] }],
    // 2. Quotation: the lines of the quote are written one after another.
    quoteLines("jr-fx-1"),
    // 3. Approval: the tick is drawn.
    [{ cls: "jr-fx-2", rest: "stroke-dashoffset:0", frames: [[0, "stroke-dashoffset:1"], [0.12, "stroke-dashoffset:1"], [0.45, "stroke-dashoffset:0"]] }],
    // 4. Printing: two sheets come out of the printer.
    [
      {
        cls: "jr-fx-3",
        rest: `${ty(0)};opacity:1`,
        frames: [[0, `${ty(-6)};opacity:0`], [0.08, `${ty(-6)};opacity:1`], [0.4, `${ty(0)};opacity:1`], [0.48, `${ty(0)};opacity:0`], [0.5, `${ty(-6)};opacity:0`], [0.58, `${ty(-6)};opacity:1`], [0.9, `${ty(0)};opacity:1`]],
      },
    ],
    // 5. Packaging: the box drops in and is taped.
    [
      { cls: "jr-fx-4", rest: ty(0), frames: [[0, ty(-5)], [0.25, ty(0)], [0.33, ty(-1.5)], [0.41, ty(0)]] },
      { cls: "jr-fx-4b", rest: "stroke-dashoffset:0", frames: [[0, "stroke-dashoffset:1"], [0.42, "stroke-dashoffset:1"], [0.7, "stroke-dashoffset:0"]] },
    ],
    // 6. Delivery: the truck drives in and idles.
    [
      { cls: "jr-fx-5", rest: tx(0), frames: [[0, tx(-6)], [0.3, tx(0)], [0.38, ty(-1)], [0.46, ty(0)], [0.54, ty(-1)], [0.62, ty(0)]] },
      { cls: "jr-fx-5b", rest: "opacity:0", frames: [[0, "opacity:1"], [0.3, "opacity:1"], [0.45, "opacity:0"]] },
    ],
  ],
  web: [
    // 1. Your needs: the idea lights up (bulb pulses, rays flash).
    [
      { cls: "jr-fx-w0", rest: scale(1), frames: [[0, scale(1)], [0.15, scale(1.1)], [0.3, scale(1)], [0.45, scale(1.1)], [0.6, scale(1)]] },
      { cls: "jr-fx-w0b", rest: "opacity:1", frames: [[0, "opacity:0"], [0.12, "opacity:1"], [0.28, "opacity:0.25"], [0.42, "opacity:1"]] },
    ],
    // 2. Proposal & quote: the quote is written.
    quoteLines("jr-fx-w1"),
    // 3. Design: a layout is drawn on the artboard, the pen moves.
    [
      { cls: "jr-fx-w2a", rest: "transform:scaleX(1)", frames: [[0, "transform:scaleX(0)"], [0.1, "transform:scaleX(0)"], [0.32, "transform:scaleX(1)"]] },
      { cls: "jr-fx-w2b", rest: scale(1), frames: [[0, scale(0)], [0.3, scale(0)], [0.5, scale(1)]] },
      { cls: "jr-fx-w2c", rest: "transform:translate(0,0)", frames: [[0, "transform:translate(-4px,-3px)"], [0.3, "transform:translate(0,0)"], [0.45, "transform:translate(-2px,1px)"], [0.6, "transform:translate(0,0)"]] },
    ],
    // 4. Development: a line of code is typed, the cursor blinks.
    [
      { cls: "jr-fx-w3a", rest: "transform:scaleX(1)", frames: [[0, "transform:scaleX(0)"], [0.12, "transform:scaleX(0)"], [0.4, "transform:scaleX(1)"]] },
      { cls: "jr-fx-w3b", rest: "opacity:1", frames: [[0, "opacity:1"], [0.1, "opacity:0"], [0.2, "opacity:1"], [0.3, "opacity:0"], [0.4, "opacity:1"], [0.5, "opacity:0"], [0.6, "opacity:1"]] },
    ],
    // 5. Launch & follow-up: the rocket lifts off.
    [
      { cls: "jr-fx-w4", rest: ty(0), frames: [[0, ty(3)], [0.3, ty(-2.5)], [0.45, ty(0)], [0.6, ty(-1)], [0.75, ty(0)]] },
      { cls: "jr-fx-w4b", rest: "opacity:1", frames: [[0, "opacity:0"], [0.1, "opacity:1"], [0.2, "opacity:0.35"], [0.3, "opacity:1"], [0.4, "opacity:0.35"], [0.5, "opacity:1"]] },
    ],
  ],
  home: [
    // 1. You share your need: the request lifts twice, as if sent.
    [{ cls: "jr-fx-h0", rest: ty(0), frames: [[0, ty(0)], [0.18, ty(-3)], [0.36, ty(0)], [0.54, ty(-3)], [0.72, ty(0)]] }],
    // 2. You choose: one tile of the grid is picked (it pops, the pointer taps it).
    [
      { cls: "jr-fx-h1", rest: scale(1), frames: [[0, scale(1)], [0.3, scale(1)], [0.42, scale(1.18)], [0.55, scale(1)]] },
      { cls: "jr-fx-h1b", rest: "transform:translate(0,0)", frames: [[0, "transform:translate(-5px,-4px)"], [0.3, "transform:translate(0,0)"], [0.38, "transform:translate(0.5px,0.5px)"], [0.46, "transform:translate(0,0)"]] },
    ],
    // 3. We review: the magnifier sweeps the request.
    [{ cls: "jr-fx-h2", rest: tx(0), frames: [[0, tx(-3)], [0.25, tx(3)], [0.5, tx(-3)], [0.75, tx(0)]] }],
    // 4. You receive your quote: its lines are written.
    quoteLines("jr-fx-h3"),
    // 5. You approve: the tick is drawn.
    [{ cls: "jr-fx-h4", rest: "stroke-dashoffset:0", frames: [[0, "stroke-dashoffset:1"], [0.12, "stroke-dashoffset:1"], [0.45, "stroke-dashoffset:0"]] }],
    // 6. We produce and deliver: the truck drives in and idles.
    [
      { cls: "jr-fx-h5", rest: tx(0), frames: [[0, tx(-6)], [0.3, tx(0)], [0.38, ty(-1)], [0.46, ty(0)], [0.54, ty(-1)], [0.62, ty(0)]] },
      { cls: "jr-fx-h5b", rest: "opacity:0", frames: [[0, "opacity:1"], [0.3, "opacity:1"], [0.45, "opacity:0"]] },
    ],
  ],
};

function keyframes(name: string, frames: Array<[number, string]>) {
  return `@keyframes ${name}{${frames.map(([at, css]) => `${pct(at)}{${css}}`).join("")}}`;
}

function buildCss(variant: Variant) {
  const fx = FX[variant];
  const stages = fx.length;
  const segment = (LAST - START) / (stages - 1); // % between two stages (hold + travel)
  const arrive = (i: number) => START + i * segment;
  const end = LAST;
  const v = `.jr-v-${variant}`;
  const k = (name: string) => `jr-${variant}-${name}`;

  /**
   * Dot and fill share these frames, so the line always ends exactly under the dot: rest on each
   * stage, travel to the next, hold at the last one, fade out, jump back while invisible.
   * `edge` is the opacity at the very start/end of the cycle (dot hidden, fill visible — it is
   * fully retracted there anyway).
   */
  const runFrames = (edge: number) => {
    const frames: Array<[number, string]> = [[0, `${along(0)};opacity:${edge}`]];
    for (let i = 0; i < stages; i++) {
      const p = i / (stages - 1);
      frames.push([arrive(i), `${along(p)};opacity:1`]);
      if (i < stages - 1) frames.push([arrive(i) + HOLD, `${along(p)};opacity:1`]);
    }
    frames.push([SUCCESS_UNTIL, `${along(1)};opacity:1`], [FADED, `${along(1)};opacity:0`], [FADED + 0.5, `${along(0)};opacity:0`], [100, `${along(0)};opacity:${edge}`]);
    return frames;
  };

  const css: string[] = [];
  // Layout. Below lg: step cards in a two-column "snake" (01 02 / 04 03 / 05 06) joined by short
  // connectors with arrowheads, so the line follows the order of the steps. From lg: one row, the
  // track running through the stage circles (--jr-half = half a 56 px circle). Both mirror in Arabic.
  // --jr-gap = the grid gap the connectors span; --jr-pad + --jr-r = centre of a card's circle
  // (32 px circles on phones, 40 px from sm).
  const snake = Array.from({ length: stages }, (_, i) => {
    const row = Math.floor(i / 2);
    const lastAlone = i === stages - 1 && i % 2 === 0;
    const col = lastAlone ? "1 / -1" : String(row % 2 === 0 ? (i % 2) + 1 : 2 - (i % 2));
    return `${v} .jr-s${i}{grid-row:${row + 1};grid-column:${col}}`;
  }).join("");
  const linkY = "calc(var(--jr-pad) + var(--jr-r) - 1px)";
  css.push(
    `.jr{--jx:1;--jy:0;--jr-half:1.75rem;--jr-dot:14px;--jr-gap:1rem;--jr-pad:0.625rem;--jr-r:1rem}[dir="rtl"] .jr{--jx:-1}`,
    `@media (min-width:40rem){.jr{--jr-gap:1.25rem;--jr-pad:0.875rem;--jr-r:1.25rem}}`,
    `@media (max-width:63.999rem){.jr-track{display:none}${snake}}`,
    `@media (min-width:64rem){.jr-link{display:none}}`,
    `.jr-link{position:absolute;z-index:1;border-radius:2px;background:rgb(255 255 255 / 0.16);pointer-events:none}`,
    `.jr-link-fill{position:absolute;inset:0;border-radius:inherit;background:#5ba7bc}`,
    `.jr-link::after{content:"";position:absolute;width:6px;height:6px;border-top:2px solid #5ba7bc;border-right:2px solid #5ba7bc}`,
    `.jr-link-end,.jr-link-start{top:${linkY};height:2px;width:var(--jr-gap)}`,
    `.jr-link-end{inset-inline-start:100%}.jr-link-start{inset-inline-end:100%}`,
    `.jr-link-down{top:100%;height:var(--jr-gap);width:2px;inset-inline-start:${linkY}}`,
    // Arrowheads at the far end of each connector (chevron = top + right border, rotated).
    `.jr-link-end::after{inset-inline-end:1px;top:50%;transform:translateY(-50%) rotate(45deg)}`,
    `.jr-link-start::after{inset-inline-start:1px;top:50%;transform:translateY(-50%) rotate(-135deg)}`,
    `[dir="rtl"] .jr-link-end::after{transform:translateY(-50%) rotate(-135deg)}[dir="rtl"] .jr-link-start::after{transform:translateY(-50%) rotate(45deg)}`,
    `.jr-link-down::after{bottom:1px;left:50%;transform:translateX(-50%) rotate(135deg)}`,
    // Fills grow from the card they leave.
    `.jr-link-end .jr-link-fill{transform-origin:left center}[dir="rtl"] .jr-link-end .jr-link-fill{transform-origin:right center}`,
    `.jr-link-start .jr-link-fill{transform-origin:right center}[dir="rtl"] .jr-link-start .jr-link-fill{transform-origin:left center}`,
    `.jr-link-down .jr-link-fill{transform-origin:center top}`,
    `${v} .jr-track{position:absolute;top:calc(var(--jr-half) - 1px);height:2px;inset-inline:calc(100% / ${stages * 2})}`,
    `.jr-rail{overflow:hidden;border-radius:2px;background:rgb(255 255 255 / 0.14)}`,
    `.jr-fill,.jr-runner{position:absolute;inset:0}`,
    `.jr-runner{opacity:0}`, // the dot only shows while it travels
    `.jr-fill{background:#5ba7bc}`,
    `.jr-dot{position:absolute;top:50%;inset-inline-end:0;width:var(--jr-dot);height:var(--jr-dot);border-radius:999px;background:#fff;transform:translate(50%,-50%);box-shadow:0 0 0 4px rgb(91 167 188 / 0.35),0 0 18px 4px rgb(91 167 188 / 0.7)}`,
    `[dir="rtl"] .jr-dot{transform:translate(-50%,-50%)}`,
    `.jr-dot::after{content:"";position:absolute;inset:-7px;border-radius:inherit;border:1px solid rgb(91 167 188 / 0.7);opacity:0}`,
    `.jr-ring,.jr-burst{opacity:0}`,
    `.jr svg .jr-fx{transform-box:fill-box;transform-origin:center}`,
    `.jr svg .jr-line{transform-origin:left center}`,
    `.jr svg .jr-dash{stroke-dasharray:1;stroke-dashoffset:0}`,
  );

  // Motion only for visitors who accept it.
  const motion: string[] = [];
  motion.push(
    `.jr-fill,.jr-runner,.jr-lit,.jr-icon,.jr-ring,.jr-burst,.jr-done,.jr-link-fill,.jr .jr-fx{animation-duration:${CYCLE_S}s;animation-iteration-count:infinite;animation-timing-function:ease-in-out}`,
    keyframes(k("fill"), runFrames(1)),
    keyframes(k("run"), runFrames(0)),
    // The runner is as large as the track, so its translate percentages are track lengths.
    `${v} .jr-fill{animation-name:${k("fill")}}${v} .jr-runner{animation-name:${k("run")}}`,
    `@keyframes jr-halo{0%{transform:scale(0.6);opacity:0.9}100%{transform:scale(1.6);opacity:0}}`,
    `.jr-dot::after{animation:jr-halo 1.5s ease-out infinite}`,
  );
  for (let i = 0; i < stages; i++) {
    const a = arrive(i);
    const stageEnd = i < stages - 1 ? arrive(i + 1) : SUCCESS_UNTIL;
    motion.push(
      keyframes(k(`lit-${i}`), [[0, "opacity:0"], [a, "opacity:0"], [a + 1.5, "opacity:1"], [SUCCESS_UNTIL, "opacity:1"], [FADED, "opacity:0"], [100, "opacity:0"]]),
      keyframes(k(`icon-${i}`), [[0, "opacity:0.55"], [a, "opacity:0.55"], [a + 1.5, "opacity:1"], [SUCCESS_UNTIL, "opacity:1"], [FADED, "opacity:0.55"], [100, "opacity:0.55"]]),
      keyframes(k(`ring-${i}`), [[0, "transform:scale(1);opacity:0"], [a, "transform:scale(0.9);opacity:0.8"], [a + 6, "transform:scale(1.7);opacity:0"], [100, "transform:scale(1.7);opacity:0"]]),
      `${v} .jr-s${i} .jr-lit{animation-name:${k(`lit-${i}`)}}${v} .jr-s${i} .jr-icon{animation-name:${k(`icon-${i}`)}}${v} .jr-s${i} .jr-ring{animation-name:${k(`ring-${i}`)}}`,
    );
    // Phones: the connector to the next card fills while the journey travels there.
    if (i < stages - 1) {
      // Even steps link sideways to the next card, odd steps link down (see `snake`).
      const s = (n: 0 | 1) => `transform:scale${i % 2 === 0 ? "X" : "Y"}(${n})`;
      const leave = a + HOLD;
      motion.push(
        keyframes(k(`link-${i}`), [[0, `${s(0)};opacity:1`], [leave, `${s(0)};opacity:1`], [arrive(i + 1), `${s(1)};opacity:1`], [SUCCESS_UNTIL, `${s(1)};opacity:1`], [FADED, `${s(1)};opacity:0`], [FADED + 0.5, `${s(0)};opacity:0`], [100, `${s(0)};opacity:1`]]),
        `${v} .jr-s${i} .jr-link-fill{animation-name:${k(`link-${i}`)}}`,
      );
    }
    fx[i].forEach((effect, n) => {
      const frames: Array<[number, string]> = [[0, effect.rest], [a - 0.01, effect.rest]];
      for (const [at, decl] of effect.frames) frames.push([a + at * (stageEnd - a), decl]);
      frames.push([stageEnd, effect.rest], [100, effect.rest]);
      motion.push(keyframes(k(`fx-${i}-${n}`), frames), `${v} .${effect.cls}{animation-name:${k(`fx-${i}-${n}`)}}`);
    });
  }
  // Last stage: success tick pops, with a wider burst.
  motion.push(
    keyframes(k("done"), [[0, "transform:scale(0.3);opacity:0"], [end + 2, "transform:scale(0.3);opacity:0"], [end + 5, "transform:scale(1.15);opacity:1"], [end + 7, "transform:scale(1);opacity:1"], [SUCCESS_UNTIL, "transform:scale(1);opacity:1"], [FADED, "transform:scale(1);opacity:0"], [100, "transform:scale(0.3);opacity:0"]]),
    keyframes(k("burst"), [[0, "transform:scale(1);opacity:0"], [end + 3, "transform:scale(1);opacity:0.7"], [end + 11, "transform:scale(2.2);opacity:0"], [100, "transform:scale(2.2);opacity:0"]]),
    `${v} .jr-done{animation-name:${k("done")}}${v} .jr-burst{animation-name:${k("burst")}}`,
  );
  css.push(`@media (prefers-reduced-motion:no-preference){${motion.join("")}}`);
  return css.join("");
}

const JOURNEY_CSS: Record<Variant, string> = { production: buildCss("production"), web: buildCss("web"), home: buildCss("home") };

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

/** One drawing per stage, in the order of the steps. */
const ICONS: Record<Variant, ReactNode[]> = {
  production: [
    // Request a quote: document being sent.
    <g key="send" className="jr-fx jr-fx-0">
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 12h5M10 15.5h5" />
    </g>,
    // Review & quotation: a quote being written.
    <g key="quote">
      <path d="M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z" />
      <path className="jr-fx jr-line jr-fx-1a" d="M9 8h6" />
      <path className="jr-fx jr-line jr-fx-1b" d="M9 11.5h6" />
      <path className="jr-fx jr-line jr-fx-1c" d="M9 15h4" />
    </g>,
    // Customer approval: tick in a circle.
    <g key="approve">
      <circle cx="12" cy="12" r="8.5" />
      <path className="jr-fx jr-dash jr-fx-2" pathLength={1} d="M8.2 12.3l2.6 2.6 5-5.4" />
    </g>,
    // Production: printer with a sheet coming out.
    <g key="print">
      <clipPath id="jr-print-out">
        <rect x="0" y="16.5" width="24" height="8" />
      </clipPath>
      <path d="M7 9V3.5h10V9" />
      <rect x="3.5" y="9" width="17" height="7.5" rx="1.5" />
      <path d="M16.8 12.2h.4" />
      <g clipPath="url(#jr-print-out)">
        <path className="jr-fx jr-fx-3" d="M7.5 14h9v7h-9z" />
      </g>
    </g>,
    // Packaging: box being taped.
    <g key="pack" className="jr-fx jr-fx-4">
      <path d="M4 8.5 12 4.5l8 4v8.5l-8 4-8-4z" />
      <path d="M4 8.5l8 4 8-4M12 12.5V21" />
      <path className="jr-fx jr-dash jr-fx-4b" pathLength={1} d="M8 6.5l8 4" />
    </g>,
    // Delivery: truck (mirrored in Arabic so it drives with the journey).
    <g key="deliver">
      <path className="jr-fx jr-fx-5b" d="M.8 10h1.6M.4 13h1.6" />
      <g className="jr-fx jr-fx-5">
        <path d="M3.5 7h10.5v9H3.5z" />
        <path d="M14 10h3.5l3 3v3H14z" />
        <circle cx="7.5" cy="17.5" r="1.8" />
        <circle cx="17" cy="17.5" r="1.8" />
      </g>
    </g>,
  ],
  web: [
    // Your needs: an idea (light bulb with rays).
    <g key="idea">
      <path className="jr-fx jr-fx-w0b" d="M12 .9v1.4M4 4.3l1 1M20 4.3l-1 1M1.6 10.6H3M21 10.6h1.4" />
      <g className="jr-fx jr-fx-w0">
        <path d="M12 4a6 6 0 0 0-3.7 10.7c.7.6 1.2 1.4 1.2 2.3h5c0-.9.5-1.7 1.2-2.3A6 6 0 0 0 12 4z" />
        <path d="M9.6 19.5h4.8M10.6 22h2.8" />
      </g>
    </g>,
    // Proposal & quote: a quote being written.
    <g key="proposal">
      <path d="M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z" />
      <path className="jr-fx jr-line jr-fx-w1a" d="M9 8h6" />
      <path className="jr-fx jr-line jr-fx-w1b" d="M9 11.5h6" />
      <path className="jr-fx jr-line jr-fx-w1c" d="M9 15h4" />
    </g>,
    // Design: artboard with a layout, and a pen.
    <g key="design">
      <rect x="2.5" y="3.5" width="15" height="15" rx="1.6" />
      <path className="jr-fx jr-line jr-fx-w2a" d="M5.5 7.5h9" />
      <rect className="jr-fx jr-fx-w2b" x="5.5" y="10.5" width="5" height="4.5" rx=".6" />
      <g className="jr-fx jr-fx-w2c">
        <path d="M14.5 15.5l5.2-5.2 2.3 2.3-5.2 5.2-3 .7z" />
      </g>
    </g>,
    // Development: code window, a line being typed and a blinking cursor.
    <g key="code">
      <rect x="2.5" y="4" width="19" height="16" rx="2" />
      <path d="M2.5 8h19M7.5 12l-2 2 2 2M11 12l2 2-2 2" />
      <path className="jr-fx jr-line jr-fx-w3a" d="M15 13h3.5" />
      <path className="jr-fx jr-fx-w3b" d="M15.2 16.5h2" />
    </g>,
    // Launch & follow-up: rocket lifting off.
    <g key="launch">
      <path className="jr-fx jr-fx-w4b" d="M10 19.5l-.8 2.3M12 19.8v2.4M14 19.5l.8 2.3" />
      <g className="jr-fx jr-fx-w4">
        <path d="M12 2.5c2.9 2.2 4.3 5.5 4.3 9.3v5.2H7.7v-5.2c0-3.8 1.4-7.1 4.3-9.3z" />
        <circle cx="12" cy="10" r="1.6" />
        <path d="M7.7 13.2 5.2 15.7v2.6h2.5M16.3 13.2l2.5 2.5v2.6h-2.5" />
      </g>
    </g>,
  ],
  home: [
    // You share your need: a request being sent.
    <g key="send" className="jr-fx jr-fx-h0">
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 12h5M10 15.5h5" />
    </g>,
    // You choose a product or service: a grid with one tile picked, and a pointer.
    <g key="choose">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.4" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.4" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.4" />
      <rect className="jr-fx jr-fx-h1" x="13.5" y="13.5" width="7.5" height="7.5" rx="1.4" fill="currentColor" fillOpacity="0.25" />
      <g className="jr-fx jr-fx-h1b">
        <path d="M16.5 16.5l5 2-2.1.9-.9 2.1z" fill="currentColor" />
      </g>
    </g>,
    // We review your request: a magnifier over the lines.
    <g key="review">
      <path d="M4 5h11M4 9h8M4 13h6" />
      <g className="jr-fx jr-fx-h2">
        <circle cx="15" cy="14" r="4.2" />
        <path d="M18.1 17.1 21 20" />
      </g>
    </g>,
    // You receive your quote: a quote being written.
    <g key="quote">
      <path d="M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z" />
      <path className="jr-fx jr-line jr-fx-h3a" d="M9 8h6" />
      <path className="jr-fx jr-line jr-fx-h3b" d="M9 11.5h6" />
      <path className="jr-fx jr-line jr-fx-h3c" d="M9 15h4" />
    </g>,
    // You approve the project: tick in a circle.
    <g key="approve">
      <circle cx="12" cy="12" r="8.5" />
      <path className="jr-fx jr-dash jr-fx-h4" pathLength={1} d="M8.2 12.3l2.6 2.6 5-5.4" />
    </g>,
    // We produce and deliver: truck (mirrored in Arabic).
    <g key="deliver">
      <path className="jr-fx jr-fx-h5b" d="M.8 10h1.6M.4 13h1.6" />
      <g className="jr-fx jr-fx-h5">
        <path d="M3.5 7h10.5v9H3.5z" />
        <path d="M14 10h3.5l3 3v3H14z" />
        <circle cx="7.5" cy="17.5" r="1.8" />
        <circle cx="17" cy="17.5" r="1.8" />
      </g>
    </g>,
  ],
};

/** The last stage's drawing is mirrored in Arabic when it has a direction (the truck). */
const MIRROR_LAST: Record<Variant, boolean> = { production: true, web: false, home: true };
/** Dark navy band behind every project journey (home, production page, Digital Solutions). */
export const JOURNEY_BG = "#0E1A2B";

/** Static class names (Tailwind only generates classes it can read in the source). */
const DESKTOP_COLUMNS: Record<number, string> = { 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" };

/**
 * `background` is the colour of the band the journey sits on: the stage circles are filled with
 * it so the timeline passes behind them. `steps` must have as many items as the variant has
 * drawings (production: 6, web: 5).
 *
 * Phones and tablets get their own layout, not the desktop row squeezed: every step is a card in
 * a two-column "snake" (01 02 / 04 03 / 05 06: all readable at once, no swiping) and each card is
 * joined to the next by a connector with an arrowhead, so the line follows the steps. A connector
 * fills as the journey moves on, then the next card lights up; an odd last step spans both
 * columns as the finale. The DOM order stays 1…n for assistive technologies. From lg: the single
 * animated row.
 */
export function ProjectJourney({
  steps,
  background,
  variant = "production",
  className,
}: {
  steps: Step[];
  background: string;
  variant?: Variant;
  className?: string;
}) {
  const icons = ICONS[variant];
  const items = steps.slice(0, icons.length);
  return (
    <div className={cn("jr relative", `jr-v-${variant}`, className)} style={{ "--jr-bg": background } as CSSProperties}>
      {/* Generated once from constants (no user input); hoisted and deduplicated by React. */}
      <style href={`mslab-project-journey-${variant}`} precedence="default">
        {JOURNEY_CSS[variant]}
      </style>
      {/* Desktop timeline: rail + fill, and the travelling dot (decorative). */}
      <div aria-hidden="true">
        <span className="jr-track jr-rail">
          <span className="jr-fill" />
        </span>
        <span className="jr-track">
          <span className="jr-runner">
            <span className="jr-dot" />
          </span>
        </span>
      </div>
      {/* gap = --jr-gap, the length of the connectors. */}
      <ol className={cn("relative grid grid-cols-2 gap-4 sm:gap-5 lg:gap-0", DESKTOP_COLUMNS[icons.length])}>
        {items.map((step, i) => {
          const last = i === items.length - 1;
          const number = String(i + 1).padStart(2, "0");
          // Snake: the first card of a row links sideways (towards the end on rows 1, 3…, towards
          // the start on rows 2, 4…), the second links down to the row below.
          const link = last ? null : i % 2 === 1 ? "down" : Math.floor(i / 2) % 2 === 0 ? "end" : "start";
          return (
            <li
              key={step.title}
              className={cn(
                `jr-s${i}`,
                // Card (below lg) …
                "relative flex flex-col rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-2.5 sm:p-3.5",
                // … plain column on desktop.
                "lg:items-center lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:px-3 lg:text-center",
              )}
            >
              {link ? (
                <span aria-hidden="true" className={`jr-link jr-link-${link} lg:hidden`}>
                  <span className="jr-link-fill" />
                </span>
              ) : null}
              {/* Card highlight while this step is active (same animation as the circle). */}
              <span aria-hidden="true" className="jr-lit pointer-events-none absolute inset-0 rounded-[inherit] border border-cyan-300/60 bg-cyan-700/15 lg:hidden" />

              <div className="relative flex items-start justify-between gap-2 lg:block">
                <span aria-hidden="true" className="relative grid size-8 shrink-0 place-items-center rounded-full border border-white/20 bg-[var(--jr-bg)] text-white sm:size-10 lg:size-14">
                  <span className="jr-ring absolute inset-0 rounded-full border border-cyan-300" />
                  {last ? <span className="jr-burst absolute inset-0 rounded-full border border-cyan-300" /> : null}
                  <span className="jr-lit absolute inset-0 rounded-full border border-cyan-300 bg-cyan-700 shadow-[0_0_24px_rgb(91_167_188/0.45)]" />
                  <svg {...svgProps} className={cn("jr-icon relative size-4 sm:size-5 lg:size-7", last && MIRROR_LAST[variant] && "rtl:-scale-x-100")}>
                    {icons[i]}
                  </svg>
                  {last ? (
                    <span className="jr-done absolute -end-1.5 -top-1.5 grid size-3.5 place-items-center sm:size-4 rounded-full bg-white text-[var(--jr-bg)] shadow lg:-end-1 lg:-top-1 lg:size-5">
                      <svg {...svgProps} strokeWidth={3} className="size-2 sm:size-2.5 lg:size-3">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                  ) : null}
                </span>
                {/* Phones: the step number as a large brand numeral in the card corner. Decorative and drawn
                    as generated content (the list already gives the order; faint on purpose). */}
                <span aria-hidden="true" data-n={number} className="type-poster text-[1.375rem] leading-none text-white/20 sm:text-[1.75rem] before:content-[attr(data-n)] lg:hidden" dir="ltr" />
              </div>

              <div className="relative mt-2 sm:mt-3 lg:mt-5">
                <span className="text-cyan-300 hidden text-xs font-semibold tracking-wide lg:block" dir="ltr">
                  {number}
                </span>
                <h3 className="text-sm leading-snug font-semibold text-balance sm:text-[0.9375rem] lg:mt-1 lg:text-base">{step.title}</h3>
                <p className="mt-0.5 text-xs leading-snug text-white/70 text-pretty sm:mt-1 sm:text-[0.8125rem] lg:mt-1.5 lg:text-sm lg:leading-relaxed lg:text-white/75">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
