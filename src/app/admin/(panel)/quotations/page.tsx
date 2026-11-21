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
  // Request type: catalogue quote, print on demand (custom) or Digital Solutions (web project).
  const kinds = { catalog: tq.kindCatalog, custom: tq.custom, digital: tq.digital } as const;
  const kind = typeof params.kind === "string" && params.kind in kinds ? (params.kind as keyof typeof kinds) : undefined;
  const kindHref = (value?: keyof typeof kinds) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (status) search.set("status", status);
    if (value) search.set("kind", value);
    const qs = search.toString();
    return `/admin/quotations${qs ? `?${qs}` : ""}`;
  };

  let query = db
    .from("quotation_requests")
    .select("id, reference, kind, full_name, company_name, email, status, created_at, notification_error, quotation_items(count)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);
  if (kind) query = query.eq("kind", kind);
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
      <nav aria-label={tq.filterKind} className="-mt-2 mb-5 flex flex-wrap gap-2">
        {[{ key: undefined, label: tq.filterAllKinds }, ...(Object.keys(kinds) as Array<keyof typeof kinds>).map((key) => ({ key, label: kinds[key] }))].map((item) => (
          <Link
            key={item.key ?? "all"}
            href={kindHref(item.key)}
            aria-current={kind === item.key ? "page" : undefined}
            className="border-line hover:border-accent aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
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
                {r.kind === "digital" ? <p className="mt-0.5"><span className="bg-ink-900 rounded px-1.5 py-0.5 text-[11px] font-semibold text-white">{tq.digital}</span></p> : null}
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
        <EmptyState>{q || status || kind ? t.common.noMatch : tq.empty}</EmptyState>
      )}
    </>
  );
}
