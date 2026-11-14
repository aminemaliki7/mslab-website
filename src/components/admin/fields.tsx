import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";

const LOCALES = [
  { code: "fr", label: "Français", dir: "ltr" as const },
  { code: "ar", label: "Arabe", dir: "rtl" as const },
  { code: "en", label: "Anglais", dir: "ltr" as const },
];

type Values = Record<string, string | number | boolean | null | undefined>;

const str = (v: Values[string]) => (v === null || v === undefined ? "" : String(v));

/**
 * One translatable field as three inputs (`<name>_fr/_ar/_en`). French is the source and the
 * only required locale; Arabic inputs are right-to-left (ADR-010/015).
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
  return (
    <fieldset className="space-y-3">
      <legend className="text-fg mb-1 text-sm font-semibold">{label}</legend>
      {hint ? <p className="text-fg-muted -mt-1 text-xs">{hint}</p> : null}
      <div className={multiline ? "grid gap-3" : "grid gap-3 md:grid-cols-3"}>
        {LOCALES.map((locale) => {
          const key = `${name}_${locale.code}`;
          return (
            <Field
              key={key}
              id={key}
              label={locale.label}
              required={requiredFr && locale.code === "fr"}
              error={errors[key]}
              dir={locale.dir}
            >
              {(p) =>
                multiline ? (
                  <Textarea {...p} name={key} lang={locale.code} rows={rows} maxLength={maxLength} defaultValue={str(values[key])} />
                ) : (
                  <Input {...p} name={key} lang={locale.code} maxLength={maxLength} defaultValue={str(values[key])} />
                )
              }
            </Field>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SlugFields({ values, errors }: { values: Values; errors: Record<string, string> }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-fg mb-1 text-sm font-semibold">Adresse (slug)</legend>
      <p className="text-fg-muted -mt-1 text-xs">
        Laisser vide pour générer à partir du nom. Lettres minuscules, chiffres et tirets. Pour l&apos;arabe, utilisez des
        lettres latines ou laissez vide (le slug français sera utilisé).
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {LOCALES.map((locale) => {
          const key = `slug_${locale.code}`;
          return (
            <Field key={key} id={key} label={locale.label} error={errors[key]}>
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

export function SelectField({ name, label, values, errors, options, emptyLabel }: { name: string; label: string; values: Values; errors: Record<string, string>; options: Array<{ value: string; label: string }>; emptyLabel?: string }) {
  return (
    <Field id={name} label={label} error={errors[name]}>
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

export function CheckboxField({ name, label, checked, hint }: { name: string; label: string; checked: boolean; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={name} name={name} defaultChecked={checked} />
      <label htmlFor={name} className="text-sm">
        <span className="font-medium">{label}</span>
        {hint ? <span className="text-fg-muted block text-xs">{hint}</span> : null}
      </label>
    </div>
  );
}
