"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { fromZod, success, type AdminActionState } from "@/features/admin/action-state";
import { createSessionClient } from "@/lib/supabase/server";
import { fromRpc, notAllowed } from "./errors";
import { authorize } from "./permissions";
import { closeDaySchema, correctReportSchema, formFields, reportCommentSchema } from "./schemas";

/** Daily closing and reports (ADR-028): the snapshot is built by Postgres, never by the browser. */

export async function closeDay(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.day.close"))) return notAllowed();
  const parsed = closeDaySchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const { data: reportId, error } = await (await createSessionClient()).rpc("business_close_day", {
    p_date: v.day,
    p_observations: v.observations ?? undefined,
    p_problems: v.problems ?? undefined,
    p_decisions: v.decisions ?? undefined,
    p_priorities: v.priorities ?? undefined,
  });
  if (error) return fromRpc(error, "close day");
  redirect(`/admin/business/reports/${reportId}?closed=1`);
}

export async function correctReport(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.reports.correct"))) return notAllowed();
  const parsed = correctReportSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const { error } = await (await createSessionClient()).rpc("business_correct_report", {
    p_report_id: v.id,
    p_reason: v.reason,
    p_observations: v.observations ?? undefined,
    p_problems: v.problems ?? undefined,
    p_decisions: v.decisions ?? undefined,
    p_priorities: v.priorities ?? undefined,
    p_refresh_figures: v.refresh,
  });
  if (error) return fromRpc(error, "correct report");
  refresh();
  return success("Rapport corrigé.");
}

export async function addReportComment(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = (await authorize("business.journal.comment")) ?? (await authorize("business.day.close")) ?? (await authorize("business.tasks.assign"));
  if (!admin) return notAllowed();
  const parsed = reportCommentSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { error } = await (await createSessionClient()).from("business_report_comments").insert({ ...parsed.data, author_id: admin.id });
  if (error) return fromRpc(error, "report comment");
  refresh();
  return success("Commentaire ajouté.");
}
