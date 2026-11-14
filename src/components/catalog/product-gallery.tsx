"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/features/catalog/queries";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";

type Props = {
  images: ProductImage[];
  /** Localized template, e.g. "Image {n} of {total}" (functions can't be passed from the server). */
  thumbLabelTemplate: string;
  noImageLabel: string;
};

/** Main image + thumbnail buttons. Without JS the first image still renders (SSR). */
export function ProductGallery({ images, thumbLabelTemplate, noImageLabel }: Props) {
  const thumbLabel = (n: number, total: number) => format(thumbLabelTemplate, { n, total });
  const [index, setIndex] = useState(0);
  const current = images[index];

  if (!current) {
    return (
      <div className="bg-surface border-line text-fg-subtle grid aspect-square place-items-center rounded-[var(--radius-card)] border text-sm">
        {noImageLabel}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-surface border-line relative aspect-square overflow-hidden rounded-[var(--radius-card)] border">
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-6"
        />
      </div>
      {images.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {images.map((image, i) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={thumbLabel(i + 1, images.length)}
                aria-pressed={i === index}
                className={cn(
                  "bg-surface relative block aspect-square w-full overflow-hidden rounded-[var(--radius-control)] border transition-colors",
                  i === index ? "border-accent ring-accent ring-1" : "border-line hover:border-line-strong",
                )}
              >
                <Image src={image.url} alt="" fill sizes="96px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
