import type { Metadata } from "next";
import { DivisionsSection } from "@/components/home/divisions";
import { LibraryIllustration } from "@/components/illustrations/scenes";
import { DIGITAL_SOLUTIONS_SLUG, PRINT_ON_DEMAND_SLUG } from "@/components/illustrations/service-art";
import { RichText } from "@/components/content/rich-text";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowLink } from "@/components/ui/arrow-link";
import { ButtonLink } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { Container, Heading, Section } from "@/components/ui/layout";
import { listMockupProducts } from "@/features/print-on-demand/queries";
import { listServices } from "@/features/services/queries";
import { forLocale, getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath, quoteFormHref, studioHref } from "@/i18n/routes";
import { formatPhone, telHref } from "@/lib/phone";
import { buildPageMetadata } from "@/lib/seo";
import { STUDIO_ENABLED } from "@/config/features";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: { route: "about" },
    title: dict.pages.about.title,
    description: dict.seo.aboutDescription,
  });
}

/**
 * About MSLAB: who MSLAB is (settings text), its three divisions, who it works with and how,
 * mission and values (settings, hidden while empty), verified company details, then how to start.
 * Company facts come from site settings only; nothing is shown that MSLAB has not entered.
 */
export default async function AboutPage() {
  const locale = await getLocale();
  const [dict, settings, services, mockups] = await Promise.all([getDictionary(locale), getSiteSettings(), listServices(locale), listMockupProducts()]);
  const a = dict.cx.about;
  const serviceHref = (slugFr: string) => {
    const service = services.find((s) => s.slugs.fr === slugFr);
    return service ? localizedPath(locale, { route: "service", slug: service.slug }) : null;
  };
  const productionHref = serviceHref(PRINT_ON_DEMAND_SLUG);
  const servicesHref = localizedPath(locale, { route: "services" });

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
        <a href={telHref(settings.phone)} className="hover:text-accent -my-2.5 inline-flex min-h-11 items-center">
          <bdi dir="ltr">{formatPhone(settings.phone)}</bdi>
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
      <PageHeader title={dict.pages.about.title} lead={dict.pages.about.description} illustration={<LibraryIllustration />} />

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

      <DivisionsSection
        dict={dict}
        id="activites"
        title={a.divisionsTitle}
        lead={null}
        tone="surface"
        links={{
          production: productionHref ?? servicesHref,
          studio: STUDIO_ENABLED && mockups.length > 0 ? studioHref(locale) : null,
          catalog: localizedPath(locale, { route: "catalog" }),
          digital: serviceHref(DIGITAL_SOLUTIONS_SLUG) ?? servicesHref,
        }}
      />

      <Section aria-labelledby="approach-heading">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Heading as="h2" size="lg" id="audience-heading">
              {a.audienceTitle}
            </Heading>
            <ul className="mt-6 space-y-3" aria-labelledby="audience-heading">
              {a.audiences.map((audience) => (
                <li key={audience} className="text-fg flex items-start gap-2.5 font-medium">
                  <CheckIcon width={18} height={18} strokeWidth={2.25} aria-hidden="true" className="text-accent mt-0.5 shrink-0" />
                  {audience}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Heading as="h2" size="lg" id="approach-heading">
              {a.approachTitle}
            </Heading>
            <ul className="border-fg mt-6 grid border-t-2 sm:grid-cols-2">
              {a.approach.map((item) => (
                <li key={item.title} className="border-line border-b py-5 sm:pe-6">
                  <h3 className="text-fg font-semibold">{item.title}</h3>
                  <p className="text-fg-muted mt-1.5 text-sm leading-relaxed">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {mission || values ? (
        <Section aria-label={[dict.about.missionTitle, dict.about.valuesTitle].join(" / ")}>
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

      {facts.length > 0 ? (
        <Section aria-labelledby="info-heading">
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

      <section aria-labelledby="work-heading" className="bg-ink-900 text-white">
        <Container className="flex flex-col gap-6 py-14 lg:flex-row lg:items-end lg:justify-between lg:py-16">
          <div>
            <h2 id="work-heading" className="type-display text-2xl sm:text-3xl">
              {a.workTitle}
            </h2>
            <p className="mt-3 max-w-xl text-white/75">{a.workBody}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={quoteFormHref(locale)} variant="accent" size="lg">
              {dict.common.requestQuote}
            </ButtonLink>
            <ButtonLink href={localizedPath(locale, { route: "contact" })} variant="inverse" size="lg">
              {dict.common.contactUs}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
