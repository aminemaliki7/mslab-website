import type { Metadata } from "next";
import { OrganizationJsonLd } from "@/components/content/organization-json-ld";
import { EnvelopeIllustration } from "@/components/illustrations";
import { ContactForm } from "@/components/forms/contact-form";
import { PageHeader } from "@/components/layout/page-header";
import { whatsappHref } from "@/components/layout/whatsapp-button";
import { ArrowLink } from "@/components/ui/arrow-link";
import { buttonClasses } from "@/components/ui/button";
import { MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Container, Heading, Section } from "@/components/ui/layout";
import { forLocale, getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath, quoteFormHref } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: { route: "contact" },
    title: dict.seo.contactTitle,
    description: dict.pages.contact.description,
  });
}

/** Contact form + verified company details (each hidden when empty; map only with a verified address). */
export default async function ContactPage() {
  const locale = await getLocale();
  const [dict, settings] = await Promise.all([getDictionary(locale), getSiteSettings()]);
  const address = forLocale(settings.address, locale);
  const hours = forLocale(settings.openingHours, locale);
  const contactPath = localizedPath(locale, { route: "contact" });

  return (
    <>
      <OrganizationJsonLd locale={locale} />
      <PageHeader title={dict.pages.contact.title} lead={dict.pages.contact.description} illustration={<EnvelopeIllustration />} />
      <Section>
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Heading as="h2" size="md">
              {dict.contactPage.formTitle}
            </Heading>
            <div className="mt-6">
              <ContactForm
                locale={locale}
                sourcePath={contactPath}
                privacyHref={localizedPath(locale, { route: "privacy" })}
                t={{ forms: dict.forms, page: dict.contactPage }}
              />
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-surface border-line rounded-[var(--radius-card)] border p-6">
              {settings.phone || settings.email || address || hours ? (
                <>
                  <h2 className="text-fg text-lg font-semibold">{dict.contactPage.detailsTitle}</h2>
                  <ul className="mt-4 space-y-4 text-[0.9375rem]">
                    {settings.phone ? (
                      <li className="flex gap-3">
                        <PhoneIcon className="text-fg-muted mt-0.5 shrink-0" />
                        <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="hover:text-accent -my-2.5 inline-flex min-h-11 items-center">
                          <bdi dir="ltr">{settings.phone}</bdi>
                        </a>
                      </li>
                    ) : null}
                    {settings.email ? (
                      <li className="flex gap-3">
                        <MailIcon className="text-fg-muted mt-0.5 shrink-0" />
                        <a href={`mailto:${settings.email}`} className="hover:text-accent -my-2.5 inline-flex min-h-11 items-center break-all">
                          <bdi dir="ltr">{settings.email}</bdi>
                        </a>
                      </li>
                    ) : null}
                    {address ? (
                      <li className="flex gap-3">
                        <MapPinIcon className="text-fg-muted mt-0.5 shrink-0" />
                        <div>
                          <p className="whitespace-pre-line">{address}</p>
                          {settings.mapsUrl ? (
                            <ArrowLink href={settings.mapsUrl} className="mt-2">
                              {dict.about.map}
                            </ArrowLink>
                          ) : null}
                        </div>
                      </li>
                    ) : null}
                    {hours ? (
                      <li>
                        <p className="text-fg-muted text-sm">{dict.about.openingHours}</p>
                        <p className="mt-1 whitespace-pre-line">{hours}</p>
                      </li>
                    ) : null}
                  </ul>
                </>
              ) : null}

              {settings.whatsappNumber ? (
                <a
                  href={whatsappHref(settings.whatsappNumber, dict.whatsapp.prefill)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("secondary", "md", "mt-6 w-full")}
                >
                  <WhatsAppIcon width={20} height={20} />
                  {dict.contactPage.whatsappCta}
                </a>
              ) : null}

              <div className={settings.phone || settings.email || address || settings.whatsappNumber ? "border-line mt-6 border-t pt-6" : ""}>
                <p className="text-fg-muted text-sm">{dict.contactPage.quoteCta}</p>
                <ArrowLink href={quoteFormHref(locale)} className="mt-3">
                  {dict.common.requestQuote}
                </ArrowLink>
              </div>
            </div>
          </aside>
        </Container>
      </Section>
    </>
  );
}
