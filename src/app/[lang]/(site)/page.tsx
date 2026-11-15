import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { ServiceIndex, type ServiceIndexRow } from "@/components/catalog/service-index";
import { ClientLogos } from "@/components/content/client-logos";
import { OrganizationJsonLd } from "@/components/content/organization-json-ld";
import { RichText, toLines } from "@/components/content/rich-text";
import { ControlStrip } from "@/components/home/control-strip";
import { LiveProof } from "@/components/home/live-proof";
import { SuppliesArt } from "@/components/illustrations/product-art";
import { HeroScene } from "@/components/illustrations/scenes";
import { CORE_SERVICE_SLUGS, PRINT_ON_DEMAND_SLUG } from "@/components/illustrations/service-art";
import { CtaBand } from "@/components/layout/cta-band";
import { ArrowLink } from "@/components/ui/arrow-link";
import { ButtonLink } from "@/components/ui/button";
import { ArrowIcon } from "@/components/ui/icons";
import { Container, Heading, Lead, Section } from "@/components/ui/layout";
import { CLIENT_LOGOS } from "@/config/client-logos";
import { listCategories, listFeaturedProducts } from "@/features/catalog/queries";
import type { MockupKey } from "@/features/print-on-demand/mockup-keys";
import { listMockupProducts } from "@/features/print-on-demand/queries";
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
 * Homepage (docs/ART_DIRECTION.md). Narrative: what MSLAB does (tagline + live proof) →
 * what it produces (services index) → how an order works (three steps) → the catalogue →
 * who MSLAB is → organizations → contact. Only verified content: services, products,
 * presentation and "why" points come from the database; a section is omitted while its data
 * is empty.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const [dict, settings, services, products, categories, mockups] = await Promise.all([
    getDictionary(locale),
    getSiteSettings(),
    listServices(locale),
    listFeaturedProducts(locale, 4),
    listCategories(locale),
    listMockupProducts(),
  ]);

  const about = forLocale(settings.about, locale);
  const highlights = toLines(forLocale(settings.highlights, locale));
  const printOnDemand = services.find((s) => s.slugs.fr === PRINT_ON_DEMAND_SLUG);
  const podHref = printOnDemand ? localizedPath(locale, { route: "service", slug: printOnDemand.slug }) : null;
  const servicesHref = localizedPath(locale, { route: "services" });

  // Services index: print on demand first, then the four core activities, then other featured services.
  const coreLabels: Record<string, string> = {
    "impression-reprographie": dict.businessAreas.printing,
    "fournitures-de-bureau": dict.businessAreas.office,
    "papeterie-fournitures-scolaires": dict.businessAreas.school,
    "livres-ouvrages": dict.businessAreas.books,
  };
  const indexed = new Set([PRINT_ON_DEMAND_SLUG, ...CORE_SERVICE_SLUGS]);
  const rows: ServiceIndexRow[] = [
    ...(printOnDemand ? [{ slugFr: PRINT_ON_DEMAND_SLUG, name: printOnDemand.name, summary: dict.printOnDemand.heroLead, href: podHref ?? servicesHref }] : []),
    ...CORE_SERVICE_SLUGS.map((slugFr) => {
      const service = services.find((s) => s.slugs.fr === slugFr);
      return {
        slugFr,
        name: service?.name ?? coreLabels[slugFr] ?? slugFr,
        summary: service?.summary ?? null,
        href: service ? localizedPath(locale, { route: "service", slug: service.slug }) : servicesHref,
      };
    }),
    ...services
      .filter((s) => s.isFeatured && !indexed.has(s.slugs.fr))
      .map((s) => ({ slugFr: s.slugs.fr, name: s.name, summary: s.summary, href: localizedPath(locale, { route: "service", slug: s.slug }) })),
  ];

  const steps = [
    { title: dict.printOnDemand.step1Title, body: dict.printOnDemand.step1Body },
    { title: dict.printOnDemand.step2Title, body: dict.printOnDemand.step2Body },
    { title: dict.printOnDemand.step3Title, body: dict.printOnDemand.step3Body },
  ];
  const topCategories = categories.filter((c) => !c.parentId);

  return (
    <>
      <OrganizationJsonLd locale={locale} />
      <Hero locale={locale} dict={dict} mockups={mockups} studioHref={podHref ? `${podHref}#studio` : null} />

      {/* ─── What we produce: an index, not cards ─────────────────────────── */}
      <Section aria-labelledby="services-heading">
        <Container>
          <SectionHeader id="services-heading" title={dict.sections.servicesTitle} link={{ href: servicesHref, label: dict.sections.allServices }} />
          <ServiceIndex rows={rows} className="mt-8 lg:mt-10" />
        </Container>
      </Section>

      {/* ─── How an order works (a real sequence, so it is numbered) ──────── */}
      {podHref ? (
        <section aria-labelledby="process-heading" className="bg-ink-900 text-white">
          <Container className="grid gap-10 py-16 lg:grid-cols-12 lg:gap-12 lg:py-24">
            <div className="lg:col-span-4">
              <h2 id="process-heading" className="type-display text-3xl text-balance sm:text-4xl">
                {dict.printOnDemand.stepsTitle}
              </h2>
              <ButtonLink href={`${podHref}#studio`} variant="accent" size="lg" className="mt-8">
                {dict.sections.processCta}
              </ButtonLink>
            </div>
            <ol className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
              {steps.map((step, index) => (
                <li key={step.title} className="border-t border-white/25 pt-5">
                  <span className="type-display text-cyan-300 block text-5xl" dir="ltr">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-white/75">{step.body}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      {/* ─── Catalogue (product cards unchanged) ──────────────────────────── */}
      {products.length > 0 ? (
        <Section aria-labelledby="products-heading" tone="surface">
          <Container>
            <SectionHeader
              id="products-heading"
              title={dict.sections.catalogTitle}
              link={{ href: localizedPath(locale, { route: "catalog" }), label: dict.sections.allProducts }}
            />
            {topCategories.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-1">
                {topCategories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={localizedPath(locale, { route: "category", slug: category.slug })}
                      className="text-fg-muted hover:text-fg decoration-line-strong hover:decoration-fg inline-flex min-h-11 items-center underline underline-offset-4"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* ─── Who we are + why (owner-managed text; hidden while empty) ────── */}
      {about || highlights.length > 0 ? (
        <Section aria-labelledby={about ? "intro-heading" : "why-heading"}>
          <Container className="grid gap-12 lg:grid-cols-12">
            {about ? (
              <div className={highlights.length > 0 ? "lg:col-span-6" : "lg:col-span-8"}>
                <Heading as="h2" size="lg" id="intro-heading" className="type-display">
                  {dict.sections.introTitle}
                </Heading>
                <RichText text={about.split(/\n\s*\n/)[0] ?? about} className="mt-6 text-lg" />
                <ArrowLink href={localizedPath(locale, { route: "about" })} className="mt-6">
                  {dict.sections.learnMore}
                </ArrowLink>
              </div>
            ) : null}
            {highlights.length > 0 ? (
              <div className={about ? "lg:col-span-5 lg:col-start-8" : "lg:col-span-12"}>
                <Heading as="h2" size="lg" id="why-heading" className="type-display">
                  {dict.sections.whyTitle}
                </Heading>
                <ul className="border-fg mt-6 border-t-2">
                  {highlights.map((point, index) => (
                    <li key={index} className="border-line text-fg border-b py-4 font-medium leading-snug">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Container>
        </Section>
      ) : null}

      <ClientLogos locale={locale} title={dict.sections.clientsTitle} subtitle={dict.sections.clientsSubtitle} logos={CLIENT_LOGOS} />

      <CtaBand />
    </>
  );
}

/**
 * Hero: the tagline set large, one sentence per line, beside the live proof (type a name,
 * see it on products). Falls back to the activities scene when no mockup product is active.
 */
function Hero({ locale, dict, mockups, studioHref }: { locale: Locale; dict: Dictionary; mockups: MockupKey[]; studioHref: string | null }) {
  // "Votre idée. Votre design. Notre production." → one sentence per line.
  const lines = dict.printOnDemand.heroTitle.split(/(?<=\.)\s+/);
  const t = dict.printOnDemand.studio;

  return (
    <section className="bg-surface border-line overflow-hidden border-b">
      <Container className="grid items-center gap-10 pt-10 pb-8 sm:pt-14 lg:grid-cols-12 lg:gap-10 lg:pt-20 lg:pb-12">
        <div className="lg:col-span-6">
          <h1 className="type-display text-fg text-[clamp(2rem,8.2vw,3.5rem)] lg:text-[clamp(2.75rem,4vw,3.75rem)]">
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <Lead className="mt-6 max-w-xl">{dict.sections.heroLead}</Lead>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={localizedPath(locale, { route: "quote" })} size="lg">
              {dict.common.requestQuote}
            </ButtonLink>
            <ButtonLink href={localizedPath(locale, { route: "contact" })} variant="secondary" size="lg">
              {dict.common.contactUs}
            </ButtonLink>
          </div>
        </div>
        <div className="lg:col-span-6">
          {mockups.length > 0 && studioHref ? (
            <LiveProof
              products={mockups}
              names={t.products}
              studioHref={studioHref}
              labels={{
                field: dict.sections.proofLabel,
                placeholder: dict.sections.proofPlaceholder,
                cta: dict.sections.proofCta,
                note: dict.sections.proofNote,
                preview: t.previewLabel,
              }}
            />
          ) : (
            <HeroScene className="mx-auto w-full max-w-[19rem] sm:max-w-md lg:max-w-xl" />
          )}
        </div>
      </Container>
      <Container className="pb-6">
        <ControlStrip />
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
      <Heading as="h2" size="xl" id={id} className="type-display">
        {title}
      </Heading>
      <ArrowLink href={link.href}>{link.label}</ArrowLink>
    </div>
  );
}
