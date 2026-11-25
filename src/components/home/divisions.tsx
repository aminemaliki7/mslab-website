import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon, CheckIcon } from "@/components/ui/icons";
import { Container, Heading, Section } from "@/components/ui/layout";
import { PHOTOS } from "@/config/photos";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export const DIVISIONS_ID = "activites";

type Links = {
  production: string;
  studio: string | null;
  catalog: string;
  digital: string;
};

/**
 * MSLAB's three divisions side by side (docs/CX_AUDIT_AND_PLAN.md): custom production,
 * catalogue & supplies, digital solutions. Editorial header (title | lead), then three cards
 * with the same photographic treatment (config/photos.ts → division*: screen-printing press,
 * office supplies, code on a laptop). Each card carries one process-ink marker (C, M, Y:
 * the hero's control strip, docs/ART_DIRECTION.md) and leads to its own page with a quiet link.
 * Used on the homepage (after the hero), the Services hub and About.
 */
export function DivisionsSection({
  dict,
  links,
  id = DIVISIONS_ID,
  title,
  lead,
  tone,
  className,
}: {
  dict: Dictionary;
  links: Links;
  id?: string;
  title?: string;
  lead?: string | null;
  tone?: "default" | "surface";
  className?: string;
}) {
  const d = dict.cx.divisions;
  const headingId = `${id}-heading`;
  const leadText = lead === null ? null : (lead ?? d.lead);
  return (
    <Section id={id} tone={tone} aria-labelledby={headingId} className={cn("scroll-mt-20", className)}>
      <Container>
        <div className="reveal grid gap-4 lg:grid-cols-12 lg:items-end lg:gap-12">
          <Heading as="h2" size="xl" id={headingId} className="type-display lg:col-span-6">
            {title ?? d.title}
          </Heading>
          {leadText ? <p className="text-fg-muted text-base leading-relaxed text-pretty lg:col-span-5 lg:col-start-8">{leadText}</p> : null}
        </div>
        {/* Phones: stacked cards. Tablets: one card per row, photo beside the text. Desktop: three columns. */}
        <ul className="reveal-stagger mt-8 grid gap-5 lg:mt-12 lg:grid-cols-3 lg:gap-6">
          <DivisionCard
            number="01"
            ink="var(--color-process-c)"
            title={d.production.title}
            body={d.production.body}
            examples={d.production.examples}
            examplesLabel={d.examplesLabel}
            visual={<Illustration src={PHOTOS.heatPressArt} alt={dict.photos.heatPressArt} tint="#9c0d29" />}
            cta={{ href: links.production, label: d.production.cta }}
            secondary={links.studio ? { href: links.studio, label: d.production.secondary } : null}
          />
          <DivisionCard
            number="02"
            ink="var(--color-process-m)"
            title={d.catalog.title}
            body={d.catalog.body}
            examples={d.catalog.examples}
            examplesLabel={d.examplesLabel}
            visual={<Photo src={PHOTOS.divisionCatalogue} alt={dict.photos.divisionCatalogue} focus="50% 50%" />}
            cta={{ href: links.catalog, label: d.catalog.cta }}
          />
          <DivisionCard
            number="03"
            ink="var(--color-process-y)"
            title={d.digital.title}
            body={d.digital.body}
            examples={d.digital.examples}
            examplesLabel={d.examplesLabel}
            visual={<Photo src={PHOTOS.divisionDigital} alt={dict.photos.divisionDigital} focus="55% 60%" />}
            cta={{ href: links.digital, label: d.digital.cta }}
          />
        </ul>
      </Container>
    </Section>
  );
}

/** Portrait illustration with a flat colour field: shown whole, centred on that colour. */
function Illustration({ src, alt, tint }: { src: StaticImageData; alt: string; tint: string }) {
  return (
    <div className="absolute inset-0" style={{ backgroundColor: tint }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 14rem, (min-width: 768px) 22vw, 50vw"
        // The press fills ~80 % of the artwork's height: enlarge so it fills the frame (only flat red is trimmed).
        className="lift-photo origin-[50%_30%] scale-[1.15] object-contain"
      />
    </div>
  );
}

/** Full-bleed photo that leans in when the card is hovered (.lift / .lift-photo). */
function Photo({ src, alt, focus }: { src: StaticImageData; alt: string; focus: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 1280px) 24rem, (min-width: 1024px) 31vw, (min-width: 768px) 40vw, 92vw"
      className="lift-photo object-cover"
      style={{ objectPosition: focus }}
    />
  );
}

/** Card footer link: navy (main) or muted (secondary), teal on hover, arrow mirrored in RTL. */
function CardLink({ href, strong, children }: { href: string; strong?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "group hover:text-accent inline-flex min-h-11 items-center gap-1.5 text-sm transition-colors",
        strong ? "text-fg font-semibold" : "text-fg-muted",
      )}
    >
      {children}
      <ArrowIcon width={16} height={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
    </Link>
  );
}

function DivisionCard({
  number,
  ink,
  title,
  body,
  examples,
  examplesLabel,
  visual,
  cta,
  secondary,
}: {
  number: string;
  /** Process ink of the card's marker (C, M or Y). */
  ink: string;
  title: string;
  body: string;
  examples: string[];
  examplesLabel: string;
  visual: ReactNode;
  cta: { href: string; label: string };
  secondary?: { href: string; label: string } | null;
}) {
  return (
    <li className="lift bg-bg flex flex-col overflow-hidden md:flex-row lg:flex-col rounded-[var(--radius-card)] shadow-[0_18px_40px_-32px_rgb(14_26_43/0.45)] ring-1 ring-[var(--color-line)]">
      <div className="bg-paper-100 relative aspect-[4/3] shrink-0 overflow-hidden md:aspect-auto md:min-h-72 md:w-[42%] lg:aspect-[4/3] lg:min-h-0 lg:w-auto">{visual}</div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="text-fg-subtle flex items-center gap-3 text-xs font-semibold tracking-[0.14em] tabular-nums">
          <span aria-hidden="true" className="h-[3px] w-6 rounded-[1px]" style={{ backgroundColor: ink }} />
          {number}
        </p>
        <h3 className="type-display text-fg mt-3 text-[1.5rem]">{title}</h3>
        <p className="text-fg-muted mt-3 leading-relaxed text-pretty">{body}</p>
        <p className="sr-only">{examplesLabel}</p>
        <ul className="mt-5 mb-6 space-y-2.5">
          {examples.map((example) => (
            <li key={example} className="text-fg flex items-start gap-2.5 text-sm">
              <CheckIcon width={15} height={15} strokeWidth={2.25} className="text-accent mt-[0.2rem] shrink-0" aria-hidden="true" />
              {example}
            </li>
          ))}
        </ul>
        <div className="border-line mt-auto flex flex-wrap items-center justify-between gap-x-6 border-t pt-4">
          <CardLink href={cta.href} strong>
            {cta.label}
          </CardLink>
          {secondary ? <CardLink href={secondary.href}>{secondary.label}</CardLink> : null}
        </div>
      </div>
    </li>
  );
}
