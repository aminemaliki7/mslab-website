import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/content/rich-text";
import { CtaBand } from "@/components/layout/cta-band";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Container, Heading, Section } from "@/components/ui/layout";
import { listServices } from "@/features/services/queries";
import { forLocale, getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: { route: "about" },
    title: dict.pages.about.title,
    description: dict.pages.about.description,
  });
}

/**
 * About MSLAB. Presentation, mission, values and company details come from site settings
 * (verified, entered by MSLAB). Without them the page shows only facts from the brief.
 */
export default async function AboutPage() {
  const locale = await getLocale();
  const [dict, settings, services] = await Promise.all([getDictionary(locale), getSiteSettings(), listServices(locale)]);

  const about = forLocale(settings.about, locale);
  const mission = forLocale(settings.mission, locale);
  const values = forLocale(settings.values, locale);
  const address = forLocale(settings.address, locale);
  const hours = forLocale(settings.openingHours, locale);

  const facts = [
    settings.companyName && { label: dict.about.companyName, value: settings.companyName },
    settings.legalName && { label: dict.about.legalName, value: settings.legalName },
    address && { label: dict.about.address, value: address },
    hours && { label: dict.about.openingHours, value: hours },
    settings.phone && {
      label: dict.about.phone,
      value: (
        <a href={`tel:${settings.phone}`} className="hover:text-accent">
          <bdi dir="ltr">{settings.phone}</bdi>
        </a>
      ),
    },
    settings.email && {
      label: dict.about.email,
      value: (
        <a href={`mailto:${settings.email}`} className="hover:text-accent">
          <bdi dir="ltr">{settings.email}</bdi>
        </a>
      ),
    },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[];

  return (
    <>
      <PageHeader title={dict.pages.about.title} lead={dict.pages.about.description} />

      <Section aria-labelledby="presentation-heading">
        <Container className="grid gap-8 lg:grid-cols-12">
          <Heading as="h2" size="lg" id="presentation-heading" className="lg:col-span-4">
            {dict.about.presentationTitle}
          </Heading>
          <div className="lg:col-span-8">
            <RichText text={about ?? dict.footer.about} className="text-lg" />
          </div>
        </Container>
      </Section>

      {mission || values ? (
        <Section tone="surface" aria-label={[dict.about.missionTitle, dict.about.valuesTitle].join(" / ")}>
          <Container className="grid gap-10 md:grid-cols-2">
            {mission ? (
              <div>
                <Heading as="h2" size="md">
                  {dict.about.missionTitle}
                </Heading>
                <RichText text={mission} className="mt-4" />
              </div>
            ) : null}
            {values ? (
              <div>
                <Heading as="h2" size="md">
                  {dict.about.valuesTitle}
                </Heading>
                <RichText text={values} className="mt-4" />
              </div>
            ) : null}
          </Container>
        </Section>
      ) : null}

      <Section aria-labelledby="expertise-heading">
        <Container className="grid gap-8 lg:grid-cols-12">
          <Heading as="h2" size="lg" id="expertise-heading" className="lg:col-span-4">
            {dict.about.expertiseTitle}
          </Heading>
          <div className="lg:col-span-8">
            <ul className="border-line grid border-t sm:grid-cols-2">
              {Object.values(dict.businessAreas).map((area) => (
                <li key={area} className="border-line text-fg border-b py-4 font-medium sm:pe-6">
                  {area}
                </li>
              ))}
            </ul>
            {services.length > 0 ? (
              <div className="mt-10">
                <h3 className="text-fg-muted text-sm font-semibold">{dict.about.servicesListTitle}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {services.map((service) => (
                    <li key={service.id}>
                      <Link
                        href={localizedPath(locale, { route: "service", slug: service.slug })}
                        className="border-line hover:border-accent hover:text-accent inline-flex rounded-full border px-3.5 py-1.5 text-sm transition-colors"
                      >
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      {facts.length > 0 ? (
        <Section tone="surface" aria-labelledby="info-heading">
          <Container className="grid gap-8 lg:grid-cols-12">
            <Heading as="h2" size="lg" id="info-heading" className="lg:col-span-4">
              {dict.about.infoTitle}
            </Heading>
            <div className="lg:col-span-8">
              <dl className="border-line grid border-t sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label} className="border-line border-b py-4 sm:pe-6">
                    <dt className="text-fg-muted text-sm">{fact.label}</dt>
                    <dd className="text-fg mt-1 font-medium whitespace-pre-line">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              {settings.mapsUrl && address ? (
                <ArrowLink href={settings.mapsUrl} className="mt-6">
                  {dict.about.map}
                </ArrowLink>
              ) : null}
            </div>
          </Container>
        </Section>
      ) : null}

      <CtaBand />
    </>
  );
}
