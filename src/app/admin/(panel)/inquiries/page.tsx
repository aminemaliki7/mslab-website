import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader, EmptyState, FilterBar, Notice, StatusBadge, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { inquiryStatuses } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { safeSearchTerm } from "@/features/admin/search";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.inquiries.title);

export default async function InquiriesAdminPage({ searchParams }: PageProps<"/admin/inquiries">) {
  await requireAdmin();
  const { lang, t } = await getAdminT();
  const ti = t.inquiries;
  const statuses = inquiryStatuses(t);
  const params = await searchParams;
  const db = await createSessionClient();

  if (typeof params.ref === "string" && /^MSC-\d{4}-\d{6}$/.test(params.ref)) {
    const { data } = await db.from("inquiries").select("id").eq("reference", params.ref).maybeSingle();
    if (data) redirect(`/admin/inquiries/${data.id}`);
  }

  const q = safeSearchTerm(params.q);
  const status = typeof params.status === "string" && params.status in statuses ? (params.status as keyof typeof statuses) : undefined;
  let query = db
    .from("inquiries")
    .select("id, reference, full_name, email, subject, status, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);
  else query = query.neq("status", "spam");
  if (q) query = query.or(`reference.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%,subject.ilike.%${q}%`);
  const { data, error } = await query;

  return (
    <>
      <AdminPageHeader title={ti.title} description={ti.description} />
      <FilterBar
        action="/admin/inquiries"
        q={q}
        status={status}
        statuses={statuses}
        labels={{ search: t.common.search, placeholder: ti.searchPlaceholder, status: t.common.status, allStatuses: t.common.allStatuses, submit: t.common.filter }}
      />
      {error ? <Notice tone="danger">{t.common.loadError}</Notice> : null}
      {data && data.length > 0 ? (
        <Table head={[ti.colMessage, ti.colSender, t.common.status, ti.colReceived]}>
          {data.map((m) => (
            <tr key={m.id} className={!m.read_at ? "md:bg-accent-soft/40 max-md:!border-accent" : undefined}>
              <Td>
                <Link href={`/admin/inquiries/${m.id}`} className={`hover:text-accent text-base underline-offset-4 hover:underline md:text-sm ${m.read_at ? "font-medium" : "font-semibold"}`}>
                  {m.subject}
                </Link>
                <p className="text-fg-muted font-[family-name:var(--font-geist-mono)] text-xs" dir="ltr">
                  {m.reference}
                </p>
              </Td>
              <Td label={ti.colSender}>
                <p>{m.full_name}</p>
                <p className="text-fg-muted text-xs">{m.email}</p>
              </Td>
              <Td label={t.common.status}>
                <StatusBadge status={statuses[m.status]} />
              </Td>
              <Td label={ti.colReceived} className="text-fg-muted whitespace-nowrap">
                {formatAdminDateTime(m.created_at, lang)}
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState>{q || status ? t.common.noMatch : ti.empty}</EmptyState>
      )}
    </>
  );
}
