import { DigitalIcon, DigitalScene } from "@/components/illustrations/digital-art";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Container } from "@/components/ui/layout";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Digital Solutions division band (homepage and Services page): a separate business line from
 * printing and production, so it gets its own tinted band and browser drawing instead of
 * product photos. No portfolio, client or figure — only the services offered.
 */
export function DigitalSolutionsSection({
  dict,
  pageHref,
  quoteHref,
  headingId = "digital-heading",
}: {
  dict: Dictionary;
  /** Landing page, or null while the service is not published. */
  pageHref: string | null;
  /** Quote page opened on the web-project form (digitalQuoteHref). */
  quoteHref: string;
  headingId?: string;
}) {
  const d = dict.digital;
  return (
    <section aria-labelledby={headingId} className="bg-cyan-50">
      <Container className="grid items-center gap-10 py-16 lg:grid-cols-12 lg:gap-12 lg:py-24">
        <div className="reveal lg:col-span-6">
          <p className="text-accent text-sm font-semibold">{d.eyebrow}</p>
          <h2 id={headingId} className="type-display text-fg mt-3 text-2xl text-balance sm:text-3xl">
            {d.title}
          </h2>
          <p className="text-fg-muted mt-4 max-w-xl text-base leading-relaxed text-pretty">{d.lead}</p>
          <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {d.services.map((service, i) => (
              <li key={service.title} className="text-fg flex items-center gap-3 text-sm font-medium">
                <span className="bg-bg text-accent grid size-9 shrink-0 place-items-center rounded-xl border border-cyan-700/15">
                  <DigitalIcon index={i} className="size-5" />
                </span>
                {service.title}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <ButtonLink href={pageHref ?? quoteHref} size="lg">
              {pageHref ? d.discoverCta : dict.common.requestQuote}
            </ButtonLink>
            {pageHref ? <ArrowLink href={quoteHref}>{dict.common.requestQuote}</ArrowLink> : null}
          </div>
        </div>
        <div className="order-first lg:order-none lg:col-span-6">
          <DigitalScene className="mx-auto w-full max-w-md lg:max-w-none" />
        </div>
      </Container>
    </section>
  );
}
