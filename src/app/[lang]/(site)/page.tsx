import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import { ProductionIndex } from "@/components/catalog/production-index";
import { ClientLogos } from "@/components/content/client-logos";
import { OrganizationJsonLd } from "@/components/content/organization-json-ld";
import { RichText, toLines } from "@/components/content/rich-text";
import { ProofCollage, ProofField } from "@/components/home/live-proof";
import { HeroScene } from "@/components/illustrations/scenes";
import { PRINT_ON_DEMAND_SLUG } from "@/components/illustrations/service-art";
import { ArrowLink } from "@/components/ui/arrow-link";
import { ButtonLink } from "@/components/ui/button";
import { Container, Heading, Section } from "@/components/ui/layout";
import { CLIENT_LOGOS } from "@/config/client-logos";
import { PHOTOS } from "@/config/photos";
import type { MockupKey } from "@/features/print-on-demand/mockup-keys";
import { listMockupProducts } from "@/features/print-on-demand/queries";
import { listServices } from "@/features/services/queries";
import { forLocale, getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { localizedPath, quoteFormHref } from "@/i18n/routes";
import { cn } from "@/lib/utils";
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

const CAPABILITIES_ID = "capacites";

/**
 * Homepage (docs/POSITIONING.md §5). Narrative: custom production in quantity (promise, bulk-only
 * note, live proof) → two journeys (businesses / brands & creators) → production capabilities →
 * how a production project works → what MSLAB simplifies → who MSLAB is → organizations → contact.
 * Database-driven sections are omitted while
 * their data is empty; no prices, quantities or figures are invented.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const [dict, settings, services, mockups] = await Promise.all([
    getDictionary(locale),
    getSiteSettings(),
    listServices(locale),
    listMockupProducts(),
  ]);

  const about = forLocale(settings.about, locale);
  const highlights = toLines(forLocale(settings.highlights, locale));
  const production = services.find((s) => s.slugs.fr === PRINT_ON_DEMAND_SLUG);
  const productionHref = production ? localizedPath(locale, { route: "service", slug: production.slug }) : null;
  const quoteHref = quoteFormHref(locale);
  // Production request form when the production page exists, otherwise the general quote.
  const productionRequestHref = productionHref ? `${productionHref}#demande` : quoteHref;
  const servicesHref = localizedPath(locale, { route: "services" });
  const steps = [
    { title: dict.printOnDemand.step1Title, body: dict.printOnDemand.step1Body },
    { title: dict.printOnDemand.step2Title, body: dict.printOnDemand.step2Body },
    { title: dict.printOnDemand.step3Title, body: dict.printOnDemand.step3Body },
  ];

  return (
    <>
      <OrganizationJsonLd locale={locale} />
      <Hero
        dict={dict}
        mockups={mockups}
        studioHref={productionHref ? `${productionHref}#studio` : null}
        requestHref={productionRequestHref}
      />

      {/* ─── Two journeys: businesses / brands & creators ─────────────────── */}
      <Section aria-labelledby="journeys-heading">
        <Container>
          <Heading as="h2" size="xl" id="journeys-heading" className="type-display reveal">
            {dict.journeys.title}
          </Heading>
          <div className="reveal-stagger mt-8 grid gap-5 md:grid-cols-2 lg:mt-10">
            <Journey journey={dict.journeys.business} href={quoteHref} photo={{ src: PHOTOS.staffTshirt, alt: dict.photos.staffTshirt, focus: "50% 12%" }} />
            <Journey journey={dict.journeys.brands} href={productionRequestHref} photo={{ src: PHOTOS.printedSweatshirts, alt: dict.photos.printedSweatshirts, focus: "50% 53%" }} dark />
          </div>
        </Container>
      </Section>

      {/* ─── Production capabilities ──────────────────────────────────────── */}
      <Section id={CAPABILITIES_ID} aria-labelledby="services-heading" className="scroll-mt-20">
        <Container>
          <SectionHeader id="services-heading" title={dict.sections.servicesTitle} link={{ href: servicesHref, label: dict.sections.allServices }} />
          <p className="text-fg-muted mt-4 max-w-2xl text-base leading-relaxed text-pretty">{dict.sections.capabilitiesLead}</p>
          <ProductionIndex dict={dict} href={productionRequestHref} className="mt-8 lg:mt-10" />
        </Container>
      </Section>

      {/* ─── How a production project works (a real sequence, so it is numbered) ─── */}
      <section aria-labelledby="process-heading" className="text-white" style={{ backgroundColor: "#0E1A2B" }}>
        <Container className="grid gap-10 py-16 lg:grid-cols-12 lg:gap-12 lg:py-24">
          <div className="reveal lg:col-span-4">
            <h2 id="process-heading" className="type-display text-2xl text-balance sm:text-3xl">
              {dict.printOnDemand.stepsTitle}
            </h2>
            <ButtonLink href={productionRequestHref} variant="accent" size="lg" className="mt-8">
              {dict.sections.processCta}
            </ButtonLink>
          </div>
          <ol className="reveal-stagger grid gap-8 sm:grid-cols-3 lg:col-span-8">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t border-white/25 pt-5">
                <span className="type-poster text-cyan-300 block text-5xl" dir="ltr">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-white/75">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

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
        <Section aria-labelledby={about ? "intro-heading" : "why-heading"}>
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

      <ClientLogos locale={locale} title={dict.sections.clientsTitle} subtitle={dict.sections.clientsSubtitle} logos={CLIENT_LOGOS} />

    </>
  );
}

/**
 * Hero (docs/DESIGN_SYSTEM.md §0): the promise in light capitals, the production lead, the
 * brand-name field, the bulk-only note and one call to action — beside an object collage that
 * shows the typed brand on MSLAB products. On phones the collage comes right after the call to
 * action and the field follows it, so typing and seeing stay on one screen. Falls back to the
 * activities scene when no mockup product is active.
 */
function Hero({
  dict,
  mockups,
  studioHref,
  requestHref,
}: {
  dict: Dictionary;
  mockups: MockupKey[];
  studioHref: string | null;
  requestHref: string;
}) {
  // "Votre idée. Votre design. Notre production." → one sentence per line.
  const lines = dict.printOnDemand.heroTitle.split(/(?<=\.)\s+/);
  const t = dict.printOnDemand.studio;
  // The three tiles stand for the three sentences: idea (tech pack), design (live), production.
  const stages = lines.map((line) => (line.endsWith(".") ? line.slice(0, -1) : line));
  const proof = mockups.length > 0 && studioHref;

  return (
    <section className="overflow-hidden">
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-6 pt-7 pb-10 sm:pt-8 sm:pb-12 lg:grid-cols-12 lg:gap-y-8 lg:pt-10 lg:pb-14">
        <div className="order-1 lg:col-span-6 lg:row-start-1">
          <p className="text-accent anim-rise text-sm tracking-wide">{dict.sections.tagline}</p>
          <h1 className="type-poster text-fg mt-3 text-[clamp(2.25rem,11vw,3.5rem)] [overflow-wrap:normal] lg:text-[clamp(2.75rem,4vw,3.75rem)]">
            {lines.map((line, index) => (
              <span key={line} className="anim-line" style={{ "--d": index + 1 } as CSSProperties}>
                <span>{line}</span>
              </span>
            ))}
          </h1>
          <p className="text-fg-muted anim-rise mt-5 max-w-lg text-base leading-relaxed text-pretty [--d:4] sm:text-[1.0625rem]">{dict.sections.heroLead}</p>
        </div>

        {proof ? (
          <ProofField
            studioHref={studioHref}
            className="anim-rise order-4 max-w-xl [--d:5] lg:order-none lg:col-span-6 lg:row-start-2"
            labels={{
              field: dict.sections.proofLabel,
              placeholder: dict.sections.proofPlaceholder,
              cta: dict.sections.proofCta,
              note: dict.sections.proofNote,
            }}
          />
        ) : null}

        <div className="anim-rise order-2 [--d:6] lg:order-none lg:col-span-6 lg:row-start-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ButtonLink href={requestHref} size="lg">
              {dict.common.requestProductionQuote}
            </ButtonLink>
            <a href={`#${CAPABILITIES_ID}`} className="text-fg inline-flex min-h-11 items-center text-sm font-medium underline decoration-1 underline-offset-4">
              {dict.sections.capabilitiesCta}
            </a>
          </div>
        </div>

        <div className="anim-rise order-3 [--d:2] [--rise:36px] lg:order-none lg:col-span-6 lg:col-start-7 lg:row-span-3 lg:row-start-1 lg:ms-auto lg:w-full lg:max-w-[27rem] lg:self-center">
          {proof ? (
            <ProofCollage
              products={mockups}
              names={t.products}
              labels={{
                placeholder: dict.sections.proofPlaceholder,
                preview: t.previewLabel,
                previous: dict.sections.proofPrev,
                next: dict.sections.proofNext,
                stage: stages[1],
              }}
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

/** One customer journey: who it is for, what MSLAB produces for them, one quote CTA. */
function Journey({
  journey,
  href,
  photo,
  dark = false,
}: {
  journey: Dictionary["journeys"]["business"];
  href: string;
  photo: { src: StaticImageData; alt: string; focus?: string };
  dark?: boolean;
}) {
  return (
    <article
      className={cn(
        "lift flex flex-col rounded-[var(--radius-card)] p-3 pb-6 sm:pb-7",
        dark ? "bg-ink-900 text-white" : "bg-paper-100",
      )}
    >
      <div className="bg-paper-100 settle-frame relative aspect-[21/9] overflow-hidden rounded-[calc(var(--radius-card)-0.5rem)]">
        <div className="reveal-settle absolute inset-0">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 768px) 36rem, 100vw"
            className="lift-photo object-cover"
            style={photo.focus ? { objectPosition: photo.focus } : undefined}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-3 pt-5 sm:px-4">
        <p className={cn("text-sm font-semibold", dark ? "text-cyan-300" : "text-accent")}>{journey.eyebrow}</p>
        <h3 className="mt-3 text-xl font-semibold text-balance sm:text-2xl">{journey.title}</h3>
        <p className={cn("mt-4 leading-relaxed", dark ? "text-white/75" : "text-fg-muted")}>{journey.body}</p>
        <ul className={cn("mt-6 border-t", dark ? "border-white/25" : "border-fg/20")}>
          {journey.points.map((point) => (
            <li key={point} className={cn("border-b py-3 font-medium", dark ? "border-white/15" : "border-fg/10")}>
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-8">
          <ButtonLink href={href} variant={dark ? "accent" : "primary"} size="lg" className="w-full sm:w-auto">
            {journey.cta}
          </ButtonLink>
        </div>
      </div>
    </article>
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
