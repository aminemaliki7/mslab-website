"use client";

import { useState } from "react";
import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField } from "@/components/admin/fields";
import { Field, Input, Select } from "@/components/ui/form";
import { recordExpense } from "@/features/business/expense-actions";
import { PAYMENT_METHODS } from "@/features/business/labels";
import { formatMoney, inputAmount, lineTotalCents, parseCents, parseMilli } from "@/features/business/money";
import { AmountInput, Choice, FileInput, TextArea, TextInput } from "./fields";
import { useBusinessT } from "./use-business-t";

type Option = { value: string; label: string };
type StockOption = { id: string; name: string; unit: string; purchase_cost: number | null };
type Line = { key: number; product_id: string; quantity: string; unit_cost: string };
type Treatment = "operating" | "stock_purchase" | "investment";

/** Quick expense entry; a stock purchase adds the received items (stock + purchase cost). */
export function ExpenseForm({ categories, suppliers, stockItems, today }: { categories: Option[]; suppliers: Option[]; stockItems: StockOption[]; today: string }) {
  const { b, lang } = useBusinessT();
  const e = b.expenses;
  const [treatment, setTreatment] = useState<Treatment>("operating");
  const [lines, setLines] = useState<Line[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const byId = new Map(stockItems.map((p) => [p.id, p]));

  const linesTotal = lines.reduce((sum, l) => {
    const qty = parseMilli(l.quantity);
    const cost = parseCents(l.unit_cost);
    return sum + (qty !== null && cost !== null ? lineTotalCents(qty, cost) : 0);
  }, 0);
  const update = (key: number, patch: Partial<Line>) => setLines((c) => c.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <AdminForm action={recordExpense} submitLabel={e.record} encType="multipart/form-data" idempotent>
      {(state) => (
        <div className="space-y-5">
          <input type="hidden" name="stay" value="1" />
          <input type="hidden" name="lines" value={JSON.stringify(treatment === "stock_purchase" ? lines.filter((l) => l.product_id).map(({ product_id, quantity, unit_cost }) => ({ product_id, quantity, unit_cost })) : [])} />

          <fieldset>
            <legend className="text-fg mb-2 text-sm font-medium">{e.treatment}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["operating", "stock_purchase", "investment"] as const).map((v) => (
                <label key={v} className="border-line has-[:checked]:border-accent has-[:checked]:bg-accent-soft block cursor-pointer rounded-[var(--radius-control)] border p-3">
                  <input type="radio" name="treatment" value={v} checked={treatment === v} onChange={() => setTreatment(v)} className="sr-only" />
                  <span className="block text-sm font-semibold">{b.treatment[v]}</span>
                  <span className="text-fg-muted mt-0.5 block text-xs leading-snug">{b.treatmentHint[v]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="label" label={e.label} hint={e.labelHint} required error={state.fieldErrors.label} />
            <AmountInput name="amount" label={`${b.common.amount} (MAD)`} required error={state.fieldErrors.amount} />
            <Choice name="category_id" label={b.common.category} options={categories} emptyLabel={b.common.noCategory} />
            <Choice name="payment_method" label={b.sales.method} options={PAYMENT_METHODS.map((m) => ({ value: m, label: b.paymentMethod[m] }))} defaultValue="cash" />
            <TextInput name="expense_date" type="date" label={e.date} required defaultValue={today} error={state.fieldErrors.expense_date} />
            <Choice name="supplier_id" label={b.common.supplier} options={suppliers} emptyLabel={b.common.none} />
          </div>

          {treatment === "stock_purchase" ? (
            <fieldset className="bg-surface space-y-3 rounded-[var(--radius-card)] p-4">
              <legend className="sr-only">{e.stockLines}</legend>
              <p className="text-sm font-semibold">{e.stockLines}</p>
              <p className="text-fg-muted -mt-2 text-xs">{e.stockLinesHint}</p>
              {lines.map((line) => {
                const product = byId.get(line.product_id);
                return (
                  <div key={line.key} className="grid items-end gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <Field id={`exp-line-${line.key}`} label={b.itemType.product}>
                      {(p) => (
                        <Select
                          {...p}
                          value={line.product_id}
                          onChange={(ev) => {
                            const picked = byId.get(ev.target.value);
                            update(line.key, { product_id: ev.target.value, unit_cost: picked?.purchase_cost != null ? inputAmount(picked.purchase_cost, lang) : line.unit_cost });
                          }}
                        >
                          <option value="">{b.sales.chooseProduct}</option>
                          {stockItems.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                    <Field id={`exp-qty-${line.key}`} label={product ? `${b.common.quantity} (${product.unit})` : b.common.quantity}>
                      {(p) => <Input {...p} value={line.quantity} inputMode="decimal" dir="ltr" onChange={(ev) => update(line.key, { quantity: ev.target.value })} />}
                    </Field>
                    <Field id={`exp-cost-${line.key}`} label={e.unitCost}>
                      {(p) => <Input {...p} value={line.unit_cost} inputMode="decimal" dir="ltr" placeholder="0,00" onChange={(ev) => update(line.key, { unit_cost: ev.target.value })} />}
                    </Field>
                    <button type="button" onClick={() => setLines((c) => c.filter((l) => l.key !== line.key))} className="text-danger min-h-11 px-2 text-sm font-medium">
                      {b.common.remove}
                    </button>
                  </div>
                );
              })}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLines((c) => [...c, { key: nextKey, product_id: "", quantity: "1", unit_cost: "" }]);
                    setNextKey((k) => k + 1);
                  }}
                  className="border-line-strong hover:border-accent inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold"
                >
                  {e.addLine}
                </button>
                <p className="text-sm">
                  {e.linesTotal} : <strong className="tabular-nums" dir="ltr">{formatMoney(linesTotal, lang, { cents: true })}</strong>
                </p>
              </div>
              <CheckboxField name="update_cost" label={e.updateCost} checked />
            </fieldset>
          ) : null}

          <details className="border-line rounded-[var(--radius-card)] border">
            <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-semibold">
              {e.reference} · {e.receipt} · {b.common.description}
            </summary>
            <div className="border-line space-y-4 border-t p-4">
              <TextInput name="reference" label={e.reference} maxLength={120} error={state.fieldErrors.reference} />
              <FileInput name="receipt" label={e.receipt} hint={b.common.fileHint} error={state.fieldErrors.receipt} />
              <TextArea name="description" label={b.common.description} maxLength={2000} />
            </div>
          </details>
        </div>
      )}
    </AdminForm>
  );
}
