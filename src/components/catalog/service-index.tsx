import Link from "next/link";
import { ServiceArt } from "@/components/illustrations/service-art";
import { ArrowIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type ServiceIndexRow = { slugFr: string; name: string; summary: string | null; href: string };

/**
 * Services as an index (docs/ART_DIRECTION.md): one row per service — name in display type,
 * summary, drawing. A 2 px ink rule opens the list; hairlines separate rows. Whole row is
 * one link.
 */
export function ServiceIndex({ rows, className }: { rows: ServiceIndexRow[]; className?: string }) {
  return (
    <ul className={cn("border-fg border-t-2", className)}>
      {rows.map((row) => (
        <li key={row.slugFr} className="border-line border-b">
          <Link
            href={row.href}
            className="group hover:bg-surface active:bg-surface -mx-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 px-4 py-6 transition-colors duration-200 sm:-mx-6 sm:px-6 md:grid-cols-12 md:py-7"
          >
            <span className="type-display text-fg text-2xl leading-[1.05] sm:text-3xl md:col-span-5 lg:text-[2.5rem]">{row.name}</span>
            {row.summary ? (
              <span className="text-fg-muted col-span-2 row-start-2 max-w-xl leading-relaxed md:col-span-5 md:row-start-auto">{row.summary}</span>
            ) : (
              <span className="hidden md:col-span-5 md:block" />
            )}
            <span className="flex items-center justify-end gap-4 md:col-span-2">
              <span className="block w-20 transition-transform duration-300 group-hover:-translate-y-1 sm:w-24">
                <ServiceArt slugFr={row.slugFr} className="w-full" />
              </span>
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
