import Image from "next/image";
import { Container, Heading, Section } from "@/components/ui/layout";
import type { ClientLogo } from "@/config/client-logos";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  title: string;
  subtitle?: string;
  logos: readonly ClientLogo[];
};

/**
 * Logo-only trust strip: heading, optional subtitle, logos. No cards, borders, shadows or
 * gradients. Logos keep their original colors and proportions inside a fixed-height row;
 * the list wraps (2 per row on phones, 3 on tablets, one row on desktop) and stays centered
 * whatever the number of logos. Renders nothing when the list is empty.
 */
export function ClientLogos({ locale, title, subtitle, logos }: Props) {
  if (logos.length === 0) return null;

  return (
    <Section aria-labelledby="clients-heading" className="border-line border-t">
      <Container>
        <div className="text-center">
          <Heading as="h2" size="lg" id="clients-heading" className="type-display">
            {title}
          </Heading>
          {subtitle ? <p className="text-fg-muted mt-3">{subtitle}</p> : null}
        </div>
        <ul className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-10 sm:gap-x-10 lg:mt-14 lg:flex-nowrap lg:justify-between lg:gap-x-12">
          {logos.map((logo) => (
            <li key={logo.id} className="flex h-16 basis-[calc(50%-0.75rem)] items-center justify-center sm:basis-[calc(33.333%-1.75rem)] lg:basis-auto">
              <Image
                src={logo.src}
                alt={logo.name[locale]}
                title={logo.name[locale]}
                width={logo.width}
                height={logo.height}
                sizes="(min-width: 1024px) 180px, 45vw"
                className="h-full w-auto max-w-full object-contain transition-transform duration-200 ease-[var(--ease-out-soft)] motion-safe:md:hover:scale-105"
              />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
