"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { idle, type AdminActionState } from "@/features/admin/action-state";
import { translateErrors, translateMessage } from "@/features/admin/dictionary";
import { cn } from "@/lib/utils";
import { useAdminT } from "./admin-i18n";

type Props = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  submitLabel: string;
  children: (state: AdminActionState) => ReactNode;
  className?: string;
  /** Form-level confirmation (e.g. destructive actions). */
  confirm?: string;
  submitVariant?: "primary" | "secondary" | "ghost";
  encType?: "multipart/form-data";
  /**
   * Money / stock operations: adds a `client_key` (UUID) that stays the same while the request
   * is pending and changes after each response, so a double tap or a retry is posted once.
   */
  idempotent?: boolean;
};

/**
 * Admin form shell: submits through useActionState without resetting the inputs, and shows
 * the result message in the admin's language. Field errors are passed to children (already
 * translated) via the state render-prop. The save bar sticks to the bottom of the screen on
 * long forms so the button is always reachable.
 */
export function AdminForm({ action, submitLabel, children, className, confirm, submitVariant = "primary", encType, idempotent }: Props) {
  const { lang, t } = useAdminT();
  const [state, formAction, pending] = useActionState(action, idle);
  const keyRef = useRef<string | null>(null);
  // A response arrived (success or failure): the next submission is a new operation.
  useEffect(() => {
    keyRef.current = null;
  }, [state]);
  const shown: AdminActionState = {
    ...state,
    message: state.message ? translateMessage(state.message, lang) : null,
    fieldErrors: translateErrors(state.fieldErrors, lang),
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending && idempotent) return;
    if (confirm && !window.confirm(confirm)) return;
    const data = new FormData(event.currentTarget);
    if (idempotent) {
      keyRef.current ??= crypto.randomUUID();
      data.set("client_key", keyRef.current);
    }
    startTransition(() => formAction(data));
  }

  return (
    <form action={formAction} onSubmit={onSubmit} encType={encType} className={cn("space-y-6", className)} noValidate>
      {children(shown)}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant={submitVariant} disabled={pending} className="max-sm:w-full">
          {pending ? t.common.saving : submitLabel}
        </Button>
        {shown.message ? (
          <p role={shown.ok ? "status" : "alert"} className={cn("text-sm font-medium", shown.ok ? "text-success" : "text-danger")}>
            {shown.message}
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
  const { lang } = useAdminT();
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
      <Button type="submit" size="sm" variant={variant === "ghost" ? "secondary" : variant} disabled={pending} className={variant === "ghost" ? "border-line-strong text-fg min-h-10" : "min-h-10"}>
        {label}
      </Button>
      {state.ok === false && state.message ? (
        <span role="alert" className="text-danger text-xs">
          {translateMessage(state.message, lang)}
        </span>
      ) : null}
    </form>
  );
}
