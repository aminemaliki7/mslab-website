"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { getProductsByIds } from "@/features/catalog/queries";
import { notifyContact, notifyQuote } from "./notifications";
import { contactSchema, quoteSchema, readQuoteItems, toFieldErrors, type FieldErrors } from "./schema";
import { hashIp, insertContactInquiry, insertQuotationRequest } from "./submit";

/**
 * Public form actions (contact + quotation). Pipeline:
 * anti-spam → Zod validation → SECURITY DEFINER RPC (rate limit, idempotency) → after(): emails.
 * Never trusts client-provided names/prices; the database snapshots product names itself.
 */

export type FormError = "rate_limited" | "server_error" | "invalid_item";

export type FormState =
  | { status: "idle" }
  | { status: "success"; reference: string | null }
  | { status: "error"; fieldErrors: FieldErrors; formError?: FormError; values: Record<string, string> };

const MIN_FILL_MS = 3_000;
const MAX_FILL_MS = 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Honeypot + minimum fill time. `startedAt` is set by the client on hydration; when it is
 * missing (no JavaScript) only the honeypot and the database rate limit apply.
 */
function looksLikeSpam(formData: FormData): boolean {
  if (String(formData.get("website") ?? "").trim() !== "") return true;
  const startedAt = Number(formData.get("startedAt"));
  if (Number.isFinite(startedAt) && startedAt > 0) {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) return true;
  }
  return false;
}

async function clientIpHash(): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || null;
  return hashIp(ip);
}

function submissionId(formData: FormData): string {
  const value = String(formData.get("submissionId") ?? "");
  return UUID.test(value) ? value : randomUUID();
}

/** Echo text fields back so the form can be re-filled after a validation error. */
function echo(formData: FormData, keys: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value.slice(0, 5000);
  }
  return values;
}

const field = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
};

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  // Silent drop: bots get a generic success and learn nothing.
  if (looksLikeSpam(formData)) return { status: "success", reference: null };

  const values = echo(formData, ["fullName", "email", "phone", "subject", "message"]);
  const parsed = contactSchema.safeParse({
    fullName: field(formData, "fullName"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    subject: field(formData, "subject"),
    message: field(formData, "message"),
    consent: field(formData, "consent"),
    locale: field(formData, "locale"),
    sourcePath: field(formData, "sourcePath"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };

  const input = parsed.data;
  const result = await insertContactInquiry({
    submissionId: submissionId(formData),
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    subject: input.subject,
    message: input.message,
    locale: input.locale,
    sourcePath: input.sourcePath,
    consent: true,
    ipHash: await clientIpHash(),
  });

  if (!result.ok) {
    const formError: FormError = result.reason === "rate_limited" ? "rate_limited" : "server_error";
    return { status: "error", fieldErrors: {}, formError, values };
  }

  const reference = result.reference;
  after(() => notifyContact(input, reference));
  return { status: "success", reference };
}

export async function submitQuote(_prev: FormState, formData: FormData): Promise<FormState> {
  if (looksLikeSpam(formData)) return { status: "success", reference: null };

  const values = echo(formData, ["fullName", "email", "phone", "companyName", "message", "preferredContact"]);
  const parsed = quoteSchema.safeParse({
    fullName: field(formData, "fullName"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    companyName: field(formData, "companyName"),
    message: field(formData, "message"),
    preferredContact: field(formData, "preferredContact"),
    consent: field(formData, "consent"),
    locale: field(formData, "locale"),
    sourcePath: field(formData, "sourcePath"),
    items: readQuoteItems(formData),
  });
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };

  const input = parsed.data;
  const result = await insertQuotationRequest({
    submissionId: submissionId(formData),
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    companyName: input.companyName,
    message: input.message,
    preferredContact: input.preferredContact,
    locale: input.locale,
    sourcePath: input.sourcePath,
    consent: true,
    ipHash: await clientIpHash(),
    items: input.items.map((item) =>
      item.productId
        ? { productId: item.productId, quantity: item.quantity, specifications: item.specifications }
        : { label: item.label!, quantity: item.quantity, specifications: item.specifications },
    ),
  });

  if (!result.ok) {
    const formError: FormError =
      result.reason === "rate_limited" ? "rate_limited" : result.reason === "invalid_product" ? "invalid_item" : "server_error";
    return { status: "error", fieldErrors: {}, formError, values };
  }

  const reference = result.reference;
  after(async () => {
    const ids = input.items.flatMap((item) => (item.productId ? [item.productId] : []));
    const products = ids.length ? await getProductsByIds("fr", ids) : [];
    await notifyQuote(input, reference, new Map(products.map((p) => [p.id, p.sku ? `${p.name} (${p.sku})` : p.name])));
  });
  return { status: "success", reference };
}
