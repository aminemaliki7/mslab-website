import "server-only";
import { createHash } from "node:crypto";
import type { Locale } from "@/i18n/config";
import { getServerEnv } from "@/lib/server-env";
import type { Database } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Database entry points for public submissions (Milestone 5 wires these into server actions
 * after Zod validation + anti-spam). Inputs here are assumed already validated.
 */

export type SubmissionFailure = "rate_limited" | "invalid_product" | "invalid_payload" | "server_error";
export type SubmissionResult = { ok: true; reference: string } | { ok: false; reason: SubmissionFailure };

/** Salted SHA-256 of the client IP — raw IPs are never stored. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${ip}|${getServerEnv().IP_HASH_SALT}`).digest("hex");
}

export type ContactInquiryInput = {
  submissionId: string;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  locale: Locale;
  sourcePath: string | null;
  consent: true;
  ipHash: string | null;
};

export type QuotationItemInput =
  | { productId: string; quantity: number; specifications?: string | null }
  | { label: string; quantity: number; specifications?: string | null };

export type QuotationRequestInput = {
  submissionId: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string | null;
  message: string | null;
  preferredContact: Database["public"]["Enums"]["contact_method"];
  locale: Locale;
  sourcePath: string | null;
  consent: true;
  ipHash: string | null;
  items: QuotationItemInput[];
};

function mapError(message: string | undefined): SubmissionFailure {
  if (!message) return "server_error";
  if (message.includes("rate_limited")) return "rate_limited";
  if (message.includes("invalid_product")) return "invalid_product";
  if (message.includes("invalid_payload") || message.includes("violates check constraint")) return "invalid_payload";
  return "server_error";
}

export async function insertContactInquiry(input: ContactInquiryInput): Promise<SubmissionResult> {
  const { data, error } = await createPublicClient().rpc("submit_contact_inquiry", {
    submission_key: getServerEnv().FORM_SUBMISSION_KEY,
    payload: {
      submission_id: input.submissionId,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      locale: input.locale,
      source_path: input.sourcePath,
      consent: input.consent,
      ip_hash: input.ipHash,
    },
  });
  if (error || !data) {
    console.error("[inquiries] submit_contact_inquiry failed", error?.code);
    return { ok: false, reason: mapError(error?.message) };
  }
  return { ok: true, reference: data };
}

export async function insertQuotationRequest(input: QuotationRequestInput): Promise<SubmissionResult> {
  const { data, error } = await createPublicClient().rpc("submit_quotation_request", {
    submission_key: getServerEnv().FORM_SUBMISSION_KEY,
    payload: {
      submission_id: input.submissionId,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      company_name: input.companyName,
      message: input.message,
      preferred_contact: input.preferredContact,
      locale: input.locale,
      source_path: input.sourcePath,
      consent: input.consent,
      ip_hash: input.ipHash,
      items: input.items.map((item) =>
        "productId" in item
          ? { product_id: item.productId, quantity: item.quantity, specifications: item.specifications ?? null }
          : { label: item.label, quantity: item.quantity, specifications: item.specifications ?? null },
      ),
    },
  });
  if (error || !data) {
    console.error("[quotations] submit_quotation_request failed", error?.code);
    return { ok: false, reason: mapError(error?.message) };
  }
  return { ok: true, reference: data };
}
