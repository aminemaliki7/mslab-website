import type { Metadata } from "next";
import { Suspense } from "react";
import { PHOTOS } from "@/config/photos";
import { CategoryNav } from "@/components/catalog/category-nav";
import { ProductListing, ProductListingSkeleton } from "@/components/catalog/product-listing";
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
    title: dict.seo.catalogTitle,
    description: dict.pages.catalog.description,
  });
}

/** Static shell (header, categories) + streamed results that depend on ?q=&category=&page=. */
export default async function CatalogPage({ searchParams }: PageProps<"/[lang]/catalog">) {
  const locale = await getLocale();
  const [dict, categories] = await Promise.all([getDictionary(locale), listCategories(locale)]);
  const nav = <CategoryNav locale={locale} dict={dict} categories={categories} />;

  return (
    <>
      <PageHeader title={dict.pages.catalog.title} lead={dict.pages.catalog.description} photo={{ src: PHOTOS.book, alt: dict.photos.book }} />
      <section className="py-6 lg:py-10">
        <Container>
          <div>
            <Suspense fallback={<ProductListingSkeleton nav={nav} />}>
              <ProductListing
                locale={locale}
                dict={dict}
                basePath={localizedPath(locale, { route: "catalog" })}
                searchParams={searchParams}
                categories={categories}
                nav={nav}
              />
            </Suspense>
          </div>
        </Container>
      </section>
    </>
  );
}
