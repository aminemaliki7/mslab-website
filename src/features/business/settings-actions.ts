"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { failure, fromZod, success, type AdminActionState } from "@/features/admin/action-state";
import { createSessionClient } from "@/lib/supabase/server";
import { fromRpc, notAllowed } from "./errors";
import { authorize } from "./permissions";
import { attachStaffSchema, categorySchema, formFields, roleAssignmentSchema, supplierSchema } from "./schemas";

/** Categories, suppliers and team access (ADR-027/028). */

const categoryPermission = (kind: "product" | "expense") => (kind === "product" ? "business.products.manage" : "business.expenses.manage");

export async function addCategory(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const parsed = categorySchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  if (!(await authorize(categoryPermission(parsed.data.kind)))) return notAllowed();
  const { error } = await (await createSessionClient()).from("business_categories").insert(parsed.data);
  if (error) return fromRpc(error, "add category");
  refresh();
  return success("Catégorie ajoutée.");
}

const toggleSchema = z.object({ id: z.uuid(), kind: z.enum(["product", "expense"]), active: z.enum(["true", "false"]) });

export async function setCategoryActive(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const parsed = toggleSchema.safeParse(formFields(formData));
  if (!parsed.success) return failure("Requête invalide.");
  if (!(await authorize(categoryPermission(parsed.data.kind)))) return notAllowed();
  const { error } = await (await createSessionClient()).from("business_categories").update({ is_active: parsed.data.active === "true" }).eq("id", parsed.data.id);
  if (error) return fromRpc(error, "toggle category");
  refresh();
  return success("Catégorie mise à jour.");
}

export async function saveSupplier(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.expenses.manage"))) return notAllowed();
  const parsed = supplierSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, ...row } = parsed.data;
  const db = await createSessionClient();
  const { error } = id ? await db.from("business_suppliers").update(row).eq("id", id) : await db.from("business_suppliers").insert(row);
  if (error) return fromRpc(error, "save supplier");
  refresh();
  return success("Fournisseur enregistré.");
}

export async function assignRole(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await authorize("roles.manage");
  if (!admin) return notAllowed();
  const parsed = roleAssignmentSchema.safeParse(formFields(formData));
  if (!parsed.success) return failure("Requête invalide.");
  const { error } = await (await createSessionClient()).from("staff_roles").insert({ ...parsed.data, assigned_by: admin.id });
  if (error && error.code !== "23505") return fromRpc(error, "assign role");
  refresh();
  return success("Rôle attribué.");
}

export async function removeRole(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("roles.manage"))) return notAllowed();
  const parsed = roleAssignmentSchema.safeParse(formFields(formData));
  if (!parsed.success) return failure("Requête invalide.");
  const { error } = await (await createSessionClient()).from("staff_roles").delete().eq("staff_id", parsed.data.staff_id).eq("role_id", parsed.data.role_id);
  if (error) return fromRpc(error, "remove role");
  refresh();
  return success("Rôle retiré.");
}

export async function attachStaff(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("staff.manage"))) return notAllowed();
  const parsed = attachStaffSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await (await createSessionClient()).rpc("attach_staff_by_email", {
    p_email: parsed.data.email,
    p_full_name: parsed.data.full_name,
    p_kind: parsed.data.kind,
  });
  if (error) return fromRpc(error, "attach staff");
  refresh();
  return success("Compte rattaché. Attribuez-lui maintenant un rôle.");
}
