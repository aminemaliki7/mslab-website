import type { Metadata } from "next";
import { ChecklistIllustration } from "@/components/illustrations";
import { PageHeader } from "@/components/layout/page-header";
import { TrackingForm } from "@/components/print-on-demand/tracking-form";
import { Container, Section } from "@/components/ui/layout";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: { route: "track" },
    title: dict.pages.tracking.title,
    description: dict.pages.tracking.description,
  });
}

/** Order tracking: reference + e-mail → status and history (rate-limited lookup, no account). */
export default async function TrackPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <>
      <PageHeader title={dict.tracking.title} lead={dict.tracking.description} illustration={<ChecklistIllustration />} />
      <Section>
        <Container className="max-w-3xl">
          <TrackingForm locale={locale} t={{ forms: dict.forms, tracking: dict.tracking }} />
        </Container>
      </Section>
    </>
  );
}
