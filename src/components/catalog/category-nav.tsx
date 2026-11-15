import Link from "next/link";
import type { CategorySummary } from "@/features/catalog/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { cn } from "@/lib/utils";

/** Category tree (2 levels) linking to canonical category pages. */
export function CategoryNav({
  locale,
  dict,
  categories,
  activeId,
}: {
  locale: Locale;
  dict: Dictionary;
  categories: CategorySummary[];
  activeId?: string;
}) {
  if (categories.length === 0) return null;
  const roots = categories.filter((c) => !c.parentId || !categories.some((p) => p.id === c.parentId));
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);
  const itemClass = (active: boolean) =>
    cn(
      "flex min-h-11 items-center rounded-[var(--radius-control)] px-3 py-2 text-[0.9375rem] transition-colors",
      active ? "bg-surface-strong text-fg font-semibold" : "text-fg-muted hover:bg-surface hover:text-fg",
    );

  return (
    <nav aria-labelledby="category-nav-heading">
      <h2 id="category-nav-heading" className="text-fg-muted mb-3 px-3 text-sm font-semibold">
        {dict.catalog.categoriesTitle}
      </h2>
      <ul className="space-y-0.5">
        <li>
          <Link href={localizedPath(locale, { route: "catalog" })} className={itemClass(!activeId)} aria-current={!activeId ? "page" : undefined}>
            {dict.catalog.allCategories}
          </Link>
        </li>
        {roots.map((root) => {
          const children = childrenOf(root.id);
          return (
            <li key={root.id}>
              <Link
                href={localizedPath(locale, { route: "category", slug: root.slug })}
                className={itemClass(activeId === root.id)}
                aria-current={activeId === root.id ? "page" : undefined}
              >
                {root.name}
              </Link>
              {children.length > 0 ? (
                <ul className="border-line ms-3 mt-0.5 space-y-0.5 border-s ps-2">
                  {children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={localizedPath(locale, { route: "category", slug: child.slug })}
                        className={itemClass(activeId === child.id)}
                        aria-current={activeId === child.id ? "page" : undefined}
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
