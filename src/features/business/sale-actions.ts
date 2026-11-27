"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { failure, fromZod, success, type AdminActionState } from "@/features/admin/action-state";
import { createSessionClient } from "@/lib/supabase/server";
import { fromRpc, notAllowed } from "./errors";
import { centsToDecimal, lineTotalCents, milliToDecimal, parseCents, parseMilli } from "./money";
import { authorize } from "./permissions";
import { formFields, paymentSchema, reasonSchema, saleNotesSchema, saleSchema, saleStatusSchema } from "./schemas";

/**
 * Sales, payments and order follow-up (ADR-028). Every money/stock change is one RPC call
 * (one transaction in Postgres); totals are recomputed there — the values below only validate
 * the form and give precise error messages before the call.
 */

export async function recordSale(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.sales.manage"))) return notAllowed();
  const fields = formFields(formData);
  const parsed = saleSchema.safeParse({ ...fields, client_key: fields.client_key || crypto.randomUUID() });
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  if (v.allow_negative && !(await authorize("business.stock.negative"))) return notAllowed();

  const items: Array<Record<string, string | null>> = [];
  let subtotal = 0;
  for (const [index, line] of v.lines.entries()) {
    const qty = parseMilli(line.quantity);
    const price = parseCents(line.unit_price);
    const discount = line.discount.trim() ? parseCents(line.discount) : 0;
    const invalid = `Ligne ${index + 1} invalide.`;
    if (!qty || price === null || price < 0 || discount === null || discount < 0) return failure(invalid);
    if (line.line_kind === "product" && !line.product_id) return failure(invalid);
    if (line.line_kind === "custom" && !line.description) return failure(invalid);
    const total = lineTotalCents(qty, price, discount);
    if (total < 0) return failure(invalid);
    subtotal += total;
    items.push({
      line_kind: line.line_kind,
      product_id: line.line_kind === "custom" ? null : line.product_id,
      description: line.description || null,
      quantity: milliToDecimal(qty),
      unit_price: centsToDecimal(price),
      discount_amount: centsToDecimal(discount),
    });
  }
  const discount = v.discount ?? 0;
  if (discount > subtotal) return failure("La remise dépasse le sous-total.", { discount: "La remise dépasse le sous-total." });
  const paid = v.paid_now ?? 0;
  if (paid > subtotal - discount) return failure("Le montant dépasse le reste à payer.", { paid_now: "Le montant dépasse le reste à payer." });

  const { data: saleId, error } = await (await createSessionClient()).rpc("business_record_sale", {
    p_payload: {
      client_key: v.client_key,
      customer_id: v.customer_id,
      quotation_request_id: v.quotation_request_id,
      sold_at: v.sold_at,
      order_status: v.order_status,
      due_date: v.due_date,
      discount_amount: centsToDecimal(discount),
      notes: v.notes,
      allow_negative: v.allow_negative,
      items,
      payment: paid > 0 ? { amount: centsToDecimal(paid), method: v.method, reference: v.payment_reference } : null,
    },
  });
  if (error) return fromRpc(error, "record sale");
  redirect(`/admin/business/sales/${saleId}?saved=1`);
}

export async function recordPayment(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.sales.manage"))) return notAllowed();
  const fields = formFields(formData);
  const parsed = paymentSchema.safeParse({ ...fields, client_key: fields.client_key || crypto.randomUUID() });
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const { error } = await (await createSessionClient()).rpc("business_record_payment", {
    p_sale_id: v.sale_id,
    p_amount: Number(centsToDecimal(v.amount ?? 0)),
    p_method: v.method,
    p_client_key: v.client_key,
    p_paid_at: v.paid_at ?? undefined,
    p_reference: v.reference ?? undefined,
  });
  if (error) return fromRpc(error, "record payment");
  refresh();
  return success("Paiement enregistré.");
}

export async function voidPayment(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.finance.correct"))) return notAllowed();
  const parsed = reasonSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await (await createSessionClient()).rpc("business_void_payment", { p_payment_id: parsed.data.id, p_reason: parsed.data.reason });
  if (error) return fromRpc(error, "void payment");
  refresh();
  return success("Paiement annulé.");
}

export async function setSaleStatus(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.sales.manage"))) return notAllowed();
  const parsed = saleStatusSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await (await createSessionClient()).rpc("business_set_sale_status", {
    p_sale_id: parsed.data.id,
    p_status: parsed.data.status,
    p_note: parsed.data.note ?? undefined,
  });
  if (error) return fromRpc(error, "sale status");
  refresh();
  return success("Statut de la commande mis à jour.");
}

export async function cancelSale(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.sales.manage"))) return notAllowed();
  const parsed = reasonSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await (await createSessionClient()).rpc("business_cancel_sale", { p_sale_id: parsed.data.id, p_reason: parsed.data.reason });
  if (error) return fromRpc(error, "cancel sale");
  refresh();
  return success("Vente annulée.");
}

export async function saveSaleNotes(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.sales.manage"))) return notAllowed();
  const parsed = saleNotesSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await (await createSessionClient()).from("business_sales").update({ notes: parsed.data.notes, due_date: parsed.data.due_date }).eq("id", parsed.data.id);
  if (error) return fromRpc(error, "sale notes");
  refresh();
  return success("Notes enregistrées.");
}
