"use client";

import { startTransition, useActionState } from "react";
import { ErrorSummary } from "@/components/forms/form-parts";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { trackRequest, type TrackingState } from "@/features/print-on-demand/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";

type T = { forms: Dictionary["forms"]; tracking: Dictionary["tracking"] };
type StepKey = keyof Dictionary["tracking"]["steps"];

const initial: TrackingState = { status: "idle" };

/** Progress steps shown to the customer, and which statuses reach each one. */
const STEPS: { key: StepKey; statuses: string[] }[] = [
  { key: "received", statuses: ["new"] },
  { key: "review", statuses: ["in_review", "contacted"] },
  { key: "quoted", statuses: ["quoted", "accepted"] },
  { key: "production", statuses: ["in_production"] },
  { key: "ready", statuses: ["ready"] },
  { key: "delivered", statuses: ["delivered", "closed"] },
];

function stepIndex(status: string): number {
  return STEPS.findIndex((s) => s.statuses.includes(status));
}

const LOCALE_TAG: Record<Locale, string> = { fr: "fr-MA", ar: "ar-MA", en: "en-GB" };

export function TrackingForm({ locale, t }: { locale: Locale; t: T }) {
  const [state, formAction, pending] = useActionState(trackRequest, initial);
  const values = state.status === "error" || state.status === "not_found" ? state.values : {};
  const errors = state.status === "error" ? state.fieldErrors : {};
  const message = (key: string) => (errors[key] ? t.forms.errors[errors[key]] : undefined);
  const date = new Intl.DateTimeFormat(LOCALE_TAG[locale], { dateStyle: "long", timeZone: "Africa/Casablanca", numberingSystem: "latn" });
  const dateTime = new Intl.DateTimeFormat(LOCALE_TAG[locale], { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Casablanca", numberingSystem: "latn" });

  return (
    <div className="space-y-10">
      <form
        action={formAction}
        // Keep what was typed after a lookup (a plain form action resets the fields).
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => formAction(data));
        }}
        noValidate
        className="border-line bg-surface space-y-5 rounded-[var(--radius-card)] border p-5 sm:p-6">
        {state.status === "error" && state.formError ? <ErrorSummary message={t.forms.errors[state.formError]} /> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="reference" label={t.tracking.reference} required hint={t.tracking.referenceHint} error={message("reference")}>
            {(p) => (
              <Input {...p} name="reference" dir="ltr" autoComplete="off" autoCapitalize="characters" maxLength={40} defaultValue={values.reference} className="uppercase" />
            )}
          </Field>
          <Field id="email" label={t.forms.email} required error={message("email")}>
            {(p) => <Input {...p} name="email" type="email" autoComplete="email" dir="ltr" maxLength={254} defaultValue={values.email} />}
          </Field>
        </div>
        <Button type="submit" size="lg" disabled={pending} aria-disabled={pending} className="w-full sm:w-auto">
          {pending ? t.forms.sending : t.tracking.submit}
        </Button>
      </form>

      <div aria-live="polite">
        {state.status === "not_found" ? (
          <p role="status" className="border-line text-fg rounded-[var(--radius-card)] border border-dashed p-5">
            {t.tracking.notFound}
          </p>
        ) : null}

        {state.status === "found" ? (
          <section aria-labelledby="tracking-result" className="border-line rounded-[var(--radius-card)] border p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="tracking-result" className="text-fg text-xl font-semibold">
                <bdi dir="ltr">{format(t.tracking.resultTitle, { reference: state.reference })}</bdi>
              </h2>
              <p className="text-fg-muted text-sm">{format(t.tracking.receivedOn, { date: date.format(new Date(state.createdAt)) })}</p>
            </div>
            <p className="text-accent mt-2 text-lg font-semibold">
              {t.tracking.statuses[state.current as keyof Dictionary["tracking"]["statuses"]] ?? state.current}
            </p>

            {state.current !== "rejected" ? (
              <ol aria-label={t.tracking.progressLabel} className="mt-6 grid grid-cols-6 gap-1.5">
                {STEPS.map((step, index) => {
                  const reached = index <= stepIndex(state.current);
                  const current = index === stepIndex(state.current);
                  return (
                    <li key={step.key} aria-current={current ? "step" : undefined} className="min-w-0">
                      <span className={cn("block h-1.5 rounded-full", reached ? "bg-accent" : "bg-line")} />
                      <span className={cn("mt-2 block truncate text-xs", current ? "text-fg font-semibold" : reached ? "text-fg-muted" : "text-fg-subtle")}>
                        {t.tracking.steps[step.key]}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : null}

            {state.events.length > 0 ? (
              <>
                <h3 className="text-fg mt-8 text-sm font-semibold">{t.tracking.historyTitle}</h3>
                <ol className="border-line mt-3 space-y-3 border-s ps-4">
                  {[...state.events].reverse().map((event, index) => (
                    <li key={`${event.at}-${index}`} className="relative">
                      <span aria-hidden="true" className={cn("absolute -start-[1.3rem] top-1.5 size-2.5 rounded-full", index === 0 ? "bg-accent" : "bg-line-strong")} />
                      <p className="text-fg text-sm font-medium">
                        {t.tracking.statuses[event.status as keyof Dictionary["tracking"]["statuses"]] ?? event.status}
                      </p>
                      <p className="text-fg-subtle text-xs">{dateTime.format(new Date(event.at))}</p>
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
