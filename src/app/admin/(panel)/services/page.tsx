import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/admin/admin-form";
import { AdminPageHeader, EmptyState, StatusBadge, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/features/admin/auth";
import { setServiceStatus } from "@/features/admin/content-actions";
import { contentStatus, formatDateTime } from "@/features/admin/labels";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesAdminPage({ searchParams }: PageProps<"/admin/services">) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const { data: services } = await (await createSessionClient())
    .from("services")
    .select("id, name_fr, slug_fr, status, is_featured, sort_order, updated_at")
    .order("sort_order")
    .order("name_fr");

  return (
    <>
      <AdminPageHeader
        title="Services"
        description="Services présentés sur le site (impression, services aux entreprises…)."
        actions={<ButtonLink href="/admin/services/new">+ Nouveau service</ButtonLink>}
      />
      {deleted ? <p className="text-success mb-4 text-sm">Service supprimé.</p> : null}
      {services && services.length > 0 ? (
        <Table head={["Service", "Statut", "À la une", "Ordre", "Modifié", "Actions"]}>
          {services.map((s) => (
            <tr key={s.id}>
              <Td>
                <Link href={`/admin/services/${s.id}`} className="hover:text-accent font-medium">
                  {s.name_fr}
                </Link>
              </Td>
              <Td>
                <StatusBadge status={contentStatus[s.status]} />
              </Td>
              <Td>{s.is_featured ? "★" : "—"}</Td>
              <Td>{s.sort_order}</Td>
              <Td className="text-fg-muted whitespace-nowrap">{formatDateTime(s.updated_at)}</Td>
              <Td>
                <ActionButton
                  action={setServiceStatus}
                  label={s.status === "published" ? "Dépublier" : "Publier"}
                  hidden={{ id: s.id, status: s.status === "published" ? "draft" : "published" }}
                />
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState>Aucun service pour le moment.</EmptyState>
      )}
    </>
  );
}
