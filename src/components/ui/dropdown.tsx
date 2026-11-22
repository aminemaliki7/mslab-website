"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { control } from "./form";

type Option = { value: string; label: ReactNode; text: string; disabled: boolean };

const textOf = (node: ReactNode): string =>
  typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(textOf).join("") : "";

/** The <option> children, in order (arrays from .map() are flattened by Children). */
function readOptions(children: ReactNode): Option[] {
  const out: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== "option") return;
    const p = child.props as ComponentProps<"option">;
    const text = textOf(p.children);
    out.push({ value: p.value === undefined ? text : String(p.value), label: p.children, text, disabled: Boolean(p.disabled) });
  });
  return out;
}

const noop = () => () => {};
/** false during SSR and hydration, true afterwards (no effect, no extra state). */
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

/** Sets the native select's value the way a user would, so React's onChange and listeners run. */
function commit(select: HTMLSelectElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

const PANEL_MAX = 288; // px, 18rem

/**
 * Drop-in replacement for <select> on the public site: same props, same <option> children.
 *
 * The native select stays in the form as the source of truth (name, value, onChange, form data,
 * fillField), so nothing changes for the server or for callers. Without JavaScript, and until
 * hydration, it IS the control. Once hydrated it is visually hidden and a custom list replaces
 * the phone's picker wheel: a field-like button (WAI-ARIA select-only combobox) opening a list
 * under the field — or above it when there is no room below — with 44 px options and a check
 * on the chosen one. Keys: ↑/↓/Home/End move, Enter/Space choose, Esc closes, letters jump.
 * The button takes the select's id, so <label htmlFor> and fillField(id) keep working.
 */
export function Dropdown({
  children,
  className,
  id,
  value,
  defaultValue,
  onChange,
  disabled,
  dir,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...props
}: ComponentProps<"select">) {
  const hydrated = useHydrated();
  const autoId = useId();
  const baseId = id ?? autoId;
  const listId = `${baseId}-list`;
  const nativeId = `${baseId}-native`;
  const options = readOptions(children);

  const selectRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(() => String(defaultValue ?? options[0]?.value ?? ""));
  const current = value !== undefined ? String(value) : inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState<{ up: boolean; max: number }>({ up: false, max: PANEL_MAX });
  const typed = useRef({ text: "", at: 0 });

  const selected = options.find((o) => o.value === current);
  const isPlaceholder = !selected || selected.value === "";

  // Keep the button in step with the native select, whoever changes it (fillField, form reset).
  useEffect(() => {
    const select = selectRef.current;
    if (!select) return;
    const sync = () => setInner(select.value);
    const reset = () => setTimeout(sync, 0);
    select.addEventListener("change", sync);
    select.form?.addEventListener("reset", reset);
    return () => {
      select.removeEventListener("change", sync);
      select.form?.removeEventListener("reset", reset);
    };
  }, []);

  // Click/tap outside closes.
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  // The highlighted option stays visible inside a long list.
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  const enabled = (i: number) => options[i] && !options[i].disabled;
  const step = (from: number, by: 1 | -1) => {
    for (let n = 1; n <= options.length; n++) {
      const i = (from + by * n + options.length) % options.length;
      if (enabled(i)) return i;
    }
    return from;
  };

  function show(at?: number) {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 84; // under the sticky header
      const up = below < Math.min(PANEL_MAX, options.length * 44 + 8) && above > below;
      setPlace({ up, max: Math.max(132, Math.min(PANEL_MAX, up ? above : below)) });
    }
    const index = options.findIndex((o) => o.value === current);
    setActive(at ?? (index >= 0 ? index : step(-1, 1)));
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    if (selectRef.current) commit(selectRef.current, option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  /** Type-ahead: letters typed within 0.7 s form a prefix to jump to. */
  function jump(char: string) {
    const now = Date.now();
    typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + char.toLowerCase(), at: now };
    const from = open ? active : options.findIndex((o) => o.value === current);
    const order = options.map((_, n) => (from + 1 + n) % options.length);
    const hit = order.find((i) => enabled(i) && options[i].text.toLowerCase().startsWith(typed.current.text));
    if (hit === undefined) return;
    if (open) setActive(hit);
    else choose(hit);
  }

  function keys(e: KeyboardEvent<HTMLButtonElement>) {
    const k = e.key;
    if (!open) {
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
        e.preventDefault();
        show();
      } else if (k === "Home" || k === "End") {
        e.preventDefault();
        show(k === "Home" ? step(-1, 1) : step(options.length, -1));
      } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) jump(k);
      return;
    }
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      setActive((i) => step(i, k === "ArrowDown" ? 1 : -1));
    } else if (k === "Home" || k === "End") {
      e.preventDefault();
      setActive(k === "Home" ? step(-1, 1) : step(options.length, -1));
    } else if (k === "Enter" || k === " ") {
      e.preventDefault();
      choose(active);
    } else if (k === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (k === "Tab") {
      setOpen(false);
    } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) jump(k);
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <select
        ref={selectRef}
        {...props}
        id={hydrated ? nativeId : baseId}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        dir={dir}
        aria-label={hydrated ? undefined : ariaLabel}
        aria-describedby={hydrated ? undefined : describedBy}
        aria-invalid={hydrated ? undefined : invalid}
        aria-hidden={hydrated ? true : undefined}
        tabIndex={hydrated ? -1 : undefined}
        className={hydrated ? "sr-only" : cn(control, "select-control h-12 pe-10 sm:h-11")}
      >
        {children}
      </select>

      {hydrated ? (
        <>
          <button
            ref={buttonRef}
            id={baseId}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
            aria-label={ariaLabel}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            data-select={nativeId}
            disabled={disabled}
            dir={dir}
            onClick={() => (open ? setOpen(false) : show())}
            onKeyDown={keys}
            onBlur={(e) => {
              if (!boxRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
            }}
            className={cn(
              control,
              "flex h-12 items-center gap-2 pe-3 text-start max-sm:text-base pointer-coarse:text-base sm:h-11",
              open && "border-focus",
            )}
          >
            <span className={cn("min-w-0 flex-1 truncate", isPlaceholder && "text-fg-subtle")}>{selected?.label ?? options[0]?.label}</span>
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("text-fg-muted shrink-0 transition-transform duration-200", open && "rotate-180")}>
              <path d="m5 8 5 5 5-5" />
            </svg>
          </button>
          <ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabel ? undefined : baseId}
            hidden={!open}
            style={{ maxHeight: place.max }}
            className={cn(
              "border-line-strong bg-bg anim-pop absolute inset-x-0 z-30 overflow-auto overscroll-contain rounded-[var(--radius-control)] border py-1 shadow-[0_14px_32px_-18px_rgb(14_26_43/0.5)]",
              place.up ? "bottom-full mb-1" : "top-full mt-1",
            )}
          >
            {options.map((o, index) => {
              const chosen = o.value === current;
              return (
                <li
                  key={`${o.value}-${index}`}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={chosen}
                  aria-disabled={o.disabled || undefined}
                  // mousedown keeps focus on the button, so the list does not close before the click.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(index)}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 text-[0.9375rem] transition-colors",
                    o.value === "" ? "text-fg-muted" : "text-fg",
                    index === active && "bg-surface",
                    chosen && "font-semibold",
                    o.disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span className="min-w-0">{o.label}</span>
                  {chosen && o.value !== "" ? (
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="text-accent shrink-0">
                      <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
