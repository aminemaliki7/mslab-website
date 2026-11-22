"use client";

import { useState } from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { Field, Textarea } from "@/components/ui/form";
import { MultiDropdown } from "@/components/ui/multi-dropdown";
import type { Dictionary } from "@/i18n/dictionaries";

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
                <Dropdown {...p} value={picked[key]?.[0] ?? ""} onChange={(e) => setPicked((c) => ({ ...c, [key]: e.target.value ? [e.target.value] : [] }))}>
                  <option value="">{choose}</option>
                  {Object.entries(group.options).map(([option, label]) => (
                    <option key={option} value={option}>
                      {label}
                    </option>
                  ))}
                </Dropdown>
              )}
            </Field>
          ) : (
            <MultiDropdown
              key={key}
              label={group.label}
              placeholder={choose}
              options={Object.entries(group.options).map(([value, label]) => ({ value, label, swatch: key === "productColor" ? SWATCH[value] : undefined }))}
              value={picked[key] ?? []}
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
