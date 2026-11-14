"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container, Heading, Lead, Section } from "@/components/ui/layout";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { errorMessages } from "@/i18n/client-messages";

export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ lang?: string }>();
  const locale = hasLocale(params.lang) ? params.lang : defaultLocale;
  const t = errorMessages[locale];
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <Section>
      <Container className="max-w-2xl text-center">
        <Heading as="h1" size="xl">
          {t.title}
        </Heading>
        <Lead className="mt-4">{t.body}</Lead>
        <div className="mt-8">
          <Button onClick={() => retry()}>{t.retry}</Button>
        </div>
        {digest ? (
          <p className="text-fg-subtle mt-6 font-[family-name:var(--font-geist-mono)] text-xs" dir="ltr">
            ref: {digest}
          </p>
        ) : null}
      </Container>
    </Section>
  );
}
