import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/business/forms";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { requirePermission } from "@/features/business/permissions";
import { listCategories } from "@/features/business/queries";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = businessTitle((b) => b.products.newTitle);

export default async function NewBusinessProductPage() {
  const { can } = await requirePermission("business.products.manage");
  const { b } = await getBusinessT();
  const db = await createSessionClient();
  const [{ data: categories }, { data: catalog }] = await Promise.all([
    listCategories("product"),
    db.from("products").select("id, name_fr").order("name_fr"),
  ]);
  return (
    <>
      <AdminPageHeader title={b.products.newTitle} description={b.products.newDescription} back={{ href: "/admin/business/products", label: b.products.title }} />
      <Panel className="max-w-3xl">
        <ProductForm
          values={{}}
          canStock={can("business.stock.manage")}
          categories={categories.filter((c) => c.is_active).map((c) => ({ value: c.id, label: c.name }))}
          catalog={(catalog ?? []).map((p) => ({ value: p.id, label: p.name_fr }))}
        />
      </Panel>
    </>
  );
}
