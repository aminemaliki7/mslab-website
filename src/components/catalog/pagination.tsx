import Link from "next/link";
import { ChevronIcon } from "@/components/ui/icons";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Props = { page: number; pageCount: number; hrefFor: (page: number) => string; dict: Dictionary };

/** Previous / page x of y / next. Disabled ends render as text, not dead links. */
export function Pagination({ page, pageCount, hrefFor, dict }: Props) {
  if (pageCount <= 1) return null;
  const linkClass =
    "border-line hover:border-line-strong inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] border px-3 text-sm font-medium";
  const disabledClass = "text-fg-subtle inline-flex h-10 items-center gap-1.5 px-3 text-sm";

  return (
    <nav aria-label={dict.catalog.pagination} className="mt-10 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={linkClass}>
          <ChevronIcon width={16} height={16} className="rotate-180 rtl:rotate-0" />
          {dict.catalog.previous}
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden="true" />
      )}
      <p className="text-fg-muted text-sm" aria-current="page">
        {format(dict.catalog.pageOf, { page, total: pageCount })}
      </p>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(linkClass)}>
          {dict.catalog.next}
          <ChevronIcon width={16} height={16} className="rtl:rotate-180" />
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden="true" />
      )}
    </nav>
  );
}
