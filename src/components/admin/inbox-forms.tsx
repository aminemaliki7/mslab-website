"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { Field, Select, Textarea } from "@/components/ui/form";
import { updateInquiry, updateQuotation } from "@/features/admin/inbox-actions";
import { INQUIRY_STATUS_KEYS, QUOTATION_STATUS_KEYS } from "@/features/admin/labels";
import { useAdminT } from "./admin-i18n";

export function QuotationUpdateForm({ id, status, notes }: { id: string; status: string; notes: string | null }) {
  const { t } = useAdminT();
  return (
    <AdminForm action={updateQuotation} submitLabel={t.common.save}>
      {(state) => (
        <div className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <Field id="status" label={t.common.status} error={state.fieldErrors.status}>
            {(p) => (
              <Select {...p} name="status" defaultValue={status}>
                {QUOTATION_STATUS_KEYS.map((value) => (
                  <option key={value} value={value}>
                    {t.status.quotation[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="internal_notes" label={t.quotations.notes} hint={t.quotations.notesHint} error={state.fieldErrors.internal_notes}>
            {(p) => <Textarea {...p} name="internal_notes" dir="auto" rows={6} maxLength={10000} defaultValue={notes ?? ""} />}
          </Field>
        </div>
      )}
    </AdminForm>
  );
}

export function InquiryStatusForm({ id, status }: { id: string; status: string }) {
  const { t } = useAdminT();
  return (
    <AdminForm action={updateInquiry} submitLabel={t.inquiries.update} submitVariant="secondary">
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <Field id="status" label={t.common.status}>
            {(p) => (
              <Select {...p} name="status" defaultValue={status}>
                {INQUIRY_STATUS_KEYS.map((value) => (
                  <option key={value} value={value}>
                    {t.status.inquiry[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </>
      )}
    </AdminForm>
  );
}
