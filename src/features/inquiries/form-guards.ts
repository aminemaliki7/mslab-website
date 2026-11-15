import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { hashIp } from "./submit";

/** Shared anti-spam and FormData helpers for public form actions. */

const MIN_FILL_MS = 3_000;
const MAX_FILL_MS = 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Honeypot + minimum fill time. `startedAt` is set by the client on hydration; when it is
 * missing (no JavaScript) only the honeypot and the database rate limit apply.
 */
export function looksLikeSpam(formData: FormData): boolean {
  if (String(formData.get("website") ?? "").trim() !== "") return true;
  const startedAt = Number(formData.get("startedAt"));
  if (Number.isFinite(startedAt) && startedAt > 0) {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) return true;
  }
  return false;
}

export async function clientIpHash(): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || null;
  return hashIp(ip);
}

export function submissionId(formData: FormData): string {
  const value = String(formData.get("submissionId") ?? "");
  return UUID.test(value) ? value : randomUUID();
}

/** Echo text fields back so the form can be re-filled after a validation error. */
export function echo(formData: FormData, keys: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value.slice(0, 5000);
  }
  return values;
}

export const field = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
};
