import type { Metadata } from "next";
import { HeroScene } from "@/components/illustrations/scenes";
import { ServiceIndex } from "@/components/catalog/service-index";
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
      <PageHeader title={dict.pages.services.title} lead={dict.pages.services.description} illustration={<HeroScene />} />

      <Section aria-labelledby="services-list-heading">
        <Container>
          <Heading as="h2" size="lg" id="services-list-heading">
            {dict.servicesPage.listTitle}
          </Heading>
          {services.length > 0 ? (
            <ServiceIndex
              className="mt-8"
              rows={services.map((service) => ({
                slugFr: service.slugs.fr,
                name: service.name,
                summary: service.summary,
                href: localizedPath(locale, { route: "service", slug: service.slug }),
              }))}
            />
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

      <CtaBand />
    </>
  );
}
