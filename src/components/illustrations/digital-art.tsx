import type { ReactNode } from "react";
import { C, Svg } from "./scenes";

/**
 * Digital Solutions visuals (docs/DESIGN_SYSTEM.md §11 style: flat shapes, brand colours,
 * light motion neutralised by prefers-reduced-motion). A web page in a browser window with a
 * phone beside it: a layout being built, code lines being written, a chart growing. Generic
 * interface shapes only — no client, brand or project shown.
 */
export function DigitalScene({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 400 300" className={className}>
      {/* Browser window */}
      <rect x="20" y="30" width="300" height="210" rx="12" fill={C.white} stroke={C.ink} strokeWidth="2.5" />
      <path d="M20 42a12 12 0 0 1 12-12h276a12 12 0 0 1 12 12v18H20z" fill={C.paperDeep} stroke={C.ink} strokeWidth="2.5" />
      <circle cx="38" cy="45" r="4" fill={C.cyan} />
      <circle cx="52" cy="45" r="4" fill={C.pencil} />
      <circle cx="66" cy="45" r="4" fill={C.cyanLight} />
      <rect x="84" y="38" width="160" height="14" rx="7" fill={C.white} stroke={C.line} strokeWidth="1.5" />
      {/* Page: navigation, hero block, cards */}
      <rect x="36" y="72" width="40" height="6" rx="3" fill={C.ink} />
      <rect x="200" y="72" width="22" height="6" rx="3" fill={C.line} />
      <rect x="228" y="72" width="22" height="6" rx="3" fill={C.line} />
      <rect x="256" y="70" width="48" height="10" rx="5" fill={C.cyan} />
      <rect x="36" y="92" width="268" height="62" rx="8" fill={C.cyanSoft} />
      <rect x="50" y="106" width="110" height="9" rx="4" fill={C.ink} />
      <rect x="50" y="121" width="80" height="6" rx="3" fill={C.inkSoft} opacity="0.5" />
      <rect x="50" y="135" width="44" height="10" rx="5" fill={C.cyan} />
      {/* Chart in the hero block */}
      <g transform="translate(210 102)">
        {[22, 34, 18, 40].map((h, i) => (
          <rect key={i} className="anim-grow-y" x={i * 18} y={42 - h} width="11" height={h} rx="2" fill={i === 3 ? C.pencil : C.cyanLight} style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${36 + i * 92} 166)`}>
          <rect width="84" height="58" rx="7" fill={C.paper} stroke={C.line} strokeWidth="1.5" />
          <rect x="10" y="10" width="26" height="18" rx="4" fill={i === 1 ? C.pencil : C.cyanLight} opacity="0.85" />
          <rect x="10" y="36" width="56" height="5" rx="2.5" fill={C.ink} opacity="0.75" />
          <rect x="10" y="46" width="40" height="4" rx="2" fill={C.line} />
        </g>
      ))}
      {/* Code panel being written */}
      <g transform="translate(232 196)">
        <rect width="132" height="78" rx="10" fill={C.ink} />
        <path d="M14 18l-7 7 7 7M30 18l7 7-7 7" stroke={C.cyanLight} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {[
          [48, 20, 60, C.pencil],
          [48, 32, 44, C.cyanLight],
          [14, 48, 72, C.white],
          [14, 60, 50, C.cyanLight],
        ].map(([x, y, w, color], i) => (
          <path
            key={i}
            className="anim-draw-loop"
            strokeDasharray={w as number}
            style={{ ["--dash" as string]: w, animationDelay: `${i * 0.3}s` }}
            d={`M${x} ${y}h${w}`}
            stroke={color as string}
            strokeWidth="4"
            strokeLinecap="round"
            opacity={i === 2 ? 0.7 : 1}
          />
        ))}
      </g>
      {/* Phone: the same page, responsive */}
      <g className="anim-float anim-float-slow">
        <g transform="translate(0 -20)">
        <rect x="318" y="88" width="64" height="118" rx="12" fill={C.white} stroke={C.ink} strokeWidth="2.5" />
        <rect x="341" y="95" width="18" height="4" rx="2" fill={C.ink} />
        <rect x="327" y="108" width="46" height="30" rx="5" fill={C.cyanSoft} />
        <rect x="333" y="116" width="28" height="5" rx="2.5" fill={C.ink} />
        <rect x="333" y="126" width="16" height="6" rx="3" fill={C.cyan} />
        <rect x="327" y="146" width="46" height="20" rx="4" fill={C.paper} stroke={C.line} strokeWidth="1.2" />
        <rect x="327" y="172" width="46" height="20" rx="4" fill={C.paper} stroke={C.line} strokeWidth="1.2" />
        </g>
      </g>
      {/* Cursor */}
      <g className="anim-float" style={{ animationDelay: "1.2s" }}>
        <path d="M158 132l0 26 7-6 5 11 6-3-5-10 9-1z" fill={C.white} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
      </g>
      <ellipse cx="200" cy="284" rx="170" ry="6" fill={C.paperDeep} />
    </Svg>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

/** One line icon per digital service, in the order of `digital.services` in the dictionaries. */
const ICON_PATHS: ReactNode[] = [
  // Corporate website: browser with a page layout.
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 8.5h18M7 12h6M7 15.5h4M15.5 12h2v3.5h-2z" />
  </>,
  // E-commerce: shopping cart.
  <>
    <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </>,
  // Custom web application: code brackets.
  <>
    <path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 5l-3 14" />
  </>,
  // Management platform: dashboard with chart.
  <>
    <rect x="3" y="3.5" width="18" height="17" rx="2" />
    <path d="M3 8h18M7.5 17v-3.5M11.5 17v-6M15.5 17v-4.5" />
  </>,
  // UI/UX design: pen tool over an artboard.
  <>
    <path d="M4 20h7M12 3.5l6.5 6.5-5 5-3.5-1-1-3.5z" />
    <circle cx="12.6" cy="10.4" r="1.2" />
    <path d="M9 14.5 4 19.5" />
  </>,
  // Maintenance & support: wrench.
  <>
    <path d="M14.7 6.3a4 4 0 0 0-5.3 5.3L4 17l3 3 5.4-5.4a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.3-.7-.7-2.3z" />
  </>,
];

export function DigitalIcon({ index, className }: { index: number; className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      {ICON_PATHS[index] ?? null}
    </svg>
  );
}
