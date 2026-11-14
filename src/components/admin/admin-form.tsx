"use client";

import { startTransition, useActionState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { idle, type AdminActionState } from "@/features/admin/action-state";
import { cn } from "@/lib/utils";

type Props = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  submitLabel: string;
  children: (state: AdminActionState) => ReactNode;
  className?: string;
  /** Form-level confirmation (e.g. destructive actions). */
  confirm?: string;
  submitVariant?: "primary" | "secondary" | "ghost";
  encType?: "multipart/form-data";
};

/**
 * Admin form shell: submits through useActionState without resetting the inputs, and shows
 * the result message. Field errors are passed to children via the state render-prop.
 */
export function AdminForm({ action, submitLabel, children, className, confirm, submitVariant = "primary", encType }: Props) {
  const [state, formAction, pending] = useActionState(action, idle);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form action={formAction} onSubmit={onSubmit} encType={encType} className={cn("space-y-6", className)} noValidate>
      {children(state)}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant={submitVariant} disabled={pending}>
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
        {state.message ? (
          <p role={state.ok ? "status" : "alert"} className={cn("text-sm font-medium", state.ok ? "text-success" : "text-danger")}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

/** Small one-button form for row actions (publish, feature, delete…). */
export function ActionButton({
  action,
  label,
  confirm,
  variant = "ghost",
  hidden,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  label: string;
  confirm?: string;
  variant?: "primary" | "secondary" | "ghost";
  hidden?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, idle);
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="inline-flex items-center gap-2"
    >
      {hidden ? Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />) : null}
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {label}
      </Button>
      {state.ok === false && state.message ? (
        <span role="alert" className="text-danger text-xs">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
