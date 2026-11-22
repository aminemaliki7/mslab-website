"use client";

import { useActionState, useRef, useState, useSyncExternalStore } from "react";
import { ConsentField, ErrorSummary, Honeypot, SuccessPanel } from "@/components/forms/form-parts";
import { fillField, inDays } from "@/components/forms/quick-picks";
import { ReferenceNotice } from "@/components/forms/reference-notice";
import { useEnhancedForm, useFocusFirstError } from "@/components/forms/use-enhanced-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { MultiDropdown } from "@/components/ui/multi-dropdown";
import { Field, Input, Textarea } from "@/components/ui/form";
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
const subscribeNothing = () => () => {};

/**
 * Budget as a drop-down of ranges, with "Other amount" revealing a text field. The chosen range's
 * own text is what is sent (the `budget` column stays free text, schema unchanged). Without
 * JavaScript the plain text field is shown instead.
 * TODO(content): MSLAB to confirm the budget ranges (they describe the visitor's budget, not MSLAB prices).
 */
function BudgetField({
  label,
  hint,
  error,
  choose,
  options,
  otherPlaceholder,
  defaultValue,
}: {
  label: string;
  hint: string;
  error?: string;
  choose: string;
  options: Record<"undecided" | "under10" | "from10to30" | "from30to80" | "over80" | "other", string>;
  otherPlaceholder: string;
  defaultValue?: string;
}) {
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const ranges = Object.entries(options).filter(([key]) => key !== "other").map(([, text]) => text);
  const OTHER = "__other";
  // A value sent back after an error: one of the ranges, or the visitor's own text.
  const [choice, setChoice] = useState(!defaultValue ? "" : ranges.includes(defaultValue) ? defaultValue : OTHER);

  if (!hydrated) {
    return (
      <Field id="budget" label={label} hint={hint} error={error} className="sm:max-w-md">
        {(p) => <Input {...p} name="budget" maxLength={120} defaultValue={defaultValue} />}
      </Field>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field id="budget" label={label} hint={hint} error={choice === OTHER ? undefined : error}>
        {(p) => (
          <Dropdown {...p} name={choice === OTHER ? undefined : "budget"} value={choice} onChange={(e) => setChoice(e.target.value)}>
            <option value="">{choose}</option>
            {ranges.map((text) => (
              <option key={text} value={text}>
                {text}
              </option>
            ))}
            <option value={OTHER}>{options.other}</option>
          </Dropdown>
        )}
      </Field>
      {choice === OTHER ? (
        <Field id="budgetOther" label={options.other} error={error}>
          {(p) => <Input {...p} name="budget" maxLength={120} placeholder={otherPlaceholder} defaultValue={ranges.includes(defaultValue ?? "") ? "" : defaultValue} autoFocus />}
        </Field>
      ) : null}
    </div>
  );
}

/**
 * "Do you already have a website?" as a drop-down; "Yes" reveals the address field
 * (existingWebsite, unchanged). Without JavaScript the address field is shown directly.
 */
function WebsiteField({
  label,
  hint,
  error,
  choose,
  options,
  urlLabel,
  defaultValue,
}: {
  label: string;
  hint: string;
  error?: string;
  choose: string;
  options: { none: string; yes: string };
  urlLabel: string;
  defaultValue?: string;
}) {
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [has, setHas] = useState(defaultValue ? "yes" : "");
  const url = (id: string, fieldLabel: string, fieldHint?: string) => (
    <Field id={id} label={fieldLabel} hint={fieldHint} error={error}>
      {(p) => <Input {...p} name="existingWebsite" type="url" inputMode="url" dir="ltr" maxLength={300} placeholder="https://" defaultValue={defaultValue} />}
    </Field>
  );
  if (!hydrated) return url("existingWebsite", label, hint);
  return (
    <div className="space-y-4">
      <Field id="existingWebsite" label={label}>
        {(p) => (
          <Dropdown {...p} value={has} onChange={(e) => setHas(e.target.value)}>
            <option value="">{choose}</option>
            <option value="none">{options.none}</option>
            <option value="yes">{options.yes}</option>
          </Dropdown>
        )}
      </Field>
      {has === "yes" ? url("existingWebsiteUrl", urlLabel) : null}
    </div>
  );
}

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

        {/* Choices as drop-downs (same as the production form); real checkboxes inside, so the
            form data is unchanged — and a plain list without JavaScript. */}
        <div className="grid gap-5 sm:grid-cols-2">
          <MultiDropdown
            name="projectTypes"
            label={f.projectTypesLabel}
            required
            hint={f.projectTypesHint}
            error={typesError}
            placeholder={t.forms.choose}
            options={DIGITAL_PROJECT_TYPES.map((key) => ({ value: key, label: f.projectTypes[key] }))}
            defaultValue={[...chosenTypes]}
          />
          <MultiDropdown
            name="features"
            label={f.featuresLabel}
            hint={f.featuresHint}
            error={groupError("features")}
            placeholder={t.forms.choose}
            options={DIGITAL_FEATURES.map((key) => ({ value: key, label: f.features[key] }))}
            defaultValue={[...chosenFeatures]}
          />
        </div>

        <Field id="description" label={f.description} required error={message("description")}>
          {(p) => <Textarea {...p} name="description" rows={6} maxLength={5000} placeholder={f.descriptionPlaceholder} defaultValue={values.description} />}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <WebsiteField
            label={optional(f.existingWebsite)}
            hint={f.existingWebsiteHint}
            error={message("existingWebsite")}
            choose={t.forms.choose}
            options={f.existingWebsiteOptions}
            urlLabel={f.existingWebsiteUrl}
            defaultValue={values.existingWebsite}
          />
          <Field id="deadline" label={optional(f.deadline)} error={message("deadline")}>
            {(p) => (
              <div className="grid grid-cols-2 gap-3">
                {/* A timeframe fills the date; an exact date can still be picked. */}
                <Dropdown
                  aria-label={`${f.deadline} — ${t.forms.quickPick}`}
                  defaultValue=""
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    if (days) fillField("deadline", inDays(days));
                  }}
                >
                  <option value="">{t.forms.choose}</option>
                  {([["month", 30], ["quarter", 91], ["halfYear", 182]] as const).map(([key, days]) => (
                    <option key={key} value={days}>
                      {f.deadlines[key]}
                    </option>
                  ))}
                </Dropdown>
                <Input {...p} name="deadline" type="date" dir="ltr" defaultValue={values.deadline} />
              </div>
            )}
          </Field>
        </div>
        <BudgetField
          label={optional(f.budget)}
          hint={f.budgetHint}
          error={message("budget")}
          choose={t.forms.choose}
          options={f.budgets}
          otherPlaceholder={f.budgetOtherPlaceholder}
          defaultValue={values.budget}
        />
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
            <Dropdown {...p} name="preferredContact" defaultValue={values.preferredContact ?? "email"}>
              <option value="email">{t.forms.contactMethods.email}</option>
              <option value="phone">{t.forms.contactMethods.phone}</option>
              <option value="whatsapp">{t.forms.contactMethods.whatsapp}</option>
            </Dropdown>
          )}
        </Field>
      </section>

      <ConsentField label={t.forms.consent} privacyHref={privacyHref} privacyLabel={t.forms.privacyLink} error={message("consent")} />

      <Button type="submit" size="lg" disabled={pending} aria-disabled={pending} className="w-full sm:w-auto">
        {pending ? t.forms.sending : f.submit}
      </Button>
    </form>
  );
}
