import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requestFlow } from "@/components/forms/request-flow";
import { StudioFlow } from "@/components/print-on-demand/studio/studio-flow";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CheckIcon } from "@/components/ui/icons";
import { Container, Eyebrow, Heading, Lead } from "@/components/ui/layout";
import { getStudioConfig, listMockupProducts, listProductionOptions } from "@/features/print-on-demand/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath, productionQuoteHref, studioHref } from "@/i18n/routes";
import { publicEnv } from "@/lib/env";
import { buildPageMetadata } from "@/lib/seo";
import { STUDIO_ENABLED } from "@/config/features";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  if (!STUDIO_ENABLED) return { robots: { index: false, follow: false } };
  return buildPageMetadata({
    locale,
    route: { route: "studio" },
    title: dict.cx.studioFlow.metaTitle,
    description: dict.cx.studioFlow.metaDescription,
  });
}

/**
 * MSLAB Studio (docs/STUDIO_CX_PLAN.md): prepare a production project in five steps and send it
 * as a quote request. The supports, their photos and the verified options come from the admin
 * (/admin/print-on-demand); the request goes through the existing production request form and
 * server action (validation, anti-spam, upload tickets unchanged).
 */
export default async function StudioPage() {
  // Switched off (config/features.ts): a real 404, the page is not reachable from anywhere.
  if (!STUDIO_ENABLED) notFound();
  const locale = await getLocale();
  const [dict, products, config, options] = await Promise.all([
    getDictionary(locale),
    listMockupProducts(),
    getStudioConfig(locale),
    listProductionOptions(locale),
  ]);
  const f = dict.cx.studioFlow;
  const flow = await requestFlow(locale, dict);
  const pagePath = studioHref(locale);

  return (
    <>
      <div className="border-line border-b">
        <Container className="pt-6 pb-8 lg:pb-10">
          <Breadcrumbs
            label={dict.sections.breadcrumb}
            items={[{ label: dict.nav.home, href: localizedPath(locale, { route: "home" }) }, { label: f.metaTitle }]}
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Eyebrow>{f.eyebrow}</Eyebrow>
              <Heading as="h1" size="xl" className="type-display mt-3">
                {f.title}
              </Heading>
              <Lead className="mt-4 max-w-2xl">{f.lead}</Lead>
            </div>
            {/* What the Studio is (and is not), in four short lines. */}
            <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              {f.notes.map((note) => (
                <li key={note} className="text-fg-muted flex items-start gap-2">
                  <CheckIcon width={16} height={16} strokeWidth={2.25} aria-hidden="true" className="text-accent mt-0.5 shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>

      <Container className="py-6 lg:py-10">
        {products.length > 0 ? (
          <StudioFlow
            products={products}
            config={config}
            t={dict.printOnDemand.studio}
            f={f}
            specs={dict.cx.specs}
            form={{
              locale,
              sourcePath: pagePath,
              privacyHref: localizedPath(locale, { route: "privacy" }),
              trackingHref: localizedPath(locale, { route: "track" }),
              storageEndpoint: `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/custom-uploads`,
              publishableKey: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
              materials: options.filter((o) => o.kind === "material"),
              finishings: options.filter((o) => o.kind === "finishing"),
              flow,
              t: { forms: dict.forms, pod: dict.printOnDemand },
            }}
          />
        ) : (
          // Every support switched off in the admin: the request form is the way in.
          <div className="border-line rounded-[var(--radius-card)] border border-dashed p-6">
            <p className="text-fg font-medium">{f.otherBody}</p>
            <ArrowLink href={productionQuoteHref(locale)} className="mt-3">
              {f.otherCta}
            </ArrowLink>
          </div>
        )}
      </Container>
    </>
  );
}
