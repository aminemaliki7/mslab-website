import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { ServiceForm } from "@/components/admin/service-form";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { deleteService } from "@/features/admin/content-actions";
import { contentStatus } from "@/features/admin/labels";
import { localizedPath } from "@/i18n/routes";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Modifier le service" };

export default async function EditServicePage({ params, searchParams }: PageProps<"/admin/services/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: service } = await (await createSessionClient()).from("services").select("*").eq("id", id).maybeSingle();
  if (!service) notFound();

  return (
    <>
      <AdminPageHeader
        title={service.name_fr}
        back={{ href: "/admin/services", label: "Services" }}
        actions={
          <>
            <StatusBadge status={contentStatus[service.status]} />
            {service.status === "published" ? (
              <Link href={localizedPath("fr", { route: "service", slug: service.slug_fr })} target="_blank" className="text-accent text-sm">
                Voir sur le site ↗
              </Link>
            ) : null}
          </>
        }
      />
      {created ? <p className="text-success mb-4 text-sm">Service créé.</p> : null}
      <div className="space-y-6">
        <ServiceForm service={service} />
        <Panel title="Zone de danger">
          <p className="text-fg-muted mb-4 text-sm">La suppression est définitive. Pour le retirer du site, préférez « Archivé ».</p>
          <ActionButton action={deleteService} label="Supprimer le service" variant="secondary" confirm={`Supprimer « ${service.name_fr} » ?`} hidden={{ id: service.id }} />
        </Panel>
      </div>
    </>
  );
}
