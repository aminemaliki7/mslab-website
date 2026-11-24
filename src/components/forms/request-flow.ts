import "server-only";
import { whatsappHref } from "@/components/layout/whatsapp-button";
import { getSiteSettings } from "@/features/settings/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routes";
import type { BriefKind } from "@/features/inquiries/brief";
import { publicEnv } from "@/lib/env";
import type { BriefProps } from "./brief-or-form";
import type { RequestFlow } from "./request-confirmation";

/** Props of the "send a file or fill in the form" first step (brief-or-form.tsx). */
export function briefProps(
  locale: Locale,
  dict: Dictionary,
  kind: BriefKind,
  sourcePath: string,
  flow: RequestFlow,
): BriefProps {
  return {
    kind,
    locale,
    sourcePath,
    privacyHref: localizedPath(locale, { route: "privacy" }),
    storageEndpoint: `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/custom-uploads`,
    publishableKey: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    flow,
    t: { forms: dict.forms, pod: dict.printOnDemand, brief: dict.cx.brief },
  };
}

/** Texts and links for the request forms' "next steps" and confirmation (request-confirmation.tsx). */
export async function requestFlow(locale: Locale, dict: Dictionary): Promise<RequestFlow> {
  const settings = await getSiteSettings();
  return {
    next: dict.cx.nextSteps,
    confirm: dict.cx.confirm,
    contactHref: localizedPath(locale, { route: "contact" }),
    trackingHref: localizedPath(locale, { route: "track" }),
    whatsappHref: settings.whatsappNumber ? whatsappHref(settings.whatsappNumber, dict.whatsapp.prefill) : null,
  };
}
