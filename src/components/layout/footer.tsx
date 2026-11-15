import Link from "next/link";
import { Container } from "@/components/ui/layout";
import { MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { Wordmark } from "./wordmark";

export async function Footer() {
  const locale = await getLocale();
  const [dict, settings] = await Promise.all([getDictionary(locale), getSiteSettings()]);

  const address = settings.address[locale] ?? settings.address.fr ?? null;
  const hasContact = Boolean(settings.email || settings.phone || address);

  const navLinks = [
    { href: localizedPath(locale, { route: "services" }), label: dict.nav.services },
    { href: localizedPath(locale, { route: "catalog" }), label: dict.nav.catalog },
    { href: localizedPath(locale, { route: "about" }), label: dict.nav.about },
    { href: localizedPath(locale, { route: "contact" }), label: dict.nav.contact },
    { href: localizedPath(locale, { route: "quote" }), label: dict.common.requestQuote },
    { href: localizedPath(locale, { route: "track" }), label: dict.footer.tracking },
  ];

  const headingClass = "text-xs font-semibold tracking-[0.08em] text-white/60 uppercase rtl:tracking-normal rtl:text-sm";
  const linkClass = "text-white/85 hover:text-white underline-offset-4 hover:underline";

  return (
    <footer className="bg-ink-900 mt-auto text-white">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Wordmark inverted />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">{dict.footer.about}</p>
        </div>

        <div className="lg:col-span-3">
          <h2 className={headingClass}>{dict.footer.activities}</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/85">
            {Object.values(dict.businessAreas).map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h2 className={headingClass}>{dict.footer.navigation}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {hasContact ? (
          <div className="lg:col-span-3">
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
        <Container className="flex flex-col gap-3 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © MSLAB. {dict.footer.rights}
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href={localizedPath(locale, { route: "legal" })} className="hover:text-white">
                {dict.footer.legal}
              </Link>
            </li>
            <li>
              <Link href={localizedPath(locale, { route: "privacy" })} className="hover:text-white">
                {dict.footer.privacy}
              </Link>
            </li>
          </ul>
        </Container>
      </div>
    </footer>
  );
}
