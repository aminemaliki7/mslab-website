import type { Metadata } from "next";
import { ServiceCard } from "@/components/catalog/service-card";
import { CtaBand } from "@/components/layout/cta-band";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Container, Heading, Section } from "@/components/ui/layout";
import { listServices } from "@/features/services/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: { route: "services" },
    title: dict.pages.services.title,
    description: dict.pages.services.description,
  });
}

export default async function ServicesPage() {
  const locale = await getLocale();
  const [dict, services] = await Promise.all([getDictionary(locale), listServices(locale)]);

  return (
    <>
      <PageHeader title={dict.pages.services.title} lead={dict.pages.services.description} />

      <Section aria-labelledby="services-list-heading">
        <Container>
          <Heading as="h2" size="lg" id="services-list-heading">
            {dict.servicesPage.listTitle}
          </Heading>
          {services.length > 0 ? (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <li key={service.id}>
                  <ServiceCard
                    service={service}
                    href={localizedPath(locale, { route: "service", slug: service.slug })}
                    cta={dict.sections.learnMore}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="border-line mt-10 rounded-[var(--radius-card)] border border-dashed p-8">
              <p className="text-fg-muted max-w-xl">{dict.servicesPage.empty}</p>
              <ArrowLink href={localizedPath(locale, { route: "contact" })} className="mt-4">
                {dict.common.contactUs}
              </ArrowLink>
            </div>
          )}
        </Container>
      </Section>

      <Section tone="surface" aria-labelledby="areas-heading">
        <Container className="grid gap-8 lg:grid-cols-12">
          <Heading as="h2" size="md" id="areas-heading" className="lg:col-span-4">
            {dict.sections.areasTitle}
          </Heading>
          <ul className="border-line grid border-t sm:grid-cols-2 lg:col-span-8">
            {Object.values(dict.businessAreas).map((area) => (
              <li key={area} className="border-line text-fg border-b py-4 font-medium sm:pe-6">
                {area}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
