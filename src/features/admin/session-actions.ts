"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; email: string };

const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

/** Same message for every failure: never reveal whether an account exists or is an admin. */
const GENERIC_ERROR = "Identifiants invalides ou accès non autorisé.";

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = credentials.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: GENERIC_ERROR, email };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: GENERIC_ERROR, email };

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!profile) {
    // Valid Supabase account but not an admin: do not keep a session around.
    await supabase.auth.signOut();
    return { error: GENERIC_ERROR, email };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
