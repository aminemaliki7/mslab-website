"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField, LocalizedField, SelectField, SlugFields, TextField } from "@/components/admin/fields";
import { Panel } from "@/components/admin/ui";
import { saveService } from "@/features/admin/content-actions";
import type { Tables } from "@/lib/supabase/database.types";

export function ServiceForm({ service }: { service: Tables<"services"> | null }) {
  const values = (service ?? { status: "draft", sort_order: 0 }) as Record<string, string | number | boolean | null>;
  return (
    <AdminForm action={saveService} submitLabel={service ? "Enregistrer" : "Créer le service"}>
      {(state) => (
        <>
          {service ? <input type="hidden" name="id" value={service.id} /> : null}
          <Panel title="Contenu">
            <div className="space-y-6">
              <LocalizedField name="name" label="Nom du service" values={values} errors={state.fieldErrors} requiredFr maxLength={160} />
              <SlugFields values={values} errors={state.fieldErrors} />
              <LocalizedField name="summary" label="Résumé (cartes et référencement)" values={values} errors={state.fieldErrors} multiline rows={2} maxLength={500} />
              <LocalizedField name="description" label="Description détaillée" hint="Texte simple. Ligne vide = nouveau paragraphe ; « - » en début de ligne = liste." values={values} errors={state.fieldErrors} multiline rows={8} maxLength={10000} />
            </div>
          </Panel>
          <Panel title="Publication">
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                name="status"
                label="Statut"
                values={values}
                errors={state.fieldErrors}
                options={[
                  { value: "draft", label: "Brouillon (non visible)" },
                  { value: "published", label: "Publié" },
                  { value: "archived", label: "Archivé (non visible)" },
                ]}
              />
              <TextField name="sort_order" label="Ordre d'affichage" type="number" values={values} errors={state.fieldErrors} />
              <CheckboxField name="is_featured" label="Mettre en avant sur l'accueil" checked={Boolean(service?.is_featured)} />
            </div>
          </Panel>
        </>
      )}
    </AdminForm>
  );
}
