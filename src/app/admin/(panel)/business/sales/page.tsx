import Link from "next/link";
import { AdminPageHeader, EmptyState, Notice, StatusBadge, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { safeSearchTerm } from "@/features/admin/search";
import { isIsoDate } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { ORDER_STATUSES, PAYMENT_STATUSES, orderStatusLabel, paymentStatusLabel } from "@/features/business/labels";
import { dbCents, formatMoney } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { listSales, type OrderStatus, type PaymentStatus } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.sales.title);

export default async function BusinessSalesPage({ searchParams }: PageProps<"/admin/business/sales">) {
  const { can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const s = b.sales;
  const params = await searchParams;
  const status = typeof params.status === "string" && (ORDER_STATUSES as string[]).includes(params.status) ? (params.status as OrderStatus) : undefined;
  const payment = typeof params.payment === "string" && (PAYMENT_STATUSES as string[]).includes(params.payment) ? (params.payment as PaymentStatus) : undefined;
  const from = isIsoDate(params.from) ? params.from : undefined;
  const to = from && isIsoDate(params.to) && params.to >= from ? params.to : from;
  const q = safeSearchTerm(params.q);
  const { data, error } = await listSales({ status, payment, q, from, to });

  // Totals of the listed (non-cancelled) sales, in integer cents.
  const valid = data.filter((r) => r.order_status !== "cancelled");
  const sum = (key: "total" | "amount_paid" | "balance") => valid.reduce((acc, r) => acc + dbCents(r[key]), 0);
  const control = "border-line-strong bg-bg h-11 rounded-[var(--radius-control)] border px-3";

  return (
    <>
      <AdminPageHeader
        title={s.title}
        description={s.description}
        actions={
          <>
            <a href={`/admin/business/export/sales${from ? `?from=${from}&to=${to}` : ""}`} download className="text-accent inline-flex min-h-11 items-center text-sm font-medium">↓ {b.analytics.export}</a>
            {can("business.sales.manage") ? <ButtonLink href="/admin/business/sales/new">{s.new}</ButtonLink> : null}
          </>
        }
      />

      <form method="get" action="/admin/business/sales" className="mb-4 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <label className="grid gap-1 text-sm">
          {b.common.search}
          <input type="search" name="q" defaultValue={q} placeholder={s.searchPlaceholder} className={control} />
        </label>
        <label className="grid gap-1 text-sm">
          {s.colStatus}
          <select name="status" defaultValue={status ?? ""} className={`${control} select-control pe-10`}>
            <option value="">{s.allOrderStatuses}</option>
            {ORDER_STATUSES.map((v) => <option key={v} value={v}>{b.orderStatus[v]}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {s.colPayment}
          <select name="payment" defaultValue={payment ?? ""} className={`${control} select-control pe-10`}>
            <option value="">{s.allPaymentStatuses}</option>
            {PAYMENT_STATUSES.map((v) => <option key={v} value={v}>{b.paymentStatus[v]}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {b.common.from}
          <input type="date" name="from" defaultValue={from} className={control} />
        </label>
        <label className="grid gap-1 text-sm">
          {b.common.to}
          <input type="date" name="to" defaultValue={from ? to : undefined} className={control} />
        </label>
        <button type="submit" className="bg-primary text-on-primary h-11 rounded-[var(--radius-control)] px-5 text-sm font-medium">{b.common.filter}</button>
      </form>

      {valid.length > 0 ? (
        <dl className="mb-5 grid grid-cols-3 gap-3 text-sm sm:max-w-2xl">
          {[
            { label: s.colTotal, value: sum("total") },
            { label: s.colPaid, value: sum("amount_paid") },
            { label: s.colBalance, value: sum("balance") },
          ].map((k) => (
            <div key={k.label} className="border-line bg-bg rounded-[var(--radius-control)] border p-3">
              <dt className="text-fg-muted text-xs">{k.label}</dt>
              <dd className="font-semibold tabular-nums" dir="ltr">{formatMoney(k.value, lang, { cents: true })}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}
      {data.length === 0 ? (
        <EmptyState action={can("business.sales.manage") ? <ButtonLink href="/admin/business/sales/new">{s.new}</ButtonLink> : undefined}>
          {status || payment || from || q ? b.common.noResult : s.empty}
        </EmptyState>
      ) : (
        <Table head={[s.colNumber, s.colCustomer, s.colTotal, s.colPayment, s.colStatus]}>
          {data.map((r) => (
            <tr key={r.id} className={r.order_status === "cancelled" ? "opacity-60" : undefined}>
              <Td>
                <Link href={`/admin/business/sales/${r.id}`} className="hover:text-accent text-base font-semibold underline-offset-4 hover:underline md:text-sm" dir="ltr">{r.number}</Link>
                <p className="text-fg-muted text-xs">{formatAdminDateTime(r.sold_at, lang)}</p>
              </Td>
              <Td label={s.colCustomer}>{r.business_customers?.name ?? <span className="text-fg-muted">{b.common.walkIn}</span>}</Td>
              <Td label={s.colTotal} className="tabular-nums">
                <span dir="ltr">{formatMoney(r.total, lang)}</span>
                {dbCents(r.balance) > 0 && r.order_status !== "cancelled" ? <p className="text-warning text-xs">{s.colBalance} {formatMoney(r.balance, lang)}</p> : null}
              </Td>
              <Td label={s.colPayment}><StatusBadge status={paymentStatusLabel(b, r.payment_status)} /></Td>
              <Td label={s.colStatus}><StatusBadge status={orderStatusLabel(b, r.order_status)} /></Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
