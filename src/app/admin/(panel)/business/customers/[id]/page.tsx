import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { CustomerForm, CustomerNoteForm, LinkRequestForm } from "@/components/admin/business/forms";
import { AdminPageHeader, Dl, EmptyState, Panel, StatusBadge, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/layout";
import { formatAdminDate, formatAdminDateTime } from "@/features/admin/dictionary";
import { quotationStatuses } from "@/features/admin/labels";
import { setCustomerArchived, unlinkRequest } from "@/features/business/customer-actions";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { orderStatusLabel, paymentStatusLabel } from "@/features/business/labels";
import { dbCents, formatMoney } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { getCustomer, staffNames } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.customers.profile);

export default async function BusinessCustomerPage({ params }: PageProps<"/admin/business/customers/[id]">) {
  const { can } = await requirePermission("business.read");
  const { lang, t, b } = await getBusinessT();
  const c = b.customers;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ customer, balance, sales, payments, notes, requests }, names] = await Promise.all([getCustomer(id), staffNames()]);
  if (!customer) notFound();
  const canManage = can("business.customers.manage");
  const qStatus = quotationStatuses(t);

  return (
    <>
      <AdminPageHeader
        title={customer.name}
        description={`${b.customerType[customer.customer_type]} · ${c.since} ${formatAdminDate(customer.created_at, lang)}`}
        back={{ href: "/admin/business/customers", label: c.title }}
        actions={
          <>
            {customer.is_archived ? <Badge>{b.common.archived}</Badge> : null}
            {can("business.sales.manage") && !customer.is_archived ? <ButtonLink href={`/admin/business/sales/new?customer=${customer.id}`}>{c.newSale}</ButtonLink> : null}
            {canManage ? (
              <ActionButton
                action={setCustomerArchived}
                label={customer.is_archived ? b.common.unarchive : b.common.archive}
                confirm={customer.is_archived ? undefined : c.archiveConfirm}
                hidden={{ id: customer.id, archived: customer.is_archived ? "false" : "true" }}
              />
            ) : null}
          </>
        }
      />

      <ul className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: c.totalSales, value: balance?.total_sales ?? 0 },
          { label: c.totalPaid, value: balance?.total_paid ?? 0 },
          { label: c.balance, value: balance?.balance ?? 0, warn: dbCents(balance?.balance) > 0 },
        ].map((k) => (
          <li key={k.label} className={`rounded-[var(--radius-card)] border p-4 ${k.warn ? "border-warning bg-warning-soft" : "border-line bg-bg"}`}>
            <p className="text-fg-muted text-sm">{k.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums" dir="ltr">{formatMoney(k.value, lang)}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <Panel title={c.salesTitle}>
            {sales.length === 0 ? (
              <EmptyState>{b.sales.empty}</EmptyState>
            ) : (
              <Table head={[b.sales.colNumber, b.sales.colTotal, b.sales.colBalance, b.sales.colStatus]}>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <Td>
                      <Link href={`/admin/business/sales/${s.id}`} className="hover:text-accent font-semibold" dir="ltr">{s.number}</Link>
                      <p className="text-fg-muted text-xs">{formatAdminDateTime(s.sold_at, lang)}</p>
                    </Td>
                    <Td label={b.sales.colTotal} className="tabular-nums">{formatMoney(s.total, lang)}</Td>
                    <Td label={b.sales.colBalance}><StatusBadge status={paymentStatusLabel(b, s.payment_status)} /> <span className="tabular-nums">{dbCents(s.balance) > 0 ? formatMoney(s.balance, lang) : ""}</span></Td>
                    <Td label={b.sales.colStatus}><StatusBadge status={orderStatusLabel(b, s.order_status)} /></Td>
                  </tr>
                ))}
              </Table>
            )}
          </Panel>

          <Panel title={c.paymentsTitle}>
            {payments.length === 0 ? (
              <EmptyState>{b.sales.paymentsEmpty}</EmptyState>
            ) : (
              <ul className="divide-line divide-y text-sm">
                {payments.map((p) => (
                  <li key={p.id} className={`flex flex-wrap items-center justify-between gap-2 py-2 ${p.is_void ? "text-fg-muted line-through" : ""}`}>
                    <span>
                      {formatAdminDateTime(p.paid_at, lang)} · {b.paymentMethod[p.method]}
                      {p.business_sales ? <> · <Link href={`/admin/business/sales/${p.sale_id}`} className="text-accent" dir="ltr">{p.business_sales.number}</Link></> : null}
                    </span>
                    <span className="font-semibold tabular-nums" dir="ltr">{formatMoney(p.amount, lang)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={c.notesTitle}>
            {canManage ? <div className="mb-5"><CustomerNoteForm customerId={customer.id} /></div> : null}
            {notes.length === 0 ? (
              <p className="text-fg-muted text-sm">{c.notesEmpty}</p>
            ) : (
              <ol className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="bg-surface rounded-[var(--radius-control)] p-3 text-sm">
                    <p className="text-fg-muted text-xs">
                      <Badge>{b.noteKind[n.kind as keyof typeof b.noteKind] ?? n.kind}</Badge> {formatAdminDateTime(n.created_at, lang)} · {names.get(n.created_by) ?? b.common.unknownUser}
                    </p>
                    <p dir="auto" className="mt-1 whitespace-pre-line">{n.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={c.editTitle}>
            {canManage ? (
              <CustomerForm values={customer} />
            ) : (
              <Dl
                items={[
                  { label: b.common.phone, value: customer.phone ?? "—" },
                  { label: b.common.email, value: customer.email ?? "—" },
                  { label: c.contactName, value: customer.contact_name ?? "—" },
                  { label: b.common.address, value: [customer.address, customer.city].filter(Boolean).join(", ") || "—" },
                  { label: b.common.notes, value: customer.notes ?? "—" },
                ]}
              />
            )}
          </Panel>

          {can("requests.read") ? (
            <Panel title={c.requestsTitle}>
              {requests.length === 0 ? (
                <p className="text-fg-muted mb-4 text-sm">{c.requestsEmpty}</p>
              ) : (
                <ul className="divide-line mb-4 divide-y text-sm">
                  {requests.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <Link href={`/admin/quotations/${r.id}`} className="text-accent font-medium" dir="ltr">{r.reference}</Link>
                      <span className="flex items-center gap-2">
                        <StatusBadge status={qStatus[r.status]} />
                        {canManage ? <ActionButton action={unlinkRequest} label={c.unlink} hidden={{ request_id: r.id }} /> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {canManage ? <LinkRequestForm customerId={customer.id} /> : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
