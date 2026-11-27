"use client";

/** Opens the browser's print dialog ("Save as PDF" produces the PDF — no PDF library needed). */
export function PrintButton({ label, hint }: { label: string; hint: string }) {
  return (
    <button
      type="button"
      title={hint}
      onClick={() => window.print()}
      className="border-line-strong text-fg hover:bg-surface inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium print:hidden"
    >
      {label}
    </button>
  );
}
