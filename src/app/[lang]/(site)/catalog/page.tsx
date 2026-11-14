import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryNav } from "@/components/catalog/category-nav";
import { ProductListing, ProductListingSkeleton } from "@/components/catalog/product-listing";
import { CtaBand } from "@/components/layout/cta-band";
import { PageHeader } from "@/components/layout/page-header";
import { Container, Section } from "@/components/ui/layout";
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
      <PageHeader title={dict.pages.catalog.title} lead={dict.pages.catalog.description} />
      <Section className="py-10 lg:py-14">
        <Container className="grid gap-10 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <CategoryNav locale={locale} dict={dict} categories={categories} />
          </aside>
          <div className="lg:col-span-9">
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
      </Section>
      <CtaBand />
    </>
  );
}
