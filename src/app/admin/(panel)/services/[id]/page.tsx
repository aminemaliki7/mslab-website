import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { ServiceForm } from "@/components/admin/service-form";
import { AdminPageHeader, Notice, Panel, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { deleteService } from "@/features/admin/content-actions";
import { contentStatuses } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { format } from "@/i18n/format";
import { localizedPath } from "@/i18n/routes";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.services.editTitle);

export default async function EditServicePage({ params, searchParams }: PageProps<"/admin/services/[id]">) {
  await requireAdmin();
  const { t } = await getAdminT();
  const s = t.services;
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: service } = await (await createSessionClient()).from("services").select("*").eq("id", id).maybeSingle();
  if (!service) notFound();

  return (
    <>
      <AdminPageHeader
        title={service.name_fr}
        back={{ href: "/admin/services", label: s.title }}
        actions={
          <>
            <StatusBadge status={contentStatuses(t)[service.status]} />
            {service.status === "published" ? (
              <Link href={localizedPath("fr", { route: "service", slug: service.slug_fr })} target="_blank" className="text-accent inline-flex min-h-11 items-center text-sm font-medium">
                {t.common.viewOnSite} ↗
              </Link>
            ) : null}
          </>
        }
      />
      {created ? <Notice>{s.created}</Notice> : null}
      <div className="space-y-6">
        <ServiceForm service={service} />
        <Panel title={t.common.dangerZone}>
          <p className="text-fg-muted mb-4 text-sm">{s.dangerText}</p>
          <ActionButton action={deleteService} label={s.deleteButton} variant="secondary" confirm={format(s.deleteConfirm, { name: service.name_fr })} hidden={{ id: service.id }} />
        </Panel>
      </div>
    </>
  );
}
