"use server";

import { after } from "next/server";
import { getProductsByIds } from "@/features/catalog/queries";
import { notifyContact, notifyQuote } from "./notifications";
import { contactSchema, quoteSchema, readQuoteItems, toFieldErrors, type FieldErrors } from "./schema";
import { clientIpHash, echo, field, looksLikeSpam, submissionId } from "./form-guards";
import { insertContactInquiry, insertQuotationRequest } from "./submit";

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

  // Bulk production: a catalog item may not be requested below its minimum order quantity.
  const ids = input.items.flatMap((item) => (item.productId ? [item.productId] : []));
  // A failed lookup must not block the request: the RPC still validates the products.
  const products = ids.length
    ? await getProductsByIds("fr", ids).catch((error: unknown) => {
        console.error("[quote] product lookup failed", error instanceof Error ? error.message : error);
        return [];
      })
    : [];
  const moq = new Map(products.map((p) => [p.id, p.minOrderQuantity]));
  const moqErrors: FieldErrors = {};
  input.items.forEach((item, index) => {
    const min = item.productId ? moq.get(item.productId) : null;
    if (min && item.quantity < min) moqErrors[`items.${index}.quantity`] = "below_moq";
  });
  if (Object.keys(moqErrors).length > 0) return { status: "error", fieldErrors: moqErrors, values };

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
    await notifyQuote(input, reference, new Map(products.map((p) => [p.id, p.sku ? `${p.name} (${p.sku})` : p.name])));
  });
  return { status: "success", reference };
}
