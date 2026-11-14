import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { ServiceCard } from "@/components/catalog/service-card";
import { RichText, toLines } from "@/components/content/rich-text";
import { CtaBand } from "@/components/layout/cta-band";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLink } from "@/components/ui/arrow-link";
import { ArrowIcon } from "@/components/ui/icons";
import { Container, Eyebrow, Heading, Lead, Section } from "@/components/ui/layout";
import { listFeaturedProducts } from "@/features/catalog/queries";
import { listServices } from "@/features/services/queries";
import { forLocale, getSiteSettings } from "@/features/settings/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    ...(await buildPageMetadata({
      locale,
      route: { route: "home" },
      title: dict.pages.home.title,
      description: dict.pages.home.description,
    })),
    title: { absolute: `MSLAB — ${dict.pages.home.title}` },
  };
}

/**
 * Homepage. Only verified content: business areas come from the brief; services, products,
 * company presentation and "why choose" points come from the database and each section is
 * omitted while its data is empty.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const [dict, settings, services, products] = await Promise.all([
    getDictionary(locale),
    getSiteSettings(),
    listServices(locale, { featuredOnly: true }),
    listFeaturedProducts(locale, 4),
  ]);

  const about = forLocale(settings.about, locale);
  const highlights = toLines(forLocale(settings.highlights, locale));

  return (
    <>
      <Hero locale={locale} dict={dict} />

      {about ? (
        <Section aria-labelledby="intro-heading">
          <Container className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Heading as="h2" size="lg" id="intro-heading">
                {dict.sections.introTitle}
              </Heading>
            </div>
            <div className="lg:col-span-8">
              <RichText text={about.split(/\n\s*\n/)[0] ?? about} className="text-lg" />
              <ArrowLink href={localizedPath(locale, { route: "about" })} className="mt-6">
                {dict.sections.learnMore}
              </ArrowLink>
            </div>
          </Container>
        </Section>
      ) : null}

      <BusinessAreas locale={locale} dict={dict} tone={about ? "surface" : "default"} />

      {services.length > 0 ? (
        <Section aria-labelledby="services-heading">
          <Container>
            <SectionHeader
              id="services-heading"
              title={dict.sections.featuredServicesTitle}
              link={{ href: localizedPath(locale, { route: "services" }), label: dict.sections.allServices }}
            />
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
          </Container>
        </Section>
      ) : null}

      {products.length > 0 ? (
        <Section aria-labelledby="products-heading" tone="surface">
          <Container>
            <SectionHeader
              id="products-heading"
              title={dict.sections.featuredProductsTitle}
              link={{ href: localizedPath(locale, { route: "catalog" }), label: dict.sections.allProducts }}
            />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    href={localizedPath(locale, { route: "product", slug: product.slug })}
                    labels={{ sku: dict.product.sku, noImage: dict.product.noImage }}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {highlights.length > 0 ? (
        <Section aria-labelledby="why-heading">
          <Container>
            <Heading as="h2" size="lg" id="why-heading">
              {dict.sections.whyTitle}
            </Heading>
            <ol className="border-line mt-10 grid border-t sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((point, index) => (
                <li key={index} className="border-line flex gap-4 border-b py-6 sm:pe-8">
                  <span className="text-accent font-[family-name:var(--font-geist-mono)] text-sm" dir="ltr">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-fg font-medium leading-snug">{point}</span>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      ) : null}

      <CtaBand />
    </>
  );
}

function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="bg-surface border-line relative overflow-hidden border-b">
      {/* Print-trade detail: registration crop marks framing the hero (decorative). */}
      <CropMarks />
      <Container className="relative py-16 sm:py-20 lg:py-28">
        <Eyebrow>MSLAB</Eyebrow>
        <Heading as="h1" size="display" className="mt-4 max-w-4xl">
          {dict.pages.home.title}
        </Heading>
        <Lead className="mt-6 max-w-2xl">{dict.footer.about}</Lead>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href={localizedPath(locale, { route: "quote" })} size="lg">
            {dict.common.requestQuote}
          </ButtonLink>
          <ButtonLink href={localizedPath(locale, { route: "contact" })} variant="secondary" size="lg">
            {dict.common.contactUs}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

function CropMarks() {
  const mark = "border-line-strong absolute size-6";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-4 hidden sm:block lg:inset-8">
      <span className={`${mark} start-0 top-0 border-s border-t`} />
      <span className={`${mark} end-0 top-0 border-e border-t`} />
      <span className={`${mark} start-0 bottom-0 border-s border-b`} />
      <span className={`${mark} end-0 bottom-0 border-e border-b`} />
    </div>
  );
}

function BusinessAreas({ locale, dict, tone }: { locale: Locale; dict: Dictionary; tone: "default" | "surface" }) {
  // Printing & B2B → services; office supplies & books → catalog.
  const areas = [
    { key: "printing", label: dict.businessAreas.printing, href: localizedPath(locale, { route: "services" }), cta: dict.sections.areasServicesLink },
    { key: "office", label: dict.businessAreas.office, href: localizedPath(locale, { route: "catalog" }), cta: dict.sections.areasCatalogLink },
    { key: "books", label: dict.businessAreas.books, href: localizedPath(locale, { route: "catalog" }), cta: dict.sections.areasCatalogLink },
    { key: "b2b", label: dict.businessAreas.b2b, href: localizedPath(locale, { route: "services" }), cta: dict.sections.areasServicesLink },
  ];
  return (
    <Section aria-labelledby="areas-heading" tone={tone}>
      <Container>
        <Heading as="h2" size="lg" id="areas-heading">
          {dict.sections.areasTitle}
        </Heading>
        <ul className="border-line mt-10 grid border-t sm:grid-cols-2 lg:grid-cols-4">
          {areas.map((area, index) => (
            <li key={area.key} className="border-line border-b sm:pe-6 lg:border-e lg:px-6 lg:first:ps-0 lg:last:border-e-0">
              <Link href={area.href} className="group flex h-full flex-col justify-between gap-10 py-8">
                <span className="text-fg-subtle font-[family-name:var(--font-geist-mono)] text-sm" dir="ltr">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="text-fg block text-lg font-semibold leading-snug">{area.label}</span>
                  <span className="text-accent mt-3 inline-flex items-center gap-1.5 text-sm font-medium">
                    {area.cta}
                    <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function SectionHeader({ id, title, link }: { id: string; title: string; link: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <Heading as="h2" size="lg" id={id}>
        {title}
      </Heading>
      <ArrowLink href={link.href}>{link.label}</ArrowLink>
    </div>
  );
}
