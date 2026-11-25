import type { Metadata } from "next";
import { Fragment, type CSSProperties } from "react";
import { ProductionIndex } from "@/components/catalog/production-index";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/content/organization-json-ld";
import { RichText, toLines } from "@/components/content/rich-text";
import { DivisionsSection } from "@/components/home/divisions";
import { Print3dSection } from "@/components/home/print-3d";
import { CatalogueCollage, type HeroProduct } from "@/components/home/catalogue-collage";
import { ControlStrip } from "@/components/home/control-strip";
import { JOURNEY_BG, ProjectJourney } from "@/components/home/project-journey";
import { HeroScene } from "@/components/illustrations/scenes";
import { DIGITAL_SOLUTIONS_SLUG, PRINT_ON_DEMAND_SLUG } from "@/components/illustrations/service-art";
import { whatsappHref } from "@/components/layout/whatsapp-button";
import { ArrowLink } from "@/components/ui/arrow-link";
import { ButtonLink } from "@/components/ui/button";
import { ChevronIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Container, Heading, Section } from "@/components/ui/layout";
import { PHOTOS } from "@/config/photos";
import { listFeaturedProducts, listProducts } from "@/features/catalog/queries";
import { listMockupProducts } from "@/features/print-on-demand/queries";
import { listServices } from "@/features/services/queries";
import { forLocale, getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { localizedPath, quoteFormHref, studioHref } from "@/i18n/routes";
import { cn } from "@/lib/utils";
import { buildPageMetadata } from "@/lib/seo";
import { STUDIO_ENABLED } from "@/config/features";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    ...(await buildPageMetadata({
      locale,
      route: { route: "home" },
      title: dict.pages.home.title,
      description: dict.seo.homeDescription,
    })),
    title: { absolute: `MSLAB — ${dict.pages.home.title}` },
  };
}

/**
 * Homepage (docs/CX_AUDIT_AND_PLAN.md §3). The first screen answers what MSLAB offers (promise,
 * the three activities in the lead), who it serves and how to start (quote) or follow an order. Then the
 * three divisions → how to work with MSLAB (six steps, every division) → what we produce → what
 * MSLAB simplifies → who we are → FAQ → contact. Database-driven sections are omitted while
 * their data is empty; no prices, quantities or figures are invented.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const [dict, settings, services, mockups, featured, firstPage] = await Promise.all([
    getDictionary(locale),
    getSiteSettings(),
    listServices(locale),
    listMockupProducts(),
    listFeaturedProducts(locale, 8),
    listProducts({ locale }),
  ]);

  // Hero collage: featured products first, then the catalogue order; only products with a photo.
  const seen = new Set<string>();
  const heroProducts: HeroProduct[] = [];
  for (const product of [...featured, ...firstPage.items]) {
    if (!product.image || seen.has(product.id) || heroProducts.length >= 8) continue;
    seen.add(product.id);
    heroProducts.push({
      id: product.id,
      name: product.name,
      href: localizedPath(locale, { route: "product", slug: product.slug }),
      image: { url: product.image.url, alt: product.image.alt },
    });
  }

  const about = forLocale(settings.about, locale);
  const highlights = toLines(forLocale(settings.highlights, locale));
  const production = services.find((s) => s.slugs.fr === PRINT_ON_DEMAND_SLUG);
  const productionHref = production ? localizedPath(locale, { route: "service", slug: production.slug }) : null;
  const quoteHref = quoteFormHref(locale);
  // Production request form when the production page exists, otherwise the general quote.
  const productionRequestHref = productionHref ? `${productionHref}#demande` : quoteHref;
  const servicesHref = localizedPath(locale, { route: "services" });
  const digital = services.find((s) => s.slugs.fr === DIGITAL_SOLUTIONS_SLUG);
  const studioPage = STUDIO_ENABLED && mockups.length > 0 ? studioHref(locale) : null;

  return (
    <>
      <OrganizationJsonLd locale={locale} />
      <WebSiteJsonLd locale={locale} />
      <Hero
        dict={dict}
        products={heroProducts}
        catalogHref={localizedPath(locale, { route: "catalog" })}
        quoteHref={quoteHref}
        trackingHref={localizedPath(locale, { route: "track" })}
      />

      {/* ─── The three divisions: what MSLAB offers ────────────────────────── */}
      <DivisionsSection
        dict={dict}
        tone="surface"
        links={{
          production: productionHref ?? servicesHref,
          studio: studioPage,
          catalog: localizedPath(locale, { route: "catalog" }),
          digital: digital ? localizedPath(locale, { route: "service", slug: digital.slug }) : servicesHref,
        }}
      />

      {/* ─── 3D printing: the printer's own timelapse ─────────────────────── */}
      <Print3dSection dict={dict} quoteHref={quoteHref} />

      {/* ─── How to work with MSLAB (every division) ───────────────────────── */}
      <section aria-labelledby="process-heading" className="text-white" style={{ backgroundColor: JOURNEY_BG }}>
        <Container className="py-12 sm:py-16 lg:py-24">
          <div className="reveal flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
            <h2 id="process-heading" className="type-display max-w-xl text-2xl text-balance sm:text-3xl">
              {dict.cx.flow.title}
            </h2>
            <ButtonLink href={quoteHref} variant="accent" size="lg" className="w-full sm:w-auto">
              {dict.cx.flow.cta}
            </ButtonLink>
          </div>
          <ProjectJourney steps={dict.cx.flow.steps} background={JOURNEY_BG} variant="home" className="mt-8 sm:mt-10 lg:mt-16" />
        </Container>
      </section>

      {/* ─── Production capabilities ──────────────────────────────────────── */}
      <Section aria-labelledby="services-heading" tone="surface">
        <Container>
          <SectionHeader
            id="services-heading"
            title={dict.sections.servicesTitle}
            link={{ href: productionHref ?? servicesHref, label: dict.cx.divisions.production.cta }}
          />
          <p className="text-fg-muted mt-4 max-w-2xl text-base leading-relaxed text-pretty">{dict.sections.capabilitiesLead}</p>
          <ProductionIndex dict={dict} href={productionRequestHref} className="mt-8 lg:mt-10" />
        </Container>
      </Section>

      {/* ─── What MSLAB simplifies (not a sequence: no numbers) ───────────── */}
      <Section aria-labelledby="pain-heading">
        <Container>
          <Heading as="h2" size="xl" id="pain-heading" className="type-display reveal">
            {dict.sections.painTitle}
          </Heading>
          <ul className="reveal-stagger mt-8 grid gap-8 md:grid-cols-3 lg:mt-10">
            {dict.sections.painPoints.map((point) => (
              <li key={point.title} className="border-fg border-t-2 pt-5">
                <h3 className="text-fg text-base font-semibold leading-snug">{point.title}</h3>
                <p className="text-fg-muted mt-2 leading-relaxed">{point.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ─── Who we are + why (owner-managed text; hidden while empty) ────── */}
      {about || highlights.length > 0 ? (
        <Section aria-labelledby={about ? "intro-heading" : "why-heading"} className="pt-0 sm:pt-0 lg:pt-0">
          <Container className="grid gap-12 lg:grid-cols-12">
            {about ? (
              <div className={cn("reveal", highlights.length > 0 ? "lg:col-span-6" : "lg:col-span-8")}>
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
                <ul className="reveal-stagger border-fg mt-6 border-t-2">
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

      {/* ─── FAQ (known facts only) ───────────────────────────────────────── */}
      <Section aria-labelledby="faq-heading" tone="surface">
        <Container className="grid gap-8 lg:grid-cols-12">
          <Heading as="h2" size="xl" id="faq-heading" className="type-display lg:col-span-4">
            {dict.cx.faq.title}
          </Heading>
          <div className="border-line bg-bg divide-y divide-[var(--color-line)] rounded-[var(--radius-card)] border lg:col-span-8">
            {dict.cx.faq.items.map((item) => (
              <details key={item.q} className="group px-5 sm:px-6">
                <summary className="text-fg flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronIcon width={18} height={18} aria-hidden="true" className="text-fg-muted shrink-0 rotate-90 transition-transform duration-200 group-open:-rotate-90" />
                </summary>
                <p className="text-fg-muted -mt-1 pb-5 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      {/* ─── Closing call to action ───────────────────────────────────────── */}
      {/* Brand teal: the one coloured band, distinct from the navy footer below it. */}
      <section aria-labelledby="closing-heading" className="bg-primary text-white">
        <Container className="grid gap-8 py-14 lg:grid-cols-12 lg:items-end lg:py-20">
          <div className="lg:col-span-7">
            <h2 id="closing-heading" className="type-display text-2xl text-balance sm:text-3xl">
              {dict.cx.closing.title}
            </h2>
            <p className="mt-4 max-w-xl text-white/90">{dict.cx.closing.body}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:col-span-5 lg:justify-end">
            <ButtonLink href={quoteHref} variant="accent" size="lg">
              {dict.cx.closing.quote}
            </ButtonLink>
            <ButtonLink href={localizedPath(locale, { route: "contact" })} variant="inverse" size="lg">
              {dict.cx.closing.contact}
            </ButtonLink>
            {settings.whatsappNumber ? (
              <a
                href={whatsappHref(settings.whatsappNumber, dict.whatsapp.prefill)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 px-2 text-sm font-medium text-white underline-offset-4 hover:underline"
              >
                <WhatsAppIcon width={18} height={18} aria-hidden="true" />
                WhatsApp
              </a>
            ) : null}
          </div>
        </Container>
      </section>
    </>
  );
}

/**
 * Hero (docs/DESIGN_SYSTEM.md §0): the promise in Anton capitals, a lead naming the three
 * activities and the audiences, two calls to action (quote / order tracking) and a link to the
 * full catalogue — beside the object collage: one large pageable tile of real catalogue products
 * (each opens its product page) above two fixed tiles, « Votre idée » (T-shirt tech pack) and
 * « Notre production » (heat-press illustration). On phones the actions come right after the
 * lead, then the collage, then the catalogue link. Falls back to the activities scene when no
 * published product has a photo.
 */
function Hero({
  dict,
  products,
  catalogHref,
  quoteHref,
  trackingHref,
}: {
  dict: Dictionary;
  products: HeroProduct[];
  catalogHref: string;
  quoteHref: string;
  trackingHref: string;
}) {
  // "Votre idée. Votre design. Notre production." → one sentence per line.
  const lines = dict.printOnDemand.heroTitle.split(/(?<=\.)\s+/);
  // The small tiles stand for the first and last sentences: idea (tech pack), production.
  const stages = lines.map((line) => (line.endsWith(".") ? line.slice(0, -1) : line));

  return (
    <section className="overflow-hidden">
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-6 pt-7 pb-10 sm:pt-8 sm:pb-12 lg:grid-cols-12 lg:gap-y-8 lg:pt-10 lg:pb-14">
        <div className="order-1 lg:col-span-6 lg:row-start-1">
          <p className="text-accent anim-rise text-sm tracking-wide">{dict.cx.hero.tagline}</p>
          <h1 className="type-poster text-fg mt-3 text-[clamp(2.25rem,11vw,3.5rem)] [overflow-wrap:normal] lg:text-[clamp(2.75rem,4vw,3.75rem)]">
            {lines.map((line, index) => (
              <Fragment key={line}>
                {/* Word space between the sentences for assistive tech and copy/paste. */}
                {index > 0 ? " " : null}
                <span className="anim-line" style={{ "--d": index + 1 } as CSSProperties}>
                  <span>{line}</span>
                </span>
              </Fragment>
            ))}
          </h1>
          <p className="text-fg-muted anim-rise mt-5 max-w-lg text-base leading-relaxed text-pretty [--d:4] sm:text-[1.0625rem]">{dict.cx.hero.lead}</p>
        </div>

        <div className="anim-rise order-2 [--d:5] lg:order-none lg:col-span-6 lg:row-start-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <ButtonLink href={quoteHref} size="lg">
              {dict.cx.hero.quote}
            </ButtonLink>
            <ButtonLink href={trackingHref} variant="secondary" size="lg">
              {dict.printOnDemand.trackCta}
            </ButtonLink>
          </div>
        </div>

        <div className="anim-rise order-4 [--d:6] lg:order-none lg:col-span-6 lg:row-start-3">
          <ArrowLink href={catalogHref}>{dict.sections.allProducts}</ArrowLink>
          {/* Printer's control strip (docs/ART_DIRECTION.md): the four process inks, once per site. */}
          <ControlStrip variant="process" className="mt-7 lg:mt-9" barClassName="h-1.5 max-w-[10.5rem] gap-[3px] sm:h-2 [&>span]:rounded-[1px]" />
        </div>

        <div className="anim-rise order-3 [--d:2] [--rise:36px] lg:order-none lg:col-span-6 lg:col-start-7 lg:row-span-3 lg:row-start-1 lg:ms-auto lg:w-full lg:max-w-[27rem] lg:self-center">
          {products.length > 0 ? (
            <CatalogueCollage
              products={products}
              labels={{ stage: dict.nav.catalog, previous: dict.sections.proofPrev, next: dict.sections.proofNext }}
              photos={[
                { src: PHOTOS.tshirt, alt: dict.photos.tshirt, caption: stages[0], contain: true },
                { src: PHOTOS.heatPressArt, alt: dict.photos.heatPressArt, caption: stages[2], tint: "#9c0d29" },
              ]}
            />
          ) : (
            <HeroScene className="mx-auto w-full max-w-[19rem] sm:max-w-md lg:max-w-xl" />
          )}
        </div>
      </Container>
    </section>
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
