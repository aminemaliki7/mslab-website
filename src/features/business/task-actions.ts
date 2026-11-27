"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { fromZod, failure, success, type AdminActionState } from "@/features/admin/action-state";
import { createSessionClient } from "@/lib/supabase/server";
import { fromRpc, notAllowed } from "./errors";
import { authorize } from "./permissions";
import { formFields, taskCommentSchema, taskSchema, taskStatusSchema } from "./schemas";

/**
 * Tasks & follow-up (ADR-028). RLS decides who may change a task (assignee with tasks.update,
 * creator with tasks.assign, administrators); status history is written by a database trigger.
 */

export async function saveTask(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await authorize("business.tasks.assign");
  const parsed = taskSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, ...row } = parsed.data;
  const db = await createSessionClient();
  if (id) {
    if (!admin && !(await authorize("business.tasks.update"))) return notAllowed();
    // Links absent from the form (not shown in it) are kept as they are.
    const { customer_id, sale_id, report_id, ...base } = row;
    const changes = {
      ...base,
      ...(formData.has("customer_id") ? { customer_id } : {}),
      ...(formData.has("sale_id") ? { sale_id } : {}),
      ...(formData.has("report_id") ? { report_id } : {}),
    };
    const { data, error } = await db.from("business_tasks").update(changes).eq("id", id).select("id");
    if (error) return fromRpc(error, "update task");
    if (!data?.length) return notAllowed(); // RLS: not the assignee / creator
    refresh();
    return success("Tâche mise à jour.");
  }
  if (!admin) return notAllowed();
  const { data, error } = await db.from("business_tasks").insert({ ...row, created_by: admin.id }).select("id").single();
  if (error) return fromRpc(error, "create task");
  if (formData.get("stay") === "1") {
    refresh();
    return success("Tâche enregistrée.");
  }
  redirect(`/admin/business/tasks/${data.id}`);
}

export async function setTaskStatus(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.tasks.update")) && !(await authorize("business.tasks.assign"))) return notAllowed();
  const parsed = taskStatusSchema.safeParse(formFields(formData));
  if (!parsed.success) return failure("Requête invalide.");
  const { data, error } = await (await createSessionClient()).from("business_tasks").update({ status: parsed.data.status }).eq("id", parsed.data.id).select("id");
  if (error) return fromRpc(error, "task status");
  if (!data?.length) return notAllowed();
  refresh();
  return success("Tâche mise à jour.");
}

export async function addTaskComment(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = (await authorize("business.tasks.update")) ?? (await authorize("business.tasks.assign")) ?? (await authorize("business.journal.comment"));
  if (!admin) return notAllowed();
  const parsed = taskCommentSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await (await createSessionClient()).from("business_task_comments").insert({ ...parsed.data, author_id: admin.id });
  if (error) return fromRpc(error, "task comment");
  refresh();
  return success("Commentaire ajouté.");
}
