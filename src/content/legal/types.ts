/**
 * Legal documents (ADR-024). Text is versioned in the repository, written against Moroccan law
 * (Loi 09-08, Loi 31-08, Loi 53-05) and must be validated by MSLAB's legal adviser before its
 * status is switched to "validated".
 *
 * Inline syntax inside every string (rendered by components/legal/legal-inline.tsx):
 *   {ph:key}            value MSLAB enters in /admin/settings → "Informations légales"
 *   {fact:key}          company fact from /admin/settings (contact details, legal name)
 *   [[ … ]]             optional segment: dropped when a value inside it is not configured yet
 *
 * A value that is not configured is NEVER shown as a placeholder on the public site: the
 * optional segment around it is removed, or — without one — the whole paragraph, list item,
 * table row or label/value row is hidden (resolve.ts). Sections left empty are hidden too.
 *   [label](route:key)  internal link to another public page, optionally with #anchor
 *   [label](https://…)  external link (official sources only)
 *   **text**            emphasis
 */
import type { Locale } from "@/i18n/config";

export const LEGAL_DOCUMENTS = [
  "legal",
  "privacy",
  "cookies",
  "terms",
  "sales",
  "delivery",
  "returns",
  "custom-orders",
] as const;

export type LegalDocumentKey = (typeof LEGAL_DOCUMENTS)[number];

/** Placeholder keys; labels live in the dictionaries (legalCenter.placeholders.*). */
export const PLACEHOLDERS = [
  "rc",
  "ice",
  "address",
  "phone",
  "email",
  "cndpReference",
  "retentionInquiries",
  "retentionQuotes",
  "retentionFiles",
  "retentionCustomers",
  "emailProvider",
  "quoteValidity",
  "paymentMethods",
  "paymentTerms",
  "proofProcess",
  "productionLeadTimes",
  "deliveryZones",
  "deliveryLeadTimes",
  "deliveryFees",
  "carriers",
  "pickup",
  "claimDeadline",
  "refundMethod",
  "courts",
] as const;

export type PlaceholderKey = (typeof PLACEHOLDERS)[number];

/**
 * Placeholders edited in /admin/settings → "Informations légales" (stored in
 * site_settings.legal_facts). address/phone/email are the existing contact settings instead.
 * `localized: false` = one value for every language (identifiers, references).
 */
export const LEGAL_FACT_GROUPS = [
  { id: "company", fields: [{ key: "rc", localized: false }, { key: "ice", localized: false }, { key: "courts", localized: true }] },
  {
    id: "data",
    fields: [
      { key: "cndpReference", localized: false },
      { key: "emailProvider", localized: false },
      { key: "retentionInquiries", localized: true },
      { key: "retentionQuotes", localized: true },
      { key: "retentionFiles", localized: true },
      { key: "retentionCustomers", localized: true },
    ],
  },
  {
    id: "sales",
    fields: [
      { key: "quoteValidity", localized: true },
      { key: "paymentMethods", localized: true },
      { key: "paymentTerms", localized: true },
      { key: "productionLeadTimes", localized: true },
      { key: "proofProcess", localized: true },
      { key: "claimDeadline", localized: true },
      { key: "refundMethod", localized: true },
    ],
  },
  {
    id: "delivery",
    fields: [
      { key: "deliveryZones", localized: true },
      { key: "deliveryLeadTimes", localized: true },
      { key: "deliveryFees", localized: true },
      { key: "carriers", localized: true },
      { key: "pickup", localized: true },
    ],
  },
] as const satisfies ReadonlyArray<{ id: string; fields: ReadonlyArray<{ key: PlaceholderKey; localized: boolean }> }>;

export type LegalFactKey = (typeof LEGAL_FACT_GROUPS)[number]["fields"][number]["key"];

export const LEGAL_FACT_FIELDS: ReadonlyArray<{ key: LegalFactKey; localized: boolean }> = LEGAL_FACT_GROUPS.flatMap(
  (g): ReadonlyArray<{ key: LegalFactKey; localized: boolean }> => g.fields,
);

/** Admin form field name: `legal_fact_rc` (language-neutral) or `legal_fact_paymentMethods_fr`. */
export function legalFactFieldName(key: LegalFactKey, lang: Locale | "all") {
  return lang === "all" ? `legal_fact_${key}` : `legal_fact_${key}_${lang}`;
}

/** Per-language values (`all` = language-neutral value) as stored in site_settings.legal_facts. */
export type LegalFactValues = Partial<Record<LegalFactKey, Partial<Record<Locale | "all", string>>>>;

/** Facts read from site_settings; when empty, the mapped placeholder is shown instead. */
export const FACTS = {
  legalName: null,
  address: "address",
  phone: "phone",
  email: "email",
} as const satisfies Record<string, PlaceholderKey | null>;

export type FactKey = keyof typeof FACTS;

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  /** Highlighted paragraph for a key point (e.g. mandatory consumer rights). */
  | { type: "note"; text: string }
  /** Label/value list, e.g. company identification. */
  | { type: "dl"; items: [label: string, value: string][] };

export type LegalSection = {
  /** Stable anchor, identical in every locale. */
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocumentText = {
  title: string;
  /** Footer / navigation label. */
  shortTitle: string;
  description: string;
  lead: string;
  sections: LegalSection[];
};

export type LegalDocument = {
  key: LegalDocumentKey;
  /** "draft": visible notice + noindex + excluded from the sitemap. */
  status: "draft" | "validated";
  version: string;
  /** ISO date (YYYY-MM-DD) of the last change to the text. */
  lastUpdated: string;
  text: Record<Locale, LegalDocumentText>;
};
