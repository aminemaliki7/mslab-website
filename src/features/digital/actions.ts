"use server";

import { after } from "next/server";
import { clientIpHash, echo, field, looksLikeSpam, submissionId } from "@/features/inquiries/form-guards";
import { notifyDigitalRequest } from "@/features/inquiries/notifications";
import { toFieldErrors, type FieldErrors } from "@/features/inquiries/schema";
import { getServerEnv } from "@/lib/server-env";
import { createPublicClient } from "@/lib/supabase/public";
import { digitalRequestSchema } from "./schema";

/**
 * Digital Solutions quote request: anti-spam → Zod → submit_digital_request RPC (stores a
 * quotation_request of kind 'digital' + its details) → after(): e-mails. Same reference format
 * (MSQ-…), admin inbox and order tracking as the other requests.
 */

export type DigitalRequestState =
  | { status: "idle" }
  | { status: "success"; reference: string | null }
  | { status: "error"; fieldErrors: FieldErrors; formError?: "rate_limited" | "server_error"; values: Record<string, string> };

const TEXT_FIELDS = ["description", "existingWebsite", "budget", "deadline", "fullName", "email", "phone", "companyName", "preferredContact"];

const list = (formData: FormData, key: string) => formData.getAll(key).filter((v): v is string => typeof v === "string");

export async function submitDigitalRequest(_prev: DigitalRequestState, formData: FormData): Promise<DigitalRequestState> {
  // Honeypot / too-fast submissions: pretend success, store nothing.
  if (looksLikeSpam(formData)) return { status: "success", reference: null };

  const projectTypes = list(formData, "projectTypes");
  const features = list(formData, "features");
  const values = { ...echo(formData, TEXT_FIELDS), projectTypes: projectTypes.join(","), features: features.join(",") };

  const parsed = digitalRequestSchema.safeParse({
    ...Object.fromEntries(TEXT_FIELDS.map((key) => [key, field(formData, key)])),
    projectTypes,
    features,
    consent: field(formData, "consent"),
    locale: field(formData, "locale"),
    sourcePath: field(formData, "sourcePath"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  const input = parsed.data;

  const { data: reference, error } = await createPublicClient().rpc("submit_digital_request", {
    submission_key: getServerEnv().FORM_SUBMISSION_KEY,
    payload: {
      submission_id: submissionId(formData),
      project_types: input.projectTypes,
      description: input.description,
      features: input.features,
      existing_website: input.existingWebsite,
      budget: input.budget,
      deadline: input.deadline,
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
    console.error("[digital] submit_digital_request failed", error?.code);
    return { status: "error", fieldErrors: {}, formError: error?.message.includes("rate_limited") ? "rate_limited" : "server_error", values };
  }

  after(() => notifyDigitalRequest(input, reference));
  return { status: "success", reference };
}
