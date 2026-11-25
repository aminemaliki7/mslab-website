"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** A published catalogue product that has a photo (the homepage hero shows nothing else). */
export type HeroProduct = { id: string; name: string; href: string; image: { url: string; alt: string } };

/** Fixed small tile. `contain`: whole image on white; `tint`: whole image on this flat colour. */
export type HeroPhoto = { src: StaticImageData; alt: string; caption: string; contain?: boolean; tint?: string };

/**
 * Homepage hero collage (docs/DESIGN_SYSTEM.md §0): the same object collage as before — one
 * large tile you can page through, two smaller fixed tiles below — with real catalogue products
 * in the large tile instead of studio mockups. Each product opens its page. The small tiles keep
 * the promise's steps (« Votre idée » / « Notre production »). It replaced the studio-mockup
 * collage (removed 2026-11-25) and keeps its look: white pill, round paging buttons, tile colours.
 */
export function CatalogueCollage({
  products,
  photos,
  labels,
  className,
}: {
  products: HeroProduct[];
  photos: HeroPhoto[];
  labels: { stage: string; previous: string; next: string };
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const count = products.length;
  const product = products[index % count];

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-5", className)}>
      {product ? (
        <div className="bg-paper-100 relative col-span-2 aspect-[16/11] overflow-hidden rounded-[var(--radius-card)] sm:aspect-[16/10]">
          <Link href={product.href} className="group absolute inset-0 block">
            {/* Multiply: a photo's white backdrop takes the tile colour (blend on the animated wrapper). */}
            <span key={product.id} className="anim-swap absolute inset-0 mx-16 mt-6 mb-10 block mix-blend-multiply">
              <Image
                src={product.image.url}
                alt={product.image.alt}
                fill
                sizes="(min-width: 1024px) 27rem, 90vw"
                {...(index === 0 ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
                className="object-contain transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
              />
            </span>
            <span className="text-fg absolute bottom-0 start-0 p-5 text-xs font-medium sm:p-6">{product.name}</span>
          </Link>
          <StagePill className="start-4 top-4 sm:start-5 sm:top-5">{labels.stage}</StagePill>
          {count > 1 ? (
            <>
              <TileButton side="start" label={labels.previous} onClick={() => setIndex((i) => (i - 1 + count) % count)} />
              <TileButton side="end" label={labels.next} onClick={() => setIndex((i) => (i + 1) % count)} />
            </>
          ) : null}
        </div>
      ) : null}
      {photos.slice(0, 2).map((photo) => (
        <figure
          key={photo.alt}
          className={cn(
            "relative aspect-[5/4] overflow-hidden rounded-[var(--radius-card)]",
            photo.tint ? "" : photo.contain ? "border-line border bg-white" : "bg-paper-100",
          )}
          style={photo.tint ? { backgroundColor: photo.tint } : undefined}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 1024px) 16rem, 50vw"
            className={photo.tint ? "object-contain" : photo.contain ? "object-contain p-2" : "object-cover"}
          />
          <StagePill className="start-3 top-3">{photo.caption}</StagePill>
        </figure>
      ))}
    </div>
  );
}

/** Small white label naming what a tile stands for (same look as the studio collage). */
function StagePill({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cn("text-fg pointer-events-none absolute rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow-[0_1px_6px_-2px_rgb(43_42_40/0.3)]", className)}>
      {children}
    </span>
  );
}

/** Round white paging button (the chevron points right by default; mirrored in RTL). */
function TileButton({ side, label, onClick }: { side: "start" | "end"; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "text-fg absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-[0_2px_10px_-4px_rgb(43_42_40/0.35)] transition-transform hover:scale-105 active:scale-95",
        side === "start" ? "start-4" : "end-4",
      )}
    >
      <ChevronIcon width={18} height={18} aria-hidden="true" className={side === "start" ? "rotate-180 rtl:rotate-0" : "rtl:rotate-180"} />
    </button>
  );
}
