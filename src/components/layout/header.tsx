import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath, quoteFormHref } from "@/i18n/routes";
import { LanguageLinks, LanguageSwitcher } from "./language-switcher";
import { MobileNav, MobileNavFallback } from "./mobile-nav";
import { NavLinks, NavList, type NavItem } from "./nav-links";
import { Wordmark } from "./wordmark";

export async function Header() {
  const locale = await getLocale();
  const [dict, { enabledLocales }] = await Promise.all([getDictionary(locale), getSiteSettings()]);

  const items: NavItem[] = [
    { section: "services", href: localizedPath(locale, { route: "services" }), label: dict.nav.services },
    { section: "catalog", href: localizedPath(locale, { route: "catalog" }), label: dict.nav.catalog },
    { section: "about", href: localizedPath(locale, { route: "about" }), label: dict.nav.about },
    { section: "contact", href: localizedPath(locale, { route: "contact" }), label: dict.nav.contact },
  ];
  const cta = { href: quoteFormHref(locale), label: dict.common.requestQuote };

  return (
    <>
      <a
        href="#main"
        className="bg-primary text-on-primary sr-only z-50 rounded-[var(--radius-control)] px-4 py-2 focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {dict.common.skipToContent}
      </a>
      <header className="bg-bg/95 header-lift sticky top-0 z-40 backdrop-blur-sm">
        {/* A hairline under the bar, inside the page margins (docs/DESIGN_SYSTEM.md §0). */}
        <Container className="relative flex h-[4.5rem] items-center justify-between gap-6 after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-fg/80 sm:after:inset-x-6 lg:h-20 lg:after:inset-x-8">
          <Link href={localizedPath(locale, { route: "home" })} className="shrink-0" aria-label={`MSLAB — ${dict.nav.home}`}>
            <Wordmark intro />
          </Link>

          {/* Path-aware client parts are wrapped in Suspense: on routes whose URL is only known
              at request time (catch-all 404, future dynamic slugs) the static fallback renders. */}
          <nav aria-label={dict.common.mainNavigation} className="hidden lg:block">
            <Suspense fallback={<NavList items={items} active={null} />}>
              <NavLinks items={items} />
            </Suspense>
          </nav>

          <div className="flex items-center gap-3">
            <Suspense
              fallback={
                <LanguageLinks available={enabledLocales} current={locale} label={dict.common.language} pathname={null} className="hidden sm:block" />
              }
            >
              <LanguageSwitcher available={enabledLocales} current={locale} label={dict.common.language} className="hidden sm:block" />
            </Suspense>
            {/* Wrapper controls visibility: display utilities on the button itself would conflict. */}
            <div className="hidden lg:block">
              <ButtonLink href={cta.href} size="sm">
                {cta.label}
              </ButtonLink>
            </div>
            <Suspense fallback={<MobileNavFallback label={dict.common.openMenu} />}>
              <MobileNav
                items={items}
                cta={cta}
                labels={{ open: dict.common.openMenu, close: dict.common.closeMenu, navigation: dict.common.mainNavigation }}
              >
                <LanguageSwitcher available={enabledLocales} current={locale} label={dict.common.language} className="sm:hidden" />
              </MobileNav>
            </Suspense>
          </div>
        </Container>
      </header>
    </>
  );
}
