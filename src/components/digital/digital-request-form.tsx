"use client";

import { useActionState, useRef, useState } from "react";
import { ConsentField, ErrorSummary, Honeypot, SuccessPanel } from "@/components/forms/form-parts";
import { ReferenceNotice } from "@/components/forms/reference-notice";
import { useEnhancedForm, useFocusFirstError } from "@/components/forms/use-enhanced-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { submitDigitalRequest, type DigitalRequestState } from "@/features/digital/actions";
import { DIGITAL_FEATURES, DIGITAL_PROJECT_TYPES } from "@/features/digital/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  locale: Locale;
  sourcePath: string;
  privacyHref: string;
  trackingHref: string;
  t: { forms: Dictionary["forms"]; form: Dictionary["digitalForm"]; trackCta: string };
};

/**
 * Digital Solutions quote request (web project): project types, description, optional
 * features / current site / budget / date, contact details. Works without JavaScript
 * (plain form post); with JavaScript the input survives validation errors.
 */
export function DigitalRequestForm(props: Props) {
  const [instance, setInstance] = useState(0);
  return <DigitalRequestFormInner key={instance} {...props} onReset={() => setInstance((n) => n + 1)} />;
}

const initial: DigitalRequestState = { status: "idle" };

function DigitalRequestFormInner({ locale, sourcePath, privacyHref, trackingHref, t, onReset }: Props & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(submitDigitalRequest, initial);
  const { onSubmit } = useEnhancedForm(formAction);
  const ref = useRef<HTMLFormElement>(null);
  useFocusFirstError(state.status === "error" ? state : null, ref);
  const f = t.form;

  if (state.status === "success") {
    return (
      <SuccessPanel title={f.successTitle}>
        <p>{f.successBody}</p>
        {state.reference ? (
          <>
            <ReferenceNotice reference={state.reference} label={f.successReference} t={t.forms} />
            <p className="text-sm">{f.successTrack}</p>
          </>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={trackingHref} variant="secondary" size="sm">
            {t.trackCta}
          </ButtonLink>
          <Button variant="secondary" size="sm" onClick={onReset}>
            {f.newRequest}
          </Button>
        </div>
      </SuccessPanel>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};
  const message = (key: string) => (errors[key] ? t.forms.errors[errors[key]] : undefined);
  const groupError = (key: string) => message(key) ?? message(Object.keys(errors).find((k) => k.startsWith(`${key}.`)) ?? "");
  const formError = state.status === "error" ? (state.formError ? t.forms.errors[state.formError] : t.forms.errorSummary) : null;
  const checked = (key: string) => new Set((values[key] ?? "").split(",").filter(Boolean));
  const chosenTypes = checked("projectTypes");
  const chosenFeatures = checked("features");
  const optional = (label: string) => `${label} (${t.forms.optional})`;
  const typesError = groupError("projectTypes");

  return (
    <form ref={ref} action={formAction} onSubmit={onSubmit} noValidate className="relative space-y-8">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <Honeypot label={t.forms.honeypot} />

      {formError ? <ErrorSummary message={formError} /> : null}

      <section className="space-y-6" aria-labelledby="digital-project-section">
        <h3 id="digital-project-section" className="text-fg text-lg font-semibold">
          {f.projectSection}
        </h3>

        <fieldset aria-describedby={typesError ? "projectTypes-error" : "projectTypes-hint"}>
          <legend className="text-fg text-sm font-medium">
            {f.projectTypesLabel}
            <span className="text-danger ms-0.5" aria-hidden="true">
              *
            </span>
          </legend>
          <p id="projectTypes-hint" className="text-fg-muted mt-1 text-sm">
            {f.projectTypesHint}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {DIGITAL_PROJECT_TYPES.map((key) => (
              <label
                key={key}
                className="border-line has-[:checked]:border-accent has-[:checked]:bg-cyan-50 flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium transition-colors"
              >
                <Checkbox
                  name="projectTypes"
                  value={key}
                  defaultChecked={chosenTypes.has(key)}
                  aria-invalid={typesError ? true : undefined}
                  className="mt-0 size-5"
                />
                {f.projectTypes[key]}
              </label>
            ))}
          </div>
          {typesError ? (
            <p id="projectTypes-error" className="text-danger mt-1.5 text-sm">
              {typesError}
            </p>
          ) : null}
        </fieldset>

        <Field id="description" label={f.description} required error={message("description")}>
          {(p) => <Textarea {...p} name="description" rows={6} maxLength={5000} placeholder={f.descriptionPlaceholder} defaultValue={values.description} />}
        </Field>

        <fieldset aria-describedby="features-hint">
          <legend className="text-fg text-sm font-medium">{f.featuresLabel}</legend>
          <p id="features-hint" className="text-fg-muted mt-1 text-sm">
            {f.featuresHint}
          </p>
          <div className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {DIGITAL_FEATURES.map((key) => (
              <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <Checkbox name="features" value={key} defaultChecked={chosenFeatures.has(key)} className="mt-0 size-5" />
                {f.features[key]}
              </label>
            ))}
          </div>
          {groupError("features") ? <p className="text-danger mt-1.5 text-sm">{groupError("features")}</p> : null}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="existingWebsite" label={optional(f.existingWebsite)} hint={f.existingWebsiteHint} error={message("existingWebsite")}>
            {(p) => <Input {...p} name="existingWebsite" type="url" inputMode="url" dir="ltr" maxLength={300} placeholder="https://" defaultValue={values.existingWebsite} />}
          </Field>
          <Field id="deadline" label={optional(f.deadline)} error={message("deadline")}>
            {(p) => <Input {...p} name="deadline" type="date" dir="ltr" defaultValue={values.deadline} />}
          </Field>
        </div>
        <Field id="budget" label={optional(f.budget)} hint={f.budgetHint} error={message("budget")} className="sm:max-w-md">
          {(p) => <Input {...p} name="budget" maxLength={120} defaultValue={values.budget} />}
        </Field>
      </section>

      <section className="space-y-5" aria-labelledby="digital-contact-section">
        <h3 id="digital-contact-section" className="text-fg text-lg font-semibold">
          {f.contactSection}
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="fullName" label={t.forms.fullName} required error={message("fullName")}>
            {(p) => <Input {...p} name="fullName" autoComplete="name" maxLength={120} defaultValue={values.fullName} />}
          </Field>
          <Field id="companyName" label={optional(t.forms.company)} error={message("companyName")}>
            {(p) => <Input {...p} name="companyName" autoComplete="organization" maxLength={160} defaultValue={values.companyName} />}
          </Field>
          <Field id="email" label={t.forms.email} required error={message("email")}>
            {(p) => <Input {...p} name="email" type="email" autoComplete="email" dir="ltr" maxLength={254} defaultValue={values.email} />}
          </Field>
          <Field id="phone" label={t.forms.phone} required hint={t.forms.phoneHint} error={message("phone")}>
            {(p) => <Input {...p} name="phone" type="tel" autoComplete="tel" dir="ltr" maxLength={32} defaultValue={values.phone} />}
          </Field>
        </div>
        <Field id="preferredContact" label={t.forms.preferredContact} className="sm:max-w-xs">
          {(p) => (
            <Select {...p} name="preferredContact" defaultValue={values.preferredContact ?? "email"}>
              <option value="email">{t.forms.contactMethods.email}</option>
              <option value="phone">{t.forms.contactMethods.phone}</option>
              <option value="whatsapp">{t.forms.contactMethods.whatsapp}</option>
            </Select>
          )}
        </Field>
      </section>

      <ConsentField label={t.forms.consent} privacyHref={privacyHref} privacyLabel={t.forms.privacyLink} error={message("consent")} />

      <Button type="submit" size="lg" disabled={pending} aria-disabled={pending}>
        {pending ? t.forms.sending : f.submit}
      </Button>
    </form>
  );
}
