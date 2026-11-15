import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { ServiceCard } from "@/components/catalog/service-card";
import { SuppliesArt } from "@/components/illustrations/product-art";
import { HeroScene, PrintOnDemandIllustration } from "@/components/illustrations/scenes";
import { CORE_SERVICE_SLUGS, PRINT_ON_DEMAND_SLUG, ServiceArt } from "@/components/illustrations/service-art";
import { OrganizationJsonLd } from "@/components/content/organization-json-ld";
import { RichText, toLines } from "@/components/content/rich-text";
import { CtaBand } from "@/components/layout/cta-band";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLink } from "@/components/ui/arrow-link";
import { ArrowIcon } from "@/components/ui/icons";
import { Container, Eyebrow, Heading, Lead, Section } from "@/components/ui/layout";
import { listFeaturedProducts } from "@/features/catalog/queries";
import { listServices, type ServiceSummary } from "@/features/services/queries";
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
 * Homepage. Only verified content: the four core services (owner-provided, DB-managed) shown as
 * picture cards; products, company presentation and "why choose" points come from the database
 * and each section is omitted while its data is empty.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const [dict, settings, services, products] = await Promise.all([
    getDictionary(locale),
    getSiteSettings(),
    listServices(locale),
    listFeaturedProducts(locale, 4),
  ]);

  const about = forLocale(settings.about, locale);
  // Core services already appear as picture cards; list only other featured ones below.
  const otherFeatured = services.filter((s) => s.isFeatured && !CORE_SERVICE_SLUGS.includes(s.slugs.fr) && s.slugs.fr !== PRINT_ON_DEMAND_SLUG);
  const printOnDemand = services.find((s) => s.slugs.fr === PRINT_ON_DEMAND_SLUG);
  const highlights = toLines(forLocale(settings.highlights, locale));

  return (
    <>
      <OrganizationJsonLd locale={locale} />
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

      <CoreServices locale={locale} dict={dict} services={services} tone={about ? "surface" : "default"} />

      {printOnDemand ? (
        <PrintOnDemandBand
          href={localizedPath(locale, { route: "service", slug: printOnDemand.slug })}
          eyebrow={printOnDemand.name}
          title={printOnDemand.summary ?? dict.printOnDemand.heroTitle}
          body={dict.printOnDemand.heroLead}
          cta={dict.printOnDemand.bandCta}
        />
      ) : null}

      {otherFeatured.length > 0 ? (
        <Section aria-labelledby="services-heading">
          <Container>
            <SectionHeader
              id="services-heading"
              title={dict.sections.featuredServicesTitle}
              link={{ href: localizedPath(locale, { route: "services" }), label: dict.sections.allServices }}
            />
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherFeatured.map((service) => (
                <li key={service.id} className="reveal">
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
                <li key={product.id} className="reveal">
                  <ProductCard
                    product={product}
                    href={localizedPath(locale, { route: "product", slug: product.slug })}
                    labels={{ sku: dict.product.sku, noImage: dict.product.noImage }}
                  />
                </li>
              ))}
              {/* Fills the row with a catalogue card (not a product) while fewer than 4 are featured. */}
              {products.length < 4 ? (
                <li className="reveal">
                  <CatalogCard href={localizedPath(locale, { route: "catalog" })} title={dict.sections.allProducts} body={dict.pages.catalog.description} />
                </li>
              ) : null}
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
                <li key={index} className="reveal border-line flex gap-4 border-b py-6 sm:pe-8">
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
      <Container className="relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-12 lg:py-20">
        <div className="lg:col-span-6">
        <Eyebrow>MSLAB</Eyebrow>
        <Heading as="h1" size="display" className="mt-4 max-w-3xl">
          {dict.pages.home.title}
        </Heading>
        <Lead className="mt-6 max-w-2xl">{dict.sections.heroLead}</Lead>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href={localizedPath(locale, { route: "quote" })} size="lg">
            {dict.common.requestQuote}
          </ButtonLink>
          <ButtonLink href={localizedPath(locale, { route: "contact" })} variant="secondary" size="lg">
            {dict.common.contactUs}
          </ButtonLink>
        </div>
        </div>
        {/* The scene explains the four activities at a glance — shown on every screen size. */}
        {/* Phones: the scene comes first (compact) so the activities are understood before reading. */}
        <div className="order-first lg:order-none lg:col-span-6">
          <HeroScene className="mx-auto w-full max-w-[19rem] sm:max-w-md lg:max-w-xl" />
        </div>
      </Container>
    </section>
  );
}

function CropMarks() {
  const mark = "hero-crop-mark border-line-strong absolute size-6";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-4 hidden sm:block lg:inset-8">
      <span className={`${mark} hero-crop-mark-1 start-0 top-0 border-s border-t`} />
      <span className={`${mark} hero-crop-mark-2 end-0 top-0 border-e border-t`} />
      <span className={`${mark} hero-crop-mark-3 start-0 bottom-0 border-s border-b`} />
      <span className={`${mark} hero-crop-mark-4 end-0 bottom-0 border-e border-b`} />
    </div>
  );
}

/**
 * The four core services as picture cards (picture first: understandable without reading).
 * Names come from the dictionaries; each card links to the service page when it is published,
 * otherwise to the services list.
 */
function CoreServices({ locale, dict, services, tone }: { locale: Locale; dict: Dictionary; services: ServiceSummary[]; tone: "default" | "surface" }) {
  const labels: Record<string, string> = {
    "impression-reprographie": dict.businessAreas.printing,
    "fournitures-de-bureau": dict.businessAreas.office,
    "papeterie-fournitures-scolaires": dict.businessAreas.school,
    "livres-ouvrages": dict.businessAreas.books,
  };
  return (
    <Section aria-labelledby="areas-heading" tone={tone}>
      <Container>
        <Heading as="h2" size="lg" id="areas-heading">
          {dict.sections.areasTitle}
        </Heading>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_SERVICE_SLUGS.map((slugFr, index) => {
            const service = services.find((s) => s.slugs.fr === slugFr);
            const href = service
              ? localizedPath(locale, { route: "service", slug: service.slug })
              : localizedPath(locale, { route: "services" });
            return (
              <li key={slugFr} className="reveal">
                <Link
                  href={href}
                  className="group border-line bg-bg hover:border-line-strong flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-18px_rgb(14_26_43/0.45)]"
                >
                  <span className="bg-surface border-line block border-b px-6 pt-6 pb-4">
                    <span className="mx-auto block max-w-[15rem] transition-transform duration-300 group-hover:-translate-y-1">
                      <ServiceArt slugFr={slugFr} className="w-full" />
                    </span>
                  </span>
                  <span className="flex flex-1 flex-col gap-3 p-5">
                    <span className="text-fg-subtle font-[family-name:var(--font-geist-mono)] text-sm" dir="ltr">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-fg block text-lg font-semibold leading-snug">{service?.name ?? labels[slugFr]}</span>
                    {service?.summary ? <span className="text-fg-muted text-sm leading-relaxed">{service.summary}</span> : null}
                    <span className="text-accent mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium">
                      {dict.sections.learnMore}
                      <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

/** Print on demand highlight: idea → production, picture first on phones. */
function PrintOnDemandBand({ href, eyebrow, title, body, cta }: { href: string; eyebrow: string; title: string; body: string; cta: string }) {
  return (
    <section aria-labelledby="pod-band-heading" className="bg-ink-900 overflow-hidden text-white">
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-6">
          <p className="text-cyan-300 text-sm font-semibold">{eyebrow}</p>
          <h2 id="pod-band-heading" className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">{body}</p>
          <ButtonLink href={href} variant="accent" size="lg" className="mt-8">
            {cta}
          </ButtonLink>
        </div>
        <div className="order-first lg:order-none lg:col-span-6">
          <div className="bg-surface mx-auto max-w-md rounded-[var(--radius-card)] p-6 sm:p-8">
            <PrintOnDemandIllustration className="w-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Dark "browse the catalogue" card, same footprint as a product card. */
function CatalogCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group bg-ink-900 flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-18px_rgb(14_26_43/0.6)]"
    >
      <span className="relative block aspect-[4/3] bg-white/[0.06]">
        <span className="absolute inset-0 grid place-items-center px-6 pt-4 pb-2">
          <SuppliesArt className="w-full max-w-[13rem] transition-transform duration-300 group-hover:-translate-y-1" />
        </span>
      </span>
      <span className="flex flex-1 flex-col p-4">
        <span className="font-semibold leading-snug">{title}</span>
        <span className="mt-1.5 text-sm leading-relaxed text-white/75">{body}</span>
        <span className="mt-auto inline-flex pt-3" aria-hidden="true">
          <ArrowIcon width={18} height={18} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
        </span>
      </span>
    </Link>
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
