"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeMeta, locales, type Locale } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/routes";
import { cn } from "@/lib/utils";
import { usePageAlternates } from "./page-alternates";

const shortLabels: Record<Locale, string> = { fr: "FR", ar: "ع", en: "EN" };

type Props = {
  current: Locale;
  label: string;
  className?: string;
  /** Languages enabled in site settings. */
  available: readonly Locale[];
  /** "touch": 44 px segments for the mobile menu; default: the compact desktop pill. */
  size?: "compact" | "touch";
};

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
  size = "compact",
}: Props & { pathname: string | null; alternates?: Partial<Record<Locale, string>> | null }) {
  const shown = locales.filter((l) => available.includes(l));
  if (shown.length < 2) return null;
  const touch = size === "touch";
  return (
    <nav aria-label={label} className={className}>
      <ul className={cn("border-line flex items-center rounded-full border", touch ? "p-1" : "p-0.5")}>
        {shown.map((locale) => {
          const isCurrent = locale === current;
          return (
            <li key={locale}>
              <Link
                href={alternates?.[locale] ?? (pathname ? switchLocalePath(pathname, locale) : `/${locale}`)}
                hrefLang={localeMeta[locale].htmlLang}
                lang={localeMeta[locale].htmlLang}
                aria-current={isCurrent ? "true" : undefined}
                prefetch={false}
                className={cn(
                  "inline-flex items-center justify-center rounded-full font-semibold transition-colors",
                  touch
                    ? "h-11 min-w-12 px-3 text-sm active:scale-95"
                    : // Touch tablets get a bigger target; mouse users keep the compact pill.
                      "h-7 min-w-7 px-1.5 text-[11px] pointer-coarse:h-11 pointer-coarse:min-w-11 pointer-coarse:text-xs",
                  isCurrent ? "bg-primary text-on-primary" : "text-fg-muted hover:text-fg hover:bg-surface",
                  locale === "ar" && "font-[family-name:var(--font-arabic)]",
                )}
              >
                {/* Accessible name = visible label + full language name ("FR Français"):
                    it contains the visible text (WCAG 2.5.3 Label in Name). */}
                {shortLabels[locale]}
                <span className="sr-only"> {localeMeta[locale].nativeName}</span>
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
