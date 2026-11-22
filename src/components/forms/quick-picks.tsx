"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type QuickPick = {
  label: string;
  /** Field id → value to put in it (one pick can fill several fields, e.g. width + height + unit). */
  values: Record<string, string>;
};

/** Set a form control's value the way typing would, so React and validation see the change. */
/** Local date `days` from today as YYYY-MM-DD (the value of an <input type="date">). */
export function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fillField(id: string, value: string) {
  let el = document.getElementById(id);
  // A custom Dropdown gives its id to the visible button; the value lives in its native select.
  if (el instanceof HTMLButtonElement && el.dataset.select) el = document.getElementById(el.dataset.select);
  if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) return;
  const proto = Object.getPrototypeOf(el) as HTMLInputElement;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * A row of ready-made answers above a field: tapping one fills the field(s) instead of
 * typing. The field itself stays editable for anything not in the list. Without JavaScript
 * the buttons do nothing and the visitor simply types.
 */
export function QuickPicks({ label, picks, className }: { label: string; picks: QuickPick[]; className?: string }) {
  const [chosen, setChosen] = useState<number | null>(null);
  if (picks.length === 0) return null;
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {picks.map((pick, index) => (
        <button
          key={pick.label}
          type="button"
          aria-pressed={chosen === index}
          onClick={() => {
            for (const [id, value] of Object.entries(pick.values)) fillField(id, value);
            setChosen(index);
            const first = Object.keys(pick.values)[0];
            if (first) document.getElementById(first)?.focus({ preventScroll: true });
          }}
          className={cn(
            "inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm transition-colors active:scale-[0.97]",
            chosen === index ? "border-fg bg-fg text-bg" : "border-line-strong bg-bg text-fg hover:border-fg",
          )}
        >
          {pick.label}
        </button>
      ))}
    </div>
  );
}
