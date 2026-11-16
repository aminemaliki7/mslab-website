"use client";

import { useState } from "react";
import { Field, Textarea } from "@/components/ui/form";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Guide = Dictionary["printOnDemand"]["guide"];
type GroupKey = keyof Guide["groups"];

/** Single-choice groups; the others allow several answers. */
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

/**
 * Project description by choices instead of free writing: the visitor taps options (product
 * colour, print colours, sides, purpose, design) and may add a short note. Both are combined
 * into the existing `description` field, so the server and database are unchanged. Without
 * JavaScript the plain textarea is submitted as before.
 */
export function ProjectOptions({ guide, error, defaultNotes, hydrated }: { guide: Guide; error?: string; defaultNotes?: string; hydrated: boolean }) {
  const [picked, setPicked] = useState<Partial<Record<GroupKey, string[]>>>({});
  const [notes, setNotes] = useState(defaultNotes ?? "");

  const toggle = (group: GroupKey, option: string) =>
    setPicked((current) => {
      const list = current[group] ?? [];
      const next = list.includes(option) ? list.filter((o) => o !== option) : SINGLE.includes(group) ? [option] : [...list, option];
      return { ...current, [group]: next };
    });

  const groups = Object.entries(guide.groups) as Array<[GroupKey, { label: string; options: Record<string, string> }]>;
  const summary = groups
    .filter(([key]) => picked[key]?.length)
    .map(([key, group]) => `${group.label.replace(/\s*[?؟]$/, "")} : ${picked[key]!.map((o) => group.options[o]).join(", ")}`)
    .join("\n");
  const description = [summary, notes.trim()].filter(Boolean).join("\n\n");

  return (
    <fieldset className="space-y-5">
      <legend className="text-fg text-sm font-medium">{guide.title}</legend>
      <p className="text-fg-muted -mt-3 text-sm">{guide.hint}</p>
      {groups.map(([key, group]) => (
        <div key={key} role="group" aria-label={group.label}>
          <p className="text-fg mb-2 text-sm font-semibold">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(group.options).map(([option, label]) => {
              const active = picked[key]?.includes(option) ?? false;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(key, option)}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors active:scale-[0.97]",
                    active ? "border-fg bg-fg text-bg" : "border-line-strong bg-bg text-fg hover:border-fg",
                  )}
                >
                  {key === "productColor" && SWATCH[option] ? (
                    <span aria-hidden="true" className="border-line-strong size-4 rounded-full border" style={{ backgroundColor: SWATCH[option] }} />
                  ) : null}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

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
