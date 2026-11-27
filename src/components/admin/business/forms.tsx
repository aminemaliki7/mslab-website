"use client";

import { useState } from "react";
import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField } from "@/components/admin/fields";
import { addCustomerNote, linkRequest, saveCustomer } from "@/features/business/customer-actions";
import { addAttachment, updateExpense, voidExpense } from "@/features/business/expense-actions";
import { MANUAL_MOVEMENTS, OPEN_ORDER_STATUSES, PAYMENT_METHODS } from "@/features/business/labels";
import { recordMovement, saveProduct } from "@/features/business/product-actions";
import { cancelSale, recordPayment, saveSaleNotes, setSaleStatus, voidPayment } from "@/features/business/sale-actions";
import { addCategory, assignRole, attachStaff, saveSupplier } from "@/features/business/settings-actions";
import { addComment } from "@/features/business/journal-actions";
import { AmountInput, Choice, FileInput, QtyInput, TextArea, TextInput } from "./fields";
import { useBusinessT } from "./use-business-t";

type Option = { value: string; label: string };

// ─── Products ───────────────────────────────────────────────────────────────
export type ProductValues = {
  id?: string;
  name?: string;
  sku?: string | null;
  item_type?: "product" | "material" | "service";
  category_id?: string | null;
  unit?: string;
  description?: string | null;
  purchase_cost?: string;
  selling_price?: string;
  track_stock?: boolean;
  min_stock?: string;
  allow_negative?: boolean;
  catalog_product_id?: string | null;
};

export function ProductForm({ values, categories, catalog, canStock }: { values: ProductValues; categories: Option[]; catalog: Option[]; canStock: boolean }) {
  const { b, lang } = useBusinessT();
  const p = b.products;
  const [type, setType] = useState(values.item_type ?? "product");
  const [track, setTrack] = useState(values.track_stock ?? true);
  const stocked = type !== "service" && track;
  return (
    <AdminForm action={saveProduct} submitLabel={values.id ? b.common.save : b.common.create} encType="multipart/form-data">
      {(state) => (
        <div className="space-y-5">
          {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
          <TextInput name="name" label={p.name} required defaultValue={values.name} error={state.fieldErrors.name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item_type" className="text-fg mb-1.5 block text-sm font-medium">
                {p.itemType}
              </label>
              <select
                id="item_type"
                name="item_type"
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="border-line-strong bg-bg select-control h-12 w-full rounded-[var(--radius-control)] border px-3 pe-10 sm:h-11"
              >
                {(["product", "material", "service"] as const).map((v) => (
                  <option key={v} value={v}>
                    {b.itemType[v]}
                  </option>
                ))}
              </select>
            </div>
            <Choice name="category_id" label={b.common.category} options={categories} defaultValue={values.category_id} emptyLabel={b.common.noCategory} error={state.fieldErrors.category_id} />
            <TextInput name="sku" label={p.sku} hint={p.skuHint} maxLength={40} defaultValue={values.sku} error={state.fieldErrors.sku} />
            <TextInput name="unit" label={p.unit} hint={p.unitHint} maxLength={20} required defaultValue={values.unit ?? (lang === "fr" ? "unité" : lang === "ar" ? "وحدة" : "unit")} error={state.fieldErrors.unit} />
            <AmountInput name="purchase_cost" label={p.purchaseCost} defaultValue={values.purchase_cost} error={state.fieldErrors.purchase_cost} />
            <AmountInput name="selling_price" label={p.sellingPrice} defaultValue={values.selling_price} error={state.fieldErrors.selling_price} />
          </div>

          {type !== "service" ? (
            <div className="bg-surface space-y-4 rounded-[var(--radius-card)] p-4">
              <div className="flex items-start gap-3">
                <input id="track_stock" name="track_stock" type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)} className="accent-accent mt-1 size-6 shrink-0" />
                <label htmlFor="track_stock" className="py-1 text-sm">
                  <span className="font-medium">{p.trackStock}</span>
                  <span className="text-fg-muted block text-xs">{p.trackStockHint}</span>
                </label>
              </div>
              {stocked ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {!values.id && canStock ? <QtyInput name="initial_quantity" label={p.initialQuantity} defaultValue="0" error={state.fieldErrors.initial_quantity} /> : null}
                  <QtyInput name="min_stock" label={p.minStock} hint={p.minStockHint} defaultValue={values.min_stock} error={state.fieldErrors.min_stock} />
                  <div className="sm:col-span-2">
                    <CheckboxField name="allow_negative" label={p.allowNegative} hint={p.allowNegativeHint} checked={values.allow_negative ?? false} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <TextArea name="description" label={b.common.description} maxLength={2000} defaultValue={values.description} error={state.fieldErrors.description} />
          <FileInput name="image" label={p.image} hint={p.imageHint} accept="image/jpeg,image/png,image/webp" error={state.fieldErrors.image} />
          {catalog.length > 0 ? (
            <Choice name="catalog_product_id" label={p.catalogLink} hint={p.catalogLinkHint} options={catalog} defaultValue={values.catalog_product_id} emptyLabel={b.common.none} />
          ) : null}
        </div>
      )}
    </AdminForm>
  );
}

export function MovementForm({ productId, unit, canNegative }: { productId: string; unit: string; canNegative: boolean }) {
  const { b } = useBusinessT();
  const p = b.products;
  const [type, setType] = useState<(typeof MANUAL_MOVEMENTS)[number]>("entry");
  return (
    <AdminForm action={recordMovement} submitLabel={p.record} idempotent>
      {(state) => (
        <div className="space-y-4">
          <input type="hidden" name="product_id" value={productId} />
          <fieldset>
            <legend className="text-fg mb-2 text-sm font-medium">{p.movementType}</legend>
            <div className="flex flex-wrap gap-2">
              {MANUAL_MOVEMENTS.map((m) => (
                <label key={m} className="border-line has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium">
                  <input type="radio" name="movement_type" value={m} checked={type === m} onChange={() => setType(m)} className="sr-only" />
                  {b.movementType[m]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <QtyInput name="quantity" label={`${type === "adjustment" ? p.countedQty : p.movementQty} (${unit})`} hint={type === "adjustment" ? p.countedHint : undefined} required error={state.fieldErrors.quantity} />
            {type === "entry" ? <AmountInput name="unit_cost" label={p.unitCost} error={state.fieldErrors.unit_cost} /> : null}
          </div>
          <TextInput name="reason" label={b.common.reason} hint={p.reasonHint} maxLength={500} error={state.fieldErrors.reason} />
          <details>
            <summary className="text-fg-muted cursor-pointer text-sm">{p.occurredAt}</summary>
            <div className="mt-3 space-y-3">
              <TextInput name="occurred_at" type="datetime-local" label={p.occurredAt} hint={b.common.nowHint} error={state.fieldErrors.occurred_at} />
              {canNegative && type !== "entry" ? <CheckboxField name="allow_negative" label={p.forceNegative} checked={false} /> : null}
            </div>
          </details>
        </div>
      )}
    </AdminForm>
  );
}

// ─── Customers ──────────────────────────────────────────────────────────────
export type CustomerValues = {
  id?: string;
  customer_type?: "individual" | "company";
  name?: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
};

export function CustomerForm({ values, quick, fromRequest }: { values: CustomerValues; quick?: boolean; fromRequest?: string }) {
  const { b } = useBusinessT();
  const c = b.customers;
  return (
    <AdminForm action={saveCustomer} submitLabel={values.id ? b.common.save : quick ? b.common.add : b.common.create}>
      {(state) => (
        <div className="space-y-4">
          {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
          {quick ? <input type="hidden" name="stay" value="1" /> : null}
          {fromRequest ? <input type="hidden" name="from_request" value={fromRequest} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="name" label={c.name} required defaultValue={values.name} error={state.fieldErrors.name} />
            <TextInput name="phone" label={b.common.phone} type="tel" maxLength={40} defaultValue={values.phone} error={state.fieldErrors.phone} />
            <Choice
              name="customer_type"
              label={c.type}
              options={(["individual", "company"] as const).map((v) => ({ value: v, label: b.customerType[v] }))}
              defaultValue={values.customer_type ?? "individual"}
            />
            <TextInput name="email" label={b.common.email} type="email" maxLength={254} defaultValue={values.email} error={state.fieldErrors.email} />
            {!quick ? (
              <>
                <TextInput name="contact_name" label={c.contactName} maxLength={120} defaultValue={values.contact_name} error={state.fieldErrors.contact_name} />
                <TextInput name="city" label={b.common.city} maxLength={80} defaultValue={values.city} error={state.fieldErrors.city} />
              </>
            ) : null}
          </div>
          {!quick ? (
            <>
              <TextInput name="address" label={b.common.address} maxLength={500} defaultValue={values.address} error={state.fieldErrors.address} />
              <TextArea name="notes" label={b.common.notes} defaultValue={values.notes} error={state.fieldErrors.notes} />
            </>
          ) : null}
        </div>
      )}
    </AdminForm>
  );
}

export function CustomerNoteForm({ customerId }: { customerId: string }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={addCustomerNote} submitLabel={b.customers.addNote} submitVariant="secondary">
      {(state) => (
        <div className="space-y-3">
          <input type="hidden" name="customer_id" value={customerId} />
          <Choice name="kind" label={b.customers.noteKind} options={(["note", "call", "meeting", "follow_up"] as const).map((v) => ({ value: v, label: b.noteKind[v] }))} defaultValue="note" />
          <TextArea name="body" label={b.customers.notesTitle} rows={3} error={state.fieldErrors.body} />
        </div>
      )}
    </AdminForm>
  );
}

export function LinkRequestForm({ customerId }: { customerId: string }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={linkRequest} submitLabel={b.customers.link} submitVariant="secondary">
      {(state) => (
        <>
          <input type="hidden" name="customer_id" value={customerId} />
          <TextInput name="reference" label={b.customers.linkRequest} hint={b.customers.linkHint} maxLength={20} error={state.fieldErrors.reference} />
        </>
      )}
    </AdminForm>
  );
}

// ─── Sales ──────────────────────────────────────────────────────────────────
export function PaymentForm({ saleId, balance }: { saleId: string; balance: string }) {
  const { b } = useBusinessT();
  const s = b.sales;
  return (
    <AdminForm action={recordPayment} submitLabel={s.addPayment} idempotent>
      {(state) => (
        <div className="space-y-4">
          <input type="hidden" name="sale_id" value={saleId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <AmountInput name="amount" label={b.common.amount} required defaultValue={balance} error={state.fieldErrors.amount} />
            <Choice name="method" label={s.method} options={PAYMENT_METHODS.map((m) => ({ value: m, label: b.paymentMethod[m] }))} defaultValue="cash" />
            <TextInput name="paid_at" type="datetime-local" label={s.paidAt} hint={b.common.nowHint} error={state.fieldErrors.paid_at} />
            <TextInput name="reference" label={s.paymentReference} maxLength={120} error={state.fieldErrors.reference} />
          </div>
        </div>
      )}
    </AdminForm>
  );
}

export function SaleStatusForm({ saleId, status }: { saleId: string; status: string }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={setSaleStatus} submitLabel={b.sales.changeStatus} submitVariant="secondary">
      {(state) => (
        <div className="space-y-3">
          <input type="hidden" name="id" value={saleId} />
          <Choice name="status" label={b.sales.colStatus} options={OPEN_ORDER_STATUSES.map((v) => ({ value: v, label: b.orderStatus[v] }))} defaultValue={status} />
          <TextInput name="note" label={b.sales.statusNote} maxLength={1000} error={state.fieldErrors.note} />
        </div>
      )}
    </AdminForm>
  );
}

export function SaleNotesForm({ saleId, notes, dueDate }: { saleId: string; notes: string | null; dueDate: string | null }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={saveSaleNotes} submitLabel={b.sales.saveNotes} submitVariant="secondary">
      {(state) => (
        <div className="space-y-3">
          <input type="hidden" name="id" value={saleId} />
          <TextInput name="due_date" type="date" label={b.sales.dueDate} defaultValue={dueDate} error={state.fieldErrors.due_date} />
          <TextArea name="notes" label={b.common.notes} defaultValue={notes} error={state.fieldErrors.notes} />
        </div>
      )}
    </AdminForm>
  );
}

/** Void a payment / cancel a sale / void an expense: always with a reason, always confirmed. */
export function ReasonForm({ kind, id }: { kind: "voidPayment" | "cancelSale" | "voidExpense"; id: string }) {
  const { b } = useBusinessT();
  const config = {
    voidPayment: { action: voidPayment, submit: b.sales.voidPayment, label: b.sales.voidReason, confirm: b.sales.voidConfirm },
    cancelSale: { action: cancelSale, submit: b.sales.cancelTitle, label: b.sales.cancelReason, confirm: b.sales.cancelConfirm },
    voidExpense: { action: voidExpense, submit: b.expenses.voidTitle, label: b.common.reason, confirm: b.expenses.voidConfirm },
  }[kind];
  return (
    <AdminForm action={config.action} submitLabel={config.submit} submitVariant="secondary" confirm={config.confirm}>
      {(state) => (
        <>
          <input type="hidden" name="id" value={id} />
          <TextInput id={`${kind}-${id}`} name="reason" label={config.label} maxLength={500} required error={state.fieldErrors.reason} />
        </>
      )}
    </AdminForm>
  );
}

// ─── Expenses ───────────────────────────────────────────────────────────────
export function ExpenseUpdateForm({
  values,
  categories,
  suppliers,
}: {
  values: { id: string; label: string; category_id: string | null; supplier_id: string | null; payment_method: string; reference: string | null; description: string | null };
  categories: Option[];
  suppliers: Option[];
}) {
  const { b } = useBusinessT();
  const e = b.expenses;
  return (
    <AdminForm action={updateExpense} submitLabel={b.common.save} submitVariant="secondary">
      {(state) => (
        <div className="space-y-4">
          <input type="hidden" name="id" value={values.id} />
          <TextInput name="label" label={e.label} required defaultValue={values.label} error={state.fieldErrors.label} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Choice name="category_id" label={b.common.category} options={categories} defaultValue={values.category_id} emptyLabel={b.common.noCategory} />
            <Choice name="supplier_id" label={b.common.supplier} options={suppliers} defaultValue={values.supplier_id} emptyLabel={b.common.none} />
            <Choice name="payment_method" label={b.sales.method} options={PAYMENT_METHODS.map((m) => ({ value: m, label: b.paymentMethod[m] }))} defaultValue={values.payment_method} />
            <TextInput name="reference" label={e.reference} maxLength={120} defaultValue={values.reference} error={state.fieldErrors.reference} />
          </div>
          <TextArea name="description" label={b.common.description} maxLength={2000} defaultValue={values.description} />
        </div>
      )}
    </AdminForm>
  );
}

export function AttachmentForm({ entityType, entityId }: { entityType: "expense" | "activity"; entityId: string }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={addAttachment} submitLabel={b.common.addFile} submitVariant="secondary" encType="multipart/form-data">
      {(state) => (
        <>
          <input type="hidden" name="entity_type" value={entityType} />
          <input type="hidden" name="entity_id" value={entityId} />
          <FileInput name="file" label={b.common.addFile} hint={b.common.fileHint} error={state.fieldErrors.file} />
        </>
      )}
    </AdminForm>
  );
}

// ─── Settings & team ────────────────────────────────────────────────────────
export function CategoryForm({ kind }: { kind: "product" | "expense" }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={addCategory} submitLabel={b.common.add} submitVariant="secondary">
      {(state) => (
        <>
          <input type="hidden" name="kind" value={kind} />
          <TextInput id={`category-${kind}`} name="name" label={b.settings.categoryName} maxLength={80} required error={state.fieldErrors.name} />
        </>
      )}
    </AdminForm>
  );
}

export function SupplierForm() {
  const { b } = useBusinessT();
  return (
    <AdminForm action={saveSupplier} submitLabel={b.common.add} submitVariant="secondary">
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="name" label={b.settings.supplierName} required error={state.fieldErrors.name} />
          <TextInput name="phone" label={b.common.phone} type="tel" maxLength={40} error={state.fieldErrors.phone} />
          <TextInput name="email" label={b.common.email} type="email" maxLength={254} error={state.fieldErrors.email} />
          <TextInput name="address" label={b.common.address} maxLength={500} error={state.fieldErrors.address} />
        </div>
      )}
    </AdminForm>
  );
}

export function AttachStaffForm() {
  const { b } = useBusinessT();
  const t = b.team;
  return (
    <AdminForm action={attachStaff} submitLabel={t.attach} submitVariant="secondary">
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput name="email" label={b.common.email} type="email" maxLength={254} required error={state.fieldErrors.email} />
          <TextInput name="full_name" label={t.fullName} maxLength={120} required error={state.fieldErrors.full_name} />
          <Choice name="kind" label={t.kind} options={[{ value: "employee", label: t.kindEmployee }, { value: "associate", label: t.kindAssociate }]} defaultValue="employee" />
        </div>
      )}
    </AdminForm>
  );
}

export function AssignRoleForm({ staffId, roles }: { staffId: string; roles: Option[] }) {
  const { b } = useBusinessT();
  if (roles.length === 0) return null;
  return (
    <AdminForm action={assignRole} submitLabel={b.team.assign} submitVariant="secondary" className="flex flex-wrap items-end gap-3 space-y-0">
      {() => (
        <>
          <input type="hidden" name="staff_id" value={staffId} />
          <Choice id={`role-${staffId}`} name="role_id" label={b.team.rolesTitle} options={roles} />
        </>
      )}
    </AdminForm>
  );
}

// ─── Journal ────────────────────────────────────────────────────────────────
export function CommentForm({ activityId }: { activityId: string }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={addComment} submitLabel={b.journal.addComment} submitVariant="secondary">
      {(state) => (
        <>
          <input type="hidden" name="activity_id" value={activityId} />
          <TextArea id={`comment-${activityId}`} name="body" label={b.journal.comments} rows={2} maxLength={2000} placeholder={b.journal.commentPlaceholder} error={state.fieldErrors.body} />
        </>
      )}
    </AdminForm>
  );
}
