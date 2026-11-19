import type { Metadata } from "next";
import { Suspense } from "react";
import { PHOTOS } from "@/config/photos";
import { PageHeader } from "@/components/layout/page-header";
import { QuoteForm } from "@/components/quote/quote-form";
import { Container, Section, Skeleton } from "@/components/ui/layout";
import { getProductsByIds } from "@/features/catalog/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: { route: "quote" },
    title: dict.pages.quote.title,
    description: dict.pages.quote.description,
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function QuotePage({ searchParams }: PageProps<"/[lang]/quote">) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <>
      <PageHeader title={dict.pages.quote.title} lead={dict.pages.quote.description} photo={{ src: PHOTOS.tshirt, alt: dict.photos.tshirt, contain: true }} />
      <Section>
        <Container className="max-w-3xl">
          <Suspense fallback={<QuoteFormSkeleton />}>
            <QuoteFormWithPrefill locale={locale} dict={dict} searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}

/** Reads ?product=<id> (request-time) and resolves it to a published product, if any. */
async function QuoteFormWithPrefill({
  locale,
  dict,
  searchParams,
}: {
  locale: Locale;
  dict: Dictionary;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).product;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const [product] = id && UUID.test(id) ? await getProductsByIds(locale, [id]) : [];

  return (
    <QuoteForm
      locale={locale}
      sourcePath={localizedPath(locale, { route: "quote" })}
      privacyHref={localizedPath(locale, { route: "privacy" })}
      catalogHref={localizedPath(locale, { route: "catalog" })}
      prefill={product ? { productId: product.id, name: product.name, sku: product.sku, minOrderQuantity: product.minOrderQuantity } : null}
      t={{ forms: dict.forms, page: dict.quotePage, sku: dict.product.sku }}
    />
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
