import Link from "next/link";
import type { CategorySummary } from "@/features/catalog/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { cn } from "@/lib/utils";

/**
 * Categories as one row of buttons above the products (scrolls sideways on phones): one tap
 * to filter, no sidebar, no duplicate dropdown. Sub-categories of the open category follow.
 */
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
  const active = categories.find((c) => c.id === activeId);
  const openRootId = active?.parentId ?? active?.id;
  const roots = categories.filter((c) => !c.parentId || !categories.some((p) => p.id === c.parentId));
  const items = roots.flatMap((root) => [root, ...(root.id === openRootId ? categories.filter((c) => c.parentId === root.id) : [])]);

  const chip = (isActive: boolean, isChild = false) =>
    cn(
      "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-[0.9375rem] whitespace-nowrap transition-colors active:scale-[0.97]",
      isActive ? "border-fg bg-fg text-bg font-semibold" : "border-line-strong bg-bg text-fg hover:border-fg",
      isChild && !isActive && "border-dashed",
    );

  return (
    <nav aria-label={dict.catalog.categoriesTitle} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex gap-2 pb-1 sm:flex-wrap">
        <li>
          <Link href={localizedPath(locale, { route: "catalog" })} className={chip(!activeId)} aria-current={!activeId ? "page" : undefined}>
            {dict.catalog.allCategories}
          </Link>
        </li>
        {items.map((category) => (
          <li key={category.id}>
            <Link
              href={localizedPath(locale, { route: "category", slug: category.slug })}
              className={chip(activeId === category.id, Boolean(category.parentId))}
              aria-current={activeId === category.id ? "page" : undefined}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
