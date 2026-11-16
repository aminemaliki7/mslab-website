"use client";

import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { useAdminT } from "./admin-i18n";

type Values = Record<string, string | number | boolean | null | undefined>;

const str = (v: Values[string]) => (v === null || v === undefined ? "" : String(v));

/**
 * One translatable field (`<name>_fr/_ar/_en`). French is the source and the only required
 * language, so it comes first at full width; Arabic (right-to-left) and English sit underneath
 * as optional translations.
 */
export function LocalizedField({
  name,
  label,
  values,
  errors,
  multiline,
  rows = 4,
  maxLength,
  requiredFr,
  hint,
}: {
  name: string;
  label: string;
  values: Values;
  errors: Record<string, string>;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  requiredFr?: boolean;
  hint?: string;
}) {
  const { t } = useAdminT();
  const control = (code: "fr" | "ar" | "en", p: Record<string, unknown>, translationRows: number) =>
    multiline ? (
      <Textarea {...p} name={`${name}_${code}`} lang={code} rows={translationRows} maxLength={maxLength} defaultValue={str(values[`${name}_${code}`])} />
    ) : (
      <Input {...p} name={`${name}_${code}`} lang={code} maxLength={maxLength} defaultValue={str(values[`${name}_${code}`])} />
    );

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">{label}</legend>
      <Field id={`${name}_fr`} label={`${label} (${t.locales.fr})`} hint={hint} required={requiredFr} error={errors[`${name}_fr`]} dir="ltr">
        {(p) => control("fr", p, rows)}
      </Field>
      <div className="bg-surface rounded-[var(--radius-control)] p-3">
        <p className="text-fg-muted mb-2 text-xs">
          {t.localized.translations} · {t.localized.translationsHint}
        </p>
        <div className={multiline ? "grid gap-3" : "grid gap-3 md:grid-cols-2"}>
          <Field id={`${name}_ar`} label={t.locales.ar} error={errors[`${name}_ar`]} dir="rtl">
            {(p) => control("ar", p, Math.min(rows, 3))}
          </Field>
          <Field id={`${name}_en`} label={t.locales.en} error={errors[`${name}_en`]} dir="ltr">
            {(p) => control("en", p, Math.min(rows, 3))}
          </Field>
        </div>
      </div>
    </fieldset>
  );
}

export function SlugFields({ values, errors }: { values: Values; errors: Record<string, string> }) {
  const { t } = useAdminT();
  return (
    <fieldset className="space-y-3">
      <legend className="text-fg mb-1 text-sm font-semibold">{t.localized.slugLegend}</legend>
      <p className="text-fg-muted -mt-1 text-xs">{t.localized.slugHint}</p>
      <div className="grid gap-3 md:grid-cols-3">
        {(["fr", "ar", "en"] as const).map((code) => {
          const key = `slug_${code}`;
          return (
            <Field key={key} id={key} label={t.locales[code]} error={errors[key]}>
              {(p) => <Input {...p} name={key} dir="ltr" maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={str(values[key])} />}
            </Field>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TextField({ name, label, values, errors, required, hint, type = "text", maxLength, dir }: { name: string; label: string; values: Values; errors: Record<string, string>; required?: boolean; hint?: string; type?: string; maxLength?: number; dir?: "ltr" | "rtl" }) {
  return (
    <Field id={name} label={label} required={required} hint={hint} error={errors[name]}>
      {(p) => <Input {...p} name={name} type={type} maxLength={maxLength} dir={dir} defaultValue={str(values[name])} />}
    </Field>
  );
}

export function SelectField({ name, label, values, errors, options, emptyLabel, hint }: { name: string; label: string; values: Values; errors: Record<string, string>; options: Array<{ value: string; label: string }>; emptyLabel?: string; hint?: string }) {
  return (
    <Field id={name} label={label} hint={hint} error={errors[name]}>
      {(p) => (
        <Select {...p} name={name} defaultValue={str(values[name])}>
          {emptyLabel !== undefined ? <option value="">{emptyLabel}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

/** Draft / published / archived select with self-explanatory option labels. */
export function StatusField({ values, errors }: { values: Values; errors: Record<string, string> }) {
  const { t } = useAdminT();
  return (
    <SelectField
      name="status"
      label={t.common.status}
      values={values}
      errors={errors}
      options={(["draft", "published", "archived"] as const).map((value) => ({ value, label: t.status.contentOption[value] }))}
    />
  );
}

export function SortOrderField({ values, errors }: { values: Values; errors: Record<string, string> }) {
  const { t } = useAdminT();
  return <TextField name="sort_order" label={t.common.sortOrder} type="number" values={values} errors={errors} hint={t.common.sortHint} />;
}

export function CheckboxField({ name, label, checked, hint }: { name: string; label: string; checked: boolean; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={name} name={name} defaultChecked={checked} />
      <label htmlFor={name} className="py-1 text-sm">
        <span className="font-medium">{label}</span>
        {hint ? <span className="text-fg-muted block text-xs">{hint}</span> : null}
      </label>
    </div>
  );
}
