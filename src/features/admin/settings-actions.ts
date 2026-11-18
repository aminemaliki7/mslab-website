"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { normalizePhone } from "@/features/inquiries/schema";
import { SETTINGS_TAG } from "@/features/settings/queries";
import { createSessionClient } from "@/lib/supabase/server";
import { LEGAL_FACT_FIELDS, legalFactFieldName, type LegalFactValues } from "@/content/legal/types";
import { locales, type Locale } from "@/i18n/config";
import { failure, fromDb, fromZod, success, type AdminActionState } from "./action-state";
import { requireAdmin } from "./auth";
import { formToObject } from "./content-schemas";

/**
 * Company information shown on the public site (ADR-014). Only verified facts belong here;
 * an empty field hides the corresponding element on the site.
 */

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `${max} caractères maximum.` })
    .optional()
    .transform((v) => (v ? v : null));

const httpsUrl = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || (/^https:\/\//.test(v) && z.url().safeParse(v).success && v.length <= 500), { error: "Adresse https:// valide attendue." })
  .transform((v) => (v ? v : null));

const phone = (allowEmpty = true) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return allowEmpty ? null : z.NEVER;
      const normalized = normalizePhone(v);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "Numéro invalide (ex. 05 22 12 34 56 ou +212 …)." });
        return z.NEVER;
      }
      return normalized;
    });

const localized = (name: string, max: number) => ({
  [`${name}_fr`]: text(max),
  [`${name}_ar`]: text(max),
  [`${name}_en`]: text(max),
});

const settingsSchema = z.object({
  company_name: text(160),
  legal_name: text(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .refine((v) => !v || z.email().safeParse(v).success, { error: "Adresse e-mail invalide." })
    .transform((v) => (v ? v : null)),
  phone: phone(),
  // Stored as digits only (wa.me format).
  whatsapp_number: phone().transform((v) => (v ? v.replace(/^\+/, "") : null)),
  maps_url: httpsUrl,
  ...localized("address", 300),
  ...localized("opening_hours", 300),
  ...localized("about", 5000),
  ...localized("mission", 2000),
  ...localized("values", 2000),
  ...localized("highlights", 2000),
  ...localized("legal_notice", 20000),
  ...localized("privacy_policy", 20000),
  social_facebook: httpsUrl,
  social_instagram: httpsUrl,
  social_linkedin: httpsUrl,
  social_youtube: httpsUrl,
});

const LEGAL_FACT_MAX = 500;

/** legal_fact_* form fields → site_settings.legal_facts (empty values are dropped = hidden). */
function parseLegalFactsForm(formData: FormData): { ok: true; value: LegalFactValues } | { ok: false; fieldErrors: Record<string, string> } {
  const value: LegalFactValues = {};
  const fieldErrors: Record<string, string> = {};
  for (const { key, localized } of LEGAL_FACT_FIELDS) {
    const entry: Partial<Record<Locale | "all", string>> = {};
    for (const lang of localized ? locales : (["all"] as const)) {
      const name = legalFactFieldName(key, lang);
      const raw = formData.get(name);
      const text = typeof raw === "string" ? raw.replace(/\r\n/g, "\n").trim() : "";
      if (!text) continue;
      if (text.length > LEGAL_FACT_MAX) fieldErrors[name] = `${LEGAL_FACT_MAX} caractères maximum.`;
      // The legal texts use {…}, [[…]] and [..](..) as markup: refuse them in values.
      else if (/[{}]|\[\[|\]\]|\]\(/.test(text)) fieldErrors[name] = "Caractères { } [[ ]] non autorisés.";
      else entry[lang] = text;
    }
    if (Object.keys(entry).length) value[key] = entry;
  }
  return Object.keys(fieldErrors).length ? { ok: false, fieldErrors } : { ok: true, value };
}

export async function saveSettings(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = settingsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const legalFacts = parseLegalFactsForm(formData);
  if (!legalFacts.ok) return failure("Le formulaire contient des erreurs.", legalFacts.fieldErrors);

  // French is always enabled (default locale); ar/en can be hidden from the language switcher later.
  const enabled = ["fr", ...["ar", "en"].filter((l) => formData.get(`locale_${l}`) === "on")];

  const { error } = await (await createSessionClient())
    .from("site_settings")
    .update({
      ...(parsed.data as Record<string, string | null>),
      legal_facts: legalFacts.value,
      enabled_locales: enabled,
      updated_by: admin.id,
    })
    .eq("id", 1);
  if (error) return fromDb(error, "update settings");
  updateTag(SETTINGS_TAG);
  refresh();
  return success("Paramètres enregistrés. Le site public est mis à jour.");
}
