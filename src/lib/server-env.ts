import "server-only";
import { z } from "zod";

/** Server-only secrets. Never import this file from a Client Component. */
const serverSchema = z.object({
  FORM_SUBMISSION_KEY: z.string().regex(/^[a-f0-9]{64}$/, "expected 64 hex chars"),
  IP_HASH_SALT: z.string().min(32),
});

let cached: z.infer<typeof serverSchema> | null = null;

/** Validated lazily so pages that never submit forms don't require these at build time. */
export function getServerEnv() {
  if (cached) return cached;
  const parsed = serverSchema.safeParse({
    FORM_SUBMISSION_KEY: process.env.FORM_SUBMISSION_KEY,
    IP_HASH_SALT: process.env.IP_HASH_SALT,
  });
  if (!parsed.success) {
    // Names only — never echo values.
    throw new Error(`Invalid server environment: ${Object.keys(z.flattenError(parsed.error).fieldErrors).join(", ")}`);
  }
  cached = parsed.data;
  return cached;
}
