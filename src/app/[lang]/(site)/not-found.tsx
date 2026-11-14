import { ButtonLink } from "@/components/ui/button";
import { Container, Heading, Lead, Section } from "@/components/ui/layout";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";

export default async function NotFound() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <Section>
      <Container className="max-w-2xl text-center">
        <p className="text-accent font-[family-name:var(--font-geist-mono)] text-sm" dir="ltr">
          404
        </p>
        <Heading as="h1" size="xl" className="mt-3">
          {dict.notFound.title}
        </Heading>
        <Lead className="mt-4">{dict.notFound.body}</Lead>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={localizedPath(locale, { route: "home" })}>{dict.notFound.backHome}</ButtonLink>
          <ButtonLink href={localizedPath(locale, { route: "catalog" })} variant="secondary">
            {dict.notFound.browseCatalog}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
