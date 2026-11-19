import type { Metadata } from "next";
import { ProductionIndex } from "@/components/catalog/production-index";
import { PRINT_ON_DEMAND_SLUG } from "@/components/illustrations/service-art";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Container, Heading, Section } from "@/components/ui/layout";
import { PHOTOS } from "@/config/photos";
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
  // Production first (docs/POSITIONING.md §6): the five lines lead to the production page.
  const production = services.find((s) => s.slugs.fr === PRINT_ON_DEMAND_SLUG);
  const productionHref = production ? localizedPath(locale, { route: "service", slug: production.slug }) : null;
  return (
    <>
      <PageHeader title={dict.pages.services.title} lead={dict.pages.services.description} photo={{ src: PHOTOS.shoppingBag, alt: dict.photos.shoppingBag }} />

      <Section aria-labelledby="production-heading">
        <Container>
          <Heading as="h2" size="lg" id="production-heading">
            {dict.sections.servicesTitle}
          </Heading>
          <p className="text-fg-muted mt-4 max-w-2xl text-lg leading-relaxed text-pretty">{dict.sections.capabilitiesLead}</p>
          <ProductionIndex dict={dict} href={productionHref ? `${productionHref}#demande` : localizedPath(locale, { route: "quote" })} className="mt-8" />
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={productionHref ? `${productionHref}#demande` : localizedPath(locale, { route: "quote" })} size="lg">
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

    </>
  );
}
