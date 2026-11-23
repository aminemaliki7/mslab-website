import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DigitalRequestForm } from "@/components/digital/digital-request-form";
import { QuoteForm } from "@/components/quote/quote-form";
import { CheckIcon } from "@/components/ui/icons";
import { Container, Skeleton } from "@/components/ui/layout";
import { getProductsByIds } from "@/features/catalog/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { DIGITAL_QUOTE_TYPE, digitalQuoteHref, localizedPath, QUOTE_FORM_ID, quoteFormHref } from "@/i18n/routes";
import { cn } from "@/lib/utils";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: { route: "quote" },
    title: dict.pages.quote.title,
    description: dict.seo.quoteDescription,
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function QuotePage({ searchParams }: PageProps<"/[lang]/quote">) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <>
      {/* Short coloured intro, then the form straight away: every "request a quote" link lands on it. */}
      <div className="bg-[linear-gradient(135deg,var(--color-cyan-700),var(--color-ink-900))] text-white">
        <Container className="max-w-3xl pt-10 pb-24 sm:pt-12 sm:pb-28">
          <h1 className="type-poster text-[clamp(1.875rem,5.5vw,3rem)] text-balance text-white">{dict.pages.quote.title}</h1>
          {/* Intro follows the request type (?type=digital → web project); generic until known. */}
          <Suspense fallback={<QuoteIntro dict={dict} digital={false} />}>
            <QuoteIntroForType dict={dict} searchParams={searchParams} />
          </Suspense>
        </Container>
      </div>
      <Container className="relative -mt-16 max-w-3xl pb-16 sm:-mt-20 sm:pb-20">
        <div id={QUOTE_FORM_ID} className="border-line bg-bg scroll-mt-24 rounded-[var(--radius-card)] border p-5 shadow-[0_24px_60px_-28px_rgb(25_54_66/0.45)] sm:p-8">
          <Suspense fallback={<QuoteFormSkeleton />}>
            <QuoteFormWithPrefill locale={locale} dict={dict} searchParams={searchParams} />
          </Suspense>
        </div>
      </Container>
    </>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const isDigital = async (searchParams: SearchParams) => first((await searchParams).type) === DIGITAL_QUOTE_TYPE;

async function QuoteIntroForType({ dict, searchParams }: { dict: Dictionary; searchParams: SearchParams }) {
  return <QuoteIntro dict={dict} digital={await isDigital(searchParams)} />;
}

function QuoteIntro({ dict, digital }: { dict: Dictionary; digital: boolean }) {
  const q = dict.quotePage;
  const points = digital ? [q.digitalPointIdea, q.digitalPointFeatures, q.digitalPointReply] : [q.pointSteps, q.pointOneNeed, q.pointReply];
  return (
    <>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-pretty text-white/85 sm:text-[1.0625rem]">{digital ? q.digitalLead : q.heroLead}</p>
      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-2">
            <span className="bg-process-y text-ink-900 grid size-5 shrink-0 place-items-center rounded-full">
              <CheckIcon width={13} height={13} strokeWidth={2.75} />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Products & printing / web project switch (plain links: works without JavaScript). */
function RequestTypeSwitch({ locale, dict, digital }: { locale: Locale; dict: Dictionary; digital: boolean }) {
  const tabs = [
    { href: quoteFormHref(locale), label: dict.quotePage.tabProducts, active: !digital },
    { href: digitalQuoteHref(locale), label: dict.quotePage.tabDigital, active: digital },
  ];
  return (
    <nav aria-label={dict.quotePage.typeLabel} className="bg-surface mb-6 grid grid-cols-2 gap-1 rounded-full p-1 sm:mb-8">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center justify-center rounded-full px-3 text-center text-sm font-semibold transition-colors",
            tab.active ? "bg-ink-900 text-white" : "text-fg-muted hover:text-fg",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Reads ?type= and ?product= (request-time). `type=digital` shows the Digital Solutions
 * web-project form; otherwise the product quote form, prefilled with a published product.
 */
async function QuoteFormWithPrefill({
  locale,
  dict,
  searchParams,
}: {
  locale: Locale;
  dict: Dictionary;
  searchParams: SearchParams;
}) {
  if (await isDigital(searchParams)) {
    return (
      <>
        <RequestTypeSwitch locale={locale} dict={dict} digital />
        <DigitalRequestForm
          locale={locale}
          sourcePath={`${localizedPath(locale, { route: "quote" })}?type=${DIGITAL_QUOTE_TYPE}`}
          privacyHref={localizedPath(locale, { route: "privacy" })}
          trackingHref={localizedPath(locale, { route: "track" })}
          t={{ forms: dict.forms, form: dict.digitalForm, trackCta: dict.printOnDemand.trackCta }}
        />
      </>
    );
  }

  const id = first((await searchParams).product);
  const [product] = id && UUID.test(id) ? await getProductsByIds(locale, [id]) : [];

  return (
    <>
      <RequestTypeSwitch locale={locale} dict={dict} digital={false} />
      <QuoteForm
        locale={locale}
        sourcePath={localizedPath(locale, { route: "quote" })}
        privacyHref={localizedPath(locale, { route: "privacy" })}
        catalogHref={localizedPath(locale, { route: "catalog" })}
        prefill={product ? { productId: product.id, name: product.name, sku: product.sku, minOrderQuantity: product.minOrderQuantity } : null}
        t={{ forms: dict.forms, page: dict.quotePage, sku: dict.product.sku }}
      />
    </>
  );
}

function QuoteFormSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
