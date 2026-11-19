"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField, LocalizedField, SelectField, SlugFields, SortOrderField, StatusField, TextField } from "@/components/admin/fields";
import { SpecsEditor, type Spec } from "@/components/admin/specs-editor";
import { Advanced, Panel } from "@/components/admin/ui";
import { saveProduct } from "@/features/admin/content-actions";
import type { Tables } from "@/lib/supabase/database.types";
import { useAdminT } from "./admin-i18n";

type Props = {
  product: Tables<"products"> | null;
  categories: Array<{ id: string; label: string }>;
};

/** Product form: what most edits need first (name, category, status), details after, rarely used options folded. */
export function ProductForm({ product, categories }: Props) {
  const { t } = useAdminT();
  const f = t.products.form;
  const values = (product ?? { status: "draft", sort_order: 0 }) as Record<string, string | number | boolean | null>;
  const specs = Array.isArray(product?.specifications) ? (product.specifications as unknown as Spec[]) : [];

  return (
    <AdminForm action={saveProduct} submitLabel={product ? t.common.save : f.create}>
      {(state) => (
        <>
          {product ? <input type="hidden" name="id" value={product.id} /> : null}
          <Panel title={f.sectionInfo}>
            <div className="space-y-6">
              <LocalizedField name="name" label={f.name} values={values} errors={state.fieldErrors} requiredFr maxLength={200} />
              <LocalizedField name="short_description" label={f.shortDescription} hint={f.shortHint} values={values} errors={state.fieldErrors} multiline rows={2} maxLength={500} />
              <LocalizedField name="description" label={f.description} hint={t.common.textHint} values={values} errors={state.fieldErrors} multiline rows={6} maxLength={10000} />
            </div>
          </Panel>

          <Panel title={f.sectionPublish}>
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField name="category_id" label={f.category} values={values} errors={state.fieldErrors} options={categories.map((c) => ({ value: c.id, label: c.label }))} emptyLabel={f.noCategory} />
              <StatusField values={values} errors={state.fieldErrors} />
              <TextField name="min_order_quantity" label={f.moq} hint={f.moqHint} type="number" values={values} errors={state.fieldErrors} dir="ltr" />
              <div className="md:col-span-2">
                <CheckboxField name="is_featured" label={f.featuredLabel} checked={Boolean(product?.is_featured)} />
              </div>
            </div>
          </Panel>

          <Panel title={f.sectionSpecs}>
            <SpecsEditor initial={specs} error={state.fieldErrors.specifications} />
          </Panel>

          <Advanced label={t.common.advanced} hint={t.common.advancedHint}>
            <div className="grid gap-5 md:grid-cols-2">
              <TextField name="sku" label={f.sku} values={values} errors={state.fieldErrors} maxLength={64} dir="ltr" />
              <SortOrderField values={values} errors={state.fieldErrors} />
            </div>
            <SlugFields values={values} errors={state.fieldErrors} />
          </Advanced>
        </>
      )}
    </AdminForm>
  );
}
