"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField, LocalizedField, SelectField, SlugFields, SortOrderField } from "@/components/admin/fields";
import { Advanced } from "@/components/admin/ui";
import { QuickPicks } from "@/components/forms/quick-picks";
import { CATEGORY_PRESETS } from "@/features/admin/presets";
import { saveCategory } from "@/features/admin/content-actions";
import type { Tables } from "@/lib/supabase/database.types";
import { useAdminT } from "./admin-i18n";

export function CategoryForm({
  category,
  parents,
}: {
  category: Tables<"categories"> | null;
  parents: Array<{ id: string; label: string }>;
}) {
  const { lang, t } = useAdminT();
  const f = t.categories.form;
  const values = (category ?? { sort_order: 0 }) as Record<string, string | number | boolean | null>;
  return (
    <AdminForm action={saveCategory} submitLabel={category ? t.common.save : f.create}>
      {(state) => (
        <div className="space-y-6">
          {category ? <input type="hidden" name="id" value={category.id} /> : null}
          {!category ? (
            <div>
              <p className="text-fg-muted mb-2 text-sm">{t.common.quickPick}</p>
              <QuickPicks
                label={t.common.quickPick}
                picks={CATEGORY_PRESETS.map((p) => ({ label: p.names[lang], values: { name_fr: p.names.fr, name_ar: p.names.ar, name_en: p.names.en } }))}
              />
            </div>
          ) : null}
          <LocalizedField name="name" label={f.name} values={values} errors={state.fieldErrors} requiredFr maxLength={120} />
          <LocalizedField name="description" label={f.description} values={values} errors={state.fieldErrors} multiline rows={3} maxLength={2000} />
          {parents.length > 0 ? (
            <div className="max-w-md">
              <SelectField name="parent_id" label={f.parent} values={values} errors={state.fieldErrors} options={parents.map((p) => ({ value: p.id, label: p.label }))} emptyLabel={f.noParent} />
            </div>
          ) : null}
          <CheckboxField name="is_published" label={f.visible} checked={category ? category.is_published : true} />
          <Advanced label={t.common.advanced} hint={t.common.advancedHint}>
            <div className="max-w-xs">
              <SortOrderField values={values} errors={state.fieldErrors} />
            </div>
            <SlugFields values={values} errors={state.fieldErrors} />
          </Advanced>
        </div>
      )}
    </AdminForm>
  );
}
