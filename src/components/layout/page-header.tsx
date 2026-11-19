import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { Container, Eyebrow, Heading, Lead } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

/**
 * Standard page intro: optional eyebrow, single h1, lead paragraph, and an optional photo (or
 * decorative illustration) shown beside the text from the md breakpoint up.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  illustration,
  photo,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  illustration?: ReactNode;
  /** `contain`: wide product views on white, shown whole instead of cropped. */
  photo?: { src: StaticImageData; alt: string; contain?: boolean };
  children?: ReactNode;
}) {
  return (
    <div className="overflow-hidden">
      <Container className="flex items-center justify-between gap-10 pt-10 pb-6 sm:pt-14 lg:pt-16 lg:pb-8">
        <div className="min-w-0">
          {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
          <Heading as="h1" size="display" className="max-w-4xl">
            {title}
          </Heading>
          {lead ? <Lead className="mt-4 max-w-2xl">{lead}</Lead> : null}
          {children}
        </div>
        {photo ? (
          <div
            className={cn(
              "relative hidden size-48 shrink-0 overflow-hidden rounded-[var(--radius-card)] md:block lg:size-56",
              photo.contain ? "border-line border bg-white" : "bg-paper-100",
            )}
          >
            <Image src={photo.src} alt={photo.alt} fill sizes="224px" className={photo.contain ? "object-contain p-3" : "object-cover"} priority />
          </div>
        ) : illustration ? (
          <div className="bg-paper-100 hidden size-48 shrink-0 place-items-center rounded-[var(--radius-tile)] p-6 md:grid lg:size-56">{illustration}</div>
        ) : null}
      </Container>
    </div>
  );
}
