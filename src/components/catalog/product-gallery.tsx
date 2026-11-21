"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { ProductImage } from "@/features/catalog/queries";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";

type Props = {
  images: ProductImage[];
  /** Localized template, e.g. "Image {n} of {total}" (functions can't be passed from the server). */
  thumbLabelTemplate: string;
  noImageLabel: string;
  /** Drawing shown while the product has no photo (rendered on the server). */
  placeholder: ReactNode;
};

/** Main image + thumbnail buttons. Without JS the first image still renders (SSR). */
export function ProductGallery({ images: allImages, thumbLabelTemplate, noImageLabel, placeholder }: Props) {
  const thumbLabel = (n: number, total: number) => format(thumbLabelTemplate, { n, total });
  const [index, setIndex] = useState(0);
  // Photos that failed to load are dropped, so a broken file never leaves an empty frame.
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const markFailed = (url: string) => {
    setFailed((prev) => new Set(prev).add(url));
    setIndex(0);
  };
  const images = allImages.filter((image) => !failed.has(image.url));
  const current = images[index] ?? images[0];

  if (!current) {
    return (
      <div className="bg-surface border-line flex aspect-square items-center justify-center rounded-[var(--radius-card)] border p-10">
        {placeholder}
        <span className="sr-only">{noImageLabel}</span>
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
          onError={() => markFailed(current.url)}
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
                <Image src={image.url} alt="" fill sizes="96px" className="object-contain p-1.5" onError={() => markFailed(image.url)} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
