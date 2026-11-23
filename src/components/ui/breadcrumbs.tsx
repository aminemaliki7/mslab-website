import Link from "next/link";
import { JsonLd } from "@/components/content/json-ld";
import { siteUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import { ChevronIcon } from "./icons";

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb trail; last item is the current page. Emits the matching schema.org
 * BreadcrumbList so the visible trail and the structured data can never disagree.
 * Phones show only a "‹ parent" back link (one line, 44 px target); the full trail from sm up.
 */
export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  const parentIndex = items.length - 2;
  return (
    <nav aria-label={label} className="text-fg-muted text-sm">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
          })),
        }}
      />
      <ol className="flex flex-wrap items-center gap-x-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isParent = index === parentIndex && Boolean(item.href);
          return (
            <li
              key={`${item.label}-${index}`}
              className={cn("items-center gap-1.5", isParent ? "flex min-w-0" : "hidden sm:flex")}
            >
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-fg -ms-1 inline-flex min-h-11 min-w-0 items-center gap-1 ps-1 underline-offset-4 hover:underline sm:ms-0 sm:ps-0"
                >
                  {isParent ? (
                    <ChevronIcon width={16} height={16} aria-hidden="true" className="shrink-0 -scale-x-100 sm:hidden rtl:scale-x-100" />
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-fg" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? <ChevronIcon width={14} height={14} className={cn("shrink-0 rtl:-scale-x-100", isParent && "hidden sm:block")} /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
