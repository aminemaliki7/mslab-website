import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { lang } from "next/root-params";
import { ServiceCard } from "@/components/catalog/service-card";
import { RichText } from "@/components/content/rich-text";
import { CtaBand } from "@/components/layout/cta-band";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Heading, Lead, Section } from "@/components/ui/layout";
import { getServiceBySlug, listServices, type ServiceDetail } from "@/features/services/queries";
import { hasLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath, type RouteKey } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";

/** Placeholder keeps the build valid (Cache Components needs ≥ 1 param) when no service is published. */
const NO_SERVICE = "__none__";

export async function generateStaticParams() {
  const value = await lang();
  const locale: Locale = hasLocale(value) ? value : "fr";
  const services = await listServices(locale);
  return services.length > 0 ? services.map((service) => ({ service: service.slug })) : [{ service: NO_SERVICE }];
}

function routesFor(service: ServiceDetail): Record<Locale, RouteKey> {
  return Object.fromEntries(
    locales.map((l) => [l, { route: "service", slug: service.slugs[l] ?? service.slugs.fr }]),
  ) as Record<Locale, RouteKey>;
}

async function load(params: PageProps<"/[lang]/services/[service]">["params"]) {
  const { service: slug } = await params;
  const locale = await getLocale();
  if (slug === NO_SERVICE) notFound();
  const decoded = decodeURIComponent(slug);
  const service = await getServiceBySlug(locale, decoded);
  if (!service) notFound();
  // Reached through another locale's slug (e.g. /en/services/<french-slug>): send to the canonical URL.
  const canonicalSlug = service.slugs[locale] ?? service.slugs.fr;
  if (decoded !== canonicalSlug) permanentRedirect(localizedPath(locale, { route: "service", slug: canonicalSlug }));
  return { locale, service };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/services/[service]">): Promise<Metadata> {
  const { locale, service } = await load(params);
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: routesFor(service),
    title: service.name,
    description: service.summary ?? dict.pages.services.description,
  });
}

export default async function ServicePage({ params }: PageProps<"/[lang]/services/[service]">) {
  const { locale, service } = await load(params);
  const [dict, all] = await Promise.all([getDictionary(locale), listServices(locale)]);
  const others = all.filter((s) => s.id !== service.id).slice(0, 3);

  return (
    <>

      <div className="bg-surface border-line border-b">
        <Container className="py-10 lg:py-14">
          <Breadcrumbs
            label={dict.sections.breadcrumb}
            items={[
              { label: dict.nav.home, href: localizedPath(locale, { route: "home" }) },
              { label: dict.nav.services, href: localizedPath(locale, { route: "services" }) },
              { label: service.name },
            ]}
          />
          <Heading as="h1" size="xl" className="mt-6 max-w-3xl">
            {service.name}
          </Heading>
          {service.summary ? <Lead className="mt-4 max-w-2xl">{service.summary}</Lead> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={localizedPath(locale, { route: "quote" })}>{dict.servicesPage.askQuote}</ButtonLink>
            <ButtonLink href={localizedPath(locale, { route: "contact" })} variant="secondary">
              {dict.common.contactUs}
            </ButtonLink>
          </div>
        </Container>
      </div>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-12">
          <div className={service.imageUrl ? "lg:col-span-7" : "lg:col-span-8"}>
            {service.description ? <RichText text={service.description} className="text-lg" /> : null}
          </div>
          {service.imageUrl ? (
            <div className="lg:col-span-5">
              <div className="bg-surface border-line relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border">
                <Image src={service.imageUrl} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" priority />
              </div>
            </div>
          ) : null}
        </Container>
      </Section>

      {others.length > 0 ? (
        <Section tone="surface" aria-labelledby="other-services-heading">
          <Container>
            <Heading as="h2" size="md" id="other-services-heading">
              {dict.servicesPage.otherServices}
            </Heading>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((other) => (
                <li key={other.id}>
                  <ServiceCard
                    service={other}
                    href={localizedPath(locale, { route: "service", slug: other.slug })}
                    cta={dict.sections.learnMore}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <CtaBand />
    </>
  );
}
