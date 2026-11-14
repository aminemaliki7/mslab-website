import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader, EmptyState, FilterBar, StatusBadge, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatDateTime, inquiryStatus } from "@/features/admin/labels";
import { safeSearchTerm } from "@/features/admin/search";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages" };

export default async function InquiriesAdminPage({ searchParams }: PageProps<"/admin/inquiries">) {
  await requireAdmin();
  const params = await searchParams;
  const db = await createSessionClient();

  if (typeof params.ref === "string" && /^MSC-\d{4}-\d{6}$/.test(params.ref)) {
    const { data } = await db.from("inquiries").select("id").eq("reference", params.ref).maybeSingle();
    if (data) redirect(`/admin/inquiries/${data.id}`);
  }

  const q = safeSearchTerm(params.q);
  const status = typeof params.status === "string" && params.status in inquiryStatus ? (params.status as keyof typeof inquiryStatus) : undefined;
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
      <AdminPageHeader title="Messages" description="Messages du formulaire de contact (100 plus récents, spam masqué par défaut)." />
      <FilterBar action="/admin/inquiries" q={q} status={status} statuses={inquiryStatus} placeholder="Référence, nom, e-mail, objet…" />
      {error ? <p className="text-danger text-sm">Impossible de charger les messages.</p> : null}
      {data && data.length > 0 ? (
        <Table head={["Message", "Expéditeur", "Statut", "Reçu le"]}>
          {data.map((m) => (
            <tr key={m.id} className={!m.read_at ? "bg-accent-soft/40" : undefined}>
              <Td>
                <Link href={`/admin/inquiries/${m.id}`} className={`hover:text-accent ${m.read_at ? "" : "font-semibold"}`}>
                  {m.subject}
                </Link>
                <p className="text-fg-muted font-[family-name:var(--font-geist-mono)] text-xs">{m.reference}</p>
              </Td>
              <Td>
                <p>{m.full_name}</p>
                <p className="text-fg-muted text-xs">{m.email}</p>
              </Td>
              <Td>
                <StatusBadge status={inquiryStatus[m.status]} />
              </Td>
              <Td className="text-fg-muted whitespace-nowrap">{formatDateTime(m.created_at)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState>Aucun message{q || status ? " ne correspond à ces filtres" : " pour le moment"}.</EmptyState>
      )}
    </>
  );
}
