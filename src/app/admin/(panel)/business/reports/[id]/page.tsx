import Link from "next/link";
import { notFound } from "next/navigation";
import { CorrectReportForm, ReportCommentForm, TaskForm } from "@/components/admin/business/report-task-forms";
import { PrintButton } from "@/components/admin/business/print-button";
import { Counters, FinancialKpis, OperationalDetails } from "@/components/admin/business/summary-view";
import { AdminPageHeader, Dl, Notice, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { format } from "@/i18n/format";
import { formatAdminDateTime, translateMessage } from "@/features/admin/dictionary";
import { formatDay, formatShortDay, formatTime } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { ACTIVITY_TYPES } from "@/features/business/labels";
import { requirePermission } from "@/features/business/permissions";
import { getReport, staffNames, staffOptions } from "@/features/business/queries";
import { parseSummary, parseTimeline } from "@/features/business/summary";

export const generateMetadata = businessTitle((b) => b.reports.title);

const NOTE_KEYS = ["observations", "problems", "decisions", "priorities"] as const;

export default async function ReportPage({ params, searchParams }: PageProps<"/admin/business/reports/[id]">) {
  const { can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const r = b.reports;
  const c = b.closing;
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ report, corrections, comments, tasks }, names, staff] = await Promise.all([getReport(id), staffNames(), can("business.tasks.assign") ? staffOptions() : Promise.resolve([])]);
  if (!report) notFound();
  const s = parseSummary(report.summary);
  const timeline = parseTimeline(report.timeline);
  const canComment = can("business.journal.comment") || can("business.day.close") || can("business.tasks.assign");
  const typeLabel = (t: string) => ((ACTIVITY_TYPES as readonly string[]).includes(t) ? b.activityType[t as (typeof ACTIVITY_TYPES)[number]] : t);

  return (
    <>
      <AdminPageHeader
        title={format(r.detailTitle, { date: formatShortDay(report.report_date, lang) })}
        description={format(r.closedBy, { name: names.get(report.closed_by ?? "") ?? b.common.unknownUser, date: formatAdminDateTime(report.closed_at, lang) })}
        back={{ href: "/admin/business/reports", label: r.title }}
        actions={
          <>
            <Badge tone={report.status === "corrected" ? "warning" : "success"}>{r.status[report.status]}</Badge>
            <Badge>{format(r.version, { n: report.version })}</Badge>
            <PrintButton label={b.print.button} hint={b.print.hint} />
            <a href={`/admin/business/export/reports?from=${report.report_date}&to=${report.report_date}`} download className="text-accent inline-flex min-h-11 items-center text-sm font-medium print:hidden">↓ CSV</a>
          </>
        }
      />
      {query.closed ? <Notice>{translateMessage("Journée clôturée. Le rapport est disponible.", lang)}</Notice> : null}
      <p className="text-fg-muted -mt-4 mb-6 first-letter:uppercase">{formatDay(report.report_date, lang)}</p>

      <Panel title={c.financial}>
        <FinancialKpis s={s} b={b} lang={lang} />
      </Panel>

      <Panel title={c.operational} className="mt-6">
        <Counters
          items={[
            { label: c.ordersReceived, value: s.salesCount },
            { label: c.ordersCompleted, value: s.ordersCompleted },
            { label: c.ordersCancelled, value: s.ordersCancelled, tone: "warning" },
            { label: c.productionCompleted, value: s.productionCompleted },
            { label: c.incidents, value: s.incidents, tone: "danger" },
            { label: b.overview.newCustomers, value: s.newCustomers },
          ]}
        />
        <div className="mt-6">
          <OperationalDetails s={s} b={b} lang={lang} />
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={r.notes}>
          <Dl items={NOTE_KEYS.map((k) => ({ label: c[k], value: report[k] ? <span className="whitespace-pre-line">{report[k]}</span> : "—" }))} />
        </Panel>

        <Panel title={r.timeline}>
          {timeline.length === 0 ? (
            <p className="text-fg-muted text-sm">{b.journal.empty}</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {timeline.map((a) => (
                <li key={a.id} className="border-line border-s-2 ps-3">
                  <p>
                    <time className="text-fg-muted tabular-nums" dateTime={a.at}>{a.at ? formatTime(a.at, lang) : ""}</time>{" "}
                    <Badge tone={a.type === "incident" ? "danger" : "neutral"}>{typeLabel(a.type)}</Badge>{" "}
                    <span dir="auto" className="font-medium">{a.title}</span>
                  </p>
                  {a.description ? <p dir="auto" className="text-fg-muted text-xs whitespace-pre-line">{a.description}</p> : null}
                  {a.responsible ? <p className="text-fg-muted text-xs">{a.responsible}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title={r.commentsTitle}>
          {comments.length === 0 ? <p className="text-fg-muted mb-4 text-sm">—</p> : null}
          <ol className="mb-4 space-y-3">
            {comments.map((cm) => (
              <li key={cm.id} className="bg-surface rounded-[var(--radius-control)] p-3 text-sm">
                <p className="text-fg-muted text-xs">{names.get(cm.author_id) ?? b.common.unknownUser} · {formatAdminDateTime(cm.created_at, lang)}</p>
                <p dir="auto" className="mt-1 whitespace-pre-line">{cm.body}</p>
              </li>
            ))}
          </ol>
          {canComment ? <div className="print:hidden"><ReportCommentForm reportId={report.id} /></div> : null}
        </Panel>

        <Panel title={r.followUp} description={r.followUpHint} className="print:hidden">
          {tasks.length > 0 ? (
            <ul className="divide-line mb-4 divide-y text-sm">
              {tasks.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`/admin/business/tasks/${t.id}`} className="text-accent font-medium">{t.title}</Link>
                  <span className="text-fg-muted text-xs">
                    {names.get(t.assigned_to ?? "") ?? b.tasks.unassigned} · <Badge>{b.taskStatus[t.status]}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {can("business.tasks.assign") ? <TaskForm values={{ report_id: report.id }} staff={staff} customers={[]} sales={[]} stay submitLabel={r.followUp} /> : null}
        </Panel>
      </div>

      <Panel title={r.correctionsTitle} className="mt-6">
        {corrections.length === 0 ? (
          <p className="text-fg-muted text-sm">{r.correctionsEmpty}</p>
        ) : (
          <ol className="space-y-3 text-sm">
            {corrections.map((x) => {
              const refreshed = typeof x.next === "object" && x.next !== null && !Array.isArray(x.next) && "summary" in x.next;
              return (
                <li key={x.id} className="border-line rounded-[var(--radius-control)] border p-3">
                  <p className="font-medium">
                    {format(r.version, { n: x.version })} · {names.get(x.corrected_by ?? "") ?? b.common.unknownUser} · {formatAdminDateTime(x.corrected_at, lang)}
                    {refreshed ? <Badge tone="warning" className="ms-2">{r.figuresChanged}</Badge> : null}
                  </p>
                  <p dir="auto" className="text-fg-muted mt-1">{b.common.reason} : {x.reason}</p>
                </li>
              );
            })}
          </ol>
        )}
        {can("business.reports.correct") ? (
          <details className="mt-5 print:hidden">
            <summary className="text-accent min-h-11 cursor-pointer py-2 text-sm font-semibold">{r.correctTitle}</summary>
            <p className="text-fg-muted mb-4 text-sm">{r.correctHint}</p>
            <CorrectReportForm id={report.id} values={report} />
          </details>
        ) : null}
      </Panel>
    </>
  );
}
