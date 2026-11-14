import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { categoryOptions } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await categoryOptions();
  return (
    <>
      <AdminPageHeader
        title="Nouveau produit"
        description="Les images s'ajoutent après la création. Un nouveau produit est en brouillon par défaut."
        back={{ href: "/admin/products", label: "Produits" }}
      />
      <ProductForm product={null} categories={categories} />
    </>
  );
}
