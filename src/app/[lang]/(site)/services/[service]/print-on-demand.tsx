import { CustomRequestForm } from "@/components/print-on-demand/custom-request-form";
import { MockupStudio } from "@/components/print-on-demand/mockup-studio";
import { HeroMockups, ProductPicker } from "@/components/print-on-demand/pod-showcase";
import { PortfolioGallery } from "@/components/print-on-demand/portfolio-gallery";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ChevronIcon } from "@/components/ui/icons";
import { Container, Eyebrow, Heading, Lead, Section } from "@/components/ui/layout";
import { listMockupProducts, listPortfolio, listProductionOptions } from "@/features/print-on-demand/queries";
import type { ServiceDetail } from "@/features/services/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { publicEnv } from "@/lib/env";

const FORM_ID = "demande";
const STUDIO_ID = "studio";
// In-page jumps use plain <a href="#…"> (native, works before hydration); page links use ButtonLink.

/**
 * Print on demand ("Your idea. Your design. Our production."): hero with floating product
 * mockups, product picker, how it works, live mockup studio, gallery of past work (hidden
 * while empty), FAQ, the custom request form with file upload, and a closing call to action.
 * Text comes from the service record (owner-managed) and the dictionaries. No prices,
 * statistics, reviews or delivery promises (CLAUDE.md §1).
 */
export async function PrintOnDemandPage({ locale, dict, service }: { locale: Locale; dict: Dictionary; service: ServiceDetail }) {
  const [options, portfolio, mockups] = await Promise.all([listProductionOptions(locale), listPortfolio(locale), listMockupProducts()]);
  const t = dict.printOnDemand;
  const trackingHref = localizedPath(locale, { route: "track" });
  const pagePath = localizedPath(locale, { route: "service", slug: service.slug });
  const hasStudio = mockups.length > 0;

  const steps = [
    { title: t.step1Title, body: t.step1Body },
    { title: t.step2Title, body: t.step2Body },
    { title: t.step3Title, body: t.step3Body },
  ];

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
              {t.heroPoints.map((point) => (
                <li key={point} className="inline-flex items-center gap-2">
                  <CheckIcon />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`#${hasStudio ? STUDIO_ID : FORM_ID}`} className={buttonClasses("primary", "lg")}>
                {hasStudio ? t.designCta : t.startCta}
              </a>
              <ButtonLink href={trackingHref} variant="secondary" size="lg">
                {t.trackCta}
              </ButtonLink>
            </div>
          </div>
          {hasStudio ? <HeroMockups products={mockups} className="mt-12 lg:mt-16" /> : null}
        </Container>
      </div>

      {/* ─── Products ─────────────────────────────────────────────────────── */}
      {hasStudio ? (
        <Section aria-labelledby="pod-products-heading">
          <Container>
            <SectionIntro id="pod-products-heading" title={t.productsTitle} lead={t.productsLead} />
            <div className="mt-10">
              <ProductPicker products={mockups} names={t.studio.products} customizeLabel={t.customize} studioId={STUDIO_ID} />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section aria-labelledby="pod-steps-heading" className="bg-ink-900 text-white">
        <Container className="grid gap-10 py-16 lg:grid-cols-12 lg:gap-12 lg:py-24">
          <h2 id="pod-steps-heading" className="type-display text-3xl text-balance sm:text-4xl lg:col-span-4">
            {t.stepsTitle}
          </h2>
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

      {/* ─── Studio ───────────────────────────────────────────────────────── */}
      {hasStudio ? (
        <Section id={STUDIO_ID} aria-labelledby="pod-studio-heading" className="scroll-mt-20">
          <Container>
            <SectionIntro id="pod-studio-heading" title={t.studio.title} lead={t.studio.lead} />
            <div className="bg-surface border-line mt-10 rounded-2xl border p-4 sm:p-6 lg:p-8">
              <MockupStudio products={mockups} t={t.studio} formId={FORM_ID} />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ─── Gallery (hidden while empty) ─────────────────────────────────── */}
      {portfolio.length > 0 ? (
        <Section tone="surface" aria-labelledby="pod-gallery-heading">
          <Container>
            <SectionIntro id="pod-gallery-heading" title={t.galleryTitle} />
            <div className="mt-10">
              <PortfolioGallery items={portfolio} />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <Section tone={portfolio.length > 0 ? "default" : "surface"} aria-labelledby="pod-faq-heading">
        <Container className="max-w-3xl">
          <SectionIntro id="pod-faq-heading" title={t.faqTitle} />
          <div className="border-line bg-bg mt-10 divide-y divide-[var(--color-line)] rounded-[var(--radius-card)] border">
            {t.faq.map((item) => (
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
            <CustomRequestForm
              locale={locale}
              sourcePath={pagePath}
              privacyHref={localizedPath(locale, { route: "privacy" })}
              trackingHref={trackingHref}
              storageEndpoint={`${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/custom-uploads`}
              publishableKey={publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
              materials={options.filter((o) => o.kind === "material")}
              finishings={options.filter((o) => o.kind === "finishing")}
              t={{ forms: dict.forms, pod: t }}
            />
          </div>
        </Container>
      </Section>

      {/* ─── Closing call to action ───────────────────────────────────────── */}
      <section aria-labelledby="pod-final-heading" className="bg-ink-900 text-white">
        <Container className="py-16 lg:py-20">
          <h2 id="pod-final-heading" className="type-display max-w-2xl text-3xl leading-[1.08] text-balance sm:text-4xl">
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
      {lead ? <p className="text-fg-muted mt-4 text-lg leading-relaxed text-pretty">{lead}</p> : null}
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
