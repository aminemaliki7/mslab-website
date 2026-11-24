import Image from "next/image";
import type { ReactNode } from "react";
import { DigitalScene } from "@/components/illustrations/digital-art";
import { ArrowLink } from "@/components/ui/arrow-link";
import { ButtonLink } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
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
 * catalogue & supplies, digital solutions. Each card says what it is, shows what can be ordered
 * and leads to its own page. Used on the homepage (after the hero), the Services hub and About.
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
  return (
    <Section id={id} tone={tone} aria-labelledby={headingId} className={cn("scroll-mt-20", className)}>
      <Container>
        <div className="reveal max-w-2xl">
          <Heading as="h2" size="xl" id={headingId} className="type-display">
            {title ?? d.title}
          </Heading>
          {lead === null ? null : <p className="text-fg-muted mt-4 text-base leading-relaxed text-pretty">{lead ?? d.lead}</p>}
        </div>
        <ul className="reveal-stagger mt-8 grid gap-5 md:grid-cols-3 lg:mt-10">
          <DivisionCard
            number="01"
            title={d.production.title}
            body={d.production.body}
            examples={d.production.examples}
            examplesLabel={d.examplesLabel}
            visual={
              <Image src={PHOTOS.designedTshirt} alt={dict.photos.designedTshirt} sizes="(min-width: 768px) 30vw, 90vw" className="h-full w-full object-contain p-4" />
            }
            cta={{ href: links.production, label: d.production.cta }}
            secondary={links.studio ? { href: links.studio, label: d.production.secondary } : null}
          />
          <DivisionCard
            number="02"
            title={d.catalog.title}
            body={d.catalog.body}
            examples={d.catalog.examples}
            examplesLabel={d.examplesLabel}
            visual={<Image src={PHOTOS.officeSupplies} alt={dict.photos.officeSupplies} sizes="(min-width: 768px) 30vw, 90vw" className="h-full w-full object-cover" />}
            cta={{ href: links.catalog, label: d.catalog.cta }}
          />
          <DivisionCard
            number="03"
            title={d.digital.title}
            body={d.digital.body}
            examples={d.digital.examples}
            examplesLabel={d.examplesLabel}
            tinted
            visual={<DigitalScene className="mx-auto h-full w-auto max-w-full p-3" />}
            cta={{ href: links.digital, label: d.digital.cta }}
          />
        </ul>
      </Container>
    </Section>
  );
}

function DivisionCard({
  number,
  title,
  body,
  examples,
  examplesLabel,
  visual,
  cta,
  secondary,
  tinted,
}: {
  number: string;
  title: string;
  body: string;
  examples: string[];
  examplesLabel: string;
  visual: ReactNode;
  cta: { href: string; label: string };
  secondary?: { href: string; label: string } | null;
  tinted?: boolean;
}) {
  return (
    <li className="border-line bg-bg flex flex-col overflow-hidden rounded-[var(--radius-card)] border">
      <div className={cn("relative aspect-[16/10] overflow-hidden", tinted ? "bg-cyan-50" : "bg-paper-100")}>{visual}</div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-accent text-sm font-semibold tabular-nums">{number}</p>
        <h3 className="type-display text-fg mt-1 text-xl">{title}</h3>
        <p className="text-fg-muted mt-2 leading-relaxed text-pretty">{body}</p>
        <p className="sr-only">{examplesLabel}</p>
        <ul className="border-line mt-5 space-y-2 border-t pt-4">
          {examples.map((example) => (
            <li key={example} className="text-fg flex items-start gap-2 text-sm">
              <CheckIcon width={16} height={16} strokeWidth={2.25} className="text-accent mt-0.5 shrink-0" aria-hidden="true" />
              {example}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-center md:flex-col md:items-stretch xl:flex-row xl:items-center">
          <ButtonLink href={cta.href} className="w-full sm:w-auto md:w-full xl:w-auto">
            {cta.label}
          </ButtonLink>
          {secondary ? <ArrowLink href={secondary.href}>{secondary.label}</ArrowLink> : null}
        </div>
      </div>
    </li>
  );
}
