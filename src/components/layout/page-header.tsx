import type { ReactNode } from "react";
import { Container, Eyebrow, Heading, Lead } from "@/components/ui/layout";

/**
 * Standard page intro: optional eyebrow, single h1, lead paragraph, and an optional decorative
 * illustration shown beside the text from the md breakpoint up.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  illustration,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  illustration?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="bg-surface border-line overflow-hidden border-b">
      <Container className="flex items-center justify-between gap-10 py-8 sm:py-10 lg:py-12">
        <div className="min-w-0">
          {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
          <Heading as="h1" size="xl" className="max-w-3xl">
            {title}
          </Heading>
          {lead ? <Lead className="mt-4 max-w-2xl">{lead}</Lead> : null}
          {children}
        </div>
        {illustration ? <div className="hidden w-40 shrink-0 md:block lg:w-48">{illustration}</div> : null}
      </Container>
    </div>
  );
}
