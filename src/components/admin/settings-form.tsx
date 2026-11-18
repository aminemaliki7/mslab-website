"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField, LocalizedField, TextField } from "@/components/admin/fields";
import { Panel } from "@/components/admin/ui";
import { saveSettings } from "@/features/admin/settings-actions";
import type { Tables } from "@/lib/supabase/database.types";
import { useAdminT } from "./admin-i18n";
import { LegalFactsFields, type LegalFactGroupView } from "./legal-facts-fields";

export function SettingsForm({ settings, legalFacts }: { settings: Tables<"site_settings">; legalFacts: LegalFactGroupView[] }) {
  const { t } = useAdminT();
  const s = t.settings;
  const values = {
    ...settings,
    whatsapp_number: settings.whatsapp_number ? `+${settings.whatsapp_number}` : null,
  } as unknown as Record<string, string | number | boolean | null>;

  return (
    <AdminForm action={saveSettings} submitLabel={s.save}>
      {(state) => {
        const e = state.fieldErrors;
        return (
          <>
            <p className="bg-warning-soft text-warning rounded-[var(--radius-control)] px-4 py-3 text-sm">{s.warning}</p>

            <Panel title={s.contact}>
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-3">
                  <TextField name="phone" label={s.phone} type="tel" values={values} errors={e} dir="ltr" />
                  <TextField name="whatsapp_number" label={s.whatsapp} type="tel" values={values} errors={e} dir="ltr" hint={s.whatsappHint} />
                  <TextField name="email" label={s.email} type="email" values={values} errors={e} dir="ltr" />
                </div>
                <LocalizedField name="address" label={s.address} values={values} errors={e} multiline rows={2} maxLength={300} />
                <TextField name="maps_url" label={s.maps} values={values} errors={e} dir="ltr" hint={s.mapsHint} />
                <LocalizedField name="opening_hours" label={s.hours} values={values} errors={e} multiline rows={2} maxLength={300} />
              </div>
            </Panel>

            <Panel title={s.company}>
              <div className="grid gap-5 md:grid-cols-2">
                <TextField name="company_name" label={s.companyName} values={values} errors={e} maxLength={160} />
                <TextField name="legal_name" label={s.legalName} values={values} errors={e} maxLength={200} />
              </div>
            </Panel>

            <Panel title={s.presentation}>
              <div className="space-y-6">
                <LocalizedField name="about" label={s.about} values={values} errors={e} multiline rows={6} maxLength={5000} />
                <LocalizedField name="highlights" label={s.highlights} hint={s.highlightsHint} values={values} errors={e} multiline rows={4} maxLength={2000} />
                <LocalizedField name="mission" label={s.mission} values={values} errors={e} multiline rows={3} maxLength={2000} />
                <LocalizedField name="values" label={s.values} hint={s.valuesHint} values={values} errors={e} multiline rows={3} maxLength={2000} />
              </div>
            </Panel>

            <Panel title={s.social}>
              <div className="grid gap-5 md:grid-cols-2">
                <TextField name="social_facebook" label="Facebook" values={values} errors={e} dir="ltr" />
                <TextField name="social_instagram" label="Instagram" values={values} errors={e} dir="ltr" />
                <TextField name="social_linkedin" label="LinkedIn" values={values} errors={e} dir="ltr" />
                <TextField name="social_youtube" label="YouTube" values={values} errors={e} dir="ltr" />
              </div>
            </Panel>

            <LegalFactsFields groups={legalFacts} errors={e} />

            <Panel title={s.legal} description={s.legalHint}>
              <div className="space-y-6">
                <LocalizedField name="legal_notice" label={s.legalNotice} values={values} errors={e} multiline rows={8} maxLength={20000} />
                <LocalizedField name="privacy_policy" label={s.privacy} values={values} errors={e} multiline rows={10} maxLength={20000} />
              </div>
            </Panel>

            <Panel title={s.languages} description={s.languagesHint}>
              <div className="space-y-3">
                <CheckboxField name="locale_ar" label={t.locales.ar} checked={settings.enabled_locales.includes("ar")} />
                <CheckboxField name="locale_en" label={t.locales.en} checked={settings.enabled_locales.includes("en")} />
              </div>
            </Panel>
          </>
        );
      }}
    </AdminForm>
  );
}
