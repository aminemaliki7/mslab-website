import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Original line illustrations for MSLAB (docs/DESIGN_SYSTEM.md §11). Abstract on purpose:
 * they never depict real premises, staff, clients or products. Inline SVG (≈1–2 KB each),
 * brand colors, decorative (aria-hidden). Motion classes live in globals.css.
 */
const C = {
  ink: "#0E1A2B",
  inkSoft: "#2A3A52",
  cyan: "#0B6E8A",
  cyanSoft: "#E7F2F5",
  paper: "#F7F6F2",
  paperDeep: "#EFEDE6",
  // Darker than the UI hairline token so "text lines" stay visible on white sheets.
  line: "#D2CEC3",
  lineStrong: "#C9C6BC",
  white: "#FFFFFF",
};

function Svg({ viewBox, className, children }: { viewBox: string; className?: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} aria-hidden="true" focusable="false" className={cn("h-auto", className ?? "w-full")} fill="none">
      {children}
    </svg>
  );
}

const dash = (length: number, delay = 0): CSSProperties =>
  ({ "--dash": length, animationDelay: `${delay}ms` }) as CSSProperties;

/** Business services / quotation: a clipboard whose checklist ticks itself. */
export function ChecklistIllustration({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 160 120" className={className}>
      <rect x="40" y="14" width="80" height="100" rx="8" fill={C.white} stroke={C.ink} strokeWidth="2.5" />
      <rect x="62" y="6" width="36" height="16" rx="5" fill={C.ink} />
      {[40, 62, 84].map((y, i) => (
        <g key={y}>
          <rect x="52" y={y} width="14" height="14" rx="3" stroke={C.ink} strokeWidth="2" fill={C.white} />
          <path className="anim-draw" style={dash(20, 400 + i * 350)} d={`M55 ${y + 7.5}L58.5 ${y + 11}L63.5 ${y + 3.5}`} stroke={C.cyan} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="74" y={y + 4} width={i === 2 ? 22 : 34} height="6" rx="3" fill={C.line} />
        </g>
      ))}
      <g className="anim-float" style={{ animationDelay: "0.8s" }}>
        <circle cx="122" cy="96" r="16" fill={C.cyan} />
        <path d="M114 96L120 102L131 90" stroke={C.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Svg>
  );
}

/** Contact: an envelope with a letter rising out of it. */
export function EnvelopeIllustration({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 160 120" className={className}>
      <g className="anim-float">
        <rect x="44" y="12" width="72" height="62" rx="4" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
        <rect x="54" y="24" width="30" height="5" rx="2.5" fill={C.ink} />
        <rect x="54" y="35" width="52" height="4" rx="2" fill={C.line} />
        <rect x="54" y="43" width="44" height="4" rx="2" fill={C.line} />
      </g>
      <path d="M24 52H136V104A6 6 0 0 1 130 110H30A6 6 0 0 1 24 104Z" fill={C.ink} />
      <path d="M24 52L80 88L136 52" stroke={C.inkSoft} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 110L64 78M136 110L96 78" stroke={C.inkSoft} strokeWidth="2.5" />
      <circle cx="128" cy="52" r="10" fill={C.cyan} stroke={C.white} strokeWidth="3" />
    </Svg>
  );
}

/** 404 / empty states: a folded sheet with a question mark. */
export function LostSheetIllustration({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 160 120" className={className}>
      <g className="anim-float">
        <path d="M52 10H96L114 28V102A6 6 0 0 1 108 108H52A6 6 0 0 1 46 102V16A6 6 0 0 1 52 10Z" fill={C.white} stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M96 10V24A4 4 0 0 0 100 28H114Z" fill={C.cyan} />
        <path d="M70 52A10 10 0 1 1 82 62C80 63 80 65 80 68" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
        <circle cx="80" cy="82" r="3.5" fill={C.ink} />
      </g>
      <ellipse cx="80" cy="114" rx="34" ry="3" fill={C.paperDeep} />
    </Svg>
  );
}

/** Small neutral placeholder for products without a photo. */
export function ProductPlaceholderIllustration({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 64 64" className={className}>
      <path d="M18 8H40L50 18V54A2 2 0 0 1 48 56H18A2 2 0 0 1 16 54V10A2 2 0 0 1 18 8Z" fill={C.white} stroke={C.lineStrong} strokeWidth="2" />
      <path d="M40 8V16A2 2 0 0 0 42 18H50Z" fill={C.line} />
      <path d="M22 44L30 34L36 40L40 36L46 44Z" fill={C.lineStrong} />
      <circle cx="40" cy="27" r="3" fill={C.lineStrong} />
    </Svg>
  );
}
