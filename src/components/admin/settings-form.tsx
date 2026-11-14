"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField, LocalizedField, TextField } from "@/components/admin/fields";
import { Panel } from "@/components/admin/ui";
import { saveSettings } from "@/features/admin/settings-actions";
import type { Tables } from "@/lib/supabase/database.types";

export function SettingsForm({ settings }: { settings: Tables<"site_settings"> }) {
  const values = {
    ...settings,
    whatsapp_number: settings.whatsapp_number ? `+${settings.whatsapp_number}` : null,
  } as unknown as Record<string, string | number | boolean | null>;

  return (
    <AdminForm action={saveSettings} submitLabel="Enregistrer les paramètres">
      {(state) => {
        const e = state.fieldErrors;
        return (
          <>
            <p className="bg-warning-soft text-warning rounded-[var(--radius-control)] px-4 py-3 text-sm">
              N&apos;indiquez que des informations vérifiées. Un champ vide est simplement masqué sur le site.
            </p>

            <Panel title="Entreprise">
              <div className="grid gap-5 md:grid-cols-2">
                <TextField name="company_name" label="Nom commercial" values={values} errors={e} maxLength={160} />
                <TextField name="legal_name" label="Raison sociale" values={values} errors={e} maxLength={200} />
              </div>
            </Panel>

            <Panel title="Coordonnées">
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-3">
                  <TextField name="email" label="E-mail de contact" type="email" values={values} errors={e} dir="ltr" />
                  <TextField name="phone" label="Téléphone" type="tel" values={values} errors={e} dir="ltr" />
                  <TextField name="whatsapp_number" label="Numéro WhatsApp" type="tel" values={values} errors={e} dir="ltr" hint="Les boutons WhatsApp n'apparaissent que si ce champ est rempli." />
                </div>
                <LocalizedField name="address" label="Adresse" values={values} errors={e} multiline rows={2} maxLength={300} />
                <TextField name="maps_url" label="Lien Google Maps (https://…)" values={values} errors={e} dir="ltr" hint="Affiché uniquement si une adresse est renseignée." />
                <LocalizedField name="opening_hours" label="Horaires d'ouverture" values={values} errors={e} multiline rows={2} maxLength={300} />
              </div>
            </Panel>

            <Panel title="Présentation (page « À propos » et accueil)">
              <div className="space-y-6">
                <LocalizedField name="about" label="Présentation de l'entreprise" values={values} errors={e} multiline rows={6} maxLength={5000} />
                <LocalizedField name="mission" label="Mission" values={values} errors={e} multiline rows={3} maxLength={2000} />
                <LocalizedField name="values" label="Valeurs" hint="« - » en début de ligne pour une liste." values={values} errors={e} multiline rows={3} maxLength={2000} />
                <LocalizedField name="highlights" label="Pourquoi choisir MSLAB" hint="Un point vérifiable par ligne. Section masquée si vide." values={values} errors={e} multiline rows={4} maxLength={2000} />
              </div>
            </Panel>

            <Panel title="Pages légales (Loi 09-08)">
              <div className="space-y-6">
                <p className="text-fg-muted text-sm">
                  Textes rédigés ou validés par MSLAB (idéalement relus par un juriste). Tant qu&apos;un texte est vide, la
                  page publique affiche « en cours de préparation » et n&apos;est pas indexée. Liste des points à couvrir :
                  docs/LEGAL_CONTENT_CHECKLIST.md.
                </p>
                <LocalizedField name="legal_notice" label="Mentions légales" values={values} errors={e} multiline rows={8} maxLength={20000} />
                <LocalizedField name="privacy_policy" label="Politique de confidentialité" values={values} errors={e} multiline rows={10} maxLength={20000} />
              </div>
            </Panel>

            <Panel title="Réseaux sociaux">
              <div className="grid gap-5 md:grid-cols-2">
                <TextField name="social_facebook" label="Facebook" values={values} errors={e} dir="ltr" />
                <TextField name="social_instagram" label="Instagram" values={values} errors={e} dir="ltr" />
                <TextField name="social_linkedin" label="LinkedIn" values={values} errors={e} dir="ltr" />
                <TextField name="social_youtube" label="YouTube" values={values} errors={e} dir="ltr" />
              </div>
            </Panel>

            <Panel title="Langues du site">
              <div className="space-y-3">
                <p className="text-fg-muted text-sm">Le français est toujours actif (langue principale).</p>
                <CheckboxField name="locale_ar" label="Arabe" checked={settings.enabled_locales.includes("ar")} />
                <CheckboxField name="locale_en" label="Anglais" checked={settings.enabled_locales.includes("en")} />
              </div>
            </Panel>
          </>
        );
      }}
    </AdminForm>
  );
}
