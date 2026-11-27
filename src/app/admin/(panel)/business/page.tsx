import Link from "next/link";
import type { ReactNode } from "react";
import { Counters, FinancialKpis } from "@/components/admin/business/summary-view";
import { PeriodFilter, resolvePeriod } from "@/components/admin/business/period-filter";
import { AdminPageHeader, Notice, Panel } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/layout";
import { format } from "@/i18n/format";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { businessDateOf, businessToday, formatShortDay, formatTime } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { formatMoney, formatQty } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { lastReport, listTasks, lowStockProducts, periodSummary, recentActivities, recentTransactions, reportForDay, staffNames } from "@/features/business/queries";
import { parseSummary } from "@/features/business/summary";

export const generateMetadata = businessTitle((b) => b.overview.title);

/**
 * Overview for the manager and the associates: understand the situation in a few seconds.
 * Every figure comes from business_period_summary() (Postgres, recorded rows only).
 */
export default async function BusinessOverviewPage({ searchParams }: PageProps<"/admin/business">) {
  const { admin, can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const o = b.overview;
  const today = businessToday();
  const period = resolvePeriod(await searchParams, today);

  const [{ data: raw, error }, transactions, activities, { data: tasks }, low, names, todayReport, latest] = await Promise.all([
    periodSummary(period.from, period.to),
    recentTransactions(8),
    recentActivities(6),
    listTasks({ view: "open", userId: admin.id, today, limit: 6 }),
    lowStockProducts(6),
    staffNames(),
    reportForDay(today),
    lastReport(),
  ]);
  const s = parseSummary(raw);
  const open = s.ordersOpen;

  return (
    <>
      <AdminPageHeader
        title={o.title}
        description={o.description}
        actions={
          can("business.day.close") && !todayReport ? (
            <ButtonLink href="/admin/business/closing">{o.closeToday}</ButtonLink>
          ) : todayReport ? (
            <ButtonLink href={`/admin/business/reports/${todayReport.id}`} variant="secondary">{b.closing.openReport}</ButtonLink>
          ) : null
        }
      />
      <PeriodFilter action="/admin/business" period={period} b={b} />
      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}

      <section aria-label={o.revenue}>
        <FinancialKpis s={s} b={b} lang={lang} />
      </section>

      <section className="mt-6" aria-label={o.awaiting}>
        <Counters
          items={[
            { label: `${o.awaiting} (${o.awaitingHint})`, value: (open.new ?? 0) + (open.confirmed ?? 0), href: "/admin/business/sales?status=new", tone: "warning" },
            { label: o.inProduction, value: open.in_production ?? 0, href: "/admin/business/sales?status=in_production" },
            { label: o.ready, value: open.ready ?? 0, href: "/admin/business/sales?status=ready" },
            { label: o.lowStock, value: s.lowStock, href: "/admin/business/products?view=low", tone: "warning" },
            { label: `${o.tasks} · ${s.tasksOverdue} ${o.overdue}`, value: s.tasksOpen, href: s.tasksOverdue > 0 ? "/admin/business/tasks?view=overdue" : "/admin/business/tasks", tone: s.tasksOverdue > 0 ? "danger" : undefined },
            { label: o.newCustomers, value: s.newCustomers, href: "/admin/business/customers" },
          ]}
        />
      </section>

      <p className="text-fg-muted mt-3 text-xs">
        {s.computedAt ? format(o.computedAt, { date: formatAdminDateTime(s.computedAt, lang) }) : null}
        {" · "}
        {latest ? <Link href={`/admin/business/reports/${latest.id}`} className="text-accent">{format(o.lastReport, { date: formatShortDay(latest.report_date, lang) })}</Link> : o.noReport}
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel title={o.pendingTasks} actions={<SeeAll href="/admin/business/tasks">{b.common.seeAll}</SeeAll>}>
          {tasks.length === 0 ? (
            <p className="text-fg-muted text-sm">{o.noTasks}</p>
          ) : (
            <List>
              {tasks.map((t) => {
                const overdue = t.due_date !== null && t.due_date < today;
                return (
                  <Row key={t.id} href={`/admin/business/tasks/${t.id}`} title={t.title} meta={`${names.get(t.assigned_to ?? "") ?? b.tasks.unassigned}${t.due_date ? ` · ${formatShortDay(t.due_date, lang)}` : ""}`}>
                    {overdue ? <Badge tone="danger">{b.tasks.overdue}</Badge> : <Badge tone={t.status === "blocked" ? "warning" : "neutral"}>{b.taskStatus[t.status]}</Badge>}
                  </Row>
                );
              })}
            </List>
          )}
        </Panel>

        <Panel title={o.recentTransactions}>
          {transactions.length === 0 ? (
            <p className="text-fg-muted text-sm">{o.noTransactions}</p>
          ) : (
            <List>
              {transactions.map((x) => (
                <Row key={x.key} href={x.href} title={x.title} meta={`${o[x.kind]} · ${formatAdminDateTime(x.at, lang)}`} muted={x.muted}>
                  <span className={`text-sm font-semibold tabular-nums ${x.kind === "expense" ? "text-fg-muted" : ""}`} dir="ltr">
                    {x.kind === "expense" ? "− " : x.kind === "payment" ? "+ " : ""}{formatMoney(x.amount, lang)}
                  </span>
                </Row>
              ))}
            </List>
          )}
        </Panel>

        <Panel title={o.recentActivities} actions={<SeeAll href="/admin/business/journal">{b.common.seeAll}</SeeAll>}>
          {activities.length === 0 ? (
            <p className="text-fg-muted text-sm">{o.noActivities}</p>
          ) : (
            <List>
              {activities.map((a) => (
                <Row key={a.id} href="/admin/business/journal" title={a.title} meta={`${formatShortDay(businessDateOf(a.occurred_at), lang)} ${formatTime(a.occurred_at, lang)} · ${names.get(a.responsible_id ?? "") ?? ""}`}>
                  <Badge tone={a.activity_type === "incident" ? "danger" : "neutral"}>{b.activityType[a.activity_type]}</Badge>
                </Row>
              ))}
            </List>
          )}
        </Panel>

        <Panel title={o.lowStockList} actions={<SeeAll href="/admin/business/products?view=low">{b.common.seeAll}</SeeAll>}>
          {low.length === 0 ? (
            <p className="text-fg-muted text-sm">{o.noLowStock}</p>
          ) : (
            <List>
              {low.map((p) => (
                <Row key={p.id} href={`/admin/business/products/${p.id}`} title={p.name} meta={`${b.products.minStock} : ${formatQty(p.min_stock, lang)} ${p.unit}`}>
                  <span className="text-warning font-semibold tabular-nums" dir="ltr">{formatQty(p.quantity_on_hand, lang)}</span>
                </Row>
              ))}
            </List>
          )}
        </Panel>
      </div>
    </>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="divide-line -my-2 divide-y">{children}</ul>;
}

function Row({ href, title, meta, children, muted }: { href: string; title: string; meta: string; children: ReactNode; muted?: boolean }) {
  return (
    <li>
      <Link href={href} className={`hover:bg-surface -mx-2 flex items-center justify-between gap-4 rounded-[var(--radius-control)] px-2 py-3 ${muted ? "opacity-60" : ""}`}>
        <span className="min-w-0">
          <span dir="auto" className="text-fg block truncate text-start font-medium">{title}</span>
          <span className="text-fg-muted block text-xs">{meta}</span>
        </span>
        {children}
      </Link>
    </li>
  );
}

function SeeAll({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="text-accent inline-flex min-h-11 items-center text-sm font-medium">{children}</Link>;
}
