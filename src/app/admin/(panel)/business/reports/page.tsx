import Link from "next/link";
import { AdminPageHeader, EmptyState, Notice, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/layout";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { formatShortDay } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { formatMoney } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { listReports, staffNames } from "@/features/business/queries";
import { parseSummary } from "@/features/business/summary";

export const generateMetadata = businessTitle((b) => b.reports.title);

export default async function ReportsPage() {
  const { can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const r = b.reports;
  const [{ data, error }, names] = await Promise.all([listReports(), staffNames()]);

  return (
    <>
      <AdminPageHeader title={r.title} description={r.description} actions={
          <>
            <a href="/admin/business/export/reports" download className="text-accent inline-flex min-h-11 items-center text-sm font-medium">↓ {b.analytics.export}</a>
            {can("business.day.close") ? <ButtonLink href="/admin/business/closing">{b.closing.close}</ButtonLink> : null}
          </>
        } />
      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}
      {data.length === 0 ? (
        <EmptyState>{r.empty}</EmptyState>
      ) : (
        <Table head={[r.colDate, r.colRevenue, r.colCollected, r.colResult, r.colStatus]}>
          {data.map((row) => {
            const s = parseSummary(row.summary);
            return (
              <tr key={row.id}>
                <Td>
                  <Link href={`/admin/business/reports/${row.id}`} className="hover:text-accent text-base font-semibold underline-offset-4 hover:underline md:text-sm">
                    {formatShortDay(row.report_date, lang)}
                  </Link>
                  <p className="text-fg-muted text-xs">{names.get(row.closed_by ?? "") ?? b.common.unknownUser} · {formatAdminDateTime(row.closed_at, lang)}</p>
                </Td>
                <Td label={r.colRevenue} className="tabular-nums">{formatMoney(s.revenue, lang, { cents: true })}</Td>
                <Td label={r.colCollected} className="tabular-nums">{formatMoney(s.collected, lang, { cents: true })}</Td>
                <Td label={r.colResult} className={`tabular-nums ${s.operatingResult < 0 ? "text-danger" : ""}`}>{formatMoney(s.operatingResult, lang, { cents: true })}</Td>
                <Td label={r.colStatus}>
                  <Badge tone={row.status === "corrected" ? "warning" : "success"}>{r.status[row.status]}</Badge>
                  {row.version > 1 ? <span className="text-fg-muted ms-1 text-xs">v{row.version}</span> : null}
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
