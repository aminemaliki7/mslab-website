import type { Metadata, Viewport } from "next";
import "../globals.css";
import { redirect } from "next/navigation";
import { ConsentManager } from "@/components/consent/consent-manager";
import { getSiteSettings } from "@/features/settings/queries";
import { defaultLocale, getDirection, localeMeta, locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import { siteUrl } from "@/lib/env";
import { fontVariables } from "@/lib/fonts";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `MSLAB — ${dict.pages.home.title}`, template: "%s | MSLAB" },
    description: dict.meta.defaultDescription,
    applicationName: "MSLAB",
  };
}

const LOGO_INTRO_SCRIPT =
  "try{if(!sessionStorage.getItem('mslab-intro')){sessionStorage.setItem('mslab-intro','1');document.documentElement.classList.add('logo-intro')}}catch(e){}";
const GTM_ID = "GTM-NZGP5ZDF";

export const viewport: Viewport = {
  themeColor: "#0e1a2b",
  width: "device-width",
  initialScale: 1,
  // Lets the page extend under the notch / home indicator; components add env(safe-area-inset-*) padding.
  viewportFit: "cover",
};

export default async function LocaleLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  // A language switched off in /admin/settings sends visitors to the French site.
  const [{ enabledLocales }, dict] = await Promise.all([getSiteSettings(), getDictionary(locale)]);
  if (!enabledLocales.includes(locale)) redirect(`/${defaultLocale}`);
  return (
    // suppressHydrationWarning: the intro script below adds a class to <html> before React hydrates.
    <html lang={localeMeta[locale].htmlLang} dir={getDirection(locale)} className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Logo intro (globals.css): only on the first page of a visit. Runs before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: LOGO_INTRO_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        {children}
        {/* GTM loads only after the visitor accepts audience measurement (ADR-024). */}
        <ConsentManager
          t={dict.consent}
          cookiePolicyHref={localizedPath(locale, { route: "cookies" })}
          gtmId={process.env.VERCEL_ENV === "production" ? GTM_ID : null}
        />
      </body>
    </html>
  );
}
