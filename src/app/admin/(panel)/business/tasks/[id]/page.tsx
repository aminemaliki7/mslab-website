import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskCommentForm, TaskForm, TaskStatusForm } from "@/components/admin/business/report-task-forms";
import { AdminPageHeader, Dl, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { format } from "@/i18n/format";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { businessToday, formatShortDay } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { requirePermission } from "@/features/business/permissions";
import { customerOptions, getTask, recentSaleOptions, staffNames, staffOptions, type TaskStatus } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.tasks.detailTitle);

const STATUSES: TaskStatus[] = ["todo", "in_progress", "completed", "blocked"];

export default async function TaskPage({ params }: PageProps<"/admin/business/tasks/[id]">) {
  const { admin, can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const t = b.tasks;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ task, comments }, names] = await Promise.all([getTask(id), staffNames()]);
  if (!task) notFound();
  const today = businessToday();
  const late = task.status !== "completed" && task.due_date !== null && task.due_date < today;

  // Mirrors the RLS update policy (the database re-checks it).
  const isAdmin = can("roles.manage");
  const canProgress = isAdmin || (can("business.tasks.update") && task.assigned_to === admin.id) || (can("business.tasks.assign") && task.created_by === admin.id);
  const canEdit = isAdmin || (can("business.tasks.assign") && task.created_by === admin.id);
  const canComment = can("business.tasks.update") || can("business.tasks.assign") || can("business.journal.comment");
  const [staff, customers, sales] = canEdit ? await Promise.all([staffOptions(), customerOptions(), recentSaleOptions()]) : [[], [], []];

  const statusText = (body: string) => {
    const [from, to] = body.split("→");
    const ok = (v: string | undefined): v is TaskStatus => !!v && (STATUSES as string[]).includes(v);
    return ok(from) && ok(to) ? format(t.statusChange, { from: b.taskStatus[from], to: b.taskStatus[to] }) : body;
  };

  return (
    <>
      <AdminPageHeader
        title={task.title}
        description={format(t.createdBy, { name: names.get(task.created_by) ?? b.common.unknownUser, date: formatAdminDateTime(task.created_at, lang) })}
        back={{ href: "/admin/business/tasks", label: t.title }}
        actions={
          <>
            {late ? <Badge tone="danger">{t.overdue}</Badge> : null}
            <Badge tone={task.status === "completed" ? "success" : task.status === "blocked" ? "warning" : "accent"}>{b.taskStatus[task.status]}</Badge>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <Panel>
            <Dl
              items={[
                { label: t.assignee, value: names.get(task.assigned_to ?? "") ?? t.unassigned },
                { label: t.priority, value: b.priority[task.priority] },
                { label: t.dueDate, value: task.due_date ? <span className={late ? "text-danger font-semibold" : ""}>{formatShortDay(task.due_date, lang)}</span> : "—" },
                ...(task.completed_at ? [{ label: t.status, value: format(t.completedOn, { date: formatAdminDateTime(task.completed_at, lang) }) }] : []),
                ...(task.business_customers ? [{ label: t.customer, value: <Link href={`/admin/business/customers/${task.business_customers.id}`} className="text-accent">{task.business_customers.name}</Link> }] : []),
                ...(task.business_sales ? [{ label: t.sale, value: <Link href={`/admin/business/sales/${task.business_sales.id}`} className="text-accent" dir="ltr">{task.business_sales.number}</Link> }] : []),
                ...(task.business_daily_reports ? [{ label: t.report, value: <Link href={`/admin/business/reports/${task.business_daily_reports.id}`} className="text-accent">{formatShortDay(task.business_daily_reports.report_date, lang)}</Link> }] : []),
                { label: b.common.description, value: task.description ? <span className="whitespace-pre-line">{task.description}</span> : "—" },
              ]}
            />
          </Panel>

          <Panel title={t.historyTitle}>
            <ol className="mb-5 space-y-2 text-sm">
              {comments.map((cm) => (
                <li key={cm.id} className={cm.kind === "status" ? "text-fg-muted border-line border-s-2 ps-3" : "bg-surface rounded-[var(--radius-control)] p-3"}>
                  <p className="text-fg-muted text-xs">{names.get(cm.author_id ?? "") ?? b.common.unknownUser} · {formatAdminDateTime(cm.created_at, lang)}</p>
                  <p dir="auto" className={cm.kind === "status" ? "font-medium" : "mt-1 whitespace-pre-line"}>{cm.kind === "status" ? statusText(cm.body) : cm.body}</p>
                </li>
              ))}
            </ol>
            {canComment ? <TaskCommentForm taskId={task.id} /> : null}
          </Panel>
        </div>

        <div className="space-y-6">
          {canProgress ? (
            <Panel title={t.updateStatus}>
              <TaskStatusForm id={task.id} status={task.status} />
            </Panel>
          ) : (
            <p className="text-fg-muted text-sm">{t.noRights}</p>
          )}
          {canEdit ? (
            <Panel title={t.editTitle}>
              <TaskForm
                values={task}
                staff={staff}
                customers={customers.map((c) => ({ value: c.id, label: c.name }))}
                sales={[
                  ...(task.business_sales && !sales.some((s) => s.id === task.business_sales?.id) ? [{ value: task.business_sales.id, label: task.business_sales.number }] : []),
                  ...sales.map((s) => ({ value: s.id, label: s.number })),
                ]}
              />
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
