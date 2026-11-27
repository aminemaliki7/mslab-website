"use client";

import { Field, Input, Select, Textarea } from "@/components/ui/form";

/** Small field helpers for the business forms (labels + errors wired by <Field>). */

export function AmountInput({ name, label, error, defaultValue, required, hint }: { name: string; label: string; error?: string; defaultValue?: string; required?: boolean; hint?: string }) {
  return (
    <Field id={name} label={label} error={error} required={required} hint={hint}>
      {(p) => <Input {...p} name={name} inputMode="decimal" autoComplete="off" dir="ltr" defaultValue={defaultValue} placeholder="0,00" />}
    </Field>
  );
}

export function QtyInput({ name, label, error, defaultValue, required, hint }: { name: string; label: string; error?: string; defaultValue?: string; required?: boolean; hint?: string }) {
  return (
    <Field id={name} label={label} error={error} required={required} hint={hint}>
      {(p) => <Input {...p} name={name} inputMode="decimal" autoComplete="off" dir="ltr" defaultValue={defaultValue} />}
    </Field>
  );
}

export function TextInput({ name, label, error, defaultValue, required, hint, maxLength = 160, type = "text", id }: { name: string; label: string; error?: string; defaultValue?: string | null; required?: boolean; hint?: string; maxLength?: number; type?: string; id?: string }) {
  return (
    <Field id={id ?? name} label={label} error={error} required={required} hint={hint}>
      {(p) => <Input {...p} name={name} type={type} dir="auto" maxLength={maxLength} defaultValue={defaultValue ?? ""} />}
    </Field>
  );
}

export function TextArea({ name, label, error, defaultValue, rows = 3, maxLength = 4000, placeholder, id }: { name: string; label: string; error?: string; defaultValue?: string | null; rows?: number; maxLength?: number; placeholder?: string; id?: string }) {
  return (
    <Field id={id ?? name} label={label} error={error}>
      {(p) => <Textarea {...p} name={name} rows={rows} dir="auto" maxLength={maxLength} placeholder={placeholder} defaultValue={defaultValue ?? ""} />}
    </Field>
  );
}

export function Choice({
  name,
  label,
  options,
  defaultValue,
  error,
  emptyLabel,
  id,
  hint,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string | null;
  error?: string;
  emptyLabel?: string;
  id?: string;
  hint?: string;
}) {
  return (
    <Field id={id ?? name} label={label} error={error} hint={hint}>
      {(p) => (
        <Select {...p} name={name} defaultValue={defaultValue ?? ""}>
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

export function FileInput({ name, label, hint, error, accept = "image/jpeg,image/png,image/webp,application/pdf" }: { name: string; label: string; hint?: string; error?: string; accept?: string }) {
  return (
    <Field id={name} label={label} hint={hint} error={error}>
      {(p) => <input {...p} type="file" name={name} accept={accept} className="file:bg-surface-strong file:text-fg text-sm file:me-3 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium" />}
    </Field>
  );
}
