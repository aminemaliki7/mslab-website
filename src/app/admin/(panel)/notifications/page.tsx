import Link from "next/link";
import { ActionButton } from "@/components/admin/admin-form";
import { AdminPageHeader, EmptyState, Notice } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { format } from "@/i18n/format";
import { formatShortDay, isIsoDate } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { markAllNotificationsRead } from "@/features/business/notification-actions";
import { listNotifications, unreadNotifications } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.notifications.title);

const HREF: Record<string, (id: string) => string> = {
  quotation_request: (id) => `/admin/quotations/${id}`,
  inquiry: (id) => `/admin/inquiries/${id}`,
  daily_report: (id) => `/admin/business/reports/${id}`,
  task: (id) => `/admin/business/tasks/${id}`,
  product: (id) => `/admin/business/products/${id}`,
  sale: (id) => `/admin/business/sales/${id}`,
  activity: () => `/admin/business/journal`,
};

const TONE: Record<string, string> = {
  "task.overdue": "bg-danger",
  "incident.reported": "bg-danger",
  "stock.low": "bg-warning",
  "task.assigned": "bg-accent",
};

/** Personal notification inbox (RLS: recipients read their own rows only). */
export default async function NotificationsPage() {
  await requireAdmin();
  const { lang, b } = await getBusinessT();
  const n = b.notifications;
  const unread = await unreadNotifications();
  const { data, error } = await listNotifications();

  return (
    <>
      <AdminPageHeader
        title={n.title}
        description={n.description}
        actions={unread > 0 ? <ActionButton action={markAllNotificationsRead} label={n.markAll} /> : null}
      />
      {unread > 0 ? <p className="text-fg-muted -mt-4 mb-6 text-sm">{format(n.unread, { count: unread })}</p> : null}
      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}
      {data.length === 0 ? (
        <EmptyState>{n.empty}</EmptyState>
      ) : (
        <ul className="border-line bg-bg divide-line divide-y rounded-[var(--radius-card)] border">
          {data.map((item) => {
            const href = HREF[item.entity_type]?.(item.entity_id) ?? "/admin";
            const reference = item.type === "report.closed" && item.reference && isIsoDate(item.reference) ? formatShortDay(item.reference, lang) : item.reference;
            return (
              <li key={item.id}>
                <Link href={href} className={`hover:bg-surface flex items-start gap-3 px-4 py-3 ${item.read_at ? "" : "bg-accent-soft/30"}`}>
                  <span aria-hidden="true" className={`mt-2 size-2.5 shrink-0 rounded-full ${item.read_at ? "bg-line-strong" : (TONE[item.type] ?? "bg-primary")}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block ${item.read_at ? "" : "font-semibold"}`}>{n.types[item.type] ?? item.type}</span>
                    {reference ? <span dir="auto" className="text-fg-muted block truncate text-sm">{reference}</span> : null}
                  </span>
                  <time dateTime={item.created_at} className="text-fg-muted shrink-0 text-xs">{formatAdminDateTime(item.created_at, lang)}</time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
