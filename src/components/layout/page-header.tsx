import type { ReactNode } from "react";
import { Container, Eyebrow, Heading, Lead } from "@/components/ui/layout";

/** Standard page intro: optional eyebrow/breadcrumbs, single h1, lead paragraph. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-surface border-line border-b">
      <Container className="py-12 lg:py-16">
        {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
        <Heading as="h1" size="xl" className="max-w-3xl">
          {title}
        </Heading>
        {lead ? <Lead className="mt-4 max-w-2xl">{lead}</Lead> : null}
        {children}
      </Container>
    </div>
  );
}
