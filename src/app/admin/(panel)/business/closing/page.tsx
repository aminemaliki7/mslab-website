import Link from "next/link";
import { CloseDayForm } from "@/components/admin/business/report-task-forms";
import { Counters, FinancialKpis, OperationalDetails } from "@/components/admin/business/summary-view";
import { AdminPageHeader, Notice, Panel } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/layout";
import { addDays, businessToday, formatDay, formatTime, isIsoDate } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { requirePermission } from "@/features/business/permissions";
import { listActivities, periodSummary, reportForDay, staffNames } from "@/features/business/queries";
import { parseSummary } from "@/features/business/summary";

export const generateMetadata = businessTitle((b) => b.closing.title);

/**
 * End-of-day review: the live summary (same function as the overview), the day's timeline, the
 * manager's notes, then "Close business day". The report itself is built by Postgres.
 */
export default async function ClosingPage({ searchParams }: PageProps<"/admin/business/closing">) {
  const { can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const c = b.closing;
  const params = await searchParams;
  const today = businessToday();
  const day = isIsoDate(params.day) && params.day <= today ? params.day : today;
  const [report, { data: raw, error }, { data: activities }, names] = await Promise.all([reportForDay(day), periodSummary(day, day), listActivities(day), staffNames()]);
  const s = parseSummary(raw);

  return (
    <>
      <AdminPageHeader
        title={c.title}
        description={c.description}
        actions={<ButtonLink href="/admin/business/reports" variant="secondary">{b.reports.title}</ButtonLink>}
      />
      <nav aria-label={c.day} className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/admin/business/closing?day=${addDays(day, -1)}`} className="border-line inline-flex min-h-11 items-center rounded-full border px-4 text-sm">
          <span aria-hidden="true" className="rtl:-scale-x-100">←</span>&nbsp;{b.journal.previousDay}
        </Link>
        <h2 className="text-lg font-semibold first-letter:uppercase">{formatDay(day, lang)}</h2>
        {day < today ? <Link href="/admin/business/closing" className="text-accent inline-flex min-h-11 items-center text-sm font-medium">{b.journal.today}</Link> : null}
      </nav>

      {report ? (
        <Notice tone="success">
          {c.alreadyClosed}{" "}
          <Link href={`/admin/business/reports/${report.id}`} className="underline">{c.openReport}</Link>
        </Notice>
      ) : null}
      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}

      <Panel title={`${c.summaryTitle} · ${c.financial}`}>
        <FinancialKpis s={s} b={b} lang={lang} />
      </Panel>

      <Panel title={`${c.summaryTitle} · ${c.operational}`} className="mt-6">
        <Counters
          items={[
            { label: c.ordersReceived, value: s.salesCount },
            { label: c.ordersCompleted, value: s.ordersCompleted },
            { label: c.ordersCancelled, value: s.ordersCancelled, tone: "warning" },
            { label: c.productionCompleted, value: s.productionCompleted },
            { label: c.incidents, value: s.incidents, tone: "danger" },
            { label: b.overview.newCustomers, value: s.newCustomers },
            { label: b.overview.tasks, value: s.tasksOpen, href: "/admin/business/tasks" },
            { label: b.overview.lowStock, value: s.lowStock, href: "/admin/business/products?view=low", tone: "warning" },
          ]}
        />
        <div className="mt-6">
          <OperationalDetails s={s} b={b} lang={lang} />
        </div>
      </Panel>

      <Panel title={c.importantActivities} className="mt-6" actions={<Link href={`/admin/business/journal?day=${day}`} className="text-accent text-sm font-medium">{b.nav.journal}</Link>}>
        {activities.length === 0 ? (
          <p className="text-fg-muted text-sm">{b.journal.empty}</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {activities.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-2">
                <time className="text-fg-muted tabular-nums" dateTime={a.occurred_at}>{formatTime(a.occurred_at, lang)}</time>
                <Badge tone={a.activity_type === "incident" ? "danger" : "neutral"}>{b.activityType[a.activity_type]}</Badge>
                <span dir="auto" className="font-medium">{a.title}</span>
                <span className="text-fg-muted text-xs">{names.get(a.responsible_id ?? "") ?? ""}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      {!report && can("business.day.close") ? (
        <Panel title={c.close} className="mt-6">
          <CloseDayForm day={day} />
        </Panel>
      ) : null}
    </>
  );
}
