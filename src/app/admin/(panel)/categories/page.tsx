import type { Metadata } from "next";
import Link from "next/link";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminPageHeader, EmptyState, Panel, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { requireAdmin } from "@/features/admin/auth";
import { categoryOptions } from "@/features/admin/queries";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Catégories" };

export default async function CategoriesAdminPage({ searchParams }: PageProps<"/admin/categories">) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const db = await createSessionClient();
  const [{ data: categories }, { data: products }, parents] = await Promise.all([
    db.from("categories").select("id, name_fr, name_ar, name_en, slug_fr, parent_id, is_published, sort_order").order("sort_order").order("name_fr"),
    db.from("products").select("category_id"),
    categoryOptions(),
  ]);
  const counts = new Map<string, number>();
  for (const p of products ?? []) if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  const label = new Map(parents.map((p) => [p.id, p.label]));

  return (
    <>
      <AdminPageHeader title="Catégories" description="Organisation du catalogue (deux niveaux recommandés)." />
      {deleted ? <p className="text-success mb-4 text-sm">Catégorie supprimée.</p> : null}

      {categories && categories.length > 0 ? (
        <Table head={["Catégorie", "Traductions", "Produits", "Visible", "Ordre"]}>
          {categories.map((c) => (
            <tr key={c.id}>
              <Td>
                <Link href={`/admin/categories/${c.id}`} className="hover:text-accent font-medium">
                  {label.get(c.id) ?? c.name_fr}
                </Link>
                <p className="text-fg-muted text-xs">/{c.slug_fr}</p>
              </Td>
              <Td>
                <div className="flex gap-1">
                  <Badge tone="success">FR</Badge>
                  <Badge tone={c.name_ar ? "success" : "warning"}>AR</Badge>
                  <Badge tone={c.name_en ? "success" : "warning"}>EN</Badge>
                </div>
              </Td>
              <Td>{counts.get(c.id) ?? 0}</Td>
              <Td>{c.is_published ? "Oui" : "Non"}</Td>
              <Td>{c.sort_order}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState>Aucune catégorie. Créez la première ci-dessous.</EmptyState>
      )}

      <Panel title="Nouvelle catégorie" className="mt-8">
        <CategoryForm category={null} parents={parents.filter((p) => !p.parentId)} />
      </Panel>
    </>
  );
}
