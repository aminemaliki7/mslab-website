"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeMeta, locales, type Locale } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/routes";
import { cn } from "@/lib/utils";
import { usePageAlternates } from "./page-alternates";

const shortLabels: Record<Locale, string> = { fr: "FR", ar: "ع", en: "EN" };

type Props = { current: Locale; label: string; className?: string; /** Languages enabled in site settings. */ available: readonly Locale[] };

/**
 * Pure links (no hooks). With `pathname` null (Suspense fallback) each link targets the
 * locale home page; the hydrated version links to the same page in the other locale.
 */
export function LanguageLinks({
  available,
  current,
  label,
  className,
  pathname,
  alternates = null,
}: Props & { pathname: string | null; alternates?: Partial<Record<Locale, string>> | null }) {
  const shown = locales.filter((l) => available.includes(l));
  if (shown.length < 2) return null;
  return (
    <nav aria-label={label} className={className}>
      <ul className="border-line flex items-center rounded-[var(--radius-control)] border p-0.5">
        {shown.map((locale) => {
          const isCurrent = locale === current;
          return (
            <li key={locale}>
              <Link
                href={alternates?.[locale] ?? (pathname ? switchLocalePath(pathname, locale) : `/${locale}`)}
                hrefLang={localeMeta[locale].htmlLang}
                lang={localeMeta[locale].htmlLang}
                aria-label={localeMeta[locale].nativeName}
                aria-current={isCurrent ? "true" : undefined}
                prefetch={false}
                className={cn(
                  "inline-flex h-8 min-w-9 items-center justify-center rounded-[4px] px-2 text-xs font-semibold transition-colors",
                  isCurrent ? "bg-primary text-on-primary" : "text-fg-muted hover:text-fg hover:bg-surface",
                  locale === "ar" && "font-[family-name:var(--font-arabic)] text-sm",
                )}
              >
                {shortLabels[locale]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Links to the current page in each locale. Full page load is fine (different <html dir>). */
export function LanguageSwitcher(props: Props) {
  const pathname = usePathname();
  const alternates = usePageAlternates();
  return <LanguageLinks {...props} pathname={pathname} alternates={alternates} />;
}
