import type { Metadata } from "next";
import { Suspense } from "react";
import { StationeryIllustration } from "@/components/illustrations/scenes";
import { CategoryNav } from "@/components/catalog/category-nav";
import { ProductListing, ProductListingSkeleton } from "@/components/catalog/product-listing";
import { CtaBand } from "@/components/layout/cta-band";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/layout";
import { listCategories } from "@/features/catalog/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: { route: "catalog" },
    title: dict.pages.catalog.title,
    description: dict.pages.catalog.description,
  });
}

/** Static shell (header, categories) + streamed results that depend on ?q=&category=&page=. */
export default async function CatalogPage({ searchParams }: PageProps<"/[lang]/catalog">) {
  const locale = await getLocale();
  const [dict, categories] = await Promise.all([getDictionary(locale), listCategories(locale)]);

  return (
    <>
      <PageHeader title={dict.pages.catalog.title} lead={dict.pages.catalog.description} illustration={<StationeryIllustration />} />
      <section className="py-6 lg:py-10">
        <Container className="space-y-6">
          <CategoryNav locale={locale} dict={dict} categories={categories} />
          <div>
            <Suspense fallback={<ProductListingSkeleton />}>
              <ProductListing
                locale={locale}
                dict={dict}
                basePath={localizedPath(locale, { route: "catalog" })}
                searchParams={searchParams}
                categories={categories}
              />
            </Suspense>
          </div>
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
