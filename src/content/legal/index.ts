import type { SiteSettings } from "@/features/settings/queries";
import type { Locale } from "@/i18n/config";
import { cookies } from "./cookies";
import { customOrders } from "./custom-orders";
import { delivery } from "./delivery";
import { legalNotice } from "./legal-notice";
import { privacy } from "./privacy";
import { returns } from "./returns";
import { sales } from "./sales";
import { terms } from "./terms";
import { LEGAL_DOCUMENTS, type LegalDocument, type LegalDocumentKey, type LegalFactKey, type LegalFactValues } from "./types";

export const legalDocuments: Record<LegalDocumentKey, LegalDocument> = {
  legal: legalNotice,
  privacy,
  cookies,
  terms,
  sales,
  delivery,
  returns,
  "custom-orders": customOrders,
};

/** Documents in display order (footer, navigation, sitemap). */
export const orderedLegalDocuments = LEGAL_DOCUMENTS.map((key) => legalDocuments[key]);

/**
 * Text MSLAB entered in /admin/settings (ADR-014) still takes precedence for the legal notice and
 * privacy policy, in the locale it was written for; the versioned documents are the default.
 */
export function legalAdminOverride(key: LegalDocumentKey, settings: SiteSettings, locale: Locale): string | null {
  if (key === "legal") return settings.legalNotice[locale] ?? null;
  if (key === "privacy") return settings.privacyPolicy[locale] ?? null;
  return null;
}

/** Value of an admin-configured legal fact for a locale: language-neutral, then locale, then French. */
export function legalFactValue(facts: LegalFactValues, key: LegalFactKey, locale: Locale): string | null {
  const entry = facts[key];
  if (!entry) return null;
  return entry.all ?? entry[locale] ?? entry.fr ?? null;
}

/** Announced to search engines (robots + sitemap) only once validated, or replaced by admin text. */
export function isLegalDocumentIndexable(doc: LegalDocument, settings: SiteSettings, locale: Locale) {
  return doc.status === "validated" || Boolean(legalAdminOverride(doc.key, settings, locale));
}

export * from "./types";
