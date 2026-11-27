"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField } from "@/components/admin/fields";
import { Field, Input, Select } from "@/components/ui/form";
import { format } from "@/i18n/format";
import { OPEN_ORDER_STATUSES, PAYMENT_METHODS } from "@/features/business/labels";
import { centsToDecimal, dbMilli, formatMoney, formatQty, inputAmount, lineTotalCents, parseCents, parseMilli } from "@/features/business/money";
import { recordSale } from "@/features/business/sale-actions";
import { Choice, TextArea, TextInput } from "./fields";
import { useBusinessT } from "./use-business-t";

export type SaleProductOption = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  item_type: "product" | "material" | "service";
  track_stock: boolean;
  quantity_on_hand: number;
  selling_price: number | null;
};

type Kind = "product" | "service" | "custom";
type Line = { key: number; line_kind: Kind; product_id: string | null; description: string; quantity: string; unit_price: string; discount: string };

/**
 * Fast sale entry: lines are added with one tap, prices come from the product (editable), and the
 * total is previewed in integer cents. The server re-validates and Postgres recomputes everything.
 */
export function SaleForm({
  products,
  customers,
  defaultCustomer,
  requestId,
  canNegative,
}: {
  products: SaleProductOption[];
  customers: Array<{ id: string; name: string; phone: string | null }>;
  defaultCustomer?: string;
  requestId?: string;
  canNegative: boolean;
}) {
  const { b, lang } = useBusinessT();
  const s = b.sales;
  const [lines, setLines] = useState<Line[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [discount, setDiscount] = useState("");
  const [paid, setPaid] = useState("");

  const byId = new Map(products.map((p) => [p.id, p]));
  const stockItems = products.filter((p) => p.item_type !== "service");
  const services = products.filter((p) => p.item_type === "service");

  function add(kind: Kind) {
    setLines((current) => [...current, { key: nextKey, line_kind: kind, product_id: null, description: "", quantity: "1", unit_price: "", discount: "" }]);
    setNextKey((k) => k + 1);
  }
  function update(key: number, patch: Partial<Line>) {
    setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function pick(key: number, productId: string) {
    const product = byId.get(productId);
    update(key, { product_id: productId || null, unit_price: product?.selling_price != null ? inputAmount(product.selling_price, lang) : "" });
  }

  const totals = lines.map((l) => {
    const qty = parseMilli(l.quantity);
    const price = parseCents(l.unit_price);
    const disc = l.discount.trim() ? parseCents(l.discount) : 0;
    return qty !== null && price !== null && disc !== null ? lineTotalCents(qty, price, disc) : null;
  });
  const subtotal = totals.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const orderDiscount = discount.trim() ? (parseCents(discount) ?? 0) : 0;
  const total = subtotal - orderDiscount;
  const paidCents = paid.trim() ? (parseCents(paid) ?? 0) : 0;
  const payload = JSON.stringify(
    lines.map((l) => ({ line_kind: l.line_kind, product_id: l.product_id, description: l.description, quantity: l.quantity, unit_price: l.unit_price, discount: l.discount })),
  );

  return (
    <AdminForm action={recordSale} submitLabel={s.record} idempotent>
      {(state) => (
        <div className="space-y-6">
          <input type="hidden" name="lines" value={payload} />
          {requestId ? <input type="hidden" name="quotation_request_id" value={requestId} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="customer_id" label={b.common.customer} error={state.fieldErrors.customer_id}>
              {(p) => (
                <Select {...p} name="customer_id" defaultValue={defaultCustomer ?? ""}>
                  <option value="">{b.common.walkIn}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.phone ? `${c.name} · ${c.phone}` : c.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="flex items-end">
              <Link href="/admin/business/customers#quick" className="text-accent inline-flex min-h-11 items-center text-sm font-medium">
                + {b.customers.new}
              </Link>
            </div>
          </div>

          {/* Lines */}
          <fieldset className="space-y-3">
            <legend className="text-fg mb-2 text-base font-semibold">{s.lines}</legend>
            {lines.length === 0 ? <p className="text-fg-muted text-sm">{state.fieldErrors.lines ?? "—"}</p> : null}
            {lines.map((line, index) => {
              const product = line.product_id ? byId.get(line.product_id) : undefined;
              const options = line.line_kind === "service" ? services : stockItems;
              const lineTotal = totals[index];
              return (
                <div key={line.key} className="border-line bg-bg space-y-3 rounded-[var(--radius-card)] border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-fg-muted text-xs font-semibold uppercase">
                      {index + 1}. {s.lineKind[line.line_kind]}
                    </p>
                    <button type="button" onClick={() => setLines((c) => c.filter((l) => l.key !== line.key))} className="text-danger min-h-11 px-2 text-sm font-medium">
                      {b.common.remove}
                    </button>
                  </div>
                  {line.line_kind !== "custom" ? (
                    <Field id={`line-${line.key}-product`} label={line.line_kind === "service" ? b.itemType.service : b.itemType.product}>
                      {(p) => (
                        <Select {...p} value={line.product_id ?? ""} onChange={(e) => pick(line.key, e.target.value)} required={line.line_kind === "product"}>
                          <option value="">{s.chooseProduct}</option>
                          {options.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.sku ? `${o.name} (${o.sku})` : o.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  ) : null}
                  {product ? (
                    <p className="text-fg-muted -mt-1 text-xs">
                      {product.track_stock && line.line_kind === "product"
                        ? format(s.stockAvailable, { qty: `${formatQty(product.quantity_on_hand, lang)} ${product.unit}` })
                        : s.noStockDeduction}
                      {product.track_stock && line.line_kind === "product" && (parseMilli(line.quantity) ?? 0) > dbMilli(product.quantity_on_hand) ? (
                        <span className="text-danger ms-2 font-semibold">{b.products.outOfStock}</span>
                      ) : null}
                    </p>
                  ) : null}
                  <Field id={`line-${line.key}-description`} label={s.lineDescription} required={line.line_kind === "custom"}>
                    {(p) => (
                      <Input {...p} value={line.description} dir="auto" maxLength={300} placeholder={product?.name} onChange={(e) => update(line.key, { description: e.target.value })} />
                    )}
                  </Field>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Field id={`line-${line.key}-qty`} label={product ? `${b.common.quantity} (${product.unit})` : b.common.quantity}>
                      {(p) => <Input {...p} value={line.quantity} inputMode="decimal" dir="ltr" onChange={(e) => update(line.key, { quantity: e.target.value })} />}
                    </Field>
                    <Field id={`line-${line.key}-price`} label={b.common.unitPrice}>
                      {(p) => <Input {...p} value={line.unit_price} inputMode="decimal" dir="ltr" placeholder="0,00" onChange={(e) => update(line.key, { unit_price: e.target.value })} />}
                    </Field>
                    <Field id={`line-${line.key}-discount`} label={b.common.discount}>
                      {(p) => <Input {...p} value={line.discount} inputMode="decimal" dir="ltr" placeholder="0,00" onChange={(e) => update(line.key, { discount: e.target.value })} />}
                    </Field>
                    <div className="flex flex-col justify-end">
                      <p className="text-fg-muted text-sm">{s.lineTotal}</p>
                      <p className={lineTotal === null || lineTotal < 0 ? "text-danger font-semibold" : "font-semibold tabular-nums"} dir="ltr">
                        {lineTotal === null ? "—" : formatMoney(lineTotal, lang, { cents: true })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["product", s.addProduct],
                  ["service", s.addService],
                  ["custom", s.addCustom],
                ] as const
              ).map(([kind, label]) => (
                <button key={kind} type="button" onClick={() => add(kind)} className="border-line-strong hover:border-accent hover:text-accent inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold">
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Totals & payment */}
          <div className="bg-surface space-y-4 rounded-[var(--radius-card)] p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="discount" label={s.orderDiscount} error={state.fieldErrors.discount}>
                {(p) => <Input {...p} name="discount" value={discount} inputMode="decimal" dir="ltr" placeholder="0,00" onChange={(e) => setDiscount(e.target.value)} />}
              </Field>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 self-end text-sm">
                <dt className="text-fg-muted">{s.subtotal}</dt>
                <dd className="text-end tabular-nums" dir="ltr">{formatMoney(subtotal, lang, { cents: true })}</dd>
                <dt className="text-fg font-semibold">{s.totalDue}</dt>
                <dd className={total < 0 ? "text-danger text-end text-lg font-semibold" : "text-end text-lg font-semibold tabular-nums"} dir="ltr">
                  {formatMoney(total, lang, { cents: true })}
                </dd>
              </dl>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="paid_now" label={s.paidNow} hint={s.paidNowHint} error={state.fieldErrors.paid_now}>
                {(p) => <Input {...p} name="paid_now" value={paid} inputMode="decimal" dir="ltr" placeholder="0,00" onChange={(e) => setPaid(e.target.value)} />}
              </Field>
              <Choice name="method" label={s.method} options={PAYMENT_METHODS.map((m) => ({ value: m, label: b.paymentMethod[m] }))} defaultValue="cash" />
              <TextInput name="payment_reference" label={s.paymentReference} maxLength={120} />
            </div>
            <p className="text-sm">
              <span className="text-fg-muted">{s.remaining} : </span>
              <span className="font-semibold tabular-nums" dir="ltr">{formatMoney(Math.max(total - paidCents, 0), lang, { cents: true })}</span>
              {paidCents > total ? <span className="text-danger ms-2 font-medium">{s.overpaid}</span> : null}
            </p>
            <button
              type="button"
              onClick={() => setPaid(total > 0 ? (lang === "fr" ? centsToDecimal(total).replace(".", ",") : centsToDecimal(total)) : "")}
              className="text-accent min-h-11 text-sm font-semibold underline-offset-4 hover:underline"
            >
              {s.paidFully} = {formatMoney(Math.max(total, 0), lang, { cents: true })}
            </button>
          </div>

          <details className="border-line rounded-[var(--radius-card)] border">
            <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-semibold">{b.common.notes} · {s.initialStatus} · {s.soldAt}</summary>
            <div className="border-line space-y-4 border-t p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Choice name="order_status" label={s.initialStatus} options={OPEN_ORDER_STATUSES.map((v) => ({ value: v, label: b.orderStatus[v] }))} defaultValue="new" />
                <TextInput name="sold_at" type="datetime-local" label={s.soldAt} hint={b.common.nowHint} error={state.fieldErrors.sold_at} />
                <TextInput name="due_date" type="date" label={s.dueDate} error={state.fieldErrors.due_date} />
              </div>
              <TextArea name="notes" label={b.common.notes} error={state.fieldErrors.notes} />
              {canNegative ? <CheckboxField name="allow_negative" label={b.products.forceNegative} checked={false} /> : null}
            </div>
          </details>
        </div>
      )}
    </AdminForm>
  );
}
