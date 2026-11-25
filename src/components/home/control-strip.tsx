import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Printer's control strip: the color bar printed in the margin of a press sheet (process
 * cyan, magenta, yellow, black, then tints of black). MSLAB's one decorative device —
 * used once, in the homepage hero. Always left-to-right, like the real thing.
 * `process`: the four solid inks only (C, M, Y, K); `full`: inks + the four tints of black.
 */
const INKS = ["var(--color-process-c)", "var(--color-process-m)", "var(--color-process-y)", "var(--color-process-k)"];
const TINTS = ["rgb(14 26 43 / 0.75)", "rgb(14 26 43 / 0.5)", "rgb(14 26 43 / 0.25)", "rgb(14 26 43 / 0.1)"];

export function ControlStrip({
  variant = "full",
  className,
  barClassName,
}: {
  variant?: "process" | "full";
  className?: string;
  /** Size of the bar (height, max width); replaces the default h-2.5 / max-w-[20rem]. */
  barClassName?: string;
}) {
  const patches = variant === "process" ? INKS : [...INKS, ...TINTS];
  return (
    <div aria-hidden="true" className={className}>
      {/* Only the bar is LTR (ink order); the bar itself still aligns to the page's start edge. */}
      <div dir="ltr" className={cn("flex w-full", barClassName ?? "h-2.5 max-w-[20rem]")}>
        {patches.map((color, index) => (
          <span key={color} className="control-patch flex-1" style={{ backgroundColor: color, "--i": index } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
