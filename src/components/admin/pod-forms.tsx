"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { LocalizedField, SortOrderField, StatusField } from "@/components/admin/fields";
import { Panel } from "@/components/admin/ui";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { addPresetOptions, saveProductionOption, savePortfolioItem } from "@/features/admin/pod-actions";
import { FINISH_PRESETS, MATERIAL_PRESETS } from "@/features/admin/presets";
import type { Tables } from "@/lib/supabase/database.types";
import { useAdminT } from "./admin-i18n";

/** Add a material or a finish offered in the print-on-demand request form. */
export function ProductionOptionForm({ kind }: { kind: "material" | "finishing" }) {
  const { t } = useAdminT();
  return (
    <AdminForm action={saveProductionOption} submitLabel={kind === "material" ? t.pod.addMaterial : t.pod.addFinishing} submitVariant="secondary">
      {(state) => (
        <div className="space-y-4">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="is_active" value="true" />
          <input type="hidden" name="sort_order" value="0" />
          <LocalizedField name="name" label={kind === "material" ? t.pod.materialName : t.pod.finishingName} values={{}} errors={state.fieldErrors} requiredFr maxLength={120} />
        </div>
      )}
    </AdminForm>
  );
}

/**
 * Common materials or finishes as a checklist (names already in fr/ar/en). Only the ones not
 * added yet are listed; the typed form below stays for anything else.
 */
export function PresetOptionsForm({ kind, existing }: { kind: "material" | "finishing"; existing: string[] }) {
  const { lang, t } = useAdminT();
  const taken = new Set(existing.map((name) => name.toLowerCase()));
  const presets = (kind === "material" ? MATERIAL_PRESETS : FINISH_PRESETS).filter((p) => !taken.has(p.names.fr.toLowerCase()));
  if (presets.length === 0) return <p className="text-fg-muted text-sm">{t.pod.allAdded}</p>;
  return (
    <AdminForm action={addPresetOptions} submitLabel={t.pod.addSelected}>
      {() => (
        <fieldset>
          <legend className="text-fg font-semibold">{t.pod.presetsTitle}</legend>
          <p className="text-fg-muted text-xs">{t.pod.presetsHint}</p>
          <input type="hidden" name="kind" value={kind} />
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {presets.map((preset) => (
              <li key={preset.key}>
                <label className="hover:bg-surface flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-2">
                  <Checkbox name="preset" value={preset.key} className="mt-0" />
                  <span className="text-sm font-medium">{preset.names[lang]}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
    </AdminForm>
  );
}

/** Portfolio item: localized title/caption, a real photo, publication status. */
export function PortfolioForm({ item, imageUrl }: { item: Tables<"portfolio_items"> | null; imageUrl: string | null }) {
  const { t } = useAdminT();
  const w = t.pod.work;
  const values = (item ?? { status: "draft", sort_order: 0 }) as Record<string, string | number | boolean | null>;
  return (
    <AdminForm action={savePortfolioItem} submitLabel={item ? t.common.save : w.create} encType="multipart/form-data">
      {(state) => (
        <>
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <Panel title={w.photo}>
            <div className="grid gap-5 md:grid-cols-[12rem_minmax(0,1fr)]">
              <div className="bg-surface border-line aspect-[4/3] overflow-hidden rounded-[var(--radius-control)] border">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview of a public catalog image
                  <img src={imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-fg-subtle grid size-full place-items-center text-xs">{w.noPhoto}</span>
                )}
              </div>
              <Field id="file" label={imageUrl ? w.replacePhoto : w.photoLabel} hint={w.photoHint} error={state.fieldErrors.file}>
                {(p) => <Input {...p} name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="h-auto py-2" />}
              </Field>
            </div>
          </Panel>
          <Panel title={w.text}>
            <div className="space-y-6">
              <LocalizedField name="title" label={w.titleField} values={values} errors={state.fieldErrors} requiredFr maxLength={160} />
              <LocalizedField name="caption" label={w.caption} values={values} errors={state.fieldErrors} multiline rows={2} maxLength={500} />
            </div>
          </Panel>
          <Panel title={w.publication}>
            <div className="grid gap-5 md:grid-cols-2">
              <StatusField values={values} errors={state.fieldErrors} />
              <SortOrderField values={values} errors={state.fieldErrors} />
            </div>
          </Panel>
        </>
      )}
    </AdminForm>
  );
}
