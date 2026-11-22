"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

export type MultiOption = { value: string; label: string; swatch?: string };

const noop = () => () => {};
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);
const PANEL_MAX = 288;

const Swatch = ({ hex }: { hex: string }) => (
  <span aria-hidden="true" className="border-line-strong size-4 shrink-0 rounded-full border" style={{ backgroundColor: hex }} />
);

type Props = {
  label: string;
  options: MultiOption[];
  /** Text of the closed field when nothing is chosen ("Choose…"). */
  placeholder: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /**
   * With a name, the checkboxes are real form fields (name=value per choice), and without
   * JavaScript they show as a plain list. Without one, the choices live in state only.
   */
  name?: string;
  defaultValue?: string[];
  /** Controlled use (with onChange). */
  value?: string[];
  onChange?: (next: string[]) => void;
  className?: string;
};

/**
 * Several-answers drop-down, the multi-choice sibling of ui/dropdown.tsx: a field-like button
 * showing what is chosen, opening a list of checkboxes under the field (above it when there is
 * no room below). Closes on Esc, on a tap outside, or when focus tabs out. The button carries
 * aria-invalid on error, so useFocusFirstError lands on it.
 */
export function MultiDropdown({ label, options, placeholder, hint, error, required, name, defaultValue, value, onChange, className }: Props) {
  const hydrated = useHydrated();
  const id = useId();
  const [inner, setInner] = useState<string[]>(defaultValue ?? []);
  const selected = value ?? inner;
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState({ up: false, max: PANEL_MAX });
  const box = useRef<HTMLFieldSetElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const set = (next: string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const toggle = (v: string) => set(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  function show() {
    const rect = button.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 84; // under the sticky header
      const up = below < Math.min(PANEL_MAX, options.length * 44 + 8) && above > below;
      setPlace({ up, max: Math.max(132, Math.min(PANEL_MAX, up ? above : below)) });
    }
    setOpen(true);
  }

  const chosen = options.filter((o) => selected.includes(o.value));
  // No JavaScript and real form fields: show the checkboxes as a plain list.
  const inline = !hydrated && Boolean(name);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <fieldset
      ref={box}
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      className={cn("relative flex min-w-0 flex-col gap-1.5", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          setOpen(false);
          button.current?.focus();
        }
      }}
      // Tabbing away closes it. The panel is focusable (tabIndex -1) so a tap on an option's text
      // keeps focus inside instead of falling to <main>, which would close it mid-tap.
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && !e.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <legend id={`${id}-label`} className="text-fg float-start w-full p-0 text-sm font-medium">
        {label}
        {required ? (
          <span className="text-danger ms-0.5" aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>
      {hint ? (
        <p id={hintId} className="text-fg-muted -mt-1 text-sm">
          {hint}
        </p>
      ) : null}

      {/* The list is anchored to the field (not the fieldset), so it opens right under it. */}
      <div className="relative">
      {inline ? null : (
        <button
          ref={button}
          id={`${id}-button`}
          type="button"
          // Combobox opening a non-modal dialog of checkboxes (supports aria-invalid, unlike a button).
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          aria-labelledby={`${id}-label ${id}-button`}
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          onClick={() => (open ? setOpen(false) : show())}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              show();
            }
          }}
          className={cn(
            "border-line-strong bg-bg text-fg focus-visible:border-focus flex h-12 w-full items-center gap-2 rounded-[var(--radius-control)] border ps-3 pe-3 text-start transition-colors hover:border-slate-500 focus-visible:outline-2 focus-visible:outline-offset-0 max-sm:text-base pointer-coarse:text-base aria-[invalid=true]:border-danger sm:h-11",
            open && "border-focus",
          )}
        >
          {chosen.length === 0 ? (
            <span className="text-fg-subtle min-w-0 flex-1 truncate">{placeholder}</span>
          ) : (
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              {chosen.map((o) => (o.swatch ? <Swatch key={o.value} hex={o.swatch} /> : null))}
              <span className="truncate">{chosen.map((o) => o.label).join(", ")}</span>
            </span>
          )}
          {chosen.length > 1 ? (
            <span className="bg-accent-soft text-accent shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" aria-hidden="true">
              {chosen.length}
            </span>
          ) : null}
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("text-fg-muted shrink-0 transition-transform duration-200", open && "rotate-180")}>
            <path d="m5 8 5 5 5-5" />
          </svg>
        </button>
      )}

      <div
        id={`${id}-panel`}
        role={inline ? "group" : "dialog"}
        aria-labelledby={`${id}-label`}
        tabIndex={-1}
        hidden={!inline && !open}
        style={inline ? undefined : { maxHeight: place.max }}
        className={
          inline
            ? "grid gap-x-4 gap-y-1 sm:grid-cols-2"
            : cn(
                "border-line-strong bg-bg anim-pop absolute inset-x-0 z-30 overflow-auto overscroll-contain rounded-[var(--radius-control)] border py-1 shadow-[0_14px_32px_-18px_rgb(14_26_43/0.5)] outline-none",
                place.up ? "bottom-full mb-1" : "top-full mt-1",
              )
        }
      >
        {options.map((o) => (
          <label key={o.value} className={cn("text-fg flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem]", inline ? "" : "hover:bg-surface px-3 has-[:checked]:font-semibold")}>
            <input
              type="checkbox"
              name={name}
              value={o.value}
              className="accent-accent size-5 shrink-0"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
            />
            {o.swatch ? <Swatch hex={o.swatch} /> : null}
            {o.label}
          </label>
        ))}
      </div>
      </div>

      {error ? (
        <p id={errorId} className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
