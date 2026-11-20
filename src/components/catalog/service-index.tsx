import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ServiceArt } from "@/components/illustrations/service-art";
import { ArrowIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

/** `photo` (or `art`) overrides the drawing looked up from `slugFr` (used by the production lines). */
export type ServiceIndexRow = {
  slugFr: string;
  name: string;
  summary: string | null;
  href: string;
  art?: ReactNode;
  photo?: { src: StaticImageData; alt: string; contain?: boolean };
};

/**
 * Services as an index (docs/ART_DIRECTION.md): one row per service — name in display type,
 * summary, drawing. A 2 px ink rule opens the list; hairlines separate rows. Whole row is
 * one link.
 */
export function ServiceIndex({ rows, className }: { rows: ServiceIndexRow[]; className?: string }) {
  return (
    <ul className={cn("border-fg border-t-2", className)}>
      {rows.map((row) => (
        <li key={row.slugFr} className="border-line reveal border-b">
          <Link
            href={row.href}
            className="group hover:bg-surface active:bg-surface -mx-4 grid rounded-[var(--radius-card)] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 px-4 py-4 transition-colors duration-200 sm:-mx-6 sm:px-6 md:grid-cols-12 md:py-5"
          >
            <span className="text-fg text-lg font-semibold sm:text-xl md:col-span-5">{row.name}</span>
            {row.summary ? (
              <span className="text-fg-muted col-span-2 row-start-2 max-w-xl leading-relaxed md:col-span-5 md:row-start-auto">{row.summary}</span>
            ) : (
              <span className="hidden md:col-span-5 md:block" />
            )}
            <span className="flex items-center justify-end gap-4 md:col-span-2">
              {row.photo ? (
                <span
                  className={cn(
                    "relative block size-16 overflow-hidden rounded-2xl transition-transform duration-300 group-hover:-translate-y-1 sm:size-24",
                    row.photo.contain ? "border-line border bg-white" : "bg-paper-100",
                  )}
                >
                  <Image src={row.photo.src} alt={row.photo.alt} fill sizes="96px" className={row.photo.contain ? "object-contain p-1.5" : "object-cover"} />
                </span>
              ) : (
                <span className="bg-paper-100 grid size-14 place-items-center rounded-2xl p-2 transition-transform duration-300 group-hover:-translate-y-1 sm:size-20 sm:p-3">
                  {row.art ?? <ServiceArt slugFr={row.slugFr} className="w-full" />}
                </span>
              )}
              <ArrowIcon
                width={22}
                height={22}
                className="text-fg hidden shrink-0 transition-transform group-hover:translate-x-1 sm:block rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
