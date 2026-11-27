import Link from "next/link";
import { TaskForm } from "@/components/admin/business/report-task-forms";
import { AdminPageHeader, EmptyState, Notice, Panel, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { businessToday, formatShortDay } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { requirePermission } from "@/features/business/permissions";
import { customerOptions, listTasks, recentSaleOptions, staffNames, staffOptions, type TaskView } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.tasks.title);

const PRIORITY_TONE = { low: "neutral", normal: "neutral", high: "warning", urgent: "danger" } as const;

export default async function TasksPage({ searchParams }: PageProps<"/admin/business/tasks">) {
  const { admin, can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const t = b.tasks;
  const params = await searchParams;
  const view: TaskView = params.view === "mine" || params.view === "overdue" || params.view === "done" ? params.view : "open";
  const today = businessToday();
  const canAssign = can("business.tasks.assign");
  const [{ data, error }, names, staff, customers, sales, { data: overdue }] = await Promise.all([
    listTasks({ view, userId: admin.id, today }),
    staffNames(),
    canAssign ? staffOptions() : Promise.resolve([]),
    canAssign ? customerOptions() : Promise.resolve([]),
    canAssign ? recentSaleOptions() : Promise.resolve([]),
    view === "overdue" ? Promise.resolve({ data: [] }) : listTasks({ view: "overdue", userId: admin.id, today, limit: 100 }),
  ]);
  const overdueCount = view === "overdue" ? data.length : overdue.length;
  const tabs: Array<[TaskView, string]> = [["open", t.viewOpen], ["mine", t.viewMine], ["overdue", t.viewOverdue], ["done", t.viewDone]];

  return (
    <>
      <AdminPageHeader title={t.title} description={t.description} />

      {overdueCount > 0 && view !== "overdue" ? (
        <Notice tone="danger">
          <Link href="/admin/business/tasks?view=overdue" className="underline">{overdueCount} · {t.overdue}</Link>
        </Notice>
      ) : null}

      {canAssign ? (
        <Panel title={t.newTitle} className="mb-8">
          <TaskForm
            values={{}}
            stay
            staff={staff}
            customers={customers.map((c) => ({ value: c.id, label: c.name }))}
            sales={sales.map((s) => ({ value: s.id, label: s.business_customers?.name ? `${s.number} · ${s.business_customers.name}` : s.number }))}
          />
        </Panel>
      ) : null}

      <nav aria-label={t.title} className="mb-5 flex flex-wrap gap-2">
        {tabs.map(([v, label]) => (
          <Link key={v} href={v === "open" ? "/admin/business/tasks" : `/admin/business/tasks?view=${v}`} aria-current={view === v ? "page" : undefined} className="border-line hover:border-accent aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent inline-flex min-h-11 items-center rounded-full border px-4 text-sm">
            {label}
            {v === "overdue" && overdueCount > 0 ? <span className="bg-danger ms-2 rounded-full px-2 text-xs font-semibold text-white">{overdueCount}</span> : null}
          </Link>
        ))}
      </nav>

      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}
      {data.length === 0 ? (
        <EmptyState>{t.empty}</EmptyState>
      ) : (
        <Table head={[t.colTask, t.colAssignee, t.colDue, t.colStatus]}>
          {data.map((task) => {
            const late = task.status !== "completed" && task.due_date !== null && task.due_date < today;
            return (
              <tr key={task.id} className={late ? "md:bg-danger-soft/40 max-md:!border-danger" : undefined}>
                <Td>
                  <Link href={`/admin/business/tasks/${task.id}`} className="hover:text-accent text-base font-semibold underline-offset-4 hover:underline md:text-sm" dir="auto">{task.title}</Link>
                  <p className="text-fg-muted text-xs">
                    <Badge tone={PRIORITY_TONE[task.priority]}>{b.priority[task.priority]}</Badge>
                    {task.business_customers ? ` · ${task.business_customers.name}` : ""}
                    {task.business_sales ? ` · ${task.business_sales.number}` : ""}
                  </p>
                </Td>
                <Td label={t.colAssignee}>{names.get(task.assigned_to ?? "") ?? <span className="text-fg-muted">{t.unassigned}</span>}</Td>
                <Td label={t.colDue} className="whitespace-nowrap">
                  {task.due_date ? (
                    <span className={late ? "text-danger font-semibold" : task.due_date === today ? "text-warning font-semibold" : ""}>
                      {formatShortDay(task.due_date, lang)}
                      {late ? ` · ${t.overdue}` : task.due_date === today ? ` · ${t.dueToday}` : ""}
                    </span>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td label={t.colStatus}>
                  <Badge tone={task.status === "completed" ? "success" : task.status === "blocked" ? "warning" : task.status === "in_progress" ? "accent" : "neutral"}>{b.taskStatus[task.status]}</Badge>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
