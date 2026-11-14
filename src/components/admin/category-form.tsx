"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField, LocalizedField, SelectField, SlugFields, TextField } from "@/components/admin/fields";
import { saveCategory } from "@/features/admin/content-actions";
import type { Tables } from "@/lib/supabase/database.types";

export function CategoryForm({
  category,
  parents,
}: {
  category: Tables<"categories"> | null;
  parents: Array<{ id: string; label: string }>;
}) {
  const values = (category ?? { sort_order: 0 }) as Record<string, string | number | boolean | null>;
  return (
    <AdminForm action={saveCategory} submitLabel={category ? "Enregistrer" : "Créer la catégorie"}>
      {(state) => (
        <div className="space-y-6">
          {category ? <input type="hidden" name="id" value={category.id} /> : null}
          <LocalizedField name="name" label="Nom" values={values} errors={state.fieldErrors} requiredFr maxLength={120} />
          <SlugFields values={values} errors={state.fieldErrors} />
          <LocalizedField name="description" label="Description" values={values} errors={state.fieldErrors} multiline rows={3} maxLength={2000} />
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField name="parent_id" label="Catégorie parente" values={values} errors={state.fieldErrors} options={parents.map((p) => ({ value: p.id, label: p.label }))} emptyLabel="— Aucune (catégorie principale) —" />
            <TextField name="sort_order" label="Ordre d'affichage" type="number" values={values} errors={state.fieldErrors} />
          </div>
          <CheckboxField name="is_published" label="Visible sur le site" checked={category ? category.is_published : true} />
        </div>
      )}
    </AdminForm>
  );
}
