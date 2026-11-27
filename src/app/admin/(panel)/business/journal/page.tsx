import Link from "next/link";
import { ActionButton } from "@/components/admin/admin-form";
import { AttachmentForm, CommentForm } from "@/components/admin/business/forms";
import { ActivityForm, JournalQuickEntry } from "@/components/admin/business/journal-entry";
import { AdminPageHeader, EmptyState, Notice, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { format } from "@/i18n/format";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { addDays, businessToday, formatDay, formatTime, isIsoDate } from "@/features/business/dates";
import { removeAttachment } from "@/features/business/expense-actions";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { requirePermission } from "@/features/business/permissions";
import { customerOptions, listActivities, recentSaleOptions, staffNames, staffOptions } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.journal.title);

/** Daily journal: quick-action buttons on top, the day's timeline (oldest first) underneath. */
export default async function JournalPage({ searchParams }: PageProps<"/admin/business/journal">) {
  const { admin, can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const j = b.journal;
  const params = await searchParams;
  const today = businessToday();
  const day = isIsoDate(params.day) && params.day <= today ? params.day : today;
  const canWrite = can("business.journal.write");
  const canComment = canWrite || can("business.journal.comment");

  const [{ data, error }, names, staff, customers, sales] = await Promise.all([
    listActivities(day),
    staffNames(),
    canWrite ? staffOptions() : Promise.resolve([]),
    canWrite ? customerOptions() : Promise.resolve([]),
    canWrite ? recentSaleOptions() : Promise.resolve([]),
  ]);
  const customerOpts = customers.map((c) => ({ value: c.id, label: c.name }));
  const saleOpts = sales.map((s) => ({ value: s.id, label: s.business_customers?.name ? `${s.number} · ${s.business_customers.name}` : s.number }));

  return (
    <>
      <AdminPageHeader title={j.title} description={j.description} />

      {canWrite && day === today ? (
        <Panel title={j.quickTitle} className="mb-8">
          <JournalQuickEntry staff={staff} customers={customerOpts} sales={saleOpts} currentUser={admin.id} />
        </Panel>
      ) : null}

      <nav aria-label={j.timeline} className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/business/journal?day=${addDays(day, -1)}`} className="border-line inline-flex min-h-11 items-center rounded-full border px-4 text-sm">
          <span aria-hidden="true" className="rtl:-scale-x-100">←</span>&nbsp;{j.previousDay}
        </Link>
        <h2 className="text-fg text-lg font-semibold first-letter:uppercase">{formatDay(day, lang)}</h2>
        {day < today ? (
          <span className="flex gap-2">
            <Link href={`/admin/business/journal?day=${addDays(day, 1)}`} className="border-line inline-flex min-h-11 items-center rounded-full border px-4 text-sm">
              {j.nextDay}&nbsp;<span aria-hidden="true" className="rtl:-scale-x-100">→</span>
            </Link>
            <Link href="/admin/business/journal" className="text-accent inline-flex min-h-11 items-center text-sm font-medium">{j.today}</Link>
          </span>
        ) : (
          <span className="text-fg-muted text-sm">{format(j.entryCount, { count: data.length })}</span>
        )}
      </nav>

      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}
      {data.length === 0 ? (
        <EmptyState>{j.empty}</EmptyState>
      ) : (
        <ol className="space-y-4">
          {data.map((a) => (
            <li key={a.id} className={`border-line bg-bg rounded-[var(--radius-card)] border p-4 sm:p-5 ${a.activity_type === "incident" ? "border-s-danger border-s-4" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-fg-muted text-sm tabular-nums">
                    <time dateTime={a.occurred_at}>{formatTime(a.occurred_at, lang)}</time> · <Badge tone={a.activity_type === "incident" ? "danger" : "neutral"}>{b.activityType[a.activity_type]}</Badge>
                  </p>
                  <h3 dir="auto" className="mt-1 text-base font-semibold">{a.title}</h3>
                  {a.description ? <p dir="auto" className="text-fg mt-1 text-sm whitespace-pre-line">{a.description}</p> : null}
                  <p className="text-fg-muted mt-2 text-xs">
                    {j.responsible} : {names.get(a.responsible_id ?? "") ?? b.common.unknownUser}
                    {a.business_customers ? <> · <Link href={`/admin/business/customers/${a.business_customers.id}`} className="text-accent">{a.business_customers.name}</Link></> : null}
                    {a.business_sales ? <> · <Link href={`/admin/business/sales/${a.business_sales.id}`} className="text-accent" dir="ltr">{a.business_sales.number}</Link></> : null}
                  </p>
                </div>
              </div>

              {a.files.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                  {a.files.map((f) => (
                    <li key={f.id} className="bg-surface inline-flex items-center gap-2 rounded-full px-3 py-1">
                      {f.url ? <a href={f.url} target="_blank" rel="noreferrer" className="text-accent" dir="auto">{f.file_name}</a> : <span dir="auto">{f.file_name}</span>}
                      {canWrite ? <ActionButton action={removeAttachment} label="×" hidden={{ id: f.id }} /> : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {a.comments.length > 0 ? (
                <ol className="border-line mt-4 space-y-2 border-s-2 ps-3">
                  {a.comments.map((c) => (
                    <li key={c.id} className="text-sm">
                      <p className="text-fg-muted text-xs">{names.get(c.author_id) ?? b.common.unknownUser} · {formatAdminDateTime(c.created_at, lang)}</p>
                      <p dir="auto" className="whitespace-pre-line">{c.body}</p>
                    </li>
                  ))}
                </ol>
              ) : null}

              {canComment || canWrite ? (
                <details className="mt-3">
                  <summary className="text-accent min-h-11 cursor-pointer py-2 text-sm font-medium">
                    {j.comments}{canWrite ? ` · ${j.editEntry}` : ""}
                  </summary>
                  <div className="mt-3 space-y-4">
                    {canComment ? <CommentForm activityId={a.id} /> : null}
                    {canWrite ? (
                      <>
                        <ActivityForm
                          type={a.activity_type}
                          staff={staff}
                          customers={customerOpts}
                          sales={saleOpts}
                          currentUser={admin.id}
                          values={{ id: a.id, title: a.title, description: a.description, responsible_id: a.responsible_id, customer_id: a.customer_id, sale_id: a.sale_id }}
                        />
                        <AttachmentForm entityType="activity" entityId={a.id} />
                      </>
                    ) : null}
                  </div>
                </details>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
