import Link from "next/link";
import type { CategorySummary } from "@/features/catalog/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { cn } from "@/lib/utils";

/**
 * Categories as one row of underlined text links (same style as the homepage catalogue
 * section, docs/ART_DIRECTION.md): one tap to filter, scrolls sideways on phones.
 * The active category is ink and bold with a 2 px underline; sub-categories of the open
 * category follow it in a smaller size.
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

  const link = (isActive: boolean, isChild = false) =>
    cn(
      "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap underline underline-offset-[6px] transition-colors",
      isActive ? "text-fg decoration-fg font-semibold decoration-2" : "text-fg-muted decoration-line-strong hover:text-fg hover:decoration-fg",
      isChild && "text-sm",
    );

  return (
    <nav aria-label={dict.catalog.categoriesTitle} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex gap-x-6 gap-y-1 sm:flex-wrap">
        <li>
          <Link href={localizedPath(locale, { route: "catalog" })} className={link(!activeId)} aria-current={!activeId ? "page" : undefined}>
            {dict.catalog.allCategories}
          </Link>
        </li>
        {items.map((category) => (
          <li key={category.id}>
            <Link
              href={localizedPath(locale, { route: "category", slug: category.slug })}
              className={link(activeId === category.id, Boolean(category.parentId))}
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
