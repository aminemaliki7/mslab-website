"use client";

import { useState } from "react";
import { AdminForm } from "@/components/admin/admin-form";
import { saveActivity } from "@/features/business/journal-actions";
import { ACTIVITY_TYPES } from "@/features/business/labels";
import { Choice, FileInput, TextArea, TextInput } from "./fields";
import { useBusinessT } from "./use-business-t";

type Option = { value: string; label: string };
type ActivityType = (typeof ACTIVITY_TYPES)[number];

/**
 * Quick journal entry: one tap on the activity type opens a two-field form (title + optional
 * details). Time defaults to now; everything else is folded away.
 */
export function JournalQuickEntry({ staff, customers, sales, currentUser }: { staff: Option[]; customers: Option[]; sales: Option[]; currentUser: string }) {
  const { b } = useBusinessT();
  const j = b.journal;
  const [type, setType] = useState<ActivityType | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {ACTIVITY_TYPES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={type === value}
            onClick={() => setType(type === value ? null : value)}
            className="border-line hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent min-h-14 rounded-[var(--radius-control)] border px-3 py-2 text-start text-sm leading-tight font-semibold transition-colors"
          >
            {b.activityType[value]}
          </button>
        ))}
      </div>
      {type ? (
        <ActivityForm key={type} type={type} staff={staff} customers={customers} sales={sales} currentUser={currentUser} />
      ) : null}
      {type === null ? <p className="text-fg-muted text-sm">{j.quickTitle}</p> : null}
    </div>
  );
}

export function ActivityForm({
  type,
  staff,
  customers,
  sales,
  currentUser,
  values,
}: {
  type: ActivityType;
  staff: Option[];
  customers: Option[];
  sales: Option[];
  currentUser: string;
  values?: { id: string; title: string; description: string | null; responsible_id: string | null; customer_id: string | null; sale_id: string | null };
}) {
  const { b } = useBusinessT();
  const j = b.journal;
  return (
    <AdminForm action={saveActivity} submitLabel={values ? b.common.save : j.record} encType="multipart/form-data">
      {(state) => (
        <div className="border-line bg-bg space-y-4 rounded-[var(--radius-card)] border p-4">
          {values ? <input type="hidden" name="id" value={values.id} /> : null}
          {values ? (
            <Choice id={`type-${values.id}`} name="activity_type" label={b.common.category} options={ACTIVITY_TYPES.map((v) => ({ value: v, label: b.activityType[v] }))} defaultValue={type} />
          ) : (
            <input type="hidden" name="activity_type" value={type} />
          )}
          <TextInput id={values ? `title-${values.id}` : "title"} name="title" label={j.titleField} required defaultValue={values?.title ?? b.activityType[type]} error={state.fieldErrors.title} />
          <TextArea id={values ? `desc-${values.id}` : "description"} name="description" label={j.descriptionField} rows={3} defaultValue={values?.description} error={state.fieldErrors.description} />
          <details>
            <summary className="text-fg-muted min-h-11 cursor-pointer py-2 text-sm">
              {j.when} · {j.responsible} · {j.customerRef} · {b.common.attachments}
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {!values ? <TextInput name="occurred_at" type="datetime-local" label={j.when} hint={b.common.nowHint} error={state.fieldErrors.occurred_at} /> : null}
              <Choice id={values ? `resp-${values.id}` : "responsible_id"} name="responsible_id" label={j.responsible} options={staff} defaultValue={values?.responsible_id ?? currentUser} />
              <Choice id={values ? `cust-${values.id}` : "customer_id"} name="customer_id" label={j.customerRef} options={customers} defaultValue={values?.customer_id} emptyLabel={b.common.none} />
              <Choice id={values ? `sale-${values.id}` : "sale_id"} name="sale_id" label={j.saleRef} options={sales} defaultValue={values?.sale_id} emptyLabel={b.common.none} />
              {!values ? <FileInput name="file" label={b.common.addFile} hint={b.common.fileHint} error={state.fieldErrors.file} /> : null}
            </div>
          </details>
        </div>
      )}
    </AdminForm>
  );
}
