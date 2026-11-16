import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader, EmptyState, FilterBar, Notice, StatusBadge, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { quotationStatuses } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { safeSearchTerm } from "@/features/admin/search";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.quotations.title);

export default async function QuotationsAdminPage({ searchParams }: PageProps<"/admin/quotations">) {
  await requireAdmin();
  const { lang, t } = await getAdminT();
  const tq = t.quotations;
  const statuses = quotationStatuses(t);
  const params = await searchParams;
  const db = await createSessionClient();

  // Links from notification emails: /admin/quotations?ref=MSQ-…
  if (typeof params.ref === "string" && /^MSQ-\d{4}-\d{6}$/.test(params.ref)) {
    const { data } = await db.from("quotation_requests").select("id").eq("reference", params.ref).maybeSingle();
    if (data) redirect(`/admin/quotations/${data.id}`);
  }

  const q = safeSearchTerm(params.q);
  const status = typeof params.status === "string" && params.status in statuses ? (params.status as keyof typeof statuses) : undefined;

  let query = db
    .from("quotation_requests")
    .select("id, reference, kind, full_name, company_name, email, status, created_at, notification_error, quotation_items(count)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`reference.ilike.%${q}%,full_name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, error } = await query;

  return (
    <>
      <AdminPageHeader title={tq.title} description={tq.description} />
      <FilterBar
        action="/admin/quotations"
        q={q}
        status={status}
        statuses={statuses}
        labels={{ search: t.common.search, placeholder: tq.searchPlaceholder, status: t.common.status, allStatuses: t.common.allStatuses, submit: t.common.filter }}
      />
      {error ? <Notice tone="danger">{t.common.loadError}</Notice> : null}
      {data && data.length > 0 ? (
        <Table head={[tq.colCustomer, tq.colReference, tq.colItems, t.common.status, tq.colReceived]}>
          {data.map((r) => (
            <tr key={r.id} className={r.status === "new" ? "md:bg-accent-soft/40 max-md:!border-accent" : undefined}>
              <Td>
                <Link href={`/admin/quotations/${r.id}`} className="hover:text-accent text-base font-semibold underline-offset-4 hover:underline md:text-sm">
                  {r.full_name}
                </Link>
                <p className="text-fg-muted text-xs">{r.company_name ?? r.email}</p>
              </Td>
              <Td label={tq.colReference}>
                <span className="font-[family-name:var(--font-geist-mono)]" dir="ltr">
                  {r.reference}
                </span>
                {r.kind === "custom" ? <p className="text-accent text-xs font-semibold">{tq.custom}</p> : null}
                {r.notification_error ? <p className="text-warning text-xs">{tq.emailNotSent}</p> : null}
              </Td>
              <Td label={tq.colItems}>{(r.quotation_items as unknown as Array<{ count: number }>)[0]?.count ?? 0}</Td>
              <Td label={t.common.status}>
                <StatusBadge status={statuses[r.status]} />
              </Td>
              <Td label={tq.colReceived} className="text-fg-muted whitespace-nowrap">
                {formatAdminDateTime(r.created_at, lang)}
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState>{q || status ? t.common.noMatch : tq.empty}</EmptyState>
      )}
    </>
  );
}
