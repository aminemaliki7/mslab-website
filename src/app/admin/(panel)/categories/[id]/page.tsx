import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { deleteCategory } from "@/features/admin/content-actions";
import { contentStatus } from "@/features/admin/labels";
import { categoryOptions } from "@/features/admin/queries";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Modifier la catégorie" };

export default async function EditCategoryPage({ params, searchParams }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
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

  return (
    <>
      <AdminPageHeader title={category.name_fr} back={{ href: "/admin/categories", label: "Catégories" }} />
      {created ? <p className="text-success mb-4 text-sm">Catégorie créée.</p> : null}
      <div className="space-y-6">
        <Panel title="Informations">
          {/* A category with sub-categories stays top-level (two levels maximum). */}
          <CategoryForm category={category} parents={children ? [] : parents.filter((p) => !p.parentId)} />
        </Panel>

        <Panel title={`Produits de cette catégorie (${products?.length ?? 0})`}>
          {products && products.length > 0 ? (
            <ul className="divide-line divide-y">
              {products.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="hover:text-accent">
                    {p.name_fr}
                  </Link>
                  <StatusBadge status={contentStatus[p.status]} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-fg-muted text-sm">Aucun produit. Assignez des produits depuis leur fiche (champ « Catégorie »).</p>
          )}
        </Panel>

        <Panel title="Zone de danger">
          <p className="text-fg-muted mb-4 text-sm">
            {children
              ? "Cette catégorie contient des sous-catégories : supprimez-les ou déplacez-les d'abord."
              : `La suppression est définitive. ${products?.length ? `Ses ${products.length} produit(s) resteront dans le catalogue, sans catégorie.` : ""}`}
          </p>
          {!children ? (
            <ActionButton action={deleteCategory} label="Supprimer la catégorie" variant="secondary" confirm={`Supprimer « ${category.name_fr} » ?`} hidden={{ id: category.id }} />
          ) : null}
        </Panel>
      </div>
    </>
  );
}
