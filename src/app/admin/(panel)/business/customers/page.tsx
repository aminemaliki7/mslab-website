import Link from "next/link";
import { CustomerForm } from "@/components/admin/business/forms";
import { AdminPageHeader, EmptyState, Notice, Panel, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/layout";
import { formatAdminDate } from "@/features/admin/dictionary";
import { safeSearchTerm } from "@/features/admin/search";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { dbCents, formatMoney } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { listCustomers } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.customers.title);

export default async function BusinessCustomersPage({ searchParams }: PageProps<"/admin/business/customers">) {
  const { can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const c = b.customers;
  const params = await searchParams;
  const q = safeSearchTerm(params.q);
  const archived = params.archived === "1";
  const { data, error } = await listCustomers({ q, archived });
  const outstanding = data.reduce((sum, r) => sum + dbCents(r.balance?.balance), 0);

  return (
    <>
      <AdminPageHeader
        title={c.title}
        description={c.description}
        actions={
          <>
            <a href={"/admin/business/export/customers"} download className="text-accent inline-flex min-h-11 items-center text-sm font-medium">↓ {b.analytics.export}</a>
            {can("business.customers.manage") ? <ButtonLink href="/admin/business/customers/new" variant="secondary">{c.new}</ButtonLink> : null}
          </>
        }
      />

      {can("business.customers.manage") ? (
        <Panel title={c.quickTitle} className="mb-6" >
          <div id="quick" className="scroll-mt-24">
            <CustomerForm values={{}} quick />
          </div>
        </Panel>
      ) : null}

      <form action="/admin/business/customers" method="get" className="mb-4 grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        <label htmlFor="q" className="sr-only">{b.common.search}</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder={c.searchPlaceholder} className="border-line-strong bg-bg h-11 min-w-0 rounded-[var(--radius-control)] border px-3 text-base sm:min-w-64 sm:flex-1" />
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="archived" value="1" defaultChecked={archived} className="accent-accent size-5" />
          {c.showArchived}
        </label>
        <button type="submit" className="bg-primary text-on-primary h-11 rounded-[var(--radius-control)] px-5 text-sm font-medium">{b.common.filter}</button>
      </form>

      {outstanding > 0 ? (
        <p className="text-fg-muted mb-4 text-sm">
          {c.balance} : <strong className="text-fg tabular-nums" dir="ltr">{formatMoney(outstanding, lang, { cents: true })}</strong>
        </p>
      ) : null}

      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}
      {data.length === 0 ? (
        <EmptyState>{q || archived ? b.common.noResult : c.empty}</EmptyState>
      ) : (
        <Table head={[c.colCustomer, c.colContact, c.colSales, c.colBalance, c.colSince]}>
          {data.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link href={`/admin/business/customers/${r.id}`} className="hover:text-accent text-base font-semibold underline-offset-4 hover:underline md:text-sm">
                  {r.name}
                </Link>
                <p className="text-fg-muted text-xs">{b.customerType[r.customer_type]}</p>
              </Td>
              <Td label={c.colContact}>
                {r.phone ? <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="block" dir="ltr">{r.phone}</a> : null}
                {r.email ? <span className="text-fg-muted block text-xs">{r.email}</span> : null}
              </Td>
              <Td label={c.colSales} className="tabular-nums">
                {r.balance?.sales_count ?? 0} · {formatMoney(r.balance?.total_sales ?? 0, lang)}
              </Td>
              <Td label={c.colBalance}>
                {dbCents(r.balance?.balance) > 0 ? <Badge tone="warning">{formatMoney(r.balance?.balance, lang)}</Badge> : <span className="text-fg-muted">—</span>}
              </Td>
              <Td label={c.colSince} className="text-fg-muted whitespace-nowrap">{formatAdminDate(r.created_at, lang)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
