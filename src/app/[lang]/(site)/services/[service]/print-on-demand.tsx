import { ProductionIndex } from "@/components/catalog/production-index";
import { JOURNEY_BG, ProjectJourney } from "@/components/home/project-journey";
import { BriefOrForm } from "@/components/forms/brief-or-form";
import { briefProps, requestFlow } from "@/components/forms/request-flow";
import { CustomRequestForm } from "@/components/print-on-demand/custom-request-form";
import { HeroMockups } from "@/components/print-on-demand/pod-showcase";
import { PortfolioGallery } from "@/components/print-on-demand/portfolio-gallery";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ChevronIcon } from "@/components/ui/icons";
import { Container, Eyebrow, Heading, Lead, Section } from "@/components/ui/layout";
import { listMockupProducts, listPortfolio, listProductionOptions } from "@/features/print-on-demand/queries";
import type { ServiceDetail } from "@/features/services/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath, studioHref } from "@/i18n/routes";
import { publicEnv } from "@/lib/env";
import { STUDIO_ENABLED } from "@/config/features";

const FORM_ID = "demande";
const STUDIO_ID = "studio";
/** Dictionary entries about the Studio (printOnDemand.heroPoints / faq), hidden while it is off. */
const STUDIO_HERO_POINT = 1;
const STUDIO_FAQ = [3, 5];
// In-page jumps use plain <a href="#…"> (native, works before hydration); page links use ButtonLink.

/**
 * Custom production ("Your idea. Your design. Our production."; French slug kept as
 * `impression-a-la-demande` for URL stability — docs/POSITIONING.md): hero with floating product
 * mockups and the bulk-only note, how a production project works, live mockup studio (to
 * prepare a brief), gallery of past work (hidden while empty), FAQ, the production request form
 * with file upload, and a closing call to action.
 * Text comes from the service record (owner-managed) and the dictionaries. No prices,
 * statistics, reviews or delivery promises (CLAUDE.md §1).
 */
export async function PrintOnDemandPage({ locale, dict, service }: { locale: Locale; dict: Dictionary; service: ServiceDetail }) {
  const [options, portfolio, mockups, flow] = await Promise.all([listProductionOptions(locale), listPortfolio(locale), listMockupProducts(), requestFlow(locale, dict)]);
  const t = dict.printOnDemand;
  const trackingHref = localizedPath(locale, { route: "track" });
  const pagePath = localizedPath(locale, { route: "service", slug: service.slug });
  const hasStudio = STUDIO_ENABLED && mockups.length > 0;
  // Studio off: its hero point ("preview of your design") and its two FAQ answers are hidden too.
  const heroPoints = hasStudio ? t.heroPoints : t.heroPoints.filter((_, i) => i !== STUDIO_HERO_POINT);
  const faq = hasStudio ? t.faq : t.faq.filter((_, i) => !STUDIO_FAQ.includes(i));

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div className="border-line overflow-hidden border-b">
        <Container className="pt-6 pb-12 lg:pb-16">
          <Breadcrumbs
            label={dict.sections.breadcrumb}
            items={[
              { label: dict.nav.home, href: localizedPath(locale, { route: "home" }) },
              { label: dict.nav.services, href: localizedPath(locale, { route: "services" }) },
              { label: service.name },
            ]}
          />
          <div className="mt-8 max-w-4xl lg:mt-12">
            <Eyebrow>{service.name}</Eyebrow>
            <Heading as="h1" size="display" className="mt-4">
              {service.summary ?? t.heroTitle}
            </Heading>
            <Lead className="mt-5 max-w-2xl">{service.description ?? t.heroLead}</Lead>
            <ul className="text-fg mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
              {heroPoints.map((point) => (
                <li key={point} className="inline-flex items-center gap-2">
                  <CheckIcon />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`#${FORM_ID}`} className={buttonClasses("primary", "lg")}>
                {t.startCta}
              </a>
              {hasStudio ? (
                <a href={studioHref(locale)} className={buttonClasses("secondary", "lg")}>
                  {t.designCta}
                </a>
              ) : (
                <ButtonLink href={trackingHref} variant="secondary" size="lg">
                  {t.trackCta}
                </ButtonLink>
              )}
            </div>
            <p className="text-fg mt-5 flex max-w-xl items-start gap-2 text-sm font-medium">
              <span aria-hidden="true" className="bg-accent mt-1.5 size-2 shrink-0 rounded-full" />
              {dict.sections.bulkNote}
            </p>
          </div>
          {hasStudio ? <HeroMockups products={mockups} names={t.studio.products} hrefs={Object.fromEntries(mockups.map((key) => [key, studioHref(locale, key)]))} className="mt-12 lg:mt-16" /> : null}
        </Container>
      </div>

      {/* ─── Production capabilities (each line leads to the request form) ── */}
      <Section aria-labelledby="pod-lines-heading">
        <Container>
          <SectionIntro id="pod-lines-heading" title={dict.sections.servicesTitle} lead={dict.sections.capabilitiesLead} />
          <ProductionIndex dict={dict} href={`#${FORM_ID}`} className="mt-8 lg:mt-10" />
        </Container>
      </Section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section aria-labelledby="pod-steps-heading" className="text-white" style={{ backgroundColor: JOURNEY_BG }}>
        <Container className="py-12 sm:py-16 lg:py-24">
          <h2 id="pod-steps-heading" className="type-display max-w-xl text-2xl text-balance sm:text-3xl">
            {t.stepsTitle}
          </h2>
          <ProjectJourney steps={t.workflow} background={JOURNEY_BG} className="mt-8 sm:mt-10 lg:mt-16" />
        </Container>
      </section>

      {/* ─── Studio ───────────────────────────────────────────────────────── */}
      {hasStudio ? (
        <Section id={STUDIO_ID} aria-labelledby="pod-studio-heading" className="scroll-mt-20">
          <Container>
            <SectionIntro id="pod-studio-heading" title={dict.cx.studio.title} lead={dict.cx.studio.lead} />
            {/* What the studio does, in four steps, and what the preview is (and is not). */}
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {dict.cx.studio.steps.map((step, index) => (
                <li key={step} className="border-line flex items-start gap-3 rounded-[var(--radius-card)] border p-4">
                  <span aria-hidden="true" className="bg-primary text-on-primary grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-fg text-sm leading-snug font-medium">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-fg-muted mt-4 flex max-w-3xl items-start gap-2 text-sm">
              <span aria-hidden="true" className="bg-accent mt-1.5 size-2 shrink-0 rounded-full" />
              {dict.cx.studio.note}
            </p>
            {/* The editor itself lives on its own page (/studio), as a five-step project. */}
            <ButtonLink href={studioHref(locale)} size="lg" className="mt-8">
              {dict.cx.studioFlow.open}
            </ButtonLink>
          </Container>
        </Section>
      ) : null}

      {/* ─── Gallery (hidden while empty) ─────────────────────────────────── */}
      {portfolio.length > 0 ? (
        <Section aria-labelledby="pod-gallery-heading">
          <Container>
            <SectionIntro id="pod-gallery-heading" title={t.galleryTitle} />
            <div className="mt-10">
              <PortfolioGallery items={portfolio} />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <Section aria-labelledby="pod-faq-heading">
        <Container className="max-w-3xl">
          <SectionIntro id="pod-faq-heading" title={t.faqTitle} />
          <div className="border-line bg-bg mt-10 divide-y divide-[var(--color-line)] rounded-[var(--radius-card)] border">
            {faq.map((item) => (
              <details key={item.q} className="group px-5 sm:px-6">
                <summary className="text-fg flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronIcon width={18} height={18} className="text-fg-muted shrink-0 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="text-fg-muted -mt-1 pb-5 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      {/* ─── Request form ─────────────────────────────────────────────────── */}
      <Section id={FORM_ID} aria-labelledby="pod-form-heading" className="scroll-mt-20">
        <Container className="max-w-3xl">
          <SectionIntro id="pod-form-heading" title={t.formTitle} lead={t.formLead} />
          <div className="border-line mt-10 rounded-2xl border p-5 sm:p-8">
            <BriefOrForm {...briefProps(locale, dict, "custom", pagePath, flow)}>
            <CustomRequestForm
              locale={locale}
              sourcePath={pagePath}
              privacyHref={localizedPath(locale, { route: "privacy" })}
              trackingHref={trackingHref}
              storageEndpoint={`${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/custom-uploads`}
              publishableKey={publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
              materials={options.filter((o) => o.kind === "material")}
              finishings={options.filter((o) => o.kind === "finishing")}
              flow={flow}
              t={{ forms: dict.forms, pod: t }}
            />
            </BriefOrForm>
          </div>
        </Container>
      </Section>

      {/* ─── Closing call to action ───────────────────────────────────────── */}
      <section aria-labelledby="pod-final-heading" className="bg-ink-900 text-white">
        <Container className="py-16 lg:py-20">
          <h2 id="pod-final-heading" className="type-display max-w-2xl text-2xl text-balance sm:text-3xl">
            {t.finalTitle}
          </h2>
          <p className="mt-4 max-w-xl text-white/75">{t.finalBody}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`#${FORM_ID}`} className={buttonClasses("accent", "lg")}>
              {t.startCta}
            </a>
            <ButtonLink href={trackingHref} variant="inverse" size="lg">
              {t.trackCta}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}

function SectionIntro({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <div className="max-w-2xl">
      <Heading as="h2" size="xl" id={id}>
        {title}
      </Heading>
      {lead ? <p className="text-fg-muted mt-4 text-base leading-relaxed text-pretty">{lead}</p> : null}
    </div>
  );
}

// ─── Icons (decorative, brand stroke style) ──────────────────────────────────

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="text-accent shrink-0">
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.14" />
      <path d="M6 10.2L8.7 12.9L14 7.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
