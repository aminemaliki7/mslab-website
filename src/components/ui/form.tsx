import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const control =
  "w-full rounded-[var(--radius-control)] border border-line-strong bg-bg px-3 text-fg " +
  "placeholder:text-fg-subtle transition-colors duration-150 hover:border-slate-500 " +
  "focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0 " +
  "aria-[invalid=true]:border-danger disabled:bg-surface disabled:text-fg-muted";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  requiredLabel?: string;
  hint?: string;
  error?: string;
  /** Render direction for the control, e.g. "rtl" for Arabic content fields in admin. */
  dir?: "ltr" | "rtl" | "auto";
  className?: string;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
    required?: boolean;
    dir?: "ltr" | "rtl" | "auto";
  }) => ReactNode;
};

/** Label + control + hint + error wiring with correct aria attributes. */
export function Field({ id, label, required, requiredLabel = "*", hint, error, dir, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-fg text-sm font-medium">
        {label}
        {required ? (
          <span className="text-danger ms-0.5" aria-hidden="true">
            {requiredLabel}
          </span>
        ) : null}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required, dir })}
      {hint ? (
        <p id={hintId} className="text-fg-muted text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  // 48 px on phones (thumb-sized), 44 px from sm.
  return <input className={cn(control, "h-12 sm:h-11", className)} {...props} />;
}

export function Textarea({ className, rows = 5, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={cn(control, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  // select-control (globals.css): one chevron style for every select, same as the comboboxes.
  return <select className={cn(control, "select-control h-12 pe-10 sm:h-11", className)} {...props} />;
}

export function Checkbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      className={cn("accent-accent border-line-strong mt-1 size-6 shrink-0 rounded", className)}
      {...props}
    />
  );
}
