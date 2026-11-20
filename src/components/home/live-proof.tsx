"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import { ArrowIcon, ChevronIcon } from "@/components/ui/icons";
import { DEFAULT_COLORS, MOCKUPS, type MockupKey } from "@/components/print-on-demand/mockups";
import { proofText } from "@/components/print-on-demand/proof-text";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";

/**
 * Homepage signature (docs/DESIGN_SYSTEM.md §0): the visitor types a brand name in the field
 * (left column) and sees it on MSLAB products in the object collage (right column) at once —
 * SVG in the browser, nothing is sent. The text also follows them to the studio.
 * The two parts share one tiny in-page store.
 */

let brand = "";
const listeners = new Set<() => void>();
const brandStore = {
  set(value: string) {
    brand = value;
    proofText.write(value.trim());
    for (const listener of listeners) listener();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => brand,
  server: () => "",
};

const useBrand = () => useSyncExternalStore(brandStore.subscribe, brandStore.get, brandStore.server);

/** The brand-name field, set quietly like a search line. */
export function ProofField({
  labels,
  studioHref,
  className,
}: {
  labels: { field: string; placeholder: string; cta: string; note: string };
  studioHref: string;
  className?: string;
}) {
  const id = useId();
  const value = useBrand();
  return (
    <div className={className}>
      <label htmlFor={id} className="text-fg-muted block text-sm">
        {labels.field}
      </label>
      <div className="border-fg/80 focus-within:border-fg mt-2 flex items-center gap-3 border-b pb-1 transition-colors">
        <input
          id={id}
          type="text"
          value={value}
          maxLength={24}
          autoComplete="off"
          enterKeyHint="done"
          placeholder={labels.placeholder}
          onChange={(event) => brandStore.set(event.target.value)}
          className="text-fg placeholder:text-fg-subtle h-11 min-w-0 flex-1 bg-transparent text-xl font-light focus-visible:outline-none"
        />
        <PenIcon />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <p className="text-fg-muted text-xs">{labels.note}</p>
        <Link href={studioHref} className="group text-fg inline-flex min-h-11 items-center gap-2 text-sm font-medium underline decoration-1 underline-offset-4">
          {labels.cta}
          <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Object collage: one large tile you can page through (previous / next) showing the visitor's
 * brand (or "Votre marque") on MSLAB products, and two smaller tiles — production photos when
 * `photos` is given, otherwise the next products.
 */
export function ProofCollage({
  products,
  names,
  labels,
  photos,
  className,
}: {
  products: MockupKey[];
  names: Record<MockupKey, string>;
  /** `stage`: which step of the promise the large tile shows (e.g. "Votre design"). */
  labels: { placeholder: string; preview: string; previous: string; next: string; stage?: string };
  /** Small tiles; `caption` names the step each photo stands for (e.g. "Votre idée"). */
  /** `tint`: show the whole image (contain) on this background — for illustrations with a flat colour field. */
  photos?: Array<{ src: StaticImageData; alt: string; caption?: string; contain?: boolean; focus?: string; tint?: string }>;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const typed = useBrand().trim();
  const design = { imageUrl: null, text: typed || labels.placeholder, scale: 1, dx: 0, dy: 0 };
  const count = products.length;
  const at = (offset: number) => products[(index + offset) % count];
  const shown = photos?.length ? [at(0)] : [at(0), ...(count > 1 ? [at(1)] : []), ...(count > 2 ? [at(2)] : [])];

  return (
    <div className={cn("grid gap-3 sm:gap-5", photos?.length ? "grid-cols-2" : "grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]", className)}>
      {shown.map((key, position) => {
        const Mockup = MOCKUPS[key];
        const large = position === 0;
        return (
          <figure
            key={large ? `large-${key}` : `${position}-${key}`}
            className={cn(
              "relative overflow-hidden rounded-[var(--radius-card)]",
              large ? "bg-paper-100 col-span-2 aspect-[16/11] sm:aspect-[16/10]" : "aspect-[5/4]",
              position === 1 && "bg-sand-200",
              position === 2 && "bg-paper-100",
            )}
          >
            {/* Multiply: the photo's white backdrop takes the tile's colour (the blend sits on the
                animated wrapper so it still reaches the tile while the wrapper moves). */}
            <div className={cn("anim-swap absolute inset-0 grid place-items-center mix-blend-multiply", large ? "px-16 pt-6 pb-10" : "p-4 sm:p-6")}>
              <Mockup
                design={design}
                color={DEFAULT_COLORS[key]}
                label={format(labels.preview, { product: names[key] })}
                className={large ? "h-full max-h-full w-auto max-w-[17rem]" : "h-full max-h-full w-auto max-w-[9.5rem]"}
              />
            </div>
            {large && labels.stage ? <StagePill className="start-4 top-4 sm:start-5 sm:top-5">{labels.stage}</StagePill> : null}
            <figcaption className={cn("text-fg absolute bottom-0 start-0 text-xs font-medium", large ? "p-5 sm:p-6" : "p-3 sm:p-4")}>{names[key]}</figcaption>
            {large && count > 1 ? (
              <>
                <TileButton side="start" label={labels.previous} onClick={() => setIndex((i) => (i - 1 + count) % count)} />
                <TileButton side="end" label={labels.next} onClick={() => setIndex((i) => (i + 1) % count)} />
              </>
            ) : null}
          </figure>
        );
      })}
      {photos?.slice(0, 2).map((photo) => (
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
            style={photo.focus ? { objectPosition: photo.focus } : undefined}
          />
          {photo.caption ? <StagePill className="start-3 top-3">{photo.caption}</StagePill> : null}
        </figure>
      ))}
    </div>
  );
}

/** Small label naming the step of the promise a tile stands for. */
function StagePill({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cn("text-fg absolute rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow-[0_1px_6px_-2px_rgb(43_42_40/0.3)]", className)}>
      {children}
    </span>
  );
}

/** Round white paging button on the large tile (the chevron icon points right by default; mirrored in RTL). */
function TileButton({ side, label, onClick }: { side: "start" | "end"; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "text-fg absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-[0_2px_10px_-4px_rgb(43_42_40/0.35)] transition-transform hover:scale-105 active:scale-95",
        side === "start" ? "start-4" : "end-4",
      )}
    >
      <ChevronIcon width={18} height={18} className={side === "start" ? "rotate-180 rtl:rotate-0" : "rtl:rotate-180"} />
    </button>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="text-fg shrink-0">
      <path d="M4 20l4.2-1.1L19 8.1a2 2 0 000-2.8l-.3-.3a2 2 0 00-2.8 0L5.1 15.8 4 20z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14.5 6.5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
