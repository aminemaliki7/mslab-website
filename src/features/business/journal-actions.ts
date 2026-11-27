"use server";

import { refresh } from "next/cache";
import { failure, fromZod, success, type AdminActionState } from "@/features/admin/action-state";
import { createSessionClient } from "@/lib/supabase/server";
import { fromRpc, notAllowed } from "./errors";
import { attachFile, checkAttachment } from "./files";
import { authorize } from "./permissions";
import { activitySchema, commentSchema, formFields } from "./schemas";

/** Daily journal (ADR-028): fast entries, comments and follow-up notes. */

export async function saveActivity(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await authorize("business.journal.write");
  if (!admin) return notAllowed();
  const parsed = activitySchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, occurred_at, responsible_id, ...row } = parsed.data;
  if (occurred_at && new Date(occurred_at).getTime() > Date.now() + 5 * 60_000) return failure("La date ne peut pas être dans le futur.", { occurred_at: "La date ne peut pas être dans le futur." });
  const file = await checkAttachment(formData.get("file"));
  if (typeof file === "string") return failure(file, { file });

  const db = await createSessionClient();
  let activityId = id;
  if (id) {
    const { error } = await db.from("business_activities").update({ ...row, responsible_id, ...(occurred_at ? { occurred_at } : {}) }).eq("id", id);
    if (error) return fromRpc(error, "update activity");
  } else {
    const { data, error } = await db
      .from("business_activities")
      .insert({ ...row, responsible_id: responsible_id ?? admin.id, created_by: admin.id, ...(occurred_at ? { occurred_at } : {}) })
      .select("id")
      .single();
    if (error) return fromRpc(error, "create activity");
    activityId = data.id;
  }
  if (file && activityId && !(await attachFile("activity", activityId, file))) return failure("Le téléversement a échoué.");
  refresh();
  return success(id ? "Activité mise à jour." : "Activité ajoutée au journal.");
}

export async function addComment(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = (await authorize("business.journal.comment")) ?? (await authorize("business.journal.write"));
  if (!admin) return notAllowed();
  const parsed = commentSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await (await createSessionClient()).from("business_activity_comments").insert({ ...parsed.data, author_id: admin.id });
  if (error) return fromRpc(error, "comment");
  refresh();
  return success("Commentaire ajouté.");
}
