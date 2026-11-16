import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { PortfolioForm } from "@/components/admin/pod-forms";
import { AdminPageHeader, Notice, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { deletePortfolioItem } from "@/features/admin/pod-actions";
import { format } from "@/i18n/format";
import { createSessionClient } from "@/lib/supabase/server";
import { catalogImageUrl } from "@/lib/supabase/storage";

export const generateMetadata = adminTitle((t) => t.pod.work.pageTitle);

/** Create ("new") or edit a portfolio item. */
export default async function PortfolioItemPage({ params, searchParams }: PageProps<"/admin/print-on-demand/portfolio/[id]">) {
  await requireAdmin();
  const { t } = await getAdminT();
  const w = t.pod.work;
  const { id } = await params;
  const { created } = await searchParams;
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const item = isNew ? null : (await (await createSessionClient()).from("portfolio_items").select("*").eq("id", id).maybeSingle()).data;
  if (!isNew && !item) notFound();

  return (
    <>
      <AdminPageHeader title={item ? item.title_fr : w.newTitle} description={t.pod.galleryHint} back={{ href: "/admin/print-on-demand", label: t.pod.title }} />
      {created ? <Notice>{w.created}</Notice> : null}
      <div className="space-y-6">
        <PortfolioForm item={item} imageUrl={item?.image_path ? catalogImageUrl(item.image_path) : null} />
        {item ? (
          <Panel title={t.common.dangerZone}>
            <p className="text-fg-muted mb-4 text-sm">{w.dangerText}</p>
            <ActionButton action={deletePortfolioItem} label={w.deleteButton} variant="secondary" confirm={format(w.deleteConfirm, { name: item.title_fr })} hidden={{ id: item.id }} />
          </Panel>
        ) : null}
      </div>
    </>
  );
}
