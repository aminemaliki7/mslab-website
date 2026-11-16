import Link from "next/link";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminPageHeader, EmptyState, Notice, Panel, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { requireAdmin } from "@/features/admin/auth";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { categoryOptions } from "@/features/admin/queries";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.categories.title);

export default async function CategoriesAdminPage({ searchParams }: PageProps<"/admin/categories">) {
  await requireAdmin();
  const { t } = await getAdminT();
  const c = t.categories;
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
      <AdminPageHeader title={c.title} description={c.description} actions={<a href="#new" className="bg-primary text-on-primary inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-5 text-[0.9375rem] font-medium">+ {c.add}</a>} />
      {deleted ? <Notice>{c.deleted}</Notice> : null}

      {categories && categories.length > 0 ? (
        <Table head={[c.colCategory, c.colLanguages, c.colProducts, c.colVisible]}>
          {categories.map((category) => (
            <tr key={category.id}>
              <Td>
                <Link href={`/admin/categories/${category.id}`} className="hover:text-accent text-base font-semibold underline-offset-4 hover:underline md:text-sm">
                  {label.get(category.id) ?? category.name_fr}
                </Link>
              </Td>
              <Td label={c.colLanguages}>
                <div className="flex gap-1" dir="ltr">
                  <Badge tone="success">FR</Badge>
                  <Badge tone={category.name_ar ? "success" : "warning"}>AR</Badge>
                  <Badge tone={category.name_en ? "success" : "warning"}>EN</Badge>
                </div>
              </Td>
              <Td label={c.colProducts}>{counts.get(category.id) ?? 0}</Td>
              <Td label={c.colVisible}>{category.is_published ? t.common.yes : t.common.no}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState>{c.empty}</EmptyState>
      )}

      <div id="new" className="scroll-mt-24">
        <Panel title={c.add} className="mt-8">
          <CategoryForm category={null} parents={parents.filter((p) => !p.parentId)} />
        </Panel>
      </div>
    </>
  );
}
