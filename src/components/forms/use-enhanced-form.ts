"use client";

import { startTransition, useEffect, useRef, type FormEvent } from "react";

/**
 * Progressive enhancement for server-action forms:
 * - without JS the <form action> posts normally;
 * - with JS, onSubmit sends the same FormData inside a transition, which keeps the user's
 *   input after a validation error (no automatic form reset) and adds:
 *     startedAt     time the form became interactive (minimum fill-time anti-spam check)
 *     submissionId  one id per form instance → database idempotency on double submit
 */
export function useEnhancedForm(formAction: (data: FormData) => void) {
  const startedAt = useRef(0);
  const submissionId = useRef("");

  useEffect(() => {
    startedAt.current = Date.now();
    submissionId.current = crypto.randomUUID();
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (startedAt.current) data.set("startedAt", String(startedAt.current));
    if (submissionId.current) data.set("submissionId", submissionId.current);
    startTransition(() => formAction(data));
  }

  return { onSubmit };
}

/** After an error render, move focus to the first invalid field (or the error summary). */
export function useFocusFirstError(trigger: unknown, container: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!trigger || !container.current) return;
    const target =
      container.current.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      container.current.querySelector<HTMLElement>("[data-error-summary]");
    target?.focus();
  }, [trigger, container]);
}
