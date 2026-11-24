import type { Metadata } from "next";
import { ProductionIndex } from "@/components/catalog/production-index";
import { ServiceCard } from "@/components/catalog/service-card";
import { DigitalSolutionsSection } from "@/components/digital/digital-solutions-section";
import { DivisionsSection } from "@/components/home/divisions";
import { DIGITAL_SOLUTIONS_SLUG, PRINT_ON_DEMAND_SLUG } from "@/components/illustrations/service-art";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Container, Heading, Section } from "@/components/ui/layout";
import { PHOTOS } from "@/config/photos";
import { listMockupProducts } from "@/features/print-on-demand/queries";
import { listServices } from "@/features/services/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { digitalQuoteHref, localizedPath, quoteFormHref, studioHref } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";
import { STUDIO_ENABLED } from "@/config/features";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: { route: "services" },
    title: dict.seo.servicesTitle,
    description: dict.seo.servicesDescription,
  });
}

/** Supply services of the Catalogue & fournitures division (French slugs). */
const SUPPLY_SLUGS = ["fournitures-de-bureau", "papeterie-fournitures-scolaires", "livres-ouvrages"];

/**
 * Services hub (URL kept for SEO): the three divisions side by side, then each in detail:
 * production lines → supplies (database services) → Digital Solutions band.
 */
export default async function ServicesPage() {
  const locale = await getLocale();
  const [dict, services, mockups] = await Promise.all([getDictionary(locale), listServices(locale), listMockupProducts()]);
  const production = services.find((s) => s.slugs.fr === PRINT_ON_DEMAND_SLUG);
  const productionHref = production ? localizedPath(locale, { route: "service", slug: production.slug }) : null;
  const digital = services.find((s) => s.slugs.fr === DIGITAL_SOLUTIONS_SLUG);
  const digitalHref = digital ? localizedPath(locale, { route: "service", slug: digital.slug }) : null;
  const supplies = SUPPLY_SLUGS.flatMap((slug) => services.filter((s) => s.slugs.fr === slug));
  const catalogHref = localizedPath(locale, { route: "catalog" });
  const requestHref = productionHref ? `${productionHref}#demande` : quoteFormHref(locale);

  return (
    <>
      <PageHeader title={dict.pages.services.title} lead={dict.pages.services.description} photo={{ src: PHOTOS.shoppingBag, alt: dict.photos.shoppingBag }} />

      <DivisionsSection
        dict={dict}
        lead={null}
        className="pt-0 sm:pt-0 lg:pt-4"
        links={{
          production: `#production`,
          studio: STUDIO_ENABLED && mockups.length > 0 ? studioHref(locale) : null,
          catalog: `#fournitures`,
          digital: digitalHref ?? digitalQuoteHref(locale),
        }}
      />

      <Section id="production" aria-labelledby="production-heading" className="scroll-mt-20" tone="surface">
        <Container>
          <Heading as="h2" size="lg" id="production-heading">
            {dict.cx.divisions.production.title}
          </Heading>
          <p className="text-fg-muted mt-4 max-w-2xl text-lg leading-relaxed text-pretty">{dict.cx.divisions.production.body}</p>
          <ProductionIndex dict={dict} href={requestHref} className="mt-8" />
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={requestHref} size="lg">
              {dict.printOnDemand.startCta}
            </ButtonLink>
            {productionHref ? (
              <ButtonLink href={productionHref} variant="secondary" size="lg">
                {dict.printOnDemand.bandCta}
              </ButtonLink>
            ) : null}
          </div>
        </Container>
      </Section>

      <Section id="fournitures" aria-labelledby="supplies-heading" className="scroll-mt-20">
        <Container>
          <Heading as="h2" size="lg" id="supplies-heading">
            {dict.cx.divisions.catalog.title}
          </Heading>
          <p className="text-fg-muted mt-4 max-w-2xl text-lg leading-relaxed text-pretty">{dict.cx.hub.supplyLead}</p>
          {supplies.length > 0 ? (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {supplies.map((service) => (
                <li key={service.id}>
                  <ServiceCard service={service} href={localizedPath(locale, { route: "service", slug: service.slug })} cta={dict.sections.learnMore} />
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={catalogHref} size="lg">
              {dict.cx.hub.catalogCta}
            </ButtonLink>
            <ButtonLink href={quoteFormHref(locale)} variant="secondary" size="lg">
              {dict.common.requestQuote}
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* Digital Solutions: separate division, its own tinted band. */}
      <DigitalSolutionsSection dict={dict} pageHref={digitalHref} quoteHref={digitalQuoteHref(locale)} />
    </>
  );
}
