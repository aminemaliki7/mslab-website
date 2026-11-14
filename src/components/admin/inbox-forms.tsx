"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { Field, Select, Textarea } from "@/components/ui/form";
import { updateInquiry, updateQuotation } from "@/features/admin/inbox-actions";
import { inquiryStatus, quotationStatus } from "@/features/admin/labels";

export function QuotationUpdateForm({ id, status, notes }: { id: string; status: string; notes: string | null }) {
  return (
    <AdminForm action={updateQuotation} submitLabel="Enregistrer">
      {(state) => (
        <div className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <Field id="status" label="Statut" error={state.fieldErrors.status}>
            {(p) => (
              <Select {...p} name="status" defaultValue={status}>
                {Object.entries(quotationStatus).map(([value, s]) => (
                  <option key={value} value={value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="internal_notes" label="Notes internes" hint="Visibles uniquement par l'équipe MSLAB." error={state.fieldErrors.internal_notes}>
            {(p) => <Textarea {...p} name="internal_notes" rows={6} maxLength={10000} defaultValue={notes ?? ""} />}
          </Field>
        </div>
      )}
    </AdminForm>
  );
}

export function InquiryStatusForm({ id, status }: { id: string; status: string }) {
  return (
    <AdminForm action={updateInquiry} submitLabel="Mettre à jour" submitVariant="secondary">
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <Field id="status" label="Statut">
            {(p) => (
              <Select {...p} name="status" defaultValue={status}>
                {Object.entries(inquiryStatus).map(([value, s]) => (
                  <option key={value} value={value}>
                    {s.label}
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
