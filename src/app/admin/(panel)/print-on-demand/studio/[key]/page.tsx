import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { StudioOptionForm, StudioProductForm, StudioViewForm, type StudioViewRow } from "@/components/admin/studio-forms";
import { AdminPageHeader, Notice, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { deleteStudioOption, deleteStudioView, toggleStudioOption } from "@/features/admin/studio-actions";
import { OPTION_KINDS, isStudioProduct, type ViewKey } from "@/features/print-on-demand/studio";
import { format } from "@/i18n/format";
import { createSessionClient } from "@/lib/supabase/server";
import { catalogImageUrl } from "@/lib/supabase/storage";

export const generateMetadata = adminTitle((t) => t.pod.studio.title);

type OptionRow = { id: string; kind: string; name_fr: string; name_ar: string | null; name_en: string | null; hex: string | null; is_active: boolean };

/** Studio configuration of one product: resolution check, printable sides, verified options. */
export default async function StudioProductAdminPage({ params }: PageProps<"/admin/print-on-demand/studio/[key]">) {
  await requireAdmin();
  const { key } = await params;
  if (!isStudioProduct(key)) notFound();
  const { t } = await getAdminT();
  const s = t.pod.studio;
  const productName = t.pod.mockups[key];

  const db = await createSessionClient();
  const [product, views, options] = await Promise.all([
    db.from("studio_products").select("key, min_dpi").eq("key", key).maybeSingle(),
    db.from("studio_views").select("*").eq("product_key", key).order("sort_order"),
    db.from("studio_options").select("*").eq("product_key", key).order("sort_order").order("name_fr"),
  ]);

  const header = (
    <AdminPageHeader
      title={format(s.pageTitle, { product: productName })}
      description={s.pageHint}
      actions={
        <Link href="/admin/print-on-demand" className="text-accent inline-flex min-h-11 items-center text-sm font-medium">
          ← {s.back}
        </Link>
      }
    />
  );
  if (product.error || views.error || options.error || !product.data) {
    return (
      <>
        {header}
        <Notice tone="warning">{s.unavailable}</Notice>
      </>
    );
  }

  const viewRows = (views.data ?? []) as Array<StudioViewRow & { image_path: string }>;
  const optionRows = (options.data ?? []) as OptionRow[];
  const taken = viewRows.map((v) => v.view as ViewKey);

  return (
    <>
      {header}
      <div className="space-y-6">
        <Panel title={s.settings}>
          <StudioProductForm productKey={key} minDpi={(product.data as { min_dpi: number | null }).min_dpi} />
        </Panel>

        <Panel title={s.views} description={s.viewsHint}>
          {viewRows.length === 0 ? <p className="text-fg-muted mb-6 text-sm">{s.noViews}</p> : null}
          <div className="space-y-8">
            {viewRows.map((view) => (
              <section key={view.id} className="border-line border-b pb-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className={view.is_active ? "text-fg font-semibold" : "text-fg-subtle font-semibold line-through"}>{s.viewNames[view.view]}</h3>
                  <ActionButton action={deleteStudioView} label={s.deleteView} confirm={format(s.deleteViewConfirm, { name: s.viewNames[view.view] })} hidden={{ id: view.id }} />
                </div>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
                  {/* Photo with the printable area outlined, as the Studio will use it. */}
                  <svg viewBox={`0 0 ${view.image_width} ${view.image_height}`} className="bg-surface border-line w-full rounded-[var(--radius-control)] border" role="img" aria-label={s.area}>
                    <image href={catalogImageUrl(view.image_path)} width={view.image_width} height={view.image_height} />
                    <rect x={view.area_x} y={view.area_y} width={view.area_w} height={view.area_h} fill="#0B6E8A" fillOpacity="0.12" stroke="#0B6E8A" strokeWidth={Math.max(2, view.image_width / 300)} strokeDasharray="12 8" />
                  </svg>
                  <StudioViewForm productKey={key} view={view} taken={taken} />
                </div>
              </section>
            ))}
          </div>
          {taken.length < 5 ? (
            <details className="mt-6" open={viewRows.length === 0}>
              <summary className="text-fg flex min-h-11 cursor-pointer items-center font-semibold">+ {s.addView}</summary>
              <div className="mt-4">
                <StudioViewForm productKey={key} view={null} taken={taken} />
              </div>
            </details>
          ) : null}
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          {OPTION_KINDS.map((kind) => {
            const list = optionRows.filter((o) => o.kind === kind);
            return (
              <Panel key={kind} title={s.options[kind]} description={s.optionsHint}>
                {list.length > 0 ? (
                  <ul className="divide-line mb-6 divide-y text-sm">
                    {list.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span className="flex items-center gap-2">
                          {o.hex ? <span aria-hidden="true" className="border-line-strong size-5 shrink-0 rounded-full border" style={{ backgroundColor: o.hex }} /> : null}
                          <span>
                            <span className={o.is_active ? "font-medium" : "text-fg-subtle line-through"}>{o.name_fr}</span>
                            <span dir="auto" className="text-fg-muted block text-xs">
                              {[o.name_ar, o.name_en, o.hex].filter(Boolean).join(" · ") || t.pod.missingTranslations}
                            </span>
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <ActionButton action={toggleStudioOption} label={o.is_active ? t.common.hide : t.common.show} hidden={{ id: o.id, is_active: String(!o.is_active) }} />
                          <ActionButton action={deleteStudioOption} label={t.common.delete} confirm={format(s.deleteOptionConfirm, { name: o.name_fr })} hidden={{ id: o.id }} />
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-fg-muted mb-6 text-sm">{s.noOptions}</p>
                )}
                <StudioOptionForm productKey={key} kind={kind} />
              </Panel>
            );
          })}
        </div>
      </div>
    </>
  );
}
