"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/server";
import { failure, fromDb, fromZod, success, type AdminActionState } from "./action-state";
import { requireAdmin } from "./auth";

/** Customer requests: status changes and internal notes (admin only; RLS enforces it too). */

const quotationUpdate = z.object({
  id: z.uuid(),
  status: z.enum(Constants.public.Enums.quotation_status),
  internal_notes: z
    .string()
    .trim()
    .max(10000, { error: "10 000 caractères maximum." })
    .transform((v) => (v ? v : null)),
});

export async function updateQuotation(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = quotationUpdate.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    internal_notes: formData.get("internal_notes") ?? "",
  });
  if (!parsed.success) return fromZod(parsed.error);
  const { id, ...changes } = parsed.data;
  const { error } = await (await createSessionClient()).from("quotation_requests").update(changes).eq("id", id);
  if (error) return fromDb(error, "update quotation");
  refresh();
  return success("Demande mise à jour.");
}

const inquiryUpdate = z.object({
  id: z.uuid(),
  status: z.enum(["new", "read", "replied", "closed", "spam"]),
});

export async function updateInquiry(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = inquiryUpdate.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return failure("Requête invalide.");
  const db = await createSessionClient();
  const { data: current } = await db.from("inquiries").select("read_at").eq("id", parsed.data.id).maybeSingle();
  const { error } = await db
    .from("inquiries")
    .update({
      status: parsed.data.status,
      // Any handling status implies the message was read.
      read_at: parsed.data.status === "new" ? null : (current?.read_at ?? new Date().toISOString()),
    })
    .eq("id", parsed.data.id);
  if (error) return fromDb(error, "update inquiry");
  refresh();
  return success("Message mis à jour.");
}
