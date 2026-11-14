import { cn } from "@/lib/utils";

/**
 * MSLAB logo (original SVG, ADR-019): a sheet of paper with a folded corner (print trade)
 * carrying an "M" monogram, followed by the MSLAB wordmark in Geist.
 * Source files: public/brand/mslab-mark.svg, public/brand/mslab-logo.svg; favicon: app/icon.svg.
 */
export function LogoMark({ inverted = false, intro = false, className }: { inverted?: boolean; intro?: boolean; className?: string }) {
  const sheet = inverted ? "#FFFFFF" : "#0E1A2B";
  const monogram = inverted ? "#0E1A2B" : "#FFFFFF";
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={cn("logo-mark size-8 shrink-0", className)}>
      <path fill={sheet} d="M6 0H24L32 8V26A6 6 0 0 1 26 32H6A6 6 0 0 1 0 26V6A6 6 0 0 1 6 0Z" />
      {/* Intro (first page of a visit, see globals.css): the sheet starts whole, then its corner folds back. */}
      {intro ? <path className="logo-corner-front" fill={sheet} d="M23 0H32V9Z" /> : null}
      <g className="logo-corner-flap">
        <path className="logo-corner-flap-front" fill="#0B6E8A" d="M24 0V6A2 2 0 0 0 26 8H32Z" />
        <path className="logo-corner-flap-back" fill={sheet} d="M24 0V6A2 2 0 0 0 26 8H32Z" />
      </g>
      <path
        fill="none"
        stroke={monogram}
        strokeWidth={3.2}
        strokeLinecap="square"
        d="M8.5 23.5V10.5L16 18L23.5 10.5V23.5"
      />
    </svg>
  );
}

/** Logo lockup. Always LTR — it is a Latin brand name. */
export function Wordmark({ className, inverted = false, intro = false }: { className?: string; inverted?: boolean; intro?: boolean }) {
  return (
    <span dir="ltr" className={cn("logo-lockup inline-flex items-center gap-2.5 font-[family-name:var(--font-geist)]", className)}>
      <LogoMark inverted={inverted} intro={intro} />
      <span className={cn("text-xl leading-none font-bold tracking-tight", inverted ? "text-white" : "text-fg")}>MSLAB</span>
    </span>
  );
}
