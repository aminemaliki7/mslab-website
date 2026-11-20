"use client";

import { useId, useMemo, useState, type ComponentProps, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./form";

export type Suggestion = {
  /** Text put in the field. */
  value: string;
  /** Text shown in the list (defaults to the value). */
  label?: string;
};

/** Accent- and case-insensitive text for matching ("écusson" finds "Ecusson"). */
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

type Props = Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "list"> & {
  suggestions: Suggestion[];
  /** Controlled value (with onValueChange), or… */
  value?: string;
  /** …an initial value for an uncontrolled field. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

/**
 * A text field with a drop-down list of suggestions (WAI-ARIA combobox, list autocomplete).
 * The list opens on focus, typing filters it, ↑/↓ move, Enter picks, Esc closes; the chevron
 * opens it with the pointer. Anything not in the list can still be typed. Without JavaScript
 * it is a plain text field.
 */
export function Combobox({ suggestions, value, defaultValue, onValueChange, className, id, onFocus, onBlur, onKeyDown, ...props }: Props) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const listId = `${inputId}-list`;
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  // While the field holds exactly one of the suggestions, show the whole list (to switch);
  // otherwise filter by what has been typed.
  const matches = useMemo(() => {
    const query = fold(current.trim());
    if (!query || suggestions.some((s) => s.value === current)) return suggestions;
    return suggestions.filter((s) => fold(s.label ?? s.value).includes(query) || fold(s.value).includes(query));
  }, [current, suggestions]);
  const shown = open && matches.length > 0;

  const set = (next: string) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  const choose = (s: Suggestion) => {
    set(s.value);
    setOpen(false);
    setActive(-1);
  };

  function keys(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(event.key === "ArrowDown" ? 0 : matches.length - 1);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (matches.length ? (i + step + matches.length) % matches.length : -1));
    } else if (event.key === "Enter" && shown && active >= 0 && matches[active]) {
      event.preventDefault();
      choose(matches[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className="relative">
      <Input
        {...props}
        id={inputId}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={current}
        className={cn("pe-11", className)}
        onChange={(e) => {
          set(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={(e) => {
          onFocus?.(e);
          setOpen(true);
        }}
        onBlur={(e) => {
          onBlur?.(e);
          setOpen(false);
          setActive(-1);
        }}
        onClick={() => setOpen(true)}
        onKeyDown={keys}
      />
      {/* Pointer shortcut only (keyboard users have ↓): not a tab stop. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="text-fg-muted hover:text-fg absolute inset-y-0 end-0 grid w-11 place-items-center"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setOpen((o) => !o);
          document.getElementById(inputId)?.focus();
        }}
      >
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-200", shown && "rotate-180")}>
          <path d="m5 8 5 5 5-5" />
        </svg>
      </button>
      <ul
        id={listId}
        role="listbox"
        hidden={!shown}
        className="border-line-strong bg-bg absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-auto overscroll-contain rounded-[var(--radius-control)] border py-1 shadow-[0_14px_32px_-18px_rgb(14_26_43/0.5)]"
      >
        {matches.map((s, index) => (
          <li
            key={s.value}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            // mousedown keeps focus in the field, so the list does not close before the click.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(s)}
            onMouseEnter={() => setActive(index)}
            className={cn(
              "text-fg flex min-h-10 cursor-pointer items-center justify-between gap-3 px-3 text-sm",
              index === active && "bg-surface",
              s.value === current && "font-semibold",
            )}
          >
            {s.label ?? s.value}
            {s.value === current ? (
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="text-accent shrink-0">
                <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
