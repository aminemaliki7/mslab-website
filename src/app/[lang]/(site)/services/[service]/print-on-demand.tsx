import { PrintOnDemandIllustration } from "@/components/illustrations/scenes";
import { CustomRequestForm } from "@/components/print-on-demand/custom-request-form";
import { PortfolioGallery } from "@/components/print-on-demand/portfolio-gallery";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Eyebrow, Heading, Lead, Section } from "@/components/ui/layout";
import { MockupStudio } from "@/components/print-on-demand/mockup-studio";
import { listMockupProducts, listPortfolio, listProductionOptions } from "@/features/print-on-demand/queries";
import type { ServiceDetail } from "@/features/services/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { publicEnv } from "@/lib/env";

const FORM_ID = "demande";

/**
 * Print on demand ("Your idea. Your design. Our production."): how it works, the gallery of
 * past work (hidden while empty), the custom request form with file upload, and a link to
 * order tracking. Text comes from the service record (owner-managed) and the dictionaries.
 */
export async function PrintOnDemandPage({ locale, dict, service }: { locale: Locale; dict: Dictionary; service: ServiceDetail }) {
  const [options, portfolio, mockups] = await Promise.all([listProductionOptions(locale), listPortfolio(locale), listMockupProducts()]);
  const t = dict.printOnDemand;
  const trackingHref = localizedPath(locale, { route: "track" });
  const pagePath = localizedPath(locale, { route: "service", slug: service.slug });

  const steps = [
    { title: t.step1Title, body: t.step1Body },
    { title: t.step2Title, body: t.step2Body },
    { title: t.step3Title, body: t.step3Body },
  ];

  return (
    <>
      <div className="bg-surface border-line overflow-hidden border-b">
        <Container className="grid items-center gap-8 py-10 md:grid-cols-12 lg:py-16">
          <div className="md:col-span-7">
            <Breadcrumbs
              label={dict.sections.breadcrumb}
              items={[
                { label: dict.nav.home, href: localizedPath(locale, { route: "home" }) },
                { label: dict.nav.services, href: localizedPath(locale, { route: "services" }) },
                { label: service.name },
              ]}
            />
            <Eyebrow className="mt-6">{service.name}</Eyebrow>
            <Heading as="h1" size="xl" className="mt-3 max-w-3xl">
              {service.summary ?? t.heroTitle}
            </Heading>
            <Lead className="mt-4 max-w-2xl">{service.description ?? t.heroLead}</Lead>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`#${FORM_ID}`}>{t.startCta}</ButtonLink>
              <ButtonLink href={trackingHref} variant="secondary">
                {t.trackCta}
              </ButtonLink>
            </div>
          </div>
          <div className="order-first md:order-none md:col-span-5">
            <PrintOnDemandIllustration className="mx-auto w-full max-w-[18rem] md:max-w-md" />
          </div>
        </Container>
      </div>

      <Section aria-labelledby="pod-steps-heading">
        <Container>
          <Heading as="h2" size="lg" id="pod-steps-heading">
            {t.stepsTitle}
          </Heading>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="reveal border-line rounded-[var(--radius-card)] border p-6">
                <span className="bg-accent-soft text-accent inline-grid size-9 place-items-center rounded-full font-[family-name:var(--font-geist-mono)] text-sm font-semibold" dir="ltr">
                  {index + 1}
                </span>
                <h3 className="text-fg mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="text-fg-muted mt-2 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {mockups.length > 0 ? (
        <Section tone="surface" aria-labelledby="pod-studio-heading">
          <Container>
            <Heading as="h2" size="lg" id="pod-studio-heading">
              {t.studio.title}
            </Heading>
            <p className="text-fg-muted mt-3 max-w-2xl">{t.studio.lead}</p>
            <div className="mt-10">
              <MockupStudio products={mockups} t={t.studio} formId={FORM_ID} />
            </div>
          </Container>
        </Section>
      ) : null}

      {portfolio.length > 0 ? (
        <Section aria-labelledby="pod-gallery-heading">
          <Container>
            <Heading as="h2" size="lg" id="pod-gallery-heading">
              {t.galleryTitle}
            </Heading>
            <div className="mt-10">
              <PortfolioGallery items={portfolio} />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section id={FORM_ID} aria-labelledby="pod-form-heading" className="scroll-mt-20">
        <Container className="max-w-3xl">
          <Heading as="h2" size="lg" id="pod-form-heading">
            {t.formTitle}
          </Heading>
          <p className="text-fg-muted mt-3">{t.formLead}</p>
          <div className="mt-10">
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
    </>
  );
}
