"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField } from "@/components/admin/fields";
import { addReportComment, closeDay, correctReport } from "@/features/business/report-actions";
import { addTaskComment, saveTask, setTaskStatus } from "@/features/business/task-actions";
import { Choice, TextArea, TextInput } from "./fields";
import { useBusinessT } from "./use-business-t";

type Option = { value: string; label: string };
type Notes = { observations?: string | null; problems?: string | null; decisions?: string | null; priorities?: string | null };

function NotesFields({ values, errors, prefix = "" }: { values?: Notes; errors: Record<string, string>; prefix?: string }) {
  const { b } = useBusinessT();
  const c = b.closing;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextArea id={`${prefix}observations`} name="observations" label={c.observations} rows={3} defaultValue={values?.observations} error={errors.observations} />
      <TextArea id={`${prefix}problems`} name="problems" label={c.problems} rows={3} defaultValue={values?.problems} error={errors.problems} />
      <TextArea id={`${prefix}decisions`} name="decisions" label={c.decisions} rows={3} defaultValue={values?.decisions} error={errors.decisions} />
      <TextArea id={`${prefix}priorities`} name="priorities" label={c.priorities} rows={3} defaultValue={values?.priorities} error={errors.priorities} />
    </div>
  );
}

export function CloseDayForm({ day }: { day: string }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={closeDay} submitLabel={b.closing.close} confirm={b.closing.closeConfirm}>
      {(state) => (
        <>
          <input type="hidden" name="day" value={day} />
          <NotesFields errors={state.fieldErrors} />
          <p className="text-fg-muted text-sm">{b.closing.lockedHint}</p>
        </>
      )}
    </AdminForm>
  );
}

export function CorrectReportForm({ id, values }: { id: string; values: Notes }) {
  const { b } = useBusinessT();
  const r = b.reports;
  return (
    <AdminForm action={correctReport} submitLabel={r.correct} submitVariant="secondary">
      {(state) => (
        <div className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <NotesFields values={values} errors={state.fieldErrors} prefix="c-" />
          <CheckboxField name="refresh" label={r.refreshFigures} checked={false} />
          <TextInput name="reason" label={r.correctReason} required maxLength={500} error={state.fieldErrors.reason} />
        </div>
      )}
    </AdminForm>
  );
}

export function ReportCommentForm({ reportId }: { reportId: string }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={addReportComment} submitLabel={b.reports.addComment} submitVariant="secondary">
      {(state) => (
        <>
          <input type="hidden" name="report_id" value={reportId} />
          <TextArea id="report-comment" name="body" label={b.reports.commentsTitle} rows={2} maxLength={2000} placeholder={b.journal.commentPlaceholder} error={state.fieldErrors.body} />
        </>
      )}
    </AdminForm>
  );
}

export type TaskValues = {
  id?: string;
  title?: string;
  description?: string | null;
  assigned_to?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  due_date?: string | null;
  customer_id?: string | null;
  sale_id?: string | null;
  report_id?: string | null;
};

export function TaskForm({ values, staff, customers, sales, stay, submitLabel }: { values: TaskValues; staff: Option[]; customers: Option[]; sales: Option[]; stay?: boolean; submitLabel?: string }) {
  const { b } = useBusinessT();
  const t = b.tasks;
  const p = values.id ? `t-${values.id}-` : "t-";
  return (
    <AdminForm action={saveTask} submitLabel={submitLabel ?? (values.id ? b.common.save : t.create)}>
      {(state) => (
        <div className="space-y-4">
          {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
          {values.report_id ? <input type="hidden" name="report_id" value={values.report_id} /> : null}
          {stay ? <input type="hidden" name="stay" value="1" /> : null}
          <TextInput id={`${p}title`} name="title" label={t.titleField} required defaultValue={values.title} error={state.fieldErrors.title} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Choice id={`${p}assigned_to`} name="assigned_to" label={t.assignee} options={staff} defaultValue={values.assigned_to} emptyLabel={t.unassigned} />
            <Choice
              id={`${p}priority`}
              name="priority"
              label={t.priority}
              options={(["low", "normal", "high", "urgent"] as const).map((v) => ({ value: v, label: b.priority[v] }))}
              defaultValue={values.priority ?? "normal"}
            />
            <TextInput id={`${p}due_date`} name="due_date" type="date" label={t.dueDate} defaultValue={values.due_date} error={state.fieldErrors.due_date} />
          </div>
          <TextArea id={`${p}description`} name="description" label={b.common.description} rows={3} defaultValue={values.description} error={state.fieldErrors.description} />
          {customers.length > 0 || sales.length > 0 ? (
            <details>
              <summary className="text-fg-muted min-h-11 cursor-pointer py-2 text-sm">{t.customer} · {t.sale}</summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Choice id={`${p}customer_id`} name="customer_id" label={t.customer} options={customers} defaultValue={values.customer_id} emptyLabel={b.common.none} />
                <Choice id={`${p}sale_id`} name="sale_id" label={t.sale} options={sales} defaultValue={values.sale_id} emptyLabel={b.common.none} />
              </div>
            </details>
          ) : null}
        </div>
      )}
    </AdminForm>
  );
}

export function TaskStatusForm({ id, status }: { id: string; status: string }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={setTaskStatus} submitLabel={b.tasks.updateStatus}>
      {() => (
        <fieldset>
          <legend className="text-fg mb-2 text-sm font-medium">{b.tasks.status}</legend>
          <input type="hidden" name="id" value={id} />
          <div className="flex flex-wrap gap-2">
            {(["todo", "in_progress", "blocked", "completed"] as const).map((s) => (
              <label key={s} className="border-line has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium">
                <input type="radio" name="status" value={s} defaultChecked={status === s} className="sr-only" />
                {b.taskStatus[s]}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </AdminForm>
  );
}

export function TaskCommentForm({ taskId }: { taskId: string }) {
  const { b } = useBusinessT();
  return (
    <AdminForm action={addTaskComment} submitLabel={b.tasks.comment} submitVariant="secondary">
      {(state) => (
        <>
          <input type="hidden" name="task_id" value={taskId} />
          <TextArea id="task-comment" name="body" label={b.tasks.historyTitle} rows={2} maxLength={2000} placeholder={b.journal.commentPlaceholder} error={state.fieldErrors.body} />
        </>
      )}
    </AdminForm>
  );
}
