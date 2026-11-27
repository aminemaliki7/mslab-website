import Link from "next/link";
import { AdminPageHeader, EmptyState, Notice, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { addDays, businessToday, isIsoDate } from "@/features/business/dates";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { MOVEMENT_TYPES, movementTone } from "@/features/business/labels";
import { dbMilli, formatQty } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { listMovements, staffNames, type MovementType } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.stock.title);

export default async function StockLedgerPage({ searchParams }: PageProps<"/admin/business/stock">) {
  await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const s = b.stock;
  const params = await searchParams;
  const today = businessToday();
  const from = isIsoDate(params.from) ? params.from : addDays(today, -30);
  const to = isIsoDate(params.to) && params.to >= from ? params.to : today;
  const type = typeof params.type === "string" && (MOVEMENT_TYPES as string[]).includes(params.type) ? (params.type as MovementType) : undefined;
  const product = typeof params.product === "string" && /^[0-9a-f-]{36}$/i.test(params.product) ? params.product : undefined;
  const [{ data, error }, names] = await Promise.all([listMovements({ type, from, to, product }), staffNames()]);
  const control = "border-line-strong bg-bg h-11 rounded-[var(--radius-control)] border px-3";

  return (
    <>
      <AdminPageHeader title={s.title} description={s.description} actions={<a href={`/admin/business/export/movements?from=${from}&to=${to}`} download className="text-accent inline-flex min-h-11 items-center text-sm font-medium">↓ {b.analytics.export}</a>} />
      <form method="get" action="/admin/business/stock" className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        {product ? <input type="hidden" name="product" value={product} /> : null}
        <label className="grid gap-1 text-sm">
          {b.common.from}
          <input type="date" name="from" defaultValue={from} className={control} />
        </label>
        <label className="grid gap-1 text-sm">
          {b.common.to}
          <input type="date" name="to" defaultValue={to} className={control} />
        </label>
        <label className="grid gap-1 text-sm">
          {s.colType}
          <select name="type" defaultValue={type ?? ""} className={`${control} select-control pe-10`}>
            <option value="">{s.allTypes}</option>
            {MOVEMENT_TYPES.map((m) => (
              <option key={m} value={m}>{b.movementType[m]}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="bg-primary text-on-primary h-11 rounded-[var(--radius-control)] px-5 text-sm font-medium">{b.common.filter}</button>
        {product ? <Link href="/admin/business/stock" className="text-accent inline-flex min-h-11 items-center text-sm">{b.common.all}</Link> : null}
      </form>
      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}
      {data.length === 0 ? (
        <EmptyState>{s.empty}</EmptyState>
      ) : (
        <Table head={[s.colWhen, s.colProduct, s.colType, s.colQty, s.colAfter, s.colReason]}>
          {data.map((m) => (
            <tr key={m.id}>
              <Td className="whitespace-nowrap">
                {formatAdminDateTime(m.occurred_at, lang)}
                <p className="text-fg-muted text-xs">{names.get(m.created_by ?? "") ?? b.common.unknownUser}</p>
              </Td>
              <Td label={s.colProduct}>
                {m.business_products ? (
                  <Link href={`/admin/business/products/${m.business_products.id}`} className="hover:text-accent font-semibold">{m.business_products.name}</Link>
                ) : null}
              </Td>
              <Td label={s.colType}>
                <Badge tone={movementTone(m.movement_type, dbMilli(m.quantity))}>{b.movementType[m.movement_type]}</Badge>
              </Td>
              <Td label={s.colQty} className="font-semibold tabular-nums">
                <span dir="ltr">{dbMilli(m.quantity) > 0 ? "+" : ""}{formatQty(m.quantity, lang)}</span> <span className="text-fg-muted text-xs">{m.business_products?.unit}</span>
              </Td>
              <Td label={s.colAfter} className="tabular-nums"><span dir="ltr">{formatQty(m.quantity_after, lang)}</span></Td>
              <Td label={s.colReason}>
                {m.business_sales ? <Link href={`/admin/business/sales/${m.business_sales.id}`} className="text-accent font-medium">{m.business_sales.number}</Link> : null}
                {m.business_expenses ? <Link href={`/admin/business/expenses/${m.business_expenses.id}`} className="text-accent font-medium">{m.business_expenses.label}</Link> : null}
                {m.reason && !m.business_sales ? <p dir="auto" className="text-fg-muted text-xs">{m.reason}</p> : null}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
