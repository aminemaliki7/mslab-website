import Link from "next/link";
import { ArrowIcon, SearchIcon } from "@/components/ui/icons";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  action: string;
  dict: Dictionary;
  q?: string;
};

/**
 * Plain GET form: works without JavaScript and produces shareable URLs. Drawn as one ink line
 * (docs/ART_DIRECTION.md: rules, not boxes) with a text submit like the site's arrow links;
 * the line turns accent while the field has focus.
 */
export function CatalogSearchForm({ action, dict, q }: Props) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="border-fg focus-within:border-accent flex items-center gap-3 border-b-2 transition-colors"
    >
      <SearchIcon className="text-fg-muted shrink-0" />
      <label htmlFor="catalog-q" className="sr-only">
        {dict.catalog.searchLabel}
      </label>
      <input
        id="catalog-q"
        type="search"
        name="q"
        defaultValue={q}
        placeholder={dict.catalog.searchPlaceholder}
        maxLength={100}
        className="text-fg placeholder:text-fg-subtle h-12 min-w-0 flex-1 bg-transparent text-base focus:outline-none"
      />
      {q ? (
        <Link href={action} className="text-fg-muted hover:text-fg inline-flex min-h-11 shrink-0 items-center text-sm underline-offset-4 hover:underline">
          {dict.catalog.reset}
        </Link>
      ) : null}
      <button
        type="submit"
        className="text-accent hover:text-accent-hover group inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold"
      >
        {dict.catalog.submit}
        <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
      </button>
    </form>
  );
}
