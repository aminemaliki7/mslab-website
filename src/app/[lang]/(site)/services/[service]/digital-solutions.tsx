import { JsonLd } from "@/components/content/json-ld";
import { JOURNEY_BG, ProjectJourney } from "@/components/home/project-journey";
import { DigitalIcon, DigitalScene } from "@/components/illustrations/digital-art";
import { DigitalRequestForm } from "@/components/digital/digital-request-form";
import { DIGITAL_FORM_ID } from "@/features/digital/schema";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Eyebrow, Heading, Lead, Section } from "@/components/ui/layout";
import type { ServiceDetail } from "@/features/services/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { siteUrl } from "@/lib/env";

/**
 * Digital Solutions landing page (DIGITAL_SOLUTIONS_SLUG): MSLAB's web division, kept visually
 * apart from the printing catalogue (tinted hero, browser drawing, line icons). Hero with quote
 * and contact CTAs, the six web services, how a web project works, the web-project request form.
 * Projects go through the dedicated web-project request form below (kind 'digital' in the
 * quotation inbox) or the contact form. No portfolio, clients, testimonials, prices or delivery times (CLAUDE.md §1).
 */
export function DigitalSolutionsPage({ locale, dict, service }: { locale: Locale; dict: Dictionary; service: ServiceDetail }) {
  const d = dict.digital;
  const pagePath = localizedPath(locale, { route: "service", slug: service.slug });
  const contactHref = localizedPath(locale, { route: "contact" });
  const pageUrl = `${siteUrl}${pagePath}`;

  return (
    <>
      {/* Verified fields only: what the service is and who provides it (no offers or ratings). */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.name,
          description: service.summary ?? d.lead,
          serviceType: d.services.map((s) => s.title),
          provider: { "@type": "Organization", name: "MSLAB", url: siteUrl },
          url: pageUrl,
        }}
      />

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-cyan-50 overflow-hidden">
        <Container className="pt-6 pb-14 lg:pb-20">
          <Breadcrumbs
            label={dict.sections.breadcrumb}
            items={[
              { label: dict.nav.home, href: localizedPath(locale, { route: "home" }) },
              { label: dict.nav.services, href: localizedPath(locale, { route: "services" }) },
              { label: service.name },
            ]}
          />
          <div className="mt-8 grid items-center gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <Eyebrow>{d.eyebrow}</Eyebrow>
              <Heading as="h1" size="display" className="mt-4">
                {service.summary ?? d.heroTitle}
              </Heading>
              <Lead className="mt-5 max-w-xl">{service.description ?? d.lead}</Lead>
              <div className="mt-8 flex flex-wrap gap-3">
                {/* In-page jump: plain <a> (works before hydration). */}
                <a href={`#${DIGITAL_FORM_ID}`} className={buttonClasses("primary", "lg")}>
                  {dict.common.requestQuote}
                </a>
                <ButtonLink href={contactHref} variant="secondary" size="lg">
                  {dict.sections.ctaDiscuss}
                </ButtonLink>
              </div>
              <p className="text-fg mt-5 flex max-w-xl items-start gap-2 text-sm font-medium">
                <span aria-hidden="true" className="bg-accent mt-1.5 size-2 shrink-0 rounded-full" />
                {d.quoteNote}
              </p>
            </div>
            <div className="order-first lg:order-none lg:col-span-6">
              <DigitalScene className="mx-auto w-full max-w-md lg:max-w-none" />
            </div>
          </div>
        </Container>
      </div>

      {/* ─── Services ─────────────────────────────────────────────────────── */}
      <Section aria-labelledby="digital-services-heading">
        <Container>
          <Heading as="h2" size="xl" id="digital-services-heading" className="type-display reveal">
            {d.servicesTitle}
          </Heading>
          <ul className="reveal-stagger mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
            {d.services.map((item, i) => (
              <li key={item.title} className="border-line rounded-[var(--radius-card)] border p-6">
                <span className="bg-cyan-50 text-accent grid size-12 place-items-center rounded-2xl">
                  <DigitalIcon index={i} className="size-6" />
                </span>
                <h3 className="text-fg mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="text-fg-muted mt-2 leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ─── How a web project works: animated journey (same as the production one) ─── */}
      <section aria-labelledby="digital-process-heading" className="text-white" style={{ backgroundColor: JOURNEY_BG }}>
        <Container className="py-12 sm:py-16 lg:py-24">
          <h2 id="digital-process-heading" className="type-display max-w-xl text-2xl text-balance sm:text-3xl">
            {d.processTitle}
          </h2>
          <ProjectJourney steps={d.process} background={JOURNEY_BG} variant="web" className="mt-8 sm:mt-10 lg:mt-16" />
        </Container>
      </section>

      {/* ─── Web-project request form ─────────────────────────────────────── */}
      <Section id={DIGITAL_FORM_ID} aria-labelledby="digital-form-heading" className="scroll-mt-20">
        <Container className="max-w-3xl">
          <Heading as="h2" size="xl" id="digital-form-heading" className="type-display">
            {dict.digitalForm.title}
          </Heading>
          <p className="text-fg-muted mt-4 max-w-2xl leading-relaxed">{dict.digitalForm.lead}</p>
          <div className="border-line mt-10 rounded-2xl border p-5 sm:p-8">
            <DigitalRequestForm
              locale={locale}
              sourcePath={pagePath}
              privacyHref={localizedPath(locale, { route: "privacy" })}
              trackingHref={localizedPath(locale, { route: "track" })}
              t={{ forms: dict.forms, form: dict.digitalForm, trackCta: dict.printOnDemand.trackCta }}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
