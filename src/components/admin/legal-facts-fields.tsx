"use client";

import { LocalizedField, TextField } from "@/components/admin/fields";
import { Panel } from "@/components/admin/ui";
import { legalFactFieldName, type LegalFactKey } from "@/content/legal/types";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { useAdminT } from "./admin-i18n";

export type LegalFactFieldView = {
  key: LegalFactKey;
  localized: boolean;
  label: string;
  /** Short titles of the legal documents that use this value. */
  usedIn: string[];
  /** Current values by form field name (legal_fact_rc, legal_fact_paymentMethods_fr…). */
  values: Record<string, string>;
  configured: boolean;
};

export type LegalFactGroupView = { id: "company" | "data" | "sales" | "delivery"; fields: LegalFactFieldView[] };

/** Long answers get a textarea; identifiers and short durations a single line. */
const MULTILINE: ReadonlySet<LegalFactKey> = new Set(["paymentTerms", "proofProcess", "deliveryZones", "deliveryFees", "pickup", "refundMethod"]);

/**
 * "Informations légales" panel of /admin/settings. Every value is optional: until it is filled
 * in, the public legal pages simply leave out the sentence or row that needs it.
 */
export function LegalFactsFields({ groups, errors }: { groups: LegalFactGroupView[]; errors: Record<string, string> }) {
  const { t } = useAdminT();
  const s = t.settings;

  return (
    <Panel title={s.legalFacts} description={s.legalFactsHint}>
      <div className="space-y-10">
        {groups.map((group) => (
          <fieldset key={group.id} className="space-y-6">
            <legend className="text-fg border-line mb-2 w-full border-b pb-2 text-sm font-semibold">{s.legalFactsGroups[group.id]}</legend>
            {group.fields.map((field) => {
              // Base name: LocalizedField appends _fr/_ar/_en, matching legalFactFieldName(key, lang).
              const name = legalFactFieldName(field.key, "all");
              const hint = [format(s.legalFactsUsedIn, { docs: field.usedIn.join(", ") }), field.localized ? null : s.legalFactsSingle].filter(Boolean).join(" ");
              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-fg-muted">{hint}</span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-medium",
                        field.configured ? "bg-success-soft text-success" : "bg-surface-strong text-fg-muted",
                      )}
                    >
                      {field.configured ? s.legalFactsShown : s.legalFactsHidden}
                    </span>
                  </div>
                  {field.localized ? (
                    <LocalizedField name={name} label={field.label} values={field.values} errors={errors} multiline={MULTILINE.has(field.key)} rows={2} maxLength={500} />
                  ) : (
                    <TextField name={name} label={field.label} values={field.values} errors={errors} maxLength={500} />
                  )}
                </div>
              );
            })}
          </fieldset>
        ))}
      </div>
    </Panel>
  );
}
