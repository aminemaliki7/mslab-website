"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { LocalizedField, SelectField, TextField } from "@/components/admin/fields";
import { Panel } from "@/components/admin/ui";
import { Field, Input } from "@/components/ui/form";
import { saveProductionOption, savePortfolioItem } from "@/features/admin/pod-actions";
import type { Tables } from "@/lib/supabase/database.types";

/** Add a material or a finish offered in the print-on-demand request form. */
export function ProductionOptionForm({ kind }: { kind: "material" | "finishing" }) {
  return (
    <AdminForm action={saveProductionOption} submitLabel={kind === "material" ? "Ajouter la matière" : "Ajouter la finition"} submitVariant="secondary">
      {(state) => (
        <div className="space-y-4">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="is_active" value="true" />
          <LocalizedField name="name" label={kind === "material" ? "Nom de la matière" : "Nom de la finition"} values={{}} errors={state.fieldErrors} requiredFr maxLength={120} />
          <div className="max-w-40">
            <TextField name="sort_order" label="Ordre" type="number" values={{ sort_order: 0 }} errors={state.fieldErrors} />
          </div>
        </div>
      )}
    </AdminForm>
  );
}

/** Portfolio item: localized title/caption, a real photo, publication status. */
export function PortfolioForm({ item, imageUrl }: { item: Tables<"portfolio_items"> | null; imageUrl: string | null }) {
  const values = (item ?? { status: "draft", sort_order: 0 }) as Record<string, string | number | boolean | null>;
  return (
    <AdminForm action={savePortfolioItem} submitLabel={item ? "Enregistrer" : "Créer la réalisation"} encType="multipart/form-data">
      {(state) => (
        <>
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <Panel title="Photo">
            <div className="grid gap-5 md:grid-cols-[12rem_minmax(0,1fr)]">
              <div className="bg-surface border-line aspect-[4/3] overflow-hidden rounded-[var(--radius-control)] border">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview of a public catalog image
                  <img src={imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-fg-subtle grid size-full place-items-center text-xs">Aucune photo</span>
                )}
              </div>
              <Field
                id="file"
                label={imageUrl ? "Remplacer la photo" : "Photo de la réalisation"}
                hint="Photo réelle d'un produit fabriqué par MSLAB (avec l'accord du client si son logo est visible). JPEG, PNG, WebP ou AVIF — 5 Mo maximum."
                error={state.fieldErrors.file}
              >
                {(p) => <Input {...p} name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="h-auto py-2" />}
              </Field>
            </div>
          </Panel>
          <Panel title="Texte">
            <div className="space-y-6">
              <LocalizedField name="title" label="Titre" values={values} errors={state.fieldErrors} requiredFr maxLength={160} />
              <LocalizedField name="caption" label="Légende (facultatif)" values={values} errors={state.fieldErrors} multiline rows={2} maxLength={500} />
            </div>
          </Panel>
          <Panel title="Publication">
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                name="status"
                label="Statut"
                values={values}
                errors={state.fieldErrors}
                options={[
                  { value: "draft", label: "Brouillon (non visible)" },
                  { value: "published", label: "Publié" },
                  { value: "archived", label: "Archivé (non visible)" },
                ]}
              />
              <TextField name="sort_order" label="Ordre d'affichage" type="number" values={values} errors={state.fieldErrors} />
            </div>
          </Panel>
        </>
      )}
    </AdminForm>
  );
}

