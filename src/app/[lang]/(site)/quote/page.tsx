import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DigitalRequestForm } from "@/components/digital/digital-request-form";
import { BriefOrForm } from "@/components/forms/brief-or-form";
import { briefProps, requestFlow } from "@/components/forms/request-flow";
import { CustomRequestForm } from "@/components/print-on-demand/custom-request-form";
import { QuoteForm } from "@/components/quote/quote-form";
import { CheckIcon } from "@/components/ui/icons";
import { Container, Skeleton } from "@/components/ui/layout";
import { getProductsByIds } from "@/features/catalog/queries";
import { listMockupProducts, listProductionOptions } from "@/features/print-on-demand/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import {
  DIGITAL_QUOTE_TYPE,
  digitalQuoteHref,
  localizedPath,
  PRODUCTION_QUOTE_TYPE,
  productionQuoteHref,
  QUOTE_FORM_ID,
  quoteFormHref,
  studioHref,
} from "@/i18n/routes";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import { buildPageMetadata } from "@/lib/seo";
import { STUDIO_ENABLED } from "@/config/features";

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

/** The three kinds of request (docs/CX_AUDIT_AND_PLAN.md §3, phase 5), chosen with ?type=. */
type RequestType = "catalog" | "production" | "digital";

export default async function QuotePage({ searchParams }: PageProps<"/[lang]/quote">) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <>
      {/* Short coloured intro, then the form straight away: every "request a quote" link lands on it. */}
      <div className="bg-[linear-gradient(135deg,var(--color-cyan-700),var(--color-ink-900))] text-white">
        <Container className="max-w-3xl pt-10 pb-24 sm:pt-12 sm:pb-28">
          <h1 className="type-poster text-[clamp(1.875rem,5.5vw,3rem)] text-balance text-white">{dict.pages.quote.title}</h1>
          {/* Intro follows the request type; generic until known. */}
          <Suspense fallback={<QuoteIntro dict={dict} type="catalog" />}>
            <QuoteIntroForType dict={dict} searchParams={searchParams} />
          </Suspense>
        </Container>
      </div>
      <Container className="relative -mt-16 max-w-3xl pb-16 sm:-mt-20 sm:pb-20">
        <div id={QUOTE_FORM_ID} className="border-line bg-bg scroll-mt-24 rounded-[var(--radius-card)] border p-5 shadow-[0_24px_60px_-28px_rgb(25_54_66/0.45)] sm:p-8">
          <Suspense fallback={<QuoteFormSkeleton />}>
            <QuoteFormForType locale={locale} dict={dict} searchParams={searchParams} />
          </Suspense>
        </div>
      </Container>
    </>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function requestType(searchParams: SearchParams): Promise<RequestType> {
  const type = first((await searchParams).type);
  return type === DIGITAL_QUOTE_TYPE ? "digital" : type === PRODUCTION_QUOTE_TYPE ? "production" : "catalog";
}

async function QuoteIntroForType({ dict, searchParams }: { dict: Dictionary; searchParams: SearchParams }) {
  return <QuoteIntro dict={dict} type={await requestType(searchParams)} />;
}

function QuoteIntro({ dict, type }: { dict: Dictionary; type: RequestType }) {
  const q = dict.quotePage;
  const lead = type === "digital" ? q.digitalLead : type === "production" ? dict.cx.quote.productionLead : dict.cx.quote.catalogLead;
  const points =
    type === "digital"
      ? [q.digitalPointIdea, q.digitalPointFeatures, q.digitalPointReply]
      : [q.pointSteps, q.pointOneNeed, q.pointReply];
  return (
    <>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-pretty text-white/85 sm:text-[1.0625rem]">{lead}</p>
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

/** Catalogue / custom production / digital switch (plain links: works without JavaScript). */
function RequestTypeSwitch({ locale, dict, type }: { locale: Locale; dict: Dictionary; type: RequestType }) {
  const q = dict.cx.quote;
  const tabs: Array<{ key: RequestType; href: string; label: string }> = [
    { key: "catalog", href: quoteFormHref(locale), label: q.tabCatalog },
    { key: "production", href: productionQuoteHref(locale), label: q.tabProduction },
    { key: "digital", href: digitalQuoteHref(locale), label: q.tabDigital },
  ];
  return (
    <nav aria-label={dict.quotePage.typeLabel} className="bg-surface mb-6 grid grid-cols-3 gap-1 rounded-[1.375rem] p-1 sm:mb-8 sm:rounded-full">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === type ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center justify-center rounded-[1.125rem] px-2 py-1.5 text-center text-[0.8125rem] leading-tight font-semibold transition-colors sm:rounded-full sm:px-3 sm:text-sm",
            tab.key === type ? "bg-ink-900 text-white" : "text-fg-muted hover:text-fg",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Reads ?type= and ?product= (request-time): `type=digital` → web-project form,
 * `type=production` → custom production form, otherwise the catalogue quote form, prefilled
 * with a published product. Every form keeps its own server validation and anti-spam checks.
 */
async function QuoteFormForType({ locale, dict, searchParams }: { locale: Locale; dict: Dictionary; searchParams: SearchParams }) {
  const [type, flow] = await Promise.all([requestType(searchParams), requestFlow(locale, dict)]);
  const quotePath = localizedPath(locale, { route: "quote" });
  const privacyHref = localizedPath(locale, { route: "privacy" });
  const trackingHref = localizedPath(locale, { route: "track" });

  if (type === "digital") {
    return (
      <>
        <RequestTypeSwitch locale={locale} dict={dict} type={type} />
        <BriefOrForm {...briefProps(locale, dict, "digital", `${quotePath}?type=${DIGITAL_QUOTE_TYPE}`, flow)}>
          <DigitalRequestForm
            locale={locale}
            sourcePath={`${quotePath}?type=${DIGITAL_QUOTE_TYPE}`}
            privacyHref={privacyHref}
            trackingHref={trackingHref}
            flow={flow}
            t={{ forms: dict.forms, form: dict.digitalForm, trackCta: dict.printOnDemand.trackCta }}
          />
        </BriefOrForm>
      </>
    );
  }

  if (type === "production") {
    const [options, mockups] = await Promise.all([listProductionOptions(locale), listMockupProducts()]);
    const studioLink = STUDIO_ENABLED && mockups.length > 0 ? studioHref(locale) : null;
    return (
      <>
        <RequestTypeSwitch locale={locale} dict={dict} type={type} />
        {studioLink ? (
          <p className="bg-accent-soft text-fg mb-8 rounded-[var(--radius-card)] px-4 py-3 text-sm">
            {dict.cx.quote.productionStudio}{" "}
            <Link href={studioLink} className="text-accent font-semibold underline underline-offset-2">
              {dict.cx.quote.studioLink}
            </Link>
          </p>
        ) : null}
        <BriefOrForm {...briefProps(locale, dict, "custom", `${quotePath}?type=${PRODUCTION_QUOTE_TYPE}`, flow)}>
        <CustomRequestForm
          locale={locale}
          sourcePath={`${quotePath}?type=${PRODUCTION_QUOTE_TYPE}`}
          privacyHref={privacyHref}
          trackingHref={trackingHref}
          storageEndpoint={`${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/custom-uploads`}
          publishableKey={publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
          materials={options.filter((o) => o.kind === "material")}
          finishings={options.filter((o) => o.kind === "finishing")}
          flow={flow}
          t={{ forms: dict.forms, pod: dict.printOnDemand }}
        />
        </BriefOrForm>
      </>
    );
  }

  const id = first((await searchParams).product);
  const [product] = id && UUID.test(id) ? await getProductsByIds(locale, [id]) : [];

  return (
    <>
      <RequestTypeSwitch locale={locale} dict={dict} type={type} />
      {/* A product chosen on its page: straight to the list (the file option stays one tap away). */}
      <BriefOrForm {...briefProps(locale, dict, "catalog", quotePath, flow)} defaultMode={product ? "form" : "file"}>
      <QuoteForm
        locale={locale}
        sourcePath={quotePath}
        privacyHref={privacyHref}
        catalogHref={localizedPath(locale, { route: "catalog" })}
        prefill={product ? { productId: product.id, name: product.name, sku: product.sku, minOrderQuantity: product.minOrderQuantity } : null}
        flow={flow}
        t={{ forms: dict.forms, page: dict.quotePage, sku: dict.product.sku }}
      />
      </BriefOrForm>
    </>
  );
}

function QuoteFormSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
