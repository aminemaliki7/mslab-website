/**
 * Printer's control strip: the color bar printed in the margin of a press sheet (process
 * cyan, magenta, yellow, black, then tints of black). MSLAB's one decorative device —
 * used once under the homepage hero. Always left-to-right, like the real thing.
 */
const PATCHES = [
  "var(--color-process-c)",
  "var(--color-process-m)",
  "var(--color-process-y)",
  "var(--color-process-k)",
  "rgb(14 26 43 / 0.75)",
  "rgb(14 26 43 / 0.5)",
  "rgb(14 26 43 / 0.25)",
  "rgb(14 26 43 / 0.1)",
];

export function ControlStrip({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" dir="ltr" className={className}>
      <div className="flex h-2.5 w-full max-w-[20rem]">
        {PATCHES.map((color) => (
          <span key={color} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}
