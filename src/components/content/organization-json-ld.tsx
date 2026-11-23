import { forLocale, getSiteSettings } from "@/features/settings/queries";
import { localeMeta, type Locale } from "@/i18n/config";
import { siteUrl } from "@/lib/env";
import { JsonLd } from "./json-ld";

export const ORGANIZATION_ID = `${siteUrl}/#organization`;

/**
 * schema.org WebSite for the home pages: tells Google the site name to show in results
 * ("MSLAB" rather than the bare domain). https://developers.google.com/search/docs/appearance/site-names
 */
export function WebSiteJsonLd({ locale }: { locale: Locale }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "MSLAB",
        alternateName: ["mslab.ma"],
        url: `${siteUrl}/`,
        inLanguage: localeMeta[locale].hreflang,
        publisher: { "@id": ORGANIZATION_ID },
      }}
    />
  );
}

/**
 * schema.org Organization built ONLY from verified site settings. Fields MSLAB has not
 * provided are omitted — never placeholder values.
 */
export async function OrganizationJsonLd({ locale }: { locale: Locale }) {
  const settings = await getSiteSettings();
  const address = forLocale(settings.address, locale);
  const sameAs = Object.values(settings.social).filter((v): v is string => Boolean(v));

  const contactPoint =
    settings.phone || settings.email
      ? [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(settings.phone ? { telephone: settings.phone } : {}),
            ...(settings.email ? { email: settings.email } : {}),
            availableLanguage: settings.enabledLocales.map((l) => ({ fr: "French", ar: "Arabic", en: "English" })[l]),
          },
        ]
      : undefined;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        // Brand name as written on the logo and in every title; the legal entity name stays in legalName.
        name: "MSLAB",
        ...(settings.legalName ? { legalName: settings.legalName } : {}),
        url: siteUrl,
        logo: `${siteUrl}/brand/mslab-logo-512.png`,
        ...(settings.email ? { email: settings.email } : {}),
        ...(settings.phone ? { telephone: settings.phone } : {}),
        ...(address ? { address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "MA" } } : { address: { "@type": "PostalAddress", addressCountry: "MA" } }),
        ...(sameAs.length ? { sameAs } : {}),
        ...(contactPoint ? { contactPoint } : {}),
      }}
    />
  );
}
