import { forLocale, getSiteSettings } from "@/features/settings/queries";
import type { Locale } from "@/i18n/config";
import { siteUrl } from "@/lib/env";
import { JsonLd } from "./json-ld";

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
        name: settings.companyName ?? "MSLAB",
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
