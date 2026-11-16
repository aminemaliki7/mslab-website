import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import type { CategorySummary } from "@/features/catalog/queries";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  action: string;
  dict: Dictionary;
  q?: string;
  /** Category filter (index page only); category pages filter by route instead. */
  categories?: { options: CategorySummary[]; selected?: string };
};

/** Plain GET form: works without JavaScript and produces shareable URLs. */
export function CatalogSearchForm({ action, dict, q, categories }: Props) {
  const hasFilter = Boolean(q || categories?.selected);
  return (
    <form action={action} method="get" role="search" className="flex flex-wrap items-end gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor="catalog-q" className="sr-only">
          {dict.catalog.searchLabel}
        </label>
        <Input id="catalog-q" type="search" name="q" defaultValue={q} placeholder={dict.catalog.searchPlaceholder} maxLength={100} />
      </div>
      {categories && categories.options.length > 0 ? (
        <div className="flex flex-col gap-1.5 sm:w-60">
          <label htmlFor="catalog-category" className="text-fg text-sm font-medium">
            {dict.catalog.categoryLabel}
          </label>
          <Select id="catalog-category" name="category" defaultValue={categories.selected ?? ""}>
            <option value="">{dict.catalog.allCategories}</option>
            {categories.options.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.parentId ? `— ${category.name}` : category.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit">{dict.catalog.submit}</Button>
        {hasFilter ? (
          <Link
            href={action}
            className="text-fg-muted hover:text-fg inline-flex h-11 items-center px-2 text-sm underline-offset-4 hover:underline"
          >
            {dict.catalog.reset}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
