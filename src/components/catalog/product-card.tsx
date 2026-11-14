import Image from "next/image";
import Link from "next/link";
import { ProductArt } from "@/components/illustrations/product-art";
import type { ProductSummary } from "@/features/catalog/queries";

type Labels = { sku: string; noImage: string };

/** Catalog card: image (or neutral placeholder), name, short description, SKU. No price (ADR-007). */
export function ProductCard({ product, href, labels }: { product: ProductSummary; href: string; labels: Labels }) {
  return (
    <Link
      href={href}
      className="group border-line bg-bg hover:border-line-strong flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-18px_rgb(14_26_43/0.45)]"
    >
      <div className="bg-surface relative aspect-[4/3]">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          // No photo yet: a drawing of the kind of object, so the card still shows what it is.
          <span className="absolute inset-0 grid place-items-center px-6 pt-4 pb-2">
            <ProductArt slugFr={product.slugFr} className="w-full max-w-[13rem] transition-transform duration-300 group-hover:-translate-y-1" />
            <span className="sr-only">{labels.noImage}</span>
          </span>
        )}
      </div>
      <div className="border-line flex flex-1 flex-col border-t p-4">
        <h3 className="text-fg font-semibold leading-snug">{product.name}</h3>
        {product.shortDescription ? (
          <p className="text-fg-muted mt-1.5 line-clamp-2 text-sm leading-relaxed">{product.shortDescription}</p>
        ) : null}
        {product.sku ? (
          <p className="text-fg-subtle mt-auto pt-3 text-xs">
            {labels.sku}{" "}
            <bdi dir="ltr" className="font-[family-name:var(--font-geist-mono)]">
              {product.sku}
            </bdi>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
