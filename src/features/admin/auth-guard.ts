import "server-only";
import { clientIpHash } from "@/features/inquiries/form-guards";
import { getServerEnv } from "@/lib/server-env";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Per-IP limit on failed admin sign-in and MFA attempts (public.admin_auth_guard, migration
 * 20261119100000). Supabase Auth only sees this server's address, so its own limits cannot tell
 * an attacker from the real admin; this counter uses the visitor's hashed IP.
 *
 * Fails open (and logs) if the database function is missing or errors, so a configuration
 * problem never locks every admin out; the generic error message is unchanged either way.
 */
export async function isAuthRateLimited(): Promise<boolean> {
  const { error } = await createPublicClient().rpc("admin_auth_guard", {
    submission_key: getServerEnv().FORM_SUBMISSION_KEY,
    ip_hash: await clientIpHash(),
    record_failure: false,
  });
  if (!error) return false;
  if (error.message.includes("rate_limited")) return true;
  console.error("[admin-auth] guard check failed", error.code);
  return false;
}

export async function recordAuthFailure(): Promise<void> {
  const { error } = await createPublicClient().rpc("admin_auth_guard", {
    submission_key: getServerEnv().FORM_SUBMISSION_KEY,
    ip_hash: await clientIpHash(),
    record_failure: true,
  });
  if (error) console.error("[admin-auth] failed to record a failed attempt", error.code);
}
