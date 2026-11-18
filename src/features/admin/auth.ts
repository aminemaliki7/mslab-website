import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Data Access Layer for the back office (docs/SECURITY_STRATEGY.md §2).
 * Admin = authenticated Supabase user (JWT verified with getUser) with an ACTIVE row in
 * admin_profiles AND a session verified with MFA (aal2). Never derived from user metadata or
 * anything the client sends. RLS applies the same rule (private.is_admin requires aal2).
 */
export type AdminUser = { id: string; email: string | null; profile: Tables<"admin_profiles"> };

type AdminSession = { admin: AdminUser; mfaVerified: boolean };

const getAdminSession = cache(async (): Promise<AdminSession | null> => {
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

  // The token was verified by getUser() above; its aal claim says whether MFA was completed.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return { admin: { id: user.id, email: user.email ?? null, profile }, mfaVerified: aal?.currentLevel === "aal2" };
});

/** The signed-in admin, or null (also null until the MFA step is completed). */
export async function getAdmin(): Promise<AdminUser | null> {
  const session = await getAdminSession();
  return session?.mfaVerified ? session.admin : null;
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<AdminUser> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!session.mfaVerified) redirect("/admin/mfa");
  return session.admin;
}

export async function requireOwner(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.profile.role !== "owner") redirect("/admin");
  return admin;
}

/** MFA step only: signed in with a password, MFA not completed yet. */
export async function requirePendingMfa(): Promise<AdminUser> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.mfaVerified) redirect("/admin");
  return session.admin;
}
