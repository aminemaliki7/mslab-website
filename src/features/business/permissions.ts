import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireAdmin, type AdminUser } from "@/features/admin/auth";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Permission checks for the business module (ADR-027/028). The set comes from the database
 * (public.my_permissions(): active staff + MFA, Administrator = every key), loaded once per
 * request. Pages and actions check it; RLS and the SECURITY DEFINER RPCs check it again —
 * this layer is for clear errors and hidden menus, not the security boundary.
 */
export const BUSINESS_PERMISSIONS = [
  "business.read",
  "business.products.manage",
  "business.stock.manage",
  "business.stock.negative",
  "business.customers.manage",
  "business.sales.manage",
  "business.expenses.manage",
  "business.finance.correct",
  "business.journal.write",
  "business.journal.comment",
] as const;
export type BusinessPermission = (typeof BUSINESS_PERMISSIONS)[number];
export type Permission = BusinessPermission | "staff.read" | "staff.manage" | "roles.manage" | "requests.read" | "messages.read" | "site.content.manage" | (string & {});

export const getPermissions = cache(async (): Promise<ReadonlySet<string>> => {
  const db = await createSessionClient();
  const { data, error } = await db.rpc("my_permissions");
  if (error) {
    console.error("[business] my_permissions failed", error.code);
    return new Set();
  }
  return new Set(data ?? []);
});

/** Pages: signed-in staff (MFA) holding the permission, otherwise back to the dashboard. */
export async function requirePermission(permission: Permission = "business.read"): Promise<{ admin: AdminUser; can: (p: Permission) => boolean }> {
  const admin = await requireAdmin();
  const permissions = await getPermissions();
  if (!permissions.has(permission)) redirect("/admin");
  return { admin, can: (p) => permissions.has(p) };
}

/** Server actions: null when the permission is missing (the action returns "not allowed"). */
export async function authorize(permission: Permission): Promise<AdminUser | null> {
  const admin = await requireAdmin();
  const permissions = await getPermissions();
  return permissions.has(permission) ? admin : null;
}
