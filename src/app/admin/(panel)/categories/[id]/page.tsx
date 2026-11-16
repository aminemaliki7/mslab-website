import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminPageHeader, Notice, Panel, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { deleteCategory } from "@/features/admin/content-actions";
import { contentStatuses } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { categoryOptions } from "@/features/admin/queries";
import { format } from "@/i18n/format";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.categories.editTitle);

export default async function EditCategoryPage({ params, searchParams }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  const { t } = await getAdminT();
  const c = t.categories;
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = await createSessionClient();
  const [{ data: category }, { data: products }, { count: children }, parents] = await Promise.all([
    db.from("categories").select("*").eq("id", id).maybeSingle(),
    db.from("products").select("id, name_fr, status").eq("category_id", id).order("name_fr"),
    db.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id),
    categoryOptions(id),
  ]);
  if (!category) notFound();
  const statuses = contentStatuses(t);

  return (
    <>
      <AdminPageHeader title={category.name_fr} back={{ href: "/admin/categories", label: c.title }} />
      {created ? <Notice>{c.created}</Notice> : null}
      <div className="space-y-6">
        <Panel title={c.infoPanel}>
          {/* A category with sub-categories stays top-level (two levels maximum). */}
          <CategoryForm category={category} parents={children ? [] : parents.filter((p) => !p.parentId)} />
        </Panel>

        <Panel title={format(c.productsPanel, { count: products?.length ?? 0 })}>
          {products && products.length > 0 ? (
            <ul className="divide-line divide-y">
              {products.map((p) => (
                <li key={p.id} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="hover:text-accent font-medium">
                    {p.name_fr}
                  </Link>
                  <StatusBadge status={statuses[p.status]} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-fg-muted text-sm">{c.noProducts}</p>
          )}
        </Panel>

        <Panel title={t.common.dangerZone}>
          <p className="text-fg-muted mb-4 text-sm">
            {children ? c.hasChildren : `${c.dangerText} ${products?.length ? format(c.productsKept, { count: products.length }) : ""}`}
          </p>
          {!children ? (
            <ActionButton action={deleteCategory} label={c.deleteButton} variant="secondary" confirm={format(c.deleteConfirm, { name: category.name_fr })} hidden={{ id: category.id }} />
          ) : null}
        </Panel>
      </div>
    </>
  );
}
