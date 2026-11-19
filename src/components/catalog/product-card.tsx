import Image from "next/image";
import Link from "next/link";
import { ProductArt } from "@/components/illustrations/product-art";
import type { ProductSummary } from "@/features/catalog/queries";
import { resolveProductVisual } from "@/features/catalog/visual";
import { format } from "@/i18n/format";

type Labels = { sku: string; noImage: string; /** "Min. {count} unités" */ moq: string };

/**
 * Catalog card: image (or neutral placeholder), name, short description, minimum order quantity
 * when MSLAB has set one, SKU. No price (ADR-007).
 */
export function ProductCard({ product, href, labels }: { product: ProductSummary; href: string; labels: Labels }) {
  const visual = resolveProductVisual(product);
  return (
    <Link
      href={href}
      className="group flex h-full flex-col"
    >
      <div className="bg-paper-100 relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] transition-colors duration-300 group-hover:bg-sand-200">
        {visual.kind === "photo" ? (
          <Image
            src={visual.image.url}
            alt={visual.image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          // No photo yet: a drawing of the kind of object, so the card still shows what it is.
          <span className="absolute inset-0 grid place-items-center px-3 pt-3 pb-1 sm:px-6 sm:pt-4 sm:pb-2">
            <ProductArt kind={visual.key} className="w-full max-w-[13rem] transition-transform duration-300 group-hover:-translate-y-1" />
            <span className="sr-only">{labels.noImage}</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <h3 className="text-fg text-sm font-semibold leading-snug">{product.name}</h3>
        {product.shortDescription ? (
          <p className="text-fg-muted mt-1.5 line-clamp-2 text-sm leading-relaxed">{product.shortDescription}</p>
        ) : null}
        {product.minOrderQuantity ? (
          <p className="text-fg mt-3 text-xs font-semibold">
            {format(labels.moq, { count: product.minOrderQuantity })}
          </p>
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
