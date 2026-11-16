"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField, LocalizedField, SlugFields, SortOrderField, StatusField } from "@/components/admin/fields";
import { Advanced, Panel } from "@/components/admin/ui";
import { saveService } from "@/features/admin/content-actions";
import type { Tables } from "@/lib/supabase/database.types";
import { useAdminT } from "./admin-i18n";

export function ServiceForm({ service }: { service: Tables<"services"> | null }) {
  const { t } = useAdminT();
  const f = t.services.form;
  const values = (service ?? { status: "draft", sort_order: 0 }) as Record<string, string | number | boolean | null>;
  return (
    <AdminForm action={saveService} submitLabel={service ? t.common.save : f.create}>
      {(state) => (
        <>
          {service ? <input type="hidden" name="id" value={service.id} /> : null}
          <Panel title={f.sectionContent}>
            <div className="space-y-6">
              <LocalizedField name="name" label={f.name} values={values} errors={state.fieldErrors} requiredFr maxLength={160} />
              <LocalizedField name="summary" label={f.summary} hint={f.summaryHint} values={values} errors={state.fieldErrors} multiline rows={2} maxLength={500} />
              <LocalizedField name="description" label={f.description} hint={t.common.textHint} values={values} errors={state.fieldErrors} multiline rows={8} maxLength={10000} />
            </div>
          </Panel>
          <Panel title={f.sectionPublish}>
            <div className="grid gap-5 md:grid-cols-2">
              <StatusField values={values} errors={state.fieldErrors} />
              <div className="md:col-span-2">
                <CheckboxField name="is_featured" label={f.featuredLabel} checked={Boolean(service?.is_featured)} />
              </div>
            </div>
          </Panel>
          <Advanced label={t.common.advanced} hint={t.common.advancedHint}>
            <div className="max-w-xs">
              <SortOrderField values={values} errors={state.fieldErrors} />
            </div>
            <SlugFields values={values} errors={state.fieldErrors} />
          </Advanced>
        </>
      )}
    </AdminForm>
  );
}
