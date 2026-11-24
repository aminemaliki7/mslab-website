"use server";

import { after } from "next/server";
import { getServerEnv } from "@/lib/server-env";
import { createPublicClient } from "@/lib/supabase/public";
import { briefSchema } from "./brief";
import { clientIpHash, echo, field, looksLikeSpam, submissionId } from "./form-guards";
import { notifyBriefRequest } from "./notifications";
import { toFieldErrors, type FieldErrors } from "./schema";

export type BriefFormError = "rate_limited" | "server_error" | "brief_missing";

export type BriefRequestState =
  | { status: "idle" }
  | { status: "success"; reference: string | null }
  | { status: "error"; fieldErrors: FieldErrors; formError?: BriefFormError; values: Record<string, string> };

const TEXT_FIELDS = ["message", "fullName", "email", "phone", "companyName", "preferredContact"];

/**
 * Quote request sent as a requirements file: anti-spam → Zod → submit_brief_request RPC (which
 * attaches only the requirements files uploaded with this ticket and refuses a request without
 * one) → after(): e-mails. Same guards as the other request actions.
 */
export async function submitBriefRequest(_prev: BriefRequestState, formData: FormData): Promise<BriefRequestState> {
  if (looksLikeSpam(formData)) return { status: "success", reference: null };

  const values = echo(formData, TEXT_FIELDS);
  const ticket = field(formData, "uploadTicket");
  const parsed = briefSchema.safeParse({
    kind: field(formData, "briefKind"),
    uploadTicket: ticket || undefined,
    // Only files still listed in the form, uploaded under this ticket.
    files: formData.getAll("uploadedFiles").filter((v): v is string => typeof v === "string" && Boolean(ticket) && v.startsWith(`${ticket}/`)),
    ...Object.fromEntries(TEXT_FIELDS.map((key) => [key, field(formData, key)])),
    consent: field(formData, "consent"),
    locale: field(formData, "locale"),
    sourcePath: field(formData, "sourcePath"),
  });
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error);
    const missing = fieldErrors.files || fieldErrors.uploadTicket;
    return { status: "error", fieldErrors, formError: missing ? "brief_missing" : undefined, values };
  }
  const input = parsed.data;

  const { data: reference, error } = await createPublicClient().rpc("submit_brief_request", {
    submission_key: getServerEnv().FORM_SUBMISSION_KEY,
    payload: {
      submission_id: submissionId(formData),
      kind: input.kind,
      upload_ticket: input.uploadTicket,
      files: input.files,
      message: input.message,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      company_name: input.companyName,
      preferred_contact: input.preferredContact,
      locale: input.locale,
      source_path: input.sourcePath,
      consent: true,
      ip_hash: await clientIpHash(),
    },
  });

  if (error || !reference) {
    console.error("[quotations] submit_brief_request failed", error?.code);
    const message = error?.message ?? "";
    const formError: BriefFormError = message.includes("rate_limited") ? "rate_limited" : message.includes("brief_missing") ? "brief_missing" : "server_error";
    return { status: "error", fieldErrors: {}, formError, values };
  }

  after(() => notifyBriefRequest({ ...input, fileCount: input.files.length }, reference));
  return { status: "success", reference };
}
