import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { PortfolioForm } from "@/components/admin/pod-forms";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { deletePortfolioItem } from "@/features/admin/pod-actions";
import { createSessionClient } from "@/lib/supabase/server";
import { catalogImageUrl } from "@/lib/supabase/storage";

export const metadata: Metadata = { title: "Réalisation" };

/** Create ("new") or edit a portfolio item. */
export default async function PortfolioItemPage({ params, searchParams }: PageProps<"/admin/print-on-demand/portfolio/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const item = isNew ? null : (await (await createSessionClient()).from("portfolio_items").select("*").eq("id", id).maybeSingle()).data;
  if (!isNew && !item) notFound();

  return (
    <>
      <AdminPageHeader title={item ? item.title_fr : "Nouvelle réalisation"} back={{ href: "/admin/print-on-demand", label: "Impression à la demande" }} />
      {created ? <p className="text-success mb-4 text-sm">Réalisation créée.</p> : null}
      <div className="space-y-6">
        <PortfolioForm item={item} imageUrl={item?.image_path ? catalogImageUrl(item.image_path) : null} />
        {item ? (
          <Panel title="Zone de danger">
            <p className="text-fg-muted mb-4 text-sm">La suppression retire aussi la photo. Pour la masquer seulement, choisissez « Archivé ».</p>
            <ActionButton
              action={deletePortfolioItem}
              label="Supprimer la réalisation"
              variant="secondary"
              confirm={`Supprimer « ${item.title_fr} » ?`}
              hidden={{ id: item.id }}
            />
          </Panel>
        ) : null}
      </div>
    </>
  );
}
