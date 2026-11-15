import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { whatsappHref } from "./whatsapp-button";

/** Closing conversion band: quote (primary), contact, WhatsApp when a verified number exists. */
export async function CtaBand() {
  const locale = await getLocale();
  const [dict, settings] = await Promise.all([getDictionary(locale), getSiteSettings()]);

  return (
    <section aria-labelledby="cta-heading" className="bg-ink-900 text-white">
      <Container className="flex flex-col gap-8 py-14 lg:flex-row lg:items-center lg:justify-between lg:py-16">
        <div className="max-w-2xl">
          <h2 id="cta-heading" className="type-display text-2xl leading-[1.1] text-balance sm:text-3xl">
            {dict.sections.ctaTitle}
          </h2>
          <p className="mt-3 text-white/75">{dict.sections.ctaBody}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={localizedPath(locale, { route: "quote" })} variant="accent" size="lg">
            {dict.common.requestQuote}
          </ButtonLink>
          <ButtonLink href={localizedPath(locale, { route: "contact" })} variant="inverse" size="lg">
            {dict.common.contactUs}
          </ButtonLink>
          {settings.whatsappNumber ? (
            <a
              href={whatsappHref(settings.whatsappNumber, dict.whatsapp.prefill)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("inverseGhost", "lg")}
            >
              <WhatsAppIcon width={20} height={20} />
              {dict.sections.ctaWhatsApp}
            </a>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
