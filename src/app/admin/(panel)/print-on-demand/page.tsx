import Link from "next/link";
import { ActionButton } from "@/components/admin/admin-form";
import { PresetOptionsForm, ProductionOptionForm } from "@/components/admin/pod-forms";
import { AdminPageHeader, EmptyState, Panel, StatusBadge, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/features/admin/auth";
import type { AdminDict } from "@/features/admin/dictionary";
import { contentStatuses } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { deleteProductionOption, toggleMockupProduct, toggleProductionOption } from "@/features/admin/pod-actions";
import { isMockupKey } from "@/features/print-on-demand/mockup-keys";
import { STUDIO_PRODUCTS } from "@/features/print-on-demand/studio";
import { format } from "@/i18n/format";
import { localizedPath } from "@/i18n/routes";
import type { Tables } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/server";
import { catalogImageUrl } from "@/lib/supabase/storage";

export const generateMetadata = adminTitle((t) => t.pod.title);

export default async function PrintOnDemandAdminPage() {
  await requireAdmin();
  const { t } = await getAdminT();
  const p = t.pod;
  const db = await createSessionClient();
  const [{ data: options }, { data: portfolio }, { data: mockups }] = await Promise.all([
    db.from("production_options").select("*").order("kind").order("sort_order").order("name_fr"),
    db.from("portfolio_items").select("*").order("sort_order").order("created_at", { ascending: false }),
    db.from("mockup_products").select("*").order("sort_order"),
  ]);
  const [studioViews, studioOptions] = await Promise.all([
    db.from("studio_views").select("product_key, is_active"),
    db.from("studio_options").select("product_key, is_active"),
  ]);
  const studioReady = !studioViews.error && !studioOptions.error;
  const countFor = (rows: unknown, key: string) => ((rows ?? []) as Array<{ product_key: string; is_active: boolean }>).filter((r) => r.product_key === key && r.is_active).length;
  const materials = (options ?? []).filter((o) => o.kind === "material");
  const finishings = (options ?? []).filter((o) => o.kind === "finishing");
  const statuses = contentStatuses(t);

  return (
    <>
      <AdminPageHeader
        title={p.title}
        description={p.description}
        actions={
          <Link href={localizedPath("fr", { route: "service", slug: "impression-a-la-demande" })} target="_blank" className="text-accent inline-flex min-h-11 items-center text-sm font-medium">
            {p.viewPage} ↗
          </Link>
        }
      />
      <div className="space-y-6">
        <Panel
          title={format(p.galleryTitle, { count: portfolio?.length ?? 0 })}
          description={p.galleryHint}
          actions={<ButtonLink href="/admin/print-on-demand/portfolio/new" size="sm">+ {p.addWork}</ButtonLink>}
        >
          {portfolio && portfolio.length > 0 ? (
            <Table head={[p.colPhoto, p.colTitle, t.common.status]}>
              {portfolio.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <div className="bg-surface size-14 overflow-hidden rounded">
                      {item.image_path ? (
                        // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                        <img src={catalogImageUrl(item.image_path)} alt="" className="size-full object-cover" />
                      ) : null}
                    </div>
                  </Td>
                  <Td label={p.colTitle}>
                    <Link href={`/admin/print-on-demand/portfolio/${item.id}`} className="hover:text-accent font-semibold">
                      {item.title_fr}
                    </Link>
                  </Td>
                  <Td label={t.common.status}>
                    <StatusBadge status={statuses[item.status]} />
                  </Td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState>{p.noWorks}</EmptyState>
          )}
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <OptionsPanel t={t} title={format(p.materials, { count: materials.length })} description={p.materialsHint} kind="material" options={materials} empty={p.noMaterials} />
          <OptionsPanel t={t} title={format(p.finishings, { count: finishings.length })} description={p.finishingsHint} kind="finishing" options={finishings} empty={p.noFinishings} />
        </div>

        <Panel title={p.studio.title} description={p.studio.hint}>
          {studioReady ? (
            <ul className="divide-line divide-y text-sm">
              {STUDIO_PRODUCTS.map((key) => {
                const views = countFor(studioViews.data, key);
                return (
                  <li key={key} className="flex min-h-12 flex-wrap items-center justify-between gap-3 py-2">
                    <span>
                      <span className="font-medium">{p.mockups[key]}</span>
                      <span className="text-fg-muted block text-xs">
                        {views > 0 ? p.studio.configured : p.studio.placeholder} · {format(p.studio.counts, { views, options: countFor(studioOptions.data, key) })}
                      </span>
                    </span>
                    <Link href={`/admin/print-on-demand/studio/${key}`} className="text-accent inline-flex min-h-11 items-center font-medium">
                      {p.studio.configure} →
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-warning text-sm">{p.studio.unavailable}</p>
          )}
        </Panel>

        <Panel title={p.mockupsTitle} description={p.mockupsHint}>
          <ul className="divide-line divide-y text-sm">
            {(mockups ?? []).map((m) => (
              <li key={m.key} className="flex min-h-12 items-center justify-between gap-3 py-2">
                <span className={m.is_active ? "font-medium" : "text-fg-subtle line-through"}>{isMockupKey(m.key) ? p.mockups[m.key] : m.key}</span>
                <ActionButton action={toggleMockupProduct} label={m.is_active ? t.common.hide : t.common.show} hidden={{ key: m.key, is_active: String(!m.is_active) }} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

function OptionsPanel({
  t,
  title,
  description,
  kind,
  options,
  empty,
}: {
  t: AdminDict;
  title: string;
  description: string;
  kind: "material" | "finishing";
  options: Tables<"production_options">[];
  empty: string;
}) {
  return (
    <Panel title={title} description={description}>
      {options.length > 0 ? (
        <ul className="divide-line mb-6 divide-y text-sm">
          {options.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className={o.is_active ? "font-medium" : "text-fg-subtle line-through"}>{o.name_fr}</span>
                <span dir="auto" className="text-fg-muted block text-xs">
                  {[o.name_ar, o.name_en].filter(Boolean).join(" · ") || t.pod.missingTranslations}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <ActionButton action={toggleProductionOption} label={o.is_active ? t.common.hide : t.common.show} hidden={{ id: o.id, is_active: String(!o.is_active) }} />
                <ActionButton action={deleteProductionOption} label={t.common.delete} confirm={format(t.pod.deleteOptionConfirm, { name: o.name_fr })} hidden={{ id: o.id }} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-fg-muted mb-6 text-sm">{empty}</p>
      )}
      <PresetOptionsForm kind={kind} existing={options.map((o) => o.name_fr)} />
      <details className="border-line mt-6 border-t pt-4">
        <summary className="text-fg flex min-h-11 cursor-pointer items-center font-semibold">{t.pod.otherTitle}</summary>
        <div className="mt-3">
          <ProductionOptionForm kind={kind} />
        </div>
      </details>
    </Panel>
  );
}
