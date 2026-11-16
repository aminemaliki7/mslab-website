"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SPEC_PRESETS, type SpecPreset } from "@/features/admin/presets";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { useAdminT } from "./admin-i18n";

type Text = { fr: string; ar?: string; en?: string };
export type Spec = { label: Text; value: Text };

let counter = 0;
const keyed = (spec: Spec, preset?: SpecPreset) => ({ key: `spec-${counter++}`, spec, preset });

/** The preset a saved row came from (matched on its French label), for value suggestions. */
const presetFor = (spec: Spec) => SPEC_PRESETS.find((p) => p.label.fr.toLowerCase() === spec.label.fr.trim().toLowerCase());

/**
 * Editable specification rows; serialized into the hidden `specifications` field as JSON.
 * Common specifications are added with one tap (label already in fr/ar/en), and their usual
 * values are offered as choices; every field stays editable.
 */
export function SpecsEditor({ initial, error }: { initial: Spec[]; error?: string }) {
  const { lang, t } = useAdminT();
  const [rows, setRows] = useState(() => initial.map((spec) => keyed(spec, presetFor(spec))));

  const update = (key: string, part: "label" | "value", locale: keyof Text, value: string) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, spec: { ...row.spec, [part]: { ...row.spec[part], [locale]: value } } } : row)),
    );
  const setValue = (key: string, value: Text) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, spec: { ...row.spec, value } } : row)));

  const serialized = JSON.stringify(
    rows
      .map(({ spec }) => spec)
      .filter((s) => s.label.fr.trim() || s.value.fr.trim())
      .map((s) => ({
        label: { fr: s.label.fr, ...(s.label.ar ? { ar: s.label.ar } : {}), ...(s.label.en ? { en: s.label.en } : {}) },
        value: { fr: s.value.fr, ...(s.value.ar ? { ar: s.value.ar } : {}), ...(s.value.en ? { en: s.value.en } : {}) },
      })),
  );

  const used = new Set(rows.map((row) => row.preset?.key).filter(Boolean));
  const suggestions = SPEC_PRESETS.filter((p) => !used.has(p.key));
  const input = "border-line-strong bg-bg h-11 w-full rounded-[var(--radius-control)] border px-2.5 text-base";
  const chip = "inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm transition-colors active:scale-[0.97]";

  return (
    <fieldset>
      <legend className="text-fg text-sm font-semibold">{t.specs.legend}</legend>
      <p className="text-fg-muted mt-0.5 text-xs">{t.specs.hint}</p>
      <input type="hidden" name="specifications" value={serialized} />
      {error ? <p className="text-danger mt-2 text-sm">{error}</p> : null}

      {suggestions.length > 0 ? (
        <div className="mt-4">
          <p className="text-fg-muted mb-2 text-sm">{t.specs.suggestions}</p>
          <div role="group" aria-label={t.specs.suggestions} className="flex flex-wrap gap-2">
            {suggestions.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => setRows((current) => [...current, keyed({ label: { ...preset.label }, value: { fr: "" } }, preset)])}
                className={cn(chip, "border-line-strong bg-bg text-fg hover:border-fg")}
              >
                + {preset.label[lang]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <ul className="mt-4 space-y-3">
        {rows.map(({ key, spec, preset }, index) => (
          <li key={key} className="border-line rounded-[var(--radius-control)] border p-3">
            <div className="grid gap-2 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
              {(["fr", "ar", "en"] as const).map((locale) => (
                <label key={`l-${locale}`} className="text-xs">
                  <span className="text-fg-muted">{format(t.specs.label, { lang: t.locales[locale] })}</span>
                  <input className={input} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} value={spec.label[locale] ?? ""} maxLength={120} onChange={(e) => update(key, "label", locale, e.target.value)} />
                </label>
              ))}
              <span className="hidden sm:block" />
              {(["fr", "ar", "en"] as const).map((locale) => (
                <label key={`v-${locale}`} className="text-xs">
                  <span className="text-fg-muted">{format(t.specs.value, { lang: t.locales[locale] })}</span>
                  <input className={input} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} value={spec.value[locale] ?? ""} maxLength={500} onChange={(e) => update(key, "value", locale, e.target.value)} />
                </label>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 self-end"
                aria-label={format(t.specs.removeAria, { n: index + 1 })}
                onClick={() => setRows((current) => current.filter((r) => r.key !== key))}
              >
                {t.specs.remove}
              </Button>
            </div>
            {preset && preset.values.length > 0 ? (
              <div role="group" aria-label={`${preset.label[lang]} — ${t.specs.valueSuggestions}`} className="mt-3 flex flex-wrap gap-2">
                {preset.values.map((value) => {
                  const active = spec.value.fr === value.fr;
                  return (
                    <button
                      key={value.fr}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setValue(key, { ...value })}
                      className={cn(chip, active ? "border-fg bg-fg text-bg" : "border-line-strong bg-bg text-fg hover:border-fg")}
                    >
                      {value[lang]}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" className="mt-3 min-h-11" onClick={() => setRows((current) => [...current, keyed({ label: { fr: "" }, value: { fr: "" } })])}>
        + {t.specs.addEmpty}
      </Button>
    </fieldset>
  );
}
