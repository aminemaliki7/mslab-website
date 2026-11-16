import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { categoryOptions } from "@/features/admin/queries";

export const generateMetadata = adminTitle((t) => t.products.newTitle);

export default async function NewProductPage() {
  await requireAdmin();
  const [{ t }, categories] = await Promise.all([getAdminT(), categoryOptions()]);
  return (
    <>
      <AdminPageHeader title={t.products.newTitle} description={t.products.newDescription} back={{ href: "/admin/products", label: t.products.title }} />
      <ProductForm product={null} categories={categories} />
    </>
  );
}
