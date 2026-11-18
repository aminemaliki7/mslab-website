import type { LegalFactGroupView } from "@/components/admin/legal-facts-fields";
import { SettingsForm } from "@/components/admin/settings-form";
import { AdminPageHeader, Notice } from "@/components/admin/ui";
import { orderedLegalDocuments } from "@/content/legal";
import { LEGAL_FACT_GROUPS, legalFactFieldName, type LegalFactKey } from "@/content/legal/types";
import { requireAdmin } from "@/features/admin/auth";
import { formatAdminDateTime, type AdminLang } from "@/features/admin/dictionary";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { parseLegalFacts } from "@/features/settings/queries";
import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.settings.title);

/** Which legal documents use a value (shown next to each field). */
function documentsUsing(key: LegalFactKey, lang: AdminLang): string[] {
  const token = `{ph:${key}}`;
  return orderedLegalDocuments.filter((doc) => JSON.stringify(doc.text.fr).includes(token)).map((doc) => doc.text[lang].shortTitle);
}

async function legalFactGroups(raw: unknown, lang: AdminLang): Promise<LegalFactGroupView[]> {
  const facts = parseLegalFacts(raw);
  // Field labels are the placeholder names of the public dictionaries, in the admin's language.
  const labels = (await getDictionary(lang)).legalCenter.placeholders;
  return LEGAL_FACT_GROUPS.map((group) => ({
    id: group.id,
    fields: group.fields.map(({ key, localized }) => {
      const entry = facts[key] ?? {};
      const values: Record<string, string> = {};
      for (const l of localized ? locales : (["all"] as const)) {
        const value = entry[l];
        if (value) values[legalFactFieldName(key, l)] = value;
      }
      const label = labels[key];
      return {
        key,
        localized,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        usedIn: documentsUsing(key, lang),
        values,
        configured: Boolean(localized ? entry.fr : entry.all),
      };
    }),
  }));
}

export default async function SettingsPage() {
  await requireAdmin();
  const { lang, t } = await getAdminT();
  const { data: settings } = await (await createSessionClient()).from("site_settings").select("*").eq("id", 1).single();
  if (!settings) return <Notice tone="danger">{t.settings.notFound}</Notice>;
  const legalFacts = await legalFactGroups(settings.legal_facts, lang);

  return (
    <>
      <AdminPageHeader title={t.settings.title} description={format(t.settings.description, { date: formatAdminDateTime(settings.updated_at, lang) })} />
      <SettingsForm settings={settings} legalFacts={legalFacts} />
    </>
  );
}
