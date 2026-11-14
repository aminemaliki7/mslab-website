import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Data Access Layer for the back office (docs/SECURITY_STRATEGY.md §2).
 * Admin = authenticated Supabase user (JWT verified with getUser) with an ACTIVE row in
 * admin_profiles. Never derived from user metadata or anything the client sends.
 */
export type AdminUser = { id: string; email: string | null; profile: Tables<"admin_profiles"> };

export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createSessionClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!profile) return null;
  return { id: user.id, email: user.email ?? null, profile };
});

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireOwner(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.profile.role !== "owner") redirect("/admin");
  return admin;
}
