import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/content/rich-text";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/layout";
import {
  isLegalDocumentIndexable,
  legalAdminOverride,
  legalDocuments,
  orderedLegalDocuments,
  LEGAL_FACT_FIELDS,
  legalFactValue,
  type LegalSection,
  type LegalDocumentKey,
} from "@/content/legal";
import { getSiteSettings, type SiteSettings } from "@/features/settings/queries";
import { localeMeta, type Locale } from "@/i18n/config";
import { resolveSections, type ResolvedValues } from "@/content/legal/resolve";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { LegalSectionView } from "./legal-blocks";
import type { InlineContext } from "./legal-inline";

/**
 * Values configured in /admin/settings, keyed by content token. Anything missing here is
 * removed from the page by resolveSections() — never shown as a placeholder.
 */
function configuredValues(locale: Locale, settings: SiteSettings): ResolvedValues {
  const values: ResolvedValues = {
    // MSLAB SARL is the company name confirmed by MSLAB; settings may refine it.
    "fact:legalName": settings.legalName ?? "MSLAB SARL",
  };
  const address = settings.address[locale] ?? settings.address.fr;
  if (address) values["fact:address"] = address;
  if (settings.phone) values["fact:phone"] = settings.phone;
  if (settings.email) values["fact:email"] = settings.email;
  for (const { key } of LEGAL_FACT_FIELDS) {
    const value = legalFactValue(settings.legalFacts, key, locale);
    if (value) values[`ph:${key}`] = value;
  }
  return values;
}

function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeMeta[locale].intl, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

/** List of all legal documents; the current one is marked with aria-current. */
function LegalDocumentsNav({ current, locale, label, className }: { current: LegalDocumentKey; locale: Locale; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={className}>
      <p className="text-fg text-sm font-semibold">{label}</p>
      <ul className="mt-3 space-y-0.5 text-sm">
        {orderedLegalDocuments.map((doc) => {
          const active = doc.key === current;
          return (
            <li key={doc.key}>
              <Link
                href={localizedPath(locale, { route: doc.key })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mx-3 flex min-h-11 items-center rounded-[var(--radius-control)] px-3 py-1.5 transition-colors",
                  active ? "bg-accent-soft text-accent-hover font-medium" : "text-fg-muted hover:bg-surface hover:text-fg",
                )}
              >
                {doc.text[locale].shortTitle}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TableOfContents({ sections }: { sections: LegalSection[] }) {
  return (
    <ol className="space-y-0.5 text-sm">
      {sections.map((section, i) => (
        <li key={section.id}>
          <a href={`#${section.id}`} className="text-fg-muted hover:text-fg flex min-h-9 gap-2 py-1 leading-snug">
            <span className="w-5 shrink-0 tabular-nums">{i + 1}.</span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * Page factory for one legal document: localized metadata (canonical + hreflang), draft
 * handling (notice + noindex), table of contents and navigation between documents.
 */
export function legalDocumentPage(key: LegalDocumentKey) {
  const doc = legalDocuments[key];

  async function load() {
    const locale = await getLocale();
    const [dict, settings] = await Promise.all([getDictionary(locale), getSiteSettings()]);
    return { locale, dict, settings };
  }

  async function generateMetadata(): Promise<Metadata> {
    const { locale, settings } = await load();
    const text = doc.text[locale];
    return buildPageMetadata({
      locale,
      route: { route: key },
      title: text.title,
      description: text.description,
      index: isLegalDocumentIndexable(doc, settings, locale),
    });
  }

  async function Page() {
    const { locale, dict, settings } = await load();
    const t = dict.legalCenter;
    const text = doc.text[locale];
    const override = legalAdminOverride(key, settings, locale);
    const ctx: InlineContext = { locale, values: configuredValues(locale, settings) };
    const sections = resolveSections(text.sections, ctx.values);
    const showTableOfContents = sections.length >= 5;
    // "Dernière mise à jour : {date}" → wrap the date in <time> without splitting the sentence in code.
    const [beforeDate = "", afterDate = ""] = t.lastUpdated.split("{date}");

    return (
      <>
        <PageHeader eyebrow={t.eyebrow} title={text.title} lead={text.lead}>
          <p className="text-fg-muted mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span>
              {beforeDate}
              <time dateTime={doc.lastUpdated}>{formatDate(doc.lastUpdated, locale)}</time>
              {afterDate}
            </span>
          </p>
        </PageHeader>

        <div className="py-10 sm:py-12 lg:py-16">
          <Container className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
            {override ? null : (
              <aside className="hidden lg:block">
                <div className="sticky top-24 max-h-[calc(100dvh-7rem)] space-y-8 overflow-y-auto pb-4">
                  {showTableOfContents ? (
                    <nav aria-labelledby="legal-toc-title">
                      <p id="legal-toc-title" className="text-fg text-sm font-semibold">
                        {t.toc}
                      </p>
                      <div className="mt-3">
                        <TableOfContents sections={sections} />
                      </div>
                    </nav>
                  ) : null}
                  <LegalDocumentsNav current={key} locale={locale} label={t.documents} className="border-line border-t pt-6" />
                </div>
              </aside>
            )}

            <div className={cn("min-w-0 max-w-3xl", override && "lg:col-span-2 lg:mx-auto lg:w-full")}>
              {override ? (
                <RichText text={override} />
              ) : (
                <>
                  {showTableOfContents ? (
                    <details className="border-line group mb-10 rounded-[var(--radius-card)] border lg:hidden">
                      <summary className="text-fg flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 font-medium [&::-webkit-details-marker]:hidden">
                        {t.tocToggle}
                        <span aria-hidden="true" className="text-fg-muted transition-transform group-open:rotate-180">
                          ▾
                        </span>
                      </summary>
                      <nav aria-label={t.toc} className="border-line border-t px-4 py-3">
                        <TableOfContents sections={sections} />
                      </nav>
                    </details>
                  ) : null}

                  <article className="space-y-10">
                    {sections.map((section, i) => (
                      <LegalSectionView key={section.id} section={section} index={i} ctx={ctx} />
                    ))}
                  </article>
                </>
              )}

              <LegalDocumentsNav current={key} locale={locale} label={t.documents} className={cn("border-line mt-14 border-t pt-8", !override && "lg:hidden")} />
            </div>
          </Container>
        </div>
      </>
    );
  }

  return { generateMetadata, Page };
}
