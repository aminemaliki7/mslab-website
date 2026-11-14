import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader, EmptyState, FilterBar, StatusBadge, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatDateTime, quotationStatus } from "@/features/admin/labels";
import { safeSearchTerm } from "@/features/admin/search";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Demandes de devis" };

export default async function QuotationsAdminPage({ searchParams }: PageProps<"/admin/quotations">) {
  await requireAdmin();
  const params = await searchParams;
  const db = await createSessionClient();

  // Links from notification emails: /admin/quotations?ref=MSQ-…
  if (typeof params.ref === "string" && /^MSQ-\d{4}-\d{6}$/.test(params.ref)) {
    const { data } = await db.from("quotation_requests").select("id").eq("reference", params.ref).maybeSingle();
    if (data) redirect(`/admin/quotations/${data.id}`);
  }

  const q = safeSearchTerm(params.q);
  const status = typeof params.status === "string" && params.status in quotationStatus ? (params.status as keyof typeof quotationStatus) : undefined;

  let query = db
    .from("quotation_requests")
    .select("id, reference, full_name, company_name, email, status, created_at, notification_error, quotation_items(count)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`reference.ilike.%${q}%,full_name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, error } = await query;

  return (
    <>
      <AdminPageHeader title="Demandes de devis" description="Demandes reçues depuis le site (100 plus récentes)." />
      <FilterBar action="/admin/quotations" q={q} status={status} statuses={quotationStatus} placeholder="Référence, nom, entreprise, e-mail…" />
      {error ? <p className="text-danger text-sm">Impossible de charger les demandes.</p> : null}
      {data && data.length > 0 ? (
        <Table head={["Référence", "Client", "Articles", "Statut", "Reçue le"]}>
          {data.map((r) => (
            <tr key={r.id} className={r.status === "new" ? "bg-accent-soft/40" : undefined}>
              <Td>
                <Link href={`/admin/quotations/${r.id}`} className="hover:text-accent font-[family-name:var(--font-geist-mono)] font-medium">
                  {r.reference}
                </Link>
                {r.notification_error ? <p className="text-warning text-xs">E-mail non envoyé</p> : null}
              </Td>
              <Td>
                <p className="font-medium">{r.full_name}</p>
                <p className="text-fg-muted text-xs">{r.company_name ?? r.email}</p>
              </Td>
              <Td>{(r.quotation_items as unknown as Array<{ count: number }>)[0]?.count ?? 0}</Td>
              <Td>
                <StatusBadge status={quotationStatus[r.status]} />
              </Td>
              <Td className="text-fg-muted whitespace-nowrap">{formatDateTime(r.created_at)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState>Aucune demande{q || status ? " ne correspond à ces filtres" : " pour le moment"}.</EmptyState>
      )}
    </>
  );
}
