"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Field, Select, Textarea } from "@/components/ui/form";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Guide = Dictionary["printOnDemand"]["guide"];
type GroupKey = keyof Guide["groups"];

/** Single-choice groups (a plain drop-down); the others allow several answers. */
const SINGLE: GroupKey[] = ["printColors", "sides", "design"];

/** Swatch shown next to each product colour. */
const SWATCH: Record<string, string> = {
  white: "#FFFFFF",
  black: "#111111",
  navy: "#1E2A4A",
  grey: "#9AA0A6",
  red: "#C8443A",
  natural: "#E9DDC7",
};

const Swatch = ({ hex }: { hex: string }) => (
  <span aria-hidden="true" className="border-line-strong size-4 shrink-0 rounded-full border" style={{ backgroundColor: hex }} />
);

/**
 * Project description by choices instead of free writing: one compact drop-down per question
 * (product colour, print colours, sides, purpose, design) and an optional note. Both are
 * combined into the existing `description` field, so the server and database are unchanged.
 * Without JavaScript the plain textarea is submitted as before.
 */
export function ProjectOptions({
  guide,
  choose,
  error,
  defaultNotes,
  hydrated,
}: {
  guide: Guide;
  /** Placeholder of an empty drop-down ("Choose…"). */
  choose: string;
  error?: string;
  defaultNotes?: string;
  hydrated: boolean;
}) {
  const [picked, setPicked] = useState<Partial<Record<GroupKey, string[]>>>({});
  const [notes, setNotes] = useState(defaultNotes ?? "");

  const groups = Object.entries(guide.groups) as Array<[GroupKey, { label: string; options: Record<string, string> }]>;
  const summary = groups
    .filter(([key]) => picked[key]?.length)
    .map(([key, group]) => `${group.label.replace(/\s*[?؟]$/, "")} : ${picked[key]!.map((o) => group.options[o]).join(", ")}`)
    .join("\n");
  const description = [summary, notes.trim()].filter(Boolean).join("\n\n");

  return (
    <fieldset className="space-y-4">
      <legend className="text-fg text-sm font-medium">{guide.title}</legend>
      <p className="text-fg-muted -mt-2 text-sm">{guide.hint}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map(([key, group]) =>
          SINGLE.includes(key) ? (
            <Field key={key} id={`guide-${key}`} label={group.label}>
              {(p) => (
                <Select {...p} value={picked[key]?.[0] ?? ""} onChange={(e) => setPicked((c) => ({ ...c, [key]: e.target.value ? [e.target.value] : [] }))}>
                  <option value="">{choose}</option>
                  {Object.entries(group.options).map(([option, label]) => (
                    <option key={option} value={option}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : (
            <MultiChoice
              key={key}
              label={group.label}
              placeholder={choose}
              options={Object.entries(group.options).map(([value, label]) => ({ value, label, swatch: key === "productColor" ? SWATCH[value] : undefined }))}
              selected={picked[key] ?? []}
              onChange={(next) => setPicked((c) => ({ ...c, [key]: next }))}
            />
          ),
        )}
      </div>

      {/* With JS the combined text is sent; without JS the textarea itself is. */}
      {hydrated ? <input type="hidden" name="description" value={description} /> : null}
      <Field id="description" label={guide.notes} error={error ?? undefined}>
        {(p) => (
          <Textarea
            {...p}
            name={hydrated ? undefined : "description"}
            rows={3}
            maxLength={3000}
            placeholder={guide.notesPlaceholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        )}
      </Field>
    </fieldset>
  );
}

type Option = { value: string; label: string; swatch?: string };

/**
 * Several-answers drop-down: a field-like button that opens a list of checkboxes. Closes on
 * Esc, on a click outside, or when focus tabs out of it. The button shows the choices made.
 */
function MultiChoice({ label, placeholder, options, selected, onChange }: { label: string; placeholder: string; options: Option[]; selected: string[]; onChange: (next: string[]) => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const chosen = options.filter((o) => selected.includes(o.value));
  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <div
      ref={box}
      className="relative flex flex-col gap-1.5"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          setOpen(false);
          document.getElementById(`${id}-button`)?.focus();
        }
      }}
      // Tabbing away closes it. The panel is focusable (tabIndex -1) so a click on an option's
      // text keeps focus inside instead of falling to <main>, which would close it mid-click.
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && !e.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <span id={`${id}-label`} className="text-fg text-sm font-medium">
        {label}
      </span>
      <button
        id={`${id}-button`}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-labelledby={`${id}-label ${id}-button`}
        onClick={() => setOpen((o) => !o)}
        className="border-line-strong bg-bg text-fg focus-visible:border-focus flex h-11 w-full items-center gap-2 rounded-[var(--radius-control)] border ps-3 pe-2 text-start transition-colors hover:border-slate-500 focus-visible:outline-2 focus-visible:outline-offset-0"
      >
        {chosen.length === 0 ? (
          <span className="text-fg-subtle flex-1 truncate">{placeholder}</span>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
            {chosen.map((o) => (o.swatch ? <Swatch key={o.value} hex={o.swatch} /> : null))}
            <span className="truncate">{chosen.map((o) => o.label).join(", ")}</span>
          </span>
        )}
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("text-fg-muted shrink-0 transition-transform duration-200", open && "rotate-180")}>
          <path d="m5 8 5 5 5-5" />
        </svg>
      </button>
      <div
        id={`${id}-panel`}
        role="group"
        aria-labelledby={`${id}-label`}
        tabIndex={-1}
        hidden={!open}
        className="border-line-strong bg-bg absolute outline-none inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto overscroll-contain rounded-[var(--radius-control)] border py-1 shadow-[0_14px_32px_-18px_rgb(14_26_43/0.5)]"
      >
        {options.map((o) => (
          <label key={o.value} className="hover:bg-surface text-fg flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm">
            <input type="checkbox" className="accent-accent size-5 shrink-0" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
            {o.swatch ? <Swatch hex={o.swatch} /> : null}
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
