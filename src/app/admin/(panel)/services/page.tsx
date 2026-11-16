import Link from "next/link";
import { ActionButton } from "@/components/admin/admin-form";
import { AdminPageHeader, EmptyState, Notice, StatusBadge, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/features/admin/auth";
import { setServiceStatus } from "@/features/admin/content-actions";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { contentStatuses } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.services.title);

export default async function ServicesAdminPage({ searchParams }: PageProps<"/admin/services">) {
  await requireAdmin();
  const { lang, t } = await getAdminT();
  const s = t.services;
  const statuses = contentStatuses(t);
  const { deleted } = await searchParams;
  const { data: services } = await (await createSessionClient())
    .from("services")
    .select("id, name_fr, slug_fr, status, is_featured, sort_order, updated_at")
    .order("sort_order")
    .order("name_fr");

  return (
    <>
      <AdminPageHeader title={s.title} description={s.description} actions={<ButtonLink href="/admin/services/new">+ {s.add}</ButtonLink>} />
      {deleted ? <Notice>{s.deleted}</Notice> : null}
      {services && services.length > 0 ? (
        <Table head={[s.colService, t.common.status, t.common.featured, t.common.modified, t.common.actions]}>
          {services.map((service) => (
            <tr key={service.id}>
              <Td>
                <Link href={`/admin/services/${service.id}`} className="hover:text-accent text-base font-semibold underline-offset-4 hover:underline md:text-sm">
                  {service.name_fr}
                </Link>
              </Td>
              <Td label={t.common.status}>
                <StatusBadge status={statuses[service.status]} />
              </Td>
              <Td label={t.common.featured}>{service.is_featured ? "★" : "—"}</Td>
              <Td label={t.common.modified} className="text-fg-muted whitespace-nowrap">
                {formatAdminDateTime(service.updated_at, lang)}
              </Td>
              <Td>
                <ActionButton
                  action={setServiceStatus}
                  label={service.status === "published" ? t.common.unpublish : t.common.publish}
                  hidden={{ id: service.id, status: service.status === "published" ? "draft" : "published" }}
                />
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState action={<ButtonLink href="/admin/services/new">+ {s.add}</ButtonLink>}>{s.empty}</EmptyState>
      )}
    </>
  );
}
