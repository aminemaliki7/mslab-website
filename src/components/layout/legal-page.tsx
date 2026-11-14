import type { Metadata } from "next";
import { RichText } from "@/components/content/rich-text";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Container, Section } from "@/components/ui/layout";
import { forLocale, getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";

type Kind = "legal" | "privacy";

/**
 * Legal notice / privacy policy. Text comes ONLY from site settings (written/validated by MSLAB).
 * While empty: honest "being prepared" notice, verified company facts, contact link, noindex.
 */
export function legalPage(kind: Kind) {
  async function load() {
    const locale = await getLocale();
    const [dict, settings] = await Promise.all([getDictionary(locale), getSiteSettings()]);
    const text = forLocale(kind === "legal" ? settings.legalNotice : settings.privacyPolicy, locale);
    return { locale, dict, settings, text };
  }

  async function generateMetadata(): Promise<Metadata> {
    const { locale, dict, text } = await load();
    return buildPageMetadata({
      locale,
      route: { route: kind },
      title: dict.pages[kind].title,
      description: dict.pages[kind].description,
      index: Boolean(text),
    });
  }

  async function Page() {
    const { locale, dict, settings, text } = await load();
    const address = forLocale(settings.address, locale);
    const publisher = [
      settings.legalName ?? settings.companyName,
      address,
      settings.phone,
      settings.email,
    ].filter(Boolean) as string[];

    return (
      <>
        <PageHeader title={dict.pages[kind].title} />
        <Section>
          <Container className="max-w-3xl">
            {text ? (
              <RichText text={text} />
            ) : (
              <div className="border-line rounded-[var(--radius-card)] border border-dashed p-6">
                <p className="text-fg font-medium">{dict.legalPages.pending}</p>
                <p className="text-fg-muted mt-2 text-sm">{dict.legalPages.contact}</p>
                <ArrowLink href={localizedPath(locale, { route: "contact" })} className="mt-4">
                  {dict.common.contactUs}
                </ArrowLink>
              </div>
            )}

            {kind === "legal" && publisher.length > 0 ? (
              <div className="border-line mt-10 border-t pt-6">
                <h2 className="text-fg text-lg font-semibold">{dict.legalPages.publisherTitle}</h2>
                <ul className="text-fg-muted mt-3 space-y-1 text-sm">
                  {publisher.map((line) => (
                    <li key={line} className="whitespace-pre-line">
                      <bdi>{line}</bdi>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Container>
        </Section>
      </>
    );
  }

  return { generateMetadata, Page };
}
