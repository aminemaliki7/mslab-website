import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { lang } from "next/root-params";
import { Suspense } from "react";
import { CategoryNav } from "@/components/catalog/category-nav";
import { ProductListing, ProductListingSkeleton } from "@/components/catalog/product-listing";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Heading, Lead } from "@/components/ui/layout";
import { getCategoryBySlug, listCategories, type CategorySummary } from "@/features/catalog/queries";
import { hasLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { localizedPath, type RouteKey } from "@/i18n/routes";
import { buildPageMetadata } from "@/lib/seo";

const NO_CATEGORY = "__none__";

export async function generateStaticParams() {
  const value = await lang();
  const locale: Locale = hasLocale(value) ? value : "fr";
  const categories = await listCategories(locale);
  return categories.length > 0 ? categories.map((c) => ({ category: c.slug })) : [{ category: NO_CATEGORY }];
}

function routesFor(category: CategorySummary): Record<Locale, RouteKey> {
  return Object.fromEntries(
    locales.map((l) => [l, { route: "category", slug: category.slugs[l] ?? category.slugs.fr }]),
  ) as Record<Locale, RouteKey>;
}

async function load(params: PageProps<"/[lang]/catalog/[category]">["params"]) {
  const { category: slug } = await params;
  const locale = await getLocale();
  if (slug === NO_CATEGORY) notFound();
  const decoded = decodeURIComponent(slug);
  const category = await getCategoryBySlug(locale, decoded);
  if (!category) notFound();
  const canonicalSlug = category.slugs[locale] ?? category.slugs.fr;
  if (decoded !== canonicalSlug) permanentRedirect(localizedPath(locale, { route: "category", slug: canonicalSlug }));
  return { locale, category };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/catalog/[category]">): Promise<Metadata> {
  const { locale, category } = await load(params);
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    route: routesFor(category),
    title: format(dict.seo.categoryTitle, { name: category.name }),
    description: category.description ?? dict.pages.catalog.description,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[lang]/catalog/[category]">) {
  const { locale, category } = await load(params);
  const [dict, categories] = await Promise.all([getDictionary(locale), listCategories(locale)]);
  const nav = <CategoryNav locale={locale} dict={dict} categories={categories} activeId={category.id} />;
  const parent = category.parentId ? categories.find((c) => c.id === category.parentId) : undefined;

  return (
    <>
      <div>
        <Container className="py-10 lg:py-14">
          <Breadcrumbs
            label={dict.sections.breadcrumb}
            items={[
              { label: dict.nav.home, href: localizedPath(locale, { route: "home" }) },
              { label: dict.nav.catalog, href: localizedPath(locale, { route: "catalog" }) },
              ...(parent ? [{ label: parent.name, href: localizedPath(locale, { route: "category", slug: parent.slug }) }] : []),
              { label: category.name },
            ]}
          />
          <Heading as="h1" size="xl" className="mt-6 max-w-3xl">
            {category.name}
          </Heading>
          {category.description ? <Lead className="mt-4 max-w-2xl">{category.description}</Lead> : null}
        </Container>
      </div>

      <section className="py-6 lg:py-10">
        <Container>
          <div>
            <Suspense fallback={<ProductListingSkeleton nav={nav} />}>
              <ProductListing
                locale={locale}
                dict={dict}
                basePath={localizedPath(locale, { route: "category", slug: category.slug })}
                searchParams={searchParams}
                categories={categories}
                nav={nav}
                fixedCategory={category}
              />
            </Suspense>
          </div>
        </Container>
      </section>
    </>
  );
}
