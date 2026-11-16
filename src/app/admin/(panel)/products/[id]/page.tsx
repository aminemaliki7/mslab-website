import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { ImageUploadForm } from "@/components/admin/image-upload-form";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader, Notice, Panel, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { deleteProduct, deleteProductImage, setPrimaryImage } from "@/features/admin/content-actions";
import { contentStatuses } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { categoryOptions } from "@/features/admin/queries";
import { format } from "@/i18n/format";
import { localizedPath } from "@/i18n/routes";
import { createSessionClient } from "@/lib/supabase/server";
import { catalogImageUrl } from "@/lib/supabase/storage";

export const generateMetadata = adminTitle((t) => t.products.editTitle);

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { t } = await getAdminT();
  const p = t.products;
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
        back={{ href: "/admin/products", label: p.title }}
        actions={
          <>
            <StatusBadge status={contentStatuses(t)[product.status]} />
            {product.status === "published" ? (
              <Link href={localizedPath("fr", { route: "product", slug: product.slug_fr })} target="_blank" className="text-accent inline-flex min-h-11 items-center text-sm font-medium">
                {t.common.viewOnSite} ↗
              </Link>
            ) : null}
          </>
        }
      />
      {created ? <Notice>{p.created}</Notice> : null}

      <div className="space-y-6">
        <Panel title={format(p.photos, { count: images?.length ?? 0 })}>
          {images && images.length > 0 ? (
            <ul className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {images.map((image) => (
                <li key={image.id} className="border-line rounded-[var(--radius-control)] border p-2">
                  <div className="bg-surface relative aspect-square">
                    <Image src={catalogImageUrl(image.storage_path)} alt={image.alt_fr ?? ""} fill sizes="200px" className="object-contain" />
                  </div>
                  <p dir="auto" className="text-fg-muted mt-2 line-clamp-2 text-xs">{image.alt_fr || p.noAlt}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {image.is_primary ? (
                      <span className="text-success text-xs font-semibold">{p.primary}</span>
                    ) : (
                      <ActionButton action={setPrimaryImage} label={p.setPrimary} hidden={{ id: image.id, productId: product.id }} />
                    )}
                    <ActionButton action={deleteProductImage} label={t.common.delete} confirm={p.deletePhotoConfirm} hidden={{ id: image.id }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-fg-muted mb-6 text-sm">{p.noPhotos}</p>
          )}
          <div className="border-line border-t pt-5">
            <ImageUploadForm productId={product.id} />
          </div>
        </Panel>

        <ProductForm product={product} categories={categories} />

        <Panel title={t.common.dangerZone}>
          <p className="text-fg-muted mb-4 text-sm">
            {p.dangerText} {quoteCount ? format(p.inQuotes, { count: quoteCount }) : ""}
          </p>
          <ActionButton action={deleteProduct} label={p.deleteButton} variant="secondary" confirm={format(p.deleteConfirm, { name: product.name_fr })} hidden={{ id: product.id }} />
        </Panel>
      </div>
    </>
  );
}
