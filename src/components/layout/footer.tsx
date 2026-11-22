import Link from "next/link";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import { Container } from "@/components/ui/layout";
import { orderedLegalDocuments } from "@/content/legal";
import { MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { DIGITAL_SOLUTIONS_SLUG } from "@/components/illustrations/service-art";
import { PRODUCTION_LINES } from "@/config/production-lines";
import { listServices } from "@/features/services/queries";
import { getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath, quoteFormHref } from "@/i18n/routes";
import { Wordmark } from "./wordmark";

export async function Footer() {
  const locale = await getLocale();
  const [dict, settings, services] = await Promise.all([getDictionary(locale), getSiteSettings(), listServices(locale)]);
  const digital = services.find((s) => s.slugs.fr === DIGITAL_SOLUTIONS_SLUG);

  const address = settings.address[locale] ?? settings.address.fr ?? null;
  const hasContact = Boolean(settings.email || settings.phone || address);

  const navLinks = [
    { href: localizedPath(locale, { route: "services" }), label: dict.nav.services },
    { href: localizedPath(locale, { route: "catalog" }), label: dict.nav.catalog },
    { href: localizedPath(locale, { route: "about" }), label: dict.nav.about },
    { href: localizedPath(locale, { route: "contact" }), label: dict.nav.contact },
    { href: quoteFormHref(locale), label: dict.common.requestQuote },
    { href: localizedPath(locale, { route: "track" }), label: dict.footer.tracking },
  ];

  const legalLinks = orderedLegalDocuments.map((doc) => ({
    href: localizedPath(locale, { route: doc.key }),
    label: doc.text[locale].shortTitle,
  }));

  const headingClass = "text-sm font-semibold text-white";
  // Rows are 44 px tall on touch screens (padding, not font size); phones list links in two
  // columns so the footer stays about one screen tall.
  const linkClass = "inline-flex min-h-11 min-w-11 items-center py-1 leading-snug text-white/85 underline-offset-4 hover:text-white hover:underline lg:min-h-8";

  return (
    <footer className="mt-auto text-white" style={{ backgroundColor: "#0E1A2B" }}>
      {/* Same hairline as under the header, inside the page margins. */}
      <Container>
        <div aria-hidden="true" className="h-px bg-white/20" />
      </Container>
      <Container className="grid gap-8 py-10 sm:grid-cols-2 sm:gap-10 sm:py-14 lg:grid-cols-12 lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-3">
          <Wordmark inverted />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">{dict.footer.about}</p>
        </div>

        {/* MSLAB's core services — docs/POSITIONING.md. */}
        <div className="lg:col-span-2">
          <h2 className={headingClass}>{dict.footer.production}</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/85">
            {PRODUCTION_LINES.map((line) => (
              <li key={line.key}>{dict.productionLines[line.key].name}</li>
            ))}
          </ul>
          {digital ? (
            <Link href={localizedPath(locale, { route: "service", slug: digital.slug })} className={`${linkClass} mt-3 font-semibold text-white`}>
              {dict.digital.title}
            </Link>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <h2 className={headingClass}>{dict.footer.navigation}</h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 text-sm sm:block">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-labelledby="footer-legal" className="lg:col-span-3">
          <h2 id="footer-legal" className={headingClass}>
            {dict.footer.legalInfo}
          </h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 text-sm sm:block">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsButton className={`${linkClass} cursor-pointer text-start`}>{dict.footer.cookieSettings}</CookieSettingsButton>
            </li>
          </ul>
        </nav>

        {hasContact ? (
          <div className="min-w-0 lg:col-span-2">
            <h2 className={headingClass}>{dict.footer.contact}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {settings.phone ? (
                <li className="flex items-start gap-2.5">
                  <PhoneIcon width={18} height={18} className="mt-0.5 shrink-0 text-white/60" />
                  <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className={linkClass}>
                    <bdi dir="ltr">{settings.phone}</bdi>
                  </a>
                </li>
              ) : null}
              {settings.email ? (
                <li className="flex items-start gap-2.5">
                  <MailIcon width={18} height={18} className="mt-0.5 shrink-0 text-white/60" />
                  <a href={`mailto:${settings.email}`} className={linkClass}>
                    <bdi dir="ltr">{settings.email}</bdi>
                  </a>
                </li>
              ) : null}
              {address ? (
                <li className="flex items-start gap-2.5 text-white/85">
                  <MapPinIcon width={18} height={18} className="mt-0.5 shrink-0 text-white/60" />
                  <span>{address}</span>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-1 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © MSLAB. {dict.footer.rights}
          </p>
        </Container>
      </div>
    </footer>
  );
}
