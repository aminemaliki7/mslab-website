"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/server";
import { requirePendingMfa } from "./auth";
import { isAuthRateLimited, recordAuthFailure } from "./auth-guard";

export type LoginState = { error: string | null; email: string };

const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

/** Same message for every failure: never reveal whether an account exists or is an admin. */
const GENERIC_ERROR = "Identifiants invalides ou accès non autorisé.";
const RATE_LIMITED = "Trop de tentatives. Réessayez dans 15 minutes.";

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = credentials.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: GENERIC_ERROR, email };
  if (await isAuthRateLimited()) return { error: RATE_LIMITED, email };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    await recordAuthFailure();
    return { error: GENERIC_ERROR, email };
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!profile) {
    // Valid Supabase account but not an admin: do not keep a session around.
    await supabase.auth.signOut();
    await recordAuthFailure();
    return { error: GENERIC_ERROR, email };
  }

  // Password accepted: the session is aal1 until the authenticator code is verified.
  redirect("/admin/mfa");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ─── MFA (TOTP authenticator app), required for every admin ───────────────── */

export type TotpEnrollment = { ok: true; factorId: string; qrCode: string; secret: string } | { ok: false; error: string };

const MFA_SETUP_ERROR = "Impossible de configurer l'authentification à deux facteurs. Réessayez.";

/** First sign-in: create a TOTP factor and return its QR code (shown once, then verified). */
export async function startTotpEnrollment(): Promise<TotpEnrollment> {
  await requirePendingMfa();
  const supabase = await createSessionClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.totp.some((f) => f.status === "verified")) return { ok: false, error: MFA_SETUP_ERROR };
  // Drop half-finished enrolments (page reloaded before the code was entered).
  for (const factor of factors?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "MSLAB admin" });
  if (error || !data) {
    console.error("[admin-auth] TOTP enrolment failed", error?.code);
    return { ok: false, error: MFA_SETUP_ERROR };
  }
  return { ok: true, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export type MfaState = { error: string | null };

const mfaInput = z.object({
  factorId: z.uuid(),
  code: z.string().regex(/^\d{6}$/),
});

const INVALID_CODE = "Code invalide. Saisissez le code à 6 chiffres affiché par votre application.";

export async function verifyTotp(_prev: MfaState, formData: FormData): Promise<MfaState> {
  await requirePendingMfa();
  const parsed = mfaInput.safeParse({
    factorId: formData.get("factorId"),
    code: String(formData.get("code") ?? "").replace(/\s/g, ""),
  });
  if (!parsed.success) return { error: INVALID_CODE };
  if (await isAuthRateLimited()) return { error: RATE_LIMITED };

  const supabase = await createSessionClient();
  // Supabase checks that the factor belongs to the signed-in user.
  const { error } = await supabase.auth.mfa.challengeAndVerify(parsed.data);
  if (error) {
    await recordAuthFailure();
    return { error: INVALID_CODE };
  }
  redirect("/admin");
}
