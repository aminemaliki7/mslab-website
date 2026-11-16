import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { lang } from "next/root-params";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductArt } from "@/components/illustrations/product-art";
import { resolveVisualKey } from "@/features/catalog/visual";
import { JsonLd } from "@/components/content/json-ld";
import { RichText } from "@/components/content/rich-text";
import { AddToQuoteButton } from "@/components/quote/add-to-quote-button";
import { CtaBand } from "@/components/layout/cta-band";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Heading, Lead, Section } from "@/components/ui/layout";
import { getProductBySlug, listProducts, listRelatedProducts, type ProductDetail } from "@/features/catalog/queries";
import { hasLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath, type RouteKey } from "@/i18n/routes";
import { siteUrl } from "@/lib/env";
import { buildPageMetadata } from "@/lib/seo";

const NO_PRODUCT = "__none__";

/** Prerender the first pages of published products; the rest render on first request. */
export async function generateStaticParams() {
  const value = await lang();
  const locale: Locale = hasLocale(value) ? value : "fr";
  const { items } = await listProducts({ locale, page: 1 });
  return items.length > 0 ? items.map((p) => ({ product: p.slug })) : [{ product: NO_PRODUCT }];
}

function routesFor(product: ProductDetail): Record<Locale, RouteKey> {
  return Object.fromEntries(
    locales.map((l) => [l, { route: "product", slug: product.slugs[l] ?? product.slugs.fr }]),
  ) as Record<Locale, RouteKey>;
}

async function load(params: PageProps<"/[lang]/products/[product]">["params"]) {
  const { product: slug } = await params;
  const locale = await getLocale();
  if (slug === NO_PRODUCT) notFound();
  const decoded = decodeURIComponent(slug);
  const product = await getProductBySlug(locale, decoded);
  if (!product) notFound();
  const canonicalSlug = product.slugs[locale] ?? product.slugs.fr;
  if (decoded !== canonicalSlug) permanentRedirect(localizedPath(locale, { route: "product", slug: canonicalSlug }));
  return { locale, product };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[product]">): Promise<Metadata> {
  const { locale, product } = await load(params);
  const dict = await getDictionary(locale);
  const metadata = await buildPageMetadata({
    locale,
    route: routesFor(product),
    title: product.name,
    description: product.shortDescription ?? dict.pages.catalog.description,
  });
  const image = product.images[0];
  return image ? { ...metadata, openGraph: { ...metadata.openGraph, images: [{ url: image.url, alt: image.alt }] } } : metadata;
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[product]">) {
  const { locale, product } = await load(params);
  const [dict, related] = await Promise.all([
    getDictionary(locale),
    listRelatedProducts(locale, product.id, product.categoryId),
  ]);

  const quoteHref = `${localizedPath(locale, { route: "quote" })}?product=${encodeURIComponent(product.id)}`;
  const productUrl = `${siteUrl}${localizedPath(locale, { route: "product", slug: product.slug })}`;
  const crumbs = [
    { label: dict.nav.home, href: localizedPath(locale, { route: "home" }) },
    { label: dict.nav.catalog, href: localizedPath(locale, { route: "catalog" }) },
    ...(product.category
      ? [{ label: product.category.name, href: localizedPath(locale, { route: "category", slug: product.category.slug }) }]
      : []),
    { label: product.name },
  ];

  return (
    <>
      {/* Verified fields only: no price/offers, ratings or availability (ADR-007/011). */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          ...(product.shortDescription || product.description
            ? { description: product.shortDescription ?? product.description }
            : {}),
          ...(product.sku ? { sku: product.sku } : {}),
          ...(product.category ? { category: product.category.name } : {}),
          ...(product.images.length ? { image: product.images.map((i) => i.url) } : {}),
          url: productUrl,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.label,
            ...(crumb.href ? { item: `${siteUrl}${crumb.href}` } : {}),
          })),
        }}
      />

      <Section className="pt-8 pb-16 lg:pt-10 lg:pb-24">
        <Container>
          <Breadcrumbs label={dict.sections.breadcrumb} items={crumbs} />

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ProductGallery
              images={product.images}
              thumbLabelTemplate={dict.product.imageNumber}
              noImageLabel={dict.product.noImage}
              placeholder={<ProductArt kind={resolveVisualKey(product)} className="w-full max-w-sm" />}
            />

            <div>
              {product.category ? <p className="text-accent text-sm font-medium">{product.category.name}</p> : null}
              <Heading as="h1" size="xl" className="mt-2">
                {product.name}
              </Heading>
              {product.sku ? (
                <p className="text-fg-muted mt-3 text-sm">
                  {dict.product.sku}{" "}
                  <bdi dir="ltr" className="text-fg font-[family-name:var(--font-geist-mono)]">
                    {product.sku}
                  </bdi>
                </p>
              ) : null}
              {product.shortDescription ? <Lead className="mt-5">{product.shortDescription}</Lead> : null}

              <div className="border-line mt-8 space-y-4 border-t pt-6">
                <ButtonLink href={quoteHref} size="lg" className="w-full sm:w-auto">
                  {dict.product.requestQuote}
                </ButtonLink>
                {/* Multi-product requests: collect several products, then send one quote (ADR-017). */}
                <AddToQuoteButton
                  product={{ productId: product.id, name: product.name, sku: product.sku }}
                  quoteHref={localizedPath(locale, { route: "quote" })}
                  labels={{ add: dict.quotePage.addToQuote, added: dict.quotePage.addedToQuote, view: dict.quotePage.viewQuote }}
                />
                <p className="text-fg-muted text-sm">{dict.product.quoteHint}</p>
              </div>

              {product.specifications.length > 0 ? (
                <div className="mt-10">
                  <h2 className="text-fg text-lg font-semibold">{dict.product.specifications}</h2>
                  <dl className="border-line mt-4 border-t">
                    {product.specifications.map((spec) => (
                      <div key={spec.label} className="border-line grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b py-3 text-sm">
                        <dt className="text-fg-muted">{spec.label}</dt>
                        <dd className="text-fg font-medium">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          </div>

          {product.description ? (
            <div className="border-line mt-16 grid gap-6 border-t pt-10 lg:grid-cols-12">
              <h2 className="text-fg text-xl font-semibold lg:col-span-4">{dict.product.description}</h2>
              <RichText text={product.description} className="lg:col-span-8" />
            </div>
          ) : null}
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section tone="surface" aria-labelledby="related-heading">
          <Container>
            <Heading as="h2" size="md" id="related-heading">
              {dict.product.related}
            </Heading>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard
                    product={item}
                    href={localizedPath(locale, { route: "product", slug: item.slug })}
                    labels={{ sku: dict.product.sku, noImage: dict.product.noImage }}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <CtaBand />
    </>
  );
}
