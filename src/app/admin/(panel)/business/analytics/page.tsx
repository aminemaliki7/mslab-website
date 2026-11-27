import Link from "next/link";
import type { ReactNode } from "react";
import { PeriodFilter } from "@/components/admin/business/period-filter";
import { TrendChart } from "@/components/admin/business/trend-chart";
import { AdminPageHeader, Notice, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { format } from "@/i18n/format";
import { completionRate, defaultGranularity, parseAnalytics, type Granularity } from "@/features/business/analytics";
import { addDays, businessToday, formatShortDay } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { formatMoney, formatQty } from "@/features/business/money";
import { resolvePeriod } from "@/features/business/period";
import { requirePermission } from "@/features/business/permissions";
import { analytics } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.analytics.title);

const EXPORTS = ["sales", "payments", "expenses", "movements", "products", "customers", "reports", "series"] as const;

/** Decision-oriented analytics: one trend chart, the rest as readable tables. */
export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/business/analytics">) {
  await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const t = b.analytics;
  const params = await searchParams;
  const today = businessToday();
  // Analytics default to the last 30 days.
  const period = params.period ? resolvePeriod(params, today) : { key: "30d" as const, from: addDays(today, -29), to: today };
  const g = params.g === "day" || params.g === "week" || params.g === "month" ? (params.g as Granularity) : defaultGranularity(period.from, period.to);
  const { data, error } = await analytics(period.from, period.to, g);
  const a = parseAnalytics(data);

  const m = (c: number) => formatMoney(c, lang, { cents: true });
  const sum = (f: (s: (typeof a.series)[number]) => number) => a.series.reduce((acc, s) => acc + f(s), 0);
  const totalExpenses = a.expensesByCategory.reduce((acc, e) => acc + e.amount, 0);
  const rate = completionRate(a.orders);
  const bucketLabel = (bucket: string) => {
    if (g === "month") return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : `${lang}-MA`, { month: "short", year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(`${bucket}T00:00:00Z`));
    return formatShortDay(bucket, lang);
  };
  const query = (extra: Record<string, string>) => {
    const q = new URLSearchParams({ ...(params.period ? { period: period.key } : {}), ...(period.key === "custom" ? { from: period.from, to: period.to } : {}), ...extra });
    return q.toString();
  };
  const exportQuery = `from=${period.from}&to=${period.to}&g=${g}`;

  return (
    <>
      <AdminPageHeader title={t.title} description={t.description} />
      <PeriodFilter action="/admin/business/analytics" period={period} b={b} />
      <nav aria-label={t.granularity} className="-mt-3 mb-6 flex flex-wrap items-center gap-2">
        <span className="text-fg-muted text-sm">{t.granularity} :</span>
        {(["day", "week", "month"] as const).map((v) => (
          <Link key={v} href={`/admin/business/analytics?${query({ g: v })}`} aria-current={g === v ? "page" : undefined} className="border-line hover:border-accent aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent inline-flex min-h-11 items-center rounded-full border px-4 text-sm">
            {t.granularities[v]}
          </Link>
        ))}
      </nav>
      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}

      <Panel title={`${t.trend} · ${formatShortDay(period.from, lang)} → ${formatShortDay(period.to, lang)}`} actions={<ExportLink href={`/admin/business/export/series?${exportQuery}`}>{t.export}</ExportLink>}>
        {sum((s) => s.revenue) === 0 && sum((s) => s.operating) === 0 ? (
          <p className="text-fg-muted text-sm">{t.noData}</p>
        ) : (
          <>
            <TrendChart series={a.series} lang={lang} label={t.trend} peakLabel={t.peak} bucketLabel={bucketLabel} />
            <details className="mt-4" open={a.series.length <= 12}>
              <summary className="text-accent min-h-11 cursor-pointer py-2 text-sm font-medium">{t.trendTable}</summary>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="text-fg-muted text-xs">
                    <tr>
                      {[t.colPeriod, t.colRevenue, t.colSales, t.colCollected, t.colOperating, t.colCashOut].map((h) => (
                        <th key={h} scope="col" className="py-2 text-start font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-line divide-y tabular-nums">
                    {a.series.map((s) => (
                      <tr key={s.bucket}>
                        <th scope="row" className="py-1.5 text-start font-medium">{bucketLabel(s.bucket)}</th>
                        <td dir="ltr" className="text-start">{m(s.revenue)}</td>
                        <td>{s.sales}</td>
                        <td dir="ltr" className="text-start">{m(s.collected)}</td>
                        <td dir="ltr" className="text-start">{m(s.operating)}</td>
                        <td dir="ltr" className="text-start">{m(s.cashOut)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <th scope="row" className="py-2 text-start">{t.totals}</th>
                      <td dir="ltr" className="text-start">{m(sum((s) => s.revenue))}</td>
                      <td>{sum((s) => s.sales)}</td>
                      <td dir="ltr" className="text-start">{m(sum((s) => s.collected))}</td>
                      <td dir="ltr" className="text-start">{m(sum((s) => s.operating))}</td>
                      <td dir="ltr" className="text-start">{m(sum((s) => s.cashOut))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={t.completion} description={t.completionHint}>
          <p className="text-3xl font-semibold tabular-nums">{rate === null ? "—" : `${rate} %`}</p>
          <p className="text-fg-muted mt-1 text-sm">{format(t.ordersLine, a.orders)}</p>
        </Panel>

        <Panel title={t.ageing} description={t.ageingHint} actions={<ExportLink href={`/admin/business/export/customers?${exportQuery}`}>{t.export}</ExportLink>}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["0_30", "31_60", "61_90", "90_plus"] as const).map((k) => (
              <li key={k} className={`rounded-[var(--radius-control)] border p-3 ${k === "90_plus" && a.ageing[k].amount > 0 ? "border-danger bg-danger-soft" : k === "61_90" && a.ageing[k].amount > 0 ? "border-warning bg-warning-soft" : "border-line"}`}>
                <p className="text-fg-muted text-xs">{t.ageingBuckets[k]}</p>
                <p className="font-semibold tabular-nums" dir="ltr">{m(a.ageing[k].amount)}</p>
                <p className="text-fg-muted text-xs">{a.ageing[k].count} · {b.nav.sales}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={t.salesByProduct} description={t.marginHint} className="xl:col-span-2" actions={<ExportLink href={`/admin/business/export/sales?${exportQuery}`}>{t.export}</ExportLink>}>
          {a.salesByProduct.length === 0 ? (
            <p className="text-fg-muted text-sm">{t.noData}</p>
          ) : (
            <DataTable head={[t.colProduct, t.colQty, b.nav.sales, t.colRevenue, t.colEstCost, t.colMargin]}>
              {a.salesByProduct.map((p) => (
                <tr key={p.productId}>
                  <th scope="row" className="py-1.5 text-start font-medium">
                    <Link href={`/admin/business/products/${p.productId}`} className="hover:text-accent" dir="auto">{p.name}</Link>
                  </th>
                  <td dir="ltr" className="text-start">{formatQty(p.quantityMilli, lang, { milli: true })} {p.unit}</td>
                  <td>{p.sales}</td>
                  <td dir="ltr" className="text-start font-semibold">{m(p.revenue)}</td>
                  <td dir="ltr" className="text-start">{p.cost === null ? "—" : `${p.costComplete ? "" : "~ "}${m(p.cost)}`}</td>
                  <td dir="ltr" className="text-start">{p.cost === null ? "—" : `${p.costComplete ? "" : "~ "}${m(p.revenue - p.cost)}`}</td>
                </tr>
              ))}
            </DataTable>
          )}
          {a.customLines.count > 0 ? <p className="text-fg-muted mt-3 text-sm">{format(t.customLines, { count: a.customLines.count, amount: m(a.customLines.revenue) })}</p> : null}
        </Panel>

        <Panel title={t.expenseBreakdown} actions={<ExportLink href={`/admin/business/export/expenses?${exportQuery}`}>{t.export}</ExportLink>}>
          {a.expensesByCategory.length === 0 ? (
            <p className="text-fg-muted text-sm">{t.noData}</p>
          ) : (
            <DataTable head={[t.colCategory, t.colNature, t.colCount, t.colAmount, t.share]}>
              {a.expensesByCategory.map((e) => (
                <tr key={`${e.category}-${e.treatment}`}>
                  <th scope="row" className="py-1.5 text-start font-medium" dir="auto">{e.category ?? b.common.noCategory}</th>
                  <td><Badge tone={e.treatment === "operating" ? "neutral" : "accent"}>{b.treatment[e.treatment as keyof typeof b.treatment] ?? e.treatment}</Badge></td>
                  <td>{e.count}</td>
                  <td dir="ltr" className="text-start font-semibold">{m(e.amount)}</td>
                  <td>{totalExpenses > 0 ? `${Math.round((e.amount * 100) / totalExpenses)} %` : "—"}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>

        <Panel title={t.inventory} description={t.inventoryHint} actions={<ExportLink href={`/admin/business/export/products?${exportQuery}`}>{t.export}</ExportLink>}>
          {a.inventory.length === 0 ? (
            <p className="text-fg-muted text-sm">{t.noData}</p>
          ) : (
            <DataTable head={[t.colCategory, t.colProducts, t.colValue, t.colMissingCost, t.colLow]}>
              {a.inventory.map((i) => (
                <tr key={i.category ?? "none"}>
                  <th scope="row" className="py-1.5 text-start font-medium" dir="auto">{i.category ?? b.common.noCategory}</th>
                  <td>{i.products}</td>
                  <td dir="ltr" className="text-start font-semibold">{m(i.value)}</td>
                  <td className={i.missingCost > 0 ? "text-warning" : ""}>{i.missingCost}</td>
                  <td className={i.low > 0 ? "text-warning font-semibold" : ""}>{i.low}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <th scope="row" className="py-2 text-start">{t.totals}</th>
                <td>{a.inventory.reduce((x, i) => x + i.products, 0)}</td>
                <td dir="ltr" className="text-start">{m(a.inventory.reduce((x, i) => x + i.value, 0))}</td>
                <td />
                <td />
              </tr>
            </DataTable>
          )}
        </Panel>

        <Panel title={t.customersTitle} className="xl:col-span-2">
          <ul className="mb-4 grid grid-cols-3 gap-3 text-sm sm:max-w-2xl">
            <li className="border-line rounded-[var(--radius-control)] border p-3"><p className="text-fg-muted text-xs">{t.activeCustomers}</p><p className="text-xl font-semibold">{a.customers.active}</p></li>
            <li className="border-line rounded-[var(--radius-control)] border p-3"><p className="text-fg-muted text-xs">{t.newCustomers}</p><p className="text-xl font-semibold">{a.customers.new}</p></li>
            <li className="border-line rounded-[var(--radius-control)] border p-3"><p className="text-fg-muted text-xs">{t.walkIn}</p><p className="font-semibold tabular-nums" dir="ltr">{m(a.customers.walkInRevenue)}</p></li>
          </ul>
          {a.customers.top.length === 0 ? null : (
            <>
              <h3 className="mb-2 text-sm font-semibold">{t.topCustomers}</h3>
              <DataTable head={[b.common.customer, b.nav.sales, t.colRevenue, t.colBalance]}>
                {a.customers.top.map((c) => (
                  <tr key={c.id}>
                    <th scope="row" className="py-1.5 text-start font-medium">
                      <Link href={`/admin/business/customers/${c.id}`} className="hover:text-accent" dir="auto">{c.name}</Link>
                    </th>
                    <td>{c.sales}</td>
                    <td dir="ltr" className="text-start font-semibold">{m(c.revenue)}</td>
                    <td dir="ltr" className={`text-start ${c.balance > 0 ? "text-warning font-semibold" : ""}`}>{m(c.balance)}</td>
                  </tr>
                ))}
              </DataTable>
            </>
          )}
        </Panel>
      </div>

      <Panel title={t.exportsTitle} description={t.exportHint} className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {EXPORTS.map((k) => (
            <li key={k}>
              <a href={`/admin/business/export/${k}?${exportQuery}`} className="border-line-strong hover:border-accent inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium" download>
                ↓ {t.exports[k]}
              </a>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

function DataTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead className="text-fg-muted text-xs">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="py-2 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-line divide-y tabular-nums">{children}</tbody>
      </table>
    </div>
  );
}

function ExportLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} download className="text-accent inline-flex min-h-11 items-center text-sm font-medium">
      ↓ {children}
    </a>
  );
}
