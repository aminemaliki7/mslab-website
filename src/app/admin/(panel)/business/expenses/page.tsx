import Link from "next/link";
import { ExpenseForm } from "@/components/admin/business/expense-form";
import { AdminPageHeader, EmptyState, Notice, Panel, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { addDays, businessToday, formatShortDay, isIsoDate } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { dbCents, formatMoney } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { listCategories, listExpenses, listSuppliers, productOptions, type Treatment } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.expenses.title);

const TREATMENTS: Treatment[] = ["operating", "stock_purchase", "investment"];

export default async function BusinessExpensesPage({ searchParams }: PageProps<"/admin/business/expenses">) {
  const { can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const e = b.expenses;
  const params = await searchParams;
  const today = businessToday();
  const from = isIsoDate(params.from) ? params.from : `${today.slice(0, 8)}01`;
  const to = isIsoDate(params.to) && params.to >= from ? params.to : today;
  const treatment = typeof params.treatment === "string" && (TREATMENTS as string[]).includes(params.treatment) ? (params.treatment as Treatment) : undefined;
  const canRecord = can("business.expenses.manage");

  const [{ data, error }, { data: categories }, { data: suppliers }, products] = await Promise.all([
    listExpenses({ from, to, treatment }),
    listCategories("expense"),
    listSuppliers(),
    canRecord ? productOptions() : Promise.resolve([]),
  ]);
  // Totals per accounting nature (voided expenses excluded), in integer cents.
  const valid = data.filter((x) => !x.is_void);
  const totalOf = (t: Treatment) => valid.filter((x) => x.treatment === t).reduce((s, x) => s + dbCents(x.amount), 0);
  const control = "border-line-strong bg-bg h-11 rounded-[var(--radius-control)] border px-3";

  return (
    <>
      <AdminPageHeader title={e.title} description={e.description} actions={<a href={`/admin/business/export/expenses?from=${from}&to=${to}`} download className="text-accent inline-flex min-h-11 items-center text-sm font-medium">↓ {b.analytics.export}</a>} />

      {canRecord ? (
        <Panel title={e.quickTitle} className="mb-8">
          <ExpenseForm
            today={today}
            categories={categories.filter((c) => c.is_active).map((c) => ({ value: c.id, label: c.name }))}
            suppliers={suppliers.filter((s) => !s.is_archived).map((s) => ({ value: s.id, label: s.name }))}
            stockItems={products.filter((p) => p.track_stock).map((p) => ({ id: p.id, name: p.name, unit: p.unit, purchase_cost: p.purchase_cost }))}
          />
        </Panel>
      ) : null}

      <form method="get" action="/admin/business/expenses" className="mb-4 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <label className="grid gap-1 text-sm">{b.common.from}<input type="date" name="from" defaultValue={from} className={control} /></label>
        <label className="grid gap-1 text-sm">{b.common.to}<input type="date" name="to" defaultValue={to} className={control} /></label>
        <label className="grid gap-1 text-sm">
          {e.treatment}
          <select name="treatment" defaultValue={treatment ?? ""} className={`${control} select-control pe-10`}>
            <option value="">{e.allTreatments}</option>
            {TREATMENTS.map((t) => <option key={t} value={t}>{b.treatment[t]}</option>)}
          </select>
        </label>
        <button type="submit" className="bg-primary text-on-primary h-11 rounded-[var(--radius-control)] px-5 text-sm font-medium">{b.common.filter}</button>
        <Link href={`/admin/business/expenses?from=${addDays(today, -6)}&to=${today}`} className="text-accent inline-flex min-h-11 items-center text-sm">{b.common.last7}</Link>
      </form>

      <h2 className="text-fg mb-2 text-sm font-semibold">{e.totals} · {formatShortDay(from, lang)} → {formatShortDay(to, lang)}</h2>
      <dl className="mb-6 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
        {[
          { label: e.totalOperating, value: totalOf("operating") },
          { label: e.totalStock, value: totalOf("stock_purchase") },
          { label: e.totalInvestment, value: totalOf("investment") },
          { label: e.totalCash, value: valid.reduce((s, x) => s + dbCents(x.amount), 0) },
        ].map((k) => (
          <div key={k.label} className="border-line bg-bg rounded-[var(--radius-control)] border p-3">
            <dt className="text-fg-muted text-xs">{k.label}</dt>
            <dd className="font-semibold tabular-nums" dir="ltr">{formatMoney(k.value, lang, { cents: true })}</dd>
          </div>
        ))}
      </dl>

      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}
      {data.length === 0 ? (
        <EmptyState>{e.empty}</EmptyState>
      ) : (
        <Table head={[e.colLabel, e.colTreatment, e.colAmount, e.colDate]}>
          {data.map((x) => (
            <tr key={x.id} className={x.is_void ? "opacity-60" : undefined}>
              <Td>
                <Link href={`/admin/business/expenses/${x.id}`} className={`hover:text-accent font-semibold ${x.is_void ? "line-through" : ""}`}>{x.label}</Link>
                <p className="text-fg-muted text-xs">{[x.business_categories?.name, x.business_suppliers?.name].filter(Boolean).join(" · ")}</p>
              </Td>
              <Td label={e.colTreatment}>
                {x.is_void ? <Badge tone="danger">{b.sales.voided}</Badge> : <Badge tone={x.treatment === "operating" ? "neutral" : "accent"}>{b.treatment[x.treatment]}</Badge>}
              </Td>
              <Td label={e.colAmount} className="font-semibold tabular-nums">{formatMoney(x.amount, lang)}</Td>
              <Td label={e.colDate} className="text-fg-muted whitespace-nowrap">{formatShortDay(x.expense_date, lang)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
