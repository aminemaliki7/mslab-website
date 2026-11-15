import Link from "next/link";
import { ChevronIcon } from "./icons";

export type Crumb = { label: string; href?: string };

/** Breadcrumb trail; last item is the current page. JSON-LD is added by the page (M8). */
export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav aria-label={label} className="text-fg-muted text-sm">
      <ol className="flex flex-wrap items-center gap-x-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-fg inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-fg" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? <ChevronIcon width={14} height={14} className="rtl:-scale-x-100" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
