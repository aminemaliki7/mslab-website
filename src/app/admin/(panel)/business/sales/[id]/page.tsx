import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentForm, ReasonForm, SaleNotesForm, SaleStatusForm } from "@/components/admin/business/forms";
import { AdminPageHeader, Dl, Notice, Panel, StatusBadge, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { format } from "@/i18n/format";
import { formatAdminDateTime, translateMessage } from "@/features/admin/dictionary";
import { formatShortDay } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { orderStatusLabel, paymentStatusLabel } from "@/features/business/labels";
import { dbCents, formatMoney, formatQty, inputAmount } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { getSale, staffNames } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.sales.title);

export default async function SalePage({ params, searchParams }: PageProps<"/admin/business/sales/[id]">) {
  const { can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const s = b.sales;
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ sale, items, payments, events }, names] = await Promise.all([getSale(id), staffNames()]);
  if (!sale) notFound();
  const canManage = can("business.sales.manage");
  const cancelled = sale.order_status === "cancelled";
  const hasValidPayments = payments.some((p) => !p.is_void);

  return (
    <>
      <AdminPageHeader
        title={format(s.detailTitle, { number: sale.number })}
        description={format(s.soldOn, { date: formatAdminDateTime(sale.sold_at, lang), name: names.get(sale.created_by ?? "") ?? b.common.unknownUser })}
        back={{ href: "/admin/business/sales", label: s.title }}
        actions={
          <>
            <StatusBadge status={orderStatusLabel(b, sale.order_status)} />
            <StatusBadge status={paymentStatusLabel(b, sale.payment_status)} />
          </>
        }
      />
      {query.saved ? <Notice>{translateMessage("Vente enregistrée.", lang)}</Notice> : null}
      {cancelled ? (
        <Notice tone="danger">{format(s.cancelled, { date: formatAdminDateTime(sale.cancelled_at, lang), reason: sale.cancel_reason ?? "" })}</Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <Panel title={s.itemsTitle}>
            <Dl
              items={[
                {
                  label: b.common.customer,
                  value: sale.business_customers ? (
                    <Link href={`/admin/business/customers/${sale.business_customers.id}`} className="text-accent font-medium">{sale.business_customers.name}</Link>
                  ) : (
                    b.common.walkIn
                  ),
                },
                ...(sale.quotation_requests ? [{ label: s.requestRef, value: <Link href={`/admin/quotations/${sale.quotation_requests.id}`} className="text-accent" dir="ltr">{sale.quotation_requests.reference}</Link> }] : []),
                ...(sale.due_date ? [{ label: s.dueDate, value: formatShortDay(sale.due_date, lang) }] : []),
              ]}
            />
            <div className="mt-5">
              <Table head={[s.lineDescription, b.common.quantity, b.common.unitPrice, s.lineTotal]}>
                {items.map((i) => (
                  <tr key={i.id}>
                    <Td>
                      {i.product_id ? <Link href={`/admin/business/products/${i.product_id}`} className="hover:text-accent font-medium">{i.description}</Link> : <span className="font-medium">{i.description}</span>}
                      <p className="text-fg-muted text-xs">{s.lineKind[i.line_kind]}{i.deducts_stock ? "" : ` · ${s.noStockDeduction}`}</p>
                    </Td>
                    <Td label={b.common.quantity} className="tabular-nums"><span dir="ltr">{formatQty(i.quantity, lang)}</span> {i.unit}</Td>
                    <Td label={b.common.unitPrice} className="tabular-nums">
                      {formatMoney(i.unit_price, lang)}
                      {dbCents(i.discount_amount) > 0 ? <p className="text-fg-muted text-xs">− {formatMoney(i.discount_amount, lang)}</p> : null}
                    </Td>
                    <Td label={s.lineTotal} className="font-semibold tabular-nums">{formatMoney(i.line_total, lang)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
            <dl className="ms-auto mt-4 grid max-w-xs grid-cols-2 gap-y-1 text-sm">
              <dt className="text-fg-muted">{s.subtotal}</dt>
              <dd className="text-end tabular-nums" dir="ltr">{formatMoney(sale.subtotal, lang)}</dd>
              {dbCents(sale.discount_amount) > 0 ? (
                <>
                  <dt className="text-fg-muted">{b.common.discount}</dt>
                  <dd className="text-end tabular-nums" dir="ltr">− {formatMoney(sale.discount_amount, lang)}</dd>
                </>
              ) : null}
              <dt className="font-semibold">{b.common.total}</dt>
              <dd className="text-end text-lg font-semibold tabular-nums" dir="ltr">{formatMoney(sale.total, lang)}</dd>
              <dt className="text-fg-muted">{s.colPaid}</dt>
              <dd className="text-end tabular-nums" dir="ltr">{formatMoney(sale.amount_paid, lang)}</dd>
              <dt className="font-semibold">{s.remaining}</dt>
              <dd className={`text-end font-semibold tabular-nums ${dbCents(sale.balance) > 0 && !cancelled ? "text-warning" : ""}`} dir="ltr">{formatMoney(sale.balance, lang)}</dd>
            </dl>
          </Panel>

          <Panel title={s.paymentsTitle}>
            {payments.length === 0 ? <p className="text-fg-muted mb-4 text-sm">{s.paymentsEmpty}</p> : null}
            <ul className="mb-5 space-y-3">
              {payments.map((p) => (
                <li key={p.id} className="border-line rounded-[var(--radius-control)] border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={p.is_void ? "text-fg-muted line-through" : ""}>
                      {formatAdminDateTime(p.paid_at, lang)} · {b.paymentMethod[p.method]}
                      {p.reference ? ` · ${p.reference}` : ""} · {names.get(p.created_by ?? "") ?? b.common.unknownUser}
                    </span>
                    <span className="font-semibold tabular-nums" dir="ltr">{formatMoney(p.amount, lang)}</span>
                  </div>
                  {p.is_void ? (
                    <p className="text-danger mt-1 text-xs">
                      <Badge tone="danger">{s.voided}</Badge> {formatAdminDateTime(p.voided_at, lang)} · {p.void_reason}
                    </p>
                  ) : can("business.finance.correct") ? (
                    <details className="mt-2">
                      <summary className="text-fg-muted cursor-pointer text-xs">{s.voidPayment}</summary>
                      <div className="mt-2"><ReasonForm kind="voidPayment" id={p.id} /></div>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
            {canManage && !cancelled && dbCents(sale.balance) > 0 ? <PaymentForm saleId={sale.id} balance={inputAmount(sale.balance, lang)} /> : null}
          </Panel>
        </div>

        <div className="space-y-6">
          {canManage && !cancelled ? (
            <Panel title={s.statusTitle}>
              <SaleStatusForm saleId={sale.id} status={sale.order_status} />
            </Panel>
          ) : null}

          <Panel title={s.eventsTitle}>
            <ol className="space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="border-line border-s-2 ps-3">
                  <p className="font-medium">
                    {e.event_type === "status" && e.from_status && e.to_status
                      ? format(s.event.status, { from: b.orderStatus[e.from_status], to: b.orderStatus[e.to_status] })
                      : s.event[e.event_type as keyof typeof s.event]}
                    {e.amount !== null && e.event_type !== "status" ? <span className="tabular-nums" dir="ltr"> · {formatMoney(e.amount, lang)}</span> : null}
                  </p>
                  <p className="text-fg-muted text-xs">
                    {formatAdminDateTime(e.created_at, lang)} · {names.get(e.created_by ?? "") ?? b.common.unknownUser}
                  </p>
                  {e.note && e.event_type !== "payment" ? <p dir="auto" className="text-fg-muted text-xs">{e.note}</p> : null}
                </li>
              ))}
            </ol>
          </Panel>

          {canManage ? (
            <Panel title={s.detailsTitle}>
              <SaleNotesForm saleId={sale.id} notes={sale.notes} dueDate={sale.due_date} />
            </Panel>
          ) : sale.notes ? (
            <Panel title={s.detailsTitle}><p dir="auto" className="text-sm whitespace-pre-line">{sale.notes}</p></Panel>
          ) : null}

          {canManage && !cancelled ? (
            <Panel title={s.cancelTitle} description={s.cancelHint}>
              {hasValidPayments ? <p className="text-warning text-sm">{translateMessage("Annulez d'abord les paiements de cette vente.", lang)}</p> : <ReasonForm kind="cancelSale" id={sale.id} />}
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
