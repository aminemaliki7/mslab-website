"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Text = { fr: string; ar?: string; en?: string };
export type Spec = { label: Text; value: Text };

let counter = 0;
const keyed = (spec: Spec) => ({ key: `spec-${counter++}`, spec });

/** Editable specification rows; serialized into the hidden `specifications` field as JSON. */
export function SpecsEditor({ initial, error }: { initial: Spec[]; error?: string }) {
  const [rows, setRows] = useState(() => initial.map(keyed));

  const update = (key: string, part: "label" | "value", locale: keyof Text, value: string) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, spec: { ...row.spec, [part]: { ...row.spec[part], [locale]: value } } } : row)),
    );

  const serialized = JSON.stringify(
    rows
      .map(({ spec }) => spec)
      .filter((s) => s.label.fr.trim() || s.value.fr.trim())
      .map((s) => ({
        label: { fr: s.label.fr, ...(s.label.ar ? { ar: s.label.ar } : {}), ...(s.label.en ? { en: s.label.en } : {}) },
        value: { fr: s.value.fr, ...(s.value.ar ? { ar: s.value.ar } : {}), ...(s.value.en ? { en: s.value.en } : {}) },
      })),
  );

  const input = "border-line-strong bg-bg h-9 w-full rounded-[var(--radius-control)] border px-2.5 text-sm";

  return (
    <fieldset>
      <legend className="text-fg text-sm font-semibold">Caractéristiques</legend>
      <p className="text-fg-muted mt-0.5 text-xs">Libellé et valeur en français obligatoires ; arabe et anglais facultatifs.</p>
      <input type="hidden" name="specifications" value={serialized} />
      {error ? <p className="text-danger mt-2 text-sm">{error}</p> : null}
      <ul className="mt-3 space-y-3">
        {rows.map(({ key, spec }, index) => (
          <li key={key} className="border-line rounded-[var(--radius-control)] border p-3">
            <div className="grid gap-2 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
              {(["fr", "ar", "en"] as const).map((locale) => (
                <label key={`l-${locale}`} className="text-xs">
                  <span className="text-fg-muted">Libellé ({locale})</span>
                  <input className={input} dir={locale === "ar" ? "rtl" : "ltr"} value={spec.label[locale] ?? ""} maxLength={120} onChange={(e) => update(key, "label", locale, e.target.value)} />
                </label>
              ))}
              <span className="hidden sm:block" />
              {(["fr", "ar", "en"] as const).map((locale) => (
                <label key={`v-${locale}`} className="text-xs">
                  <span className="text-fg-muted">Valeur ({locale})</span>
                  <input className={input} dir={locale === "ar" ? "rtl" : "ltr"} value={spec.value[locale] ?? ""} maxLength={500} onChange={(e) => update(key, "value", locale, e.target.value)} />
                </label>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="self-end"
                aria-label={`Supprimer la caractéristique ${index + 1}`}
                onClick={() => setRows((current) => current.filter((r) => r.key !== key))}
              >
                Supprimer
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" className="mt-3" onClick={() => setRows((current) => [...current, keyed({ label: { fr: "" }, value: { fr: "" } })])}>
        + Ajouter une caractéristique
      </Button>
    </fieldset>
  );
}
