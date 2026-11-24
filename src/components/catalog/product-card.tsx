import Link from "next/link";
import { ProductArt } from "@/components/illustrations/product-art";
import { ArrowIcon } from "@/components/ui/icons";
import type { ProductSummary } from "@/features/catalog/queries";
import { resolveProductVisual, resolveVisualKey } from "@/features/catalog/visual";
import type { Dictionary } from "@/i18n/dictionaries";
import { CatalogPhoto } from "./catalog-photo";
import { OfferBadge } from "./offer-badge";
import { format } from "@/i18n/format";

type Labels = {
  sku: string;
  noImage: string;
  /** "Min. {count} unités" */
  moq: string;
  offer: Pick<Dictionary["cx"]["offer"], "standard" | "customizable">;
  cta: string;
};

/** Card labels from the dictionary (every listing passes the same ones). */
export function productCardLabels(dict: Dictionary): Labels {
  return {
    sku: dict.product.sku,
    noImage: dict.product.noImage,
    moq: dict.product.moqShort,
    offer: { standard: dict.cx.offer.standard, customizable: dict.cx.offer.customizable },
    cta: dict.cx.offer.cardCta,
  };
}

/**
 * Catalog card: image (or a drawing of the object), offer type (available / customizable),
 * category, name, short description, minimum order quantity when MSLAB has set one, SKU, and the
 * call to action. No price (ADR-007). The whole card is one link (one tab stop).
 */
export function ProductCard({
  product,
  href,
  labels,
  categoryName,
}: {
  product: ProductSummary;
  href: string;
  labels: Labels;
  categoryName?: string | null;
}) {
  const visual = resolveProductVisual(product);
  // No photo yet (or the photo fails to load): a drawing of the kind of object, so the card still shows what it is.
  const drawing = (
    <span className="absolute inset-0 grid place-items-center px-3 pt-3 pb-1 sm:px-6 sm:pt-4 sm:pb-2">
      <ProductArt kind={resolveVisualKey(product)} className="w-full max-w-[13rem] transition-transform duration-300 group-hover:-translate-y-1" />
      <span className="sr-only">{labels.noImage}</span>
    </span>
  );
  return (
    <Link href={href} className="group flex h-full flex-col">
      <div className="bg-paper-100 relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] transition-colors duration-300 group-hover:bg-sand-200">
        {visual.kind === "photo" ? (
          <CatalogPhoto
            src={visual.image.url}
            alt={visual.image.alt}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
            className="object-contain object-center p-4 transition-transform duration-300 group-hover:scale-[1.02]"
            fallback={drawing}
          />
        ) : (
          drawing
        )}
        <OfferBadge type={product.offerType} labels={labels.offer} className="absolute start-2 top-2 sm:start-3 sm:top-3" />
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        {categoryName ? <p className="text-fg-subtle line-clamp-1 text-xs">{categoryName}</p> : null}
        <h3 className="text-fg mt-0.5 text-sm font-semibold leading-snug">{product.name}</h3>
        {product.shortDescription ? (
          <p className="text-fg-muted mt-1.5 line-clamp-2 text-sm leading-relaxed">{product.shortDescription}</p>
        ) : null}
        {product.minOrderQuantity ? (
          <p className="text-fg mt-3 text-xs font-semibold">{format(labels.moq, { count: product.minOrderQuantity })}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 pt-3">
          <span className="text-accent inline-flex items-center gap-1 text-sm font-medium">
            {labels.cta}
            <ArrowIcon width={14} height={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
          </span>
          {product.sku ? (
            <span className="text-fg-subtle text-xs">
              {labels.sku}{" "}
              <bdi dir="ltr" className="font-[family-name:var(--font-geist-mono)]">
                {product.sku}
              </bdi>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
