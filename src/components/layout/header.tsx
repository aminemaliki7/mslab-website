import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath, quoteFormHref } from "@/i18n/routes";
import { LanguageLinks, LanguageSwitcher } from "./language-switcher";
import { MobileNav, MobileNavFallback } from "./mobile-nav";
import { NavLinks, NavList } from "./nav-links";
import { buildNavigation } from "./navigation";
import { whatsappHref } from "./whatsapp-button";
import { Wordmark } from "./wordmark";

export async function Header() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const [settings, { items }] = await Promise.all([getSiteSettings(), buildNavigation(locale, dict)]);
  const { enabledLocales } = settings;
  // One-tap contact in the mobile menu — only numbers MSLAB has verified in site settings.
  const contact = {
    phone: settings.phone ? { href: `tel:${settings.phone.replace(/\s+/g, "")}`, label: dict.common.call } : undefined,
    whatsapp: settings.whatsappNumber ? { href: whatsappHref(settings.whatsappNumber, dict.whatsapp.prefill), label: "WhatsApp" } : undefined,
  };
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
        <Container className="relative flex h-[4.5rem] items-center justify-between gap-6 after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-fg/80 sm:after:inset-x-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:h-20 lg:after:inset-x-8">
          <Link
            href={localizedPath(locale, { route: "home" })}
            className="-my-1.5 inline-flex min-h-11 shrink-0 items-center py-1.5"
            aria-label={`MSLAB — ${dict.nav.home}`}
          >
            <Wordmark intro />
          </Link>

          {/* Path-aware client parts are wrapped in Suspense: on routes whose URL is only known
              at request time (catch-all 404, future dynamic slugs) the static fallback renders. */}
          <nav aria-label={dict.common.mainNavigation} className="hidden lg:block lg:-translate-x-12">
            <Suspense fallback={<NavList items={items} active={null} />}>
              <NavLinks items={items} />
            </Suspense>
          </nav>

          <div className="flex items-center gap-3 lg:justify-self-end">
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
                secondary={[{ href: localizedPath(locale, { route: "track" }), label: dict.footer.tracking }]}
                contact={contact}
              >
                <LanguageSwitcher available={enabledLocales} current={locale} label={dict.common.language} size="touch" className="sm:hidden" />
              </MobileNav>
            </Suspense>
          </div>
        </Container>
      </header>
    </>
  );
}
