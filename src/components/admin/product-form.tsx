"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField, LocalizedField, SelectField, SlugFields, TextField } from "@/components/admin/fields";
import { SpecsEditor, type Spec } from "@/components/admin/specs-editor";
import { Panel } from "@/components/admin/ui";
import { saveProduct } from "@/features/admin/content-actions";
import type { Tables } from "@/lib/supabase/database.types";

type Props = {
  product: Tables<"products"> | null;
  categories: Array<{ id: string; label: string }>;
};

export function ProductForm({ product, categories }: Props) {
  const values = (product ?? { status: "draft", sort_order: 0 }) as Record<string, string | number | boolean | null>;
  const specs = Array.isArray(product?.specifications) ? (product.specifications as unknown as Spec[]) : [];

  return (
    <AdminForm action={saveProduct} submitLabel={product ? "Enregistrer" : "Créer le produit"}>
      {(state) => (
        <>
          {product ? <input type="hidden" name="id" value={product.id} /> : null}
          <Panel title="Informations">
            <div className="space-y-6">
              <LocalizedField name="name" label="Nom" values={values} errors={state.fieldErrors} requiredFr maxLength={200} />
              <SlugFields values={values} errors={state.fieldErrors} />
              <LocalizedField name="short_description" label="Description courte" values={values} errors={state.fieldErrors} multiline rows={2} maxLength={500} />
              <LocalizedField name="description" label="Description détaillée" hint="Texte simple. Ligne vide = nouveau paragraphe ; « - » en début de ligne = liste." values={values} errors={state.fieldErrors} multiline rows={6} maxLength={10000} />
            </div>
          </Panel>

          <Panel title="Classement et publication">
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField name="category_id" label="Catégorie" values={values} errors={state.fieldErrors} options={categories.map((c) => ({ value: c.id, label: c.label }))} emptyLabel="— Sans catégorie —" />
              <TextField name="sku" label="Référence (SKU, facultatif)" values={values} errors={state.fieldErrors} maxLength={64} dir="ltr" />
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
              <TextField name="sort_order" label="Ordre d'affichage" type="number" values={values} errors={state.fieldErrors} hint="Plus petit = affiché en premier." />
              <CheckboxField name="is_featured" label="Mettre en avant sur l'accueil" checked={Boolean(product?.is_featured)} />
            </div>
          </Panel>

          <Panel title="Caractéristiques techniques">
            <SpecsEditor initial={specs} error={state.fieldErrors.specifications} />
          </Panel>
        </>
      )}
    </AdminForm>
  );
}
