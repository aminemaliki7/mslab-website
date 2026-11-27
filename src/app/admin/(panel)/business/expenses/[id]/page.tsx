import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { AttachmentForm, ExpenseUpdateForm, ReasonForm } from "@/components/admin/business/forms";
import { AdminPageHeader, Dl, Notice, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { format } from "@/i18n/format";
import { formatAdminDateTime, translateMessage } from "@/features/admin/dictionary";
import { formatShortDay } from "@/features/business/dates";
import { removeAttachment } from "@/features/business/expense-actions";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { formatMoney, formatQty } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { getExpense, listCategories, listSuppliers, staffNames } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.expenses.detailTitle);

export default async function ExpensePage({ params, searchParams }: PageProps<"/admin/business/expenses/[id]">) {
  const { can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const e = b.expenses;
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ expense, items, files }, names, { data: categories }, { data: suppliers }] = await Promise.all([getExpense(id), staffNames(), listCategories("expense"), listSuppliers()]);
  if (!expense) notFound();
  const canManage = can("business.expenses.manage");

  return (
    <>
      <AdminPageHeader
        title={expense.label}
        description={format(e.recordedBy, { name: names.get(expense.created_by ?? "") ?? b.common.unknownUser, date: formatAdminDateTime(expense.created_at, lang) })}
        back={{ href: "/admin/business/expenses", label: e.title }}
        actions={expense.is_void ? <Badge tone="danger">{b.sales.voided}</Badge> : <Badge tone="accent">{b.treatment[expense.treatment]}</Badge>}
      />
      {query.saved ? <Notice>{translateMessage("Dépense enregistrée.", lang)}</Notice> : null}
      {query.upload === "failed" ? <Notice tone="warning">{translateMessage("Le téléversement a échoué.", lang)}</Notice> : null}
      {expense.is_void ? <Notice tone="danger">{format(e.voided, { date: formatAdminDateTime(expense.voided_at, lang), reason: expense.void_reason ?? "" })}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Panel>
            <Dl
              items={[
                { label: b.common.amount, value: <strong className="text-lg tabular-nums" dir="ltr">{formatMoney(expense.amount, lang)}</strong> },
                { label: e.treatment, value: `${b.treatment[expense.treatment]} — ${b.treatmentHint[expense.treatment]}` },
                { label: e.date, value: formatShortDay(expense.expense_date, lang) },
                { label: b.sales.method, value: b.paymentMethod[expense.payment_method] },
                { label: b.common.category, value: expense.business_categories?.name ?? "—" },
                { label: b.common.supplier, value: expense.business_suppliers?.name ?? "—" },
                { label: e.reference, value: expense.reference ?? "—" },
              ]}
            />
          </Panel>
          {items.length > 0 ? (
            <Panel title={e.stockLines}>
              <ul className="divide-line divide-y text-sm">
                {items.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link href={`/admin/business/products/${i.product_id}`} className="text-accent font-medium">{i.business_products?.name}</Link>
                    <span className="tabular-nums" dir="ltr">
                      {formatQty(i.quantity, lang)} × {formatMoney(i.unit_cost, lang)} = <strong>{formatMoney(i.line_total, lang)}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
          <Panel title={b.common.attachments}>
            {files.length === 0 ? <p className="text-fg-muted mb-4 text-sm">—</p> : null}
            <ul className="mb-4 space-y-2 text-sm">
              {files.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-2">
                  {f.url ? <a href={f.url} target="_blank" rel="noreferrer" className="text-accent font-medium" dir="auto">{f.file_name}</a> : <span dir="auto">{f.file_name}</span>}
                  {canManage ? <ActionButton action={removeAttachment} label={b.common.remove} hidden={{ id: f.id }} /> : null}
                </li>
              ))}
            </ul>
            {canManage ? <AttachmentForm entityType="expense" entityId={expense.id} /> : null}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title={e.editTitle}>
            {canManage ? (
              <ExpenseUpdateForm
                values={expense}
                categories={categories.filter((c) => c.is_active || c.id === expense.category_id).map((c) => ({ value: c.id, label: c.name }))}
                suppliers={suppliers.map((s) => ({ value: s.id, label: s.name }))}
              />
            ) : (
              <p dir="auto" className="text-sm whitespace-pre-line">{expense.description ?? "—"}</p>
            )}
          </Panel>
          {can("business.finance.correct") && !expense.is_void ? (
            <Panel title={e.voidTitle} description={e.voidHint}>
              <ReasonForm kind="voidExpense" id={expense.id} />
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
