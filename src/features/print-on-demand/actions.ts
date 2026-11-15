"use server";

import { after } from "next/server";
import { clientIpHash, echo, field, looksLikeSpam, submissionId } from "@/features/inquiries/form-guards";
import { notifyCustomRequest } from "@/features/inquiries/notifications";
import { toFieldErrors, type FieldErrors } from "@/features/inquiries/schema";
import { getServerEnv } from "@/lib/server-env";
import { createPublicClient } from "@/lib/supabase/public";
import { customRequestSchema, trackingSchema } from "./schema";

/**
 * Print on demand — public actions.
 * 1. requestUploadTicket: rate-limited ticket; the browser then uploads files straight to the
 *    private `custom-uploads` bucket under "<ticket>/…" (Storage policy checks the ticket).
 * 2. submitCustomRequest: anti-spam → Zod → submit_custom_request RPC (attaches the ticket's
 *    files, snapshots option names) → after(): e-mails.
 * 3. trackRequest: reference + e-mail → status timeline (rate-limited RPC).
 */

export type CustomFormError = "rate_limited" | "server_error" | "invalid_option";

export type CustomRequestState =
  | { status: "idle" }
  | { status: "success"; reference: string | null }
  | { status: "error"; fieldErrors: FieldErrors; formError?: CustomFormError; values: Record<string, string> };

export async function requestUploadTicket(): Promise<{ ok: true; ticket: string } | { ok: false; reason: "rate_limited" | "server_error" }> {
  const { data, error } = await createPublicClient().rpc("create_upload_ticket", {
    submission_key: getServerEnv().FORM_SUBMISSION_KEY,
    ip_hash: await clientIpHash(),
  });
  if (error || !data) {
    console.error("[print-on-demand] create_upload_ticket failed", error?.code);
    return { ok: false, reason: error?.message.includes("rate_limited") ? "rate_limited" : "server_error" };
  }
  return { ok: true, ticket: data };
}

const TEXT_FIELDS = [
  "projectType",
  "description",
  "quantity",
  "width",
  "height",
  "depth",
  "dimensionUnit",
  "materialOptionId",
  "materialOther",
  "deadline",
  "fullName",
  "email",
  "phone",
  "companyName",
  "preferredContact",
];

export async function submitCustomRequest(_prev: CustomRequestState, formData: FormData): Promise<CustomRequestState> {
  if (looksLikeSpam(formData)) return { status: "success", reference: null };

  const values = echo(formData, TEXT_FIELDS);
  const finishingIds = formData.getAll("finishingOptionIds").filter((v): v is string => typeof v === "string");
  values.finishingOptionIds = finishingIds.join(",");

  const parsed = customRequestSchema.safeParse({
    ...Object.fromEntries(TEXT_FIELDS.map((key) => [key, field(formData, key)])),
    finishingOptionIds: finishingIds,
    uploadTicket: field(formData, "uploadTicket") || undefined,
    consent: field(formData, "consent"),
    locale: field(formData, "locale"),
    sourcePath: field(formData, "sourcePath"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  const input = parsed.data;

  const { data: reference, error } = await createPublicClient().rpc("submit_custom_request", {
    submission_key: getServerEnv().FORM_SUBMISSION_KEY,
    payload: {
      submission_id: submissionId(formData),
      project_type: input.projectType,
      description: input.description,
      quantity: input.quantity,
      width: input.width,
      height: input.height,
      depth: input.depth,
      dimension_unit: input.dimensionUnit,
      material_option_id: input.materialOptionId,
      material_other: input.materialOptionId ? null : input.materialOther,
      finishing_option_ids: input.finishingOptionIds,
      deadline: input.deadline,
      upload_ticket: input.uploadTicket ?? null,
      // Only files still listed in the form are attached (a visitor can remove an upload).
      files: formData
        .getAll("uploadedFiles")
        .filter((v): v is string => typeof v === "string" && v.startsWith(`${input.uploadTicket}/`))
        .slice(0, 5),
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
    console.error("[print-on-demand] submit_custom_request failed", error?.code);
    const message = error?.message ?? "";
    const formError: CustomFormError = message.includes("rate_limited")
      ? "rate_limited"
      : message.includes("invalid_option")
        ? "invalid_option"
        : "server_error";
    return { status: "error", fieldErrors: {}, formError, values };
  }

  const dims = [input.width, input.height, input.depth].filter((v) => v !== null);
  after(() =>
    notifyCustomRequest(
      {
        ...input,
        dimensions: dims.length ? `${dims.join(" × ")} ${input.dimensionUnit}` : null,
        material: input.materialOptionId ? "option choisie dans la liste (voir l'administration)" : input.materialOther,
      },
      reference,
    ),
  );
  return { status: "success", reference };
}

export type TrackingEvent = { status: string; at: string };
export type TrackingState =
  | { status: "idle" }
  | { status: "found"; reference: string; current: string; createdAt: string; events: TrackingEvent[] }
  | { status: "not_found"; values: Record<string, string> }
  | { status: "error"; fieldErrors: FieldErrors; formError?: "rate_limited" | "server_error"; values: Record<string, string> };

export async function trackRequest(_prev: TrackingState, formData: FormData): Promise<TrackingState> {
  const values = echo(formData, ["reference", "email"]);
  const parsed = trackingSchema.safeParse({ reference: field(formData, "reference"), email: field(formData, "email") });
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };

  const { data, error } = await createPublicClient().rpc("track_quotation", {
    p_reference: parsed.data.reference,
    p_email: parsed.data.email,
    submission_key: getServerEnv().FORM_SUBMISSION_KEY,
    ip_hash: await clientIpHash(),
  });
  if (error) {
    console.error("[print-on-demand] track_quotation failed", error.code);
    return {
      status: "error",
      fieldErrors: {},
      formError: error.message.includes("rate_limited") ? "rate_limited" : "server_error",
      values,
    };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return { status: "not_found", values };

  const result = data as { reference: string; status: string; created_at: string; events: TrackingEvent[] };
  return {
    status: "found",
    reference: result.reference,
    current: result.status,
    createdAt: result.created_at,
    events: Array.isArray(result.events) ? result.events : [],
  };
}
