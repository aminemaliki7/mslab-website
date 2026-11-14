import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { ImageUploadForm } from "@/components/admin/image-upload-form";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { deleteProduct, deleteProductImage, setPrimaryImage } from "@/features/admin/content-actions";
import { contentStatus } from "@/features/admin/labels";
import { categoryOptions } from "@/features/admin/queries";
import { localizedPath } from "@/i18n/routes";
import { createSessionClient } from "@/lib/supabase/server";
import { catalogImageUrl } from "@/lib/supabase/storage";

export const metadata: Metadata = { title: "Modifier le produit" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = await createSessionClient();
  const [{ data: product }, { data: images }, categories, { count: quoteCount }] = await Promise.all([
    db.from("products").select("*").eq("id", id).maybeSingle(),
    db.from("product_images").select("*").eq("product_id", id).order("is_primary", { ascending: false }).order("sort_order"),
    categoryOptions(),
    db.from("quotation_items").select("id", { count: "exact", head: true }).eq("product_id", id),
  ]);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader
        title={product.name_fr}
        back={{ href: "/admin/products", label: "Produits" }}
        actions={
          <>
            <StatusBadge status={contentStatus[product.status]} />
            {product.status === "published" ? (
              <Link href={localizedPath("fr", { route: "product", slug: product.slug_fr })} target="_blank" className="text-accent text-sm">
                Voir sur le site ↗
              </Link>
            ) : null}
          </>
        }
      />
      {created ? <p className="text-success mb-4 text-sm">Produit créé. Ajoutez maintenant ses images.</p> : null}

      <div className="space-y-6">
        <ProductForm product={product} categories={categories} />

        <Panel title={`Images (${images?.length ?? 0})`}>
          {images && images.length > 0 ? (
            <ul className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {images.map((image) => (
                <li key={image.id} className="border-line rounded-[var(--radius-control)] border p-2">
                  <div className="bg-surface relative aspect-square">
                    <Image src={catalogImageUrl(image.storage_path)} alt={image.alt_fr ?? ""} fill sizes="200px" className="object-contain" />
                  </div>
                  <p className="text-fg-muted mt-2 line-clamp-2 text-xs">{image.alt_fr || "Sans texte alternatif"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {image.is_primary ? (
                      <span className="text-success text-xs font-semibold">Image principale</span>
                    ) : (
                      <ActionButton action={setPrimaryImage} label="Définir principale" hidden={{ id: image.id, productId: product.id }} />
                    )}
                    <ActionButton action={deleteProductImage} label="Supprimer" confirm="Supprimer définitivement cette image ?" hidden={{ id: image.id }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-fg-muted mb-6 text-sm">Aucune image. Le site affiche « Image non disponible ».</p>
          )}
          <ImageUploadForm productId={product.id} />
        </Panel>

        <Panel title="Zone de danger">
          <p className="text-fg-muted mb-4 text-sm">
            La suppression est définitive (images comprises).{" "}
            {quoteCount ? `Ce produit figure dans ${quoteCount} demande(s) de devis : leur historique (nom, référence, quantité) est conservé. ` : ""}
            Pour simplement le retirer du site, préférez le statut « Archivé ».
          </p>
          <ActionButton
            action={deleteProduct}
            label="Supprimer le produit"
            variant="secondary"
            confirm={`Supprimer définitivement « ${product.name_fr} » ?`}
            hidden={{ id: product.id }}
          />
        </Panel>
      </div>
    </>
  );
}
