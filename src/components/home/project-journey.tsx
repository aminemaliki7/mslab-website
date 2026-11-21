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
 *
 * - CSS only (no JavaScript, no dependency): every animation of a journey shares one 15 s cycle,
 *   so all parts stay in sync; keyframes are generated below from one timing table, scoped per
 *   variant (`.jr-v-<variant>`) so two journeys can never interfere.
 * - Horizontal from `lg`, vertical below; in Arabic the journey runs right to left (the truck
 *   faces left). Motion uses transform/opacity (plus small stroke draws) — no layout work.
 * - prefers-reduced-motion: nothing moves; the finished journey is shown (every stage lit).
 * - The list is plain text for assistive technologies; the drawings are decorative.
 */

type Step = { title: string; body: string };
type Variant = "production" | "web";

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
  // Layout: vertical (nodes at the inline start) below lg, horizontal from lg.
  css.push(
    `.jr{--jx:0;--jy:1}`,
    `${v} .jr-track{position:absolute;top:1.75rem;bottom:calc(100% / ${stages} - 1.75rem);inset-inline-start:calc(1.75rem - 1px);width:2px}`,
    `.jr-rail{overflow:hidden;border-radius:2px;background:rgb(255 255 255 / 0.14)}`,
    `.jr-fill,.jr-runner{position:absolute;inset:0}`,
    `.jr-runner{opacity:0}`, // the dot only shows while it travels
    `.jr-fill{background:#5ba7bc}`,
    `.jr-dot{position:absolute;left:50%;bottom:0;width:14px;height:14px;border-radius:999px;background:#fff;transform:translate(-50%,50%);box-shadow:0 0 0 4px rgb(91 167 188 / 0.35),0 0 18px 4px rgb(91 167 188 / 0.7)}`,
    `.jr-dot::after{content:"";position:absolute;inset:-7px;border-radius:inherit;border:1px solid rgb(91 167 188 / 0.7);opacity:0}`,
    `@media (min-width:64rem){.jr{--jx:1;--jy:0}[dir="rtl"] .jr{--jx:-1}` +
      `${v} .jr-track{top:calc(1.75rem - 1px);bottom:auto;height:2px;width:auto;inset-inline:calc(100% / ${stages * 2})}` +
      `.jr-dot{left:auto;bottom:auto;top:50%;inset-inline-end:0;transform:translate(50%,-50%)}[dir="rtl"] .jr-dot{transform:translate(-50%,-50%)}}`,
    `.jr-ring,.jr-burst{opacity:0}`,
    `.jr svg .jr-fx{transform-box:fill-box;transform-origin:center}`,
    `.jr svg .jr-line{transform-origin:left center}`,
    `.jr svg .jr-dash{stroke-dasharray:1;stroke-dashoffset:0}`,
  );

  // Motion only for visitors who accept it.
  const motion: string[] = [];
  motion.push(
    `.jr-fill,.jr-runner,.jr-lit,.jr-icon,.jr-ring,.jr-burst,.jr-done,.jr .jr-fx{animation-duration:${CYCLE_S}s;animation-iteration-count:infinite;animation-timing-function:ease-in-out}`,
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

const JOURNEY_CSS: Record<Variant, string> = { production: buildCss("production"), web: buildCss("web") };

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
};

/** The last stage's drawing is mirrored in Arabic when it has a direction (the truck). */
const MIRROR_LAST: Record<Variant, boolean> = { production: true, web: false };
/** Static class names (Tailwind only generates classes it can read in the source). */
const DESKTOP_COLUMNS: Record<number, string> = { 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" };

/**
 * `background` is the colour of the band the journey sits on: the stage circles are filled with
 * it so the timeline passes behind them. `steps` must have as many items as the variant has
 * drawings (production: 6, web: 5).
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
      {/* Timeline: rail + fill, and the travelling dot (decorative). */}
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
      <ol className={cn("relative grid auto-rows-fr lg:auto-rows-auto", DESKTOP_COLUMNS[icons.length])}>
        {items.map((step, i) => (
          <li
            key={step.title}
            className={cn(
              `jr-s${i}`,
              "relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 pb-8 lg:flex lg:flex-col lg:items-center lg:px-3 lg:pb-0 lg:text-center",
            )}
          >
            <span aria-hidden="true" className="relative grid size-14 place-items-center rounded-full border border-white/20 bg-[var(--jr-bg)] text-white">
              <span className="jr-ring absolute inset-0 rounded-full border border-cyan-300" />
              {i === items.length - 1 ? <span className="jr-burst absolute inset-0 rounded-full border border-cyan-300" /> : null}
              <span className="jr-lit absolute inset-0 rounded-full border border-cyan-300 bg-cyan-700 shadow-[0_0_24px_rgb(91_167_188/0.45)]" />
              <svg {...svgProps} className={cn("jr-icon relative size-7", i === items.length - 1 && MIRROR_LAST[variant] && "rtl:-scale-x-100")}>
                {icons[i]}
              </svg>
              {i === items.length - 1 ? (
                <span className="jr-done absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-white text-[var(--jr-bg)] shadow">
                  <svg {...svgProps} strokeWidth={3} className="size-3">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
              ) : null}
            </span>
            <div className="pt-1 lg:mt-5 lg:pt-0">
              <span className="text-cyan-300 block text-xs font-semibold tracking-wide" dir="ltr">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 text-base font-semibold text-balance">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/75 text-pretty">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
