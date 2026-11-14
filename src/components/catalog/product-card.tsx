import Image from "next/image";
import Link from "next/link";
import type { ProductSummary } from "@/features/catalog/queries";

type Labels = { sku: string; noImage: string };

/** Catalog card: image (or neutral placeholder), name, short description, SKU. No price (ADR-007). */
export function ProductCard({ product, href, labels }: { product: ProductSummary; href: string; labels: Labels }) {
  return (
    <Link
      href={href}
      className="group border-line bg-bg hover:border-line-strong flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border transition-colors"
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
          <span className="text-fg-subtle absolute inset-0 grid place-items-center text-xs">{labels.noImage}</span>
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
