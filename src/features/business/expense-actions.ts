"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { failure, fromZod, success, type AdminActionState } from "@/features/admin/action-state";
import { createSessionClient } from "@/lib/supabase/server";
import { fromRpc, notAllowed } from "./errors";
import { attachFile, checkAttachment } from "./files";
import { centsToDecimal, lineTotalCents, milliToDecimal, parseCents, parseMilli } from "./money";
import { authorize } from "./permissions";
import { BUSINESS_BUCKET } from "./queries";
import { expenseSchema, expenseUpdateSchema, formFields, reasonSchema } from "./schemas";

/** Expenses & stock purchases (ADR-028). Amount and nature are fixed once recorded (void + re-enter). */

export async function recordExpense(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.expenses.manage"))) return notAllowed();
  const fields = formFields(formData);
  const parsed = expenseSchema.safeParse({ ...fields, client_key: fields.client_key || crypto.randomUUID() });
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const receipt = await checkAttachment(formData.get("receipt"));
  if (typeof receipt === "string") return failure(receipt, { receipt });

  const items: Array<{ product_id: string; quantity: string; unit_cost: string }> = [];
  let linesTotal = 0;
  if (v.treatment === "stock_purchase") {
    for (const [index, line] of v.lines.entries()) {
      const qty = parseMilli(line.quantity);
      const cost = parseCents(line.unit_cost);
      if (!qty || cost === null || cost < 0) return failure(`Ligne ${index + 1} invalide.`);
      linesTotal += lineTotalCents(qty, cost);
      items.push({ product_id: line.product_id, quantity: milliToDecimal(qty), unit_cost: centsToDecimal(cost) });
    }
  }
  if (linesTotal > (v.amount ?? 0)) return failure("Le total des articles dépasse le montant de la dépense.", { amount: "Le total des articles dépasse le montant de la dépense." });

  const db = await createSessionClient();
  const { data: expenseId, error } = await db.rpc("business_record_expense", {
    p_payload: {
      client_key: v.client_key,
      label: v.label,
      amount: centsToDecimal(v.amount ?? 0),
      treatment: v.treatment,
      category_id: v.category_id,
      supplier_id: v.supplier_id,
      payment_method: v.payment_method,
      expense_date: v.expense_date,
      reference: v.reference,
      description: v.description,
      update_cost: v.update_cost,
      items,
    },
  });
  if (error) return fromRpc(error, "record expense");
  if (receipt && !(await attachFile("expense", expenseId, receipt))) {
    // The expense itself is recorded; only the receipt failed — say so on its page.
    redirect(`/admin/business/expenses/${expenseId}?upload=failed`);
  }
  if (formData.get("stay") === "1") {
    refresh();
    return success("Dépense enregistrée.");
  }
  redirect(`/admin/business/expenses/${expenseId}?saved=1`);
}

export async function updateExpense(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.expenses.manage"))) return notAllowed();
  const parsed = expenseUpdateSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, ...row } = parsed.data;
  const { error } = await (await createSessionClient()).from("business_expenses").update(row).eq("id", id);
  if (error) return fromRpc(error, "update expense");
  refresh();
  return success("Dépense mise à jour.");
}

export async function voidExpense(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.finance.correct"))) return notAllowed();
  const parsed = reasonSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await (await createSessionClient()).rpc("business_void_expense", { p_expense_id: parsed.data.id, p_reason: parsed.data.reason });
  if (error) return fromRpc(error, "void expense");
  refresh();
  return success("Dépense annulée.");
}

const attachmentSchema = z.object({ entity_id: z.uuid(), entity_type: z.enum(["expense", "activity"]) });

export async function addAttachment(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const parsed = attachmentSchema.safeParse(formFields(formData));
  if (!parsed.success) return failure("Requête invalide.");
  const permission = parsed.data.entity_type === "expense" ? "business.expenses.manage" : "business.journal.write";
  if (!(await authorize(permission))) return notAllowed();
  const file = await checkAttachment(formData.get("file"));
  if (file === null) return failure("Choisissez une image.", { file: "Champ requis." });
  if (typeof file === "string") return failure(file, { file });
  if (!(await attachFile(parsed.data.entity_type, parsed.data.entity_id, file))) return failure("Le téléversement a échoué.");
  refresh();
  return success("Fichier joint.");
}

export async function removeAttachment(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return failure("Requête invalide.");
  const db = await createSessionClient();
  const { data: row } = await db.from("business_attachments").select("storage_path, entity_type").eq("id", id.data).maybeSingle();
  if (!row) return failure("Requête invalide.");
  const permission = row.entity_type === "expense" ? "business.expenses.manage" : "business.journal.write";
  if (!(await authorize(permission))) return notAllowed();
  const { error } = await db.from("business_attachments").delete().eq("id", id.data);
  if (error) return fromRpc(error, "remove attachment");
  await db.storage.from(BUSINESS_BUCKET).remove([row.storage_path]);
  refresh();
  return success("Fichier retiré.");
}
