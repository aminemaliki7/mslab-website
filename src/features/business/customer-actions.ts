"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { failure, fromZod, success, type AdminActionState } from "@/features/admin/action-state";
import { createSessionClient } from "@/lib/supabase/server";
import { fromRpc, notAllowed } from "./errors";
import { authorize } from "./permissions";
import { customerNoteSchema, customerSchema, formFields } from "./schemas";

/** Customers & CRM (ADR-028). */

export async function saveCustomer(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.customers.manage"))) return notAllowed();
  const parsed = customerSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, from_request, ...row } = parsed.data;
  const db = await createSessionClient();
  if (id) {
    const { error } = await db.from("business_customers").update(row).eq("id", id);
    if (error) return fromRpc(error, "update customer");
    refresh();
    return success("Client enregistré.");
  }
  const { data, error } = await db.from("business_customers").insert(row).select("id").single();
  if (error) return fromRpc(error, "create customer");
  if (from_request) {
    const { error: linkError } = await db.rpc("business_link_customer", { p_customer_id: data.id, p_request_id: from_request });
    if (linkError) console.error("[business] link new customer to request", linkError.message);
  }
  // "Quick add" stays on the list (and keeps the flow fast); the full form opens the profile.
  if (formData.get("stay") === "1") {
    refresh();
    return success("Client enregistré.");
  }
  redirect(`/admin/business/customers/${data.id}`);
}

const archiveSchema = z.object({ id: z.uuid(), archived: z.enum(["true", "false"]) });

export async function setCustomerArchived(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.customers.manage"))) return notAllowed();
  const parsed = archiveSchema.safeParse(formFields(formData));
  if (!parsed.success) return failure("Requête invalide.");
  const archived = parsed.data.archived === "true";
  const { error } = await (await createSessionClient()).from("business_customers").update({ is_archived: archived }).eq("id", parsed.data.id);
  if (error) return fromRpc(error, "archive customer");
  refresh();
  return success(archived ? "Client archivé." : "Client réactivé.");
}

export async function addCustomerNote(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await authorize("business.customers.manage");
  if (!admin) return notAllowed();
  const parsed = customerNoteSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await (await createSessionClient()).from("business_customer_notes").insert({ ...parsed.data, created_by: admin.id });
  if (error) return fromRpc(error, "customer note");
  refresh();
  return success("Note ajoutée.");
}

const linkSchema = z.object({
  customer_id: z.uuid(),
  reference: z.string().trim().toUpperCase().regex(/^MS[A-Z]-\d{4}-\d{6}$/, { error: "Format invalide." }),
});

/** Links a website request (by its reference) to the customer. */
export async function linkRequest(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.customers.manage"))) return notAllowed();
  const parsed = linkSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const db = await createSessionClient();
  const { data: request } = await db.from("quotation_requests").select("id").eq("reference", parsed.data.reference).maybeSingle();
  if (!request) return failure("Demande introuvable.", { reference: "Demande introuvable." });
  const { error } = await db.rpc("business_link_customer", { p_customer_id: parsed.data.customer_id, p_request_id: request.id });
  if (error) return fromRpc(error, "link request");
  refresh();
  return success("Demande liée.");
}

const unlinkSchema = z.object({ request_id: z.uuid() });

export async function unlinkRequest(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.customers.manage"))) return notAllowed();
  const parsed = unlinkSchema.safeParse(formFields(formData));
  if (!parsed.success) return failure("Requête invalide.");
  const { error } = await (await createSessionClient()).rpc("business_link_customer", { p_customer_id: null as unknown as string, p_request_id: parsed.data.request_id });
  if (error) return fromRpc(error, "unlink request");
  refresh();
  return success("Demande déliée.");
}
