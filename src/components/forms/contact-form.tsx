"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { submitContact, type FormState } from "@/features/inquiries/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { QuickPicks } from "./quick-picks";
import { format } from "@/i18n/format";
import { ConsentField, ErrorSummary, Honeypot, SuccessPanel } from "./form-parts";
import { useEnhancedForm, useFocusFirstError } from "./use-enhanced-form";

type Props = {
  locale: Locale;
  sourcePath: string;
  privacyHref: string;
  t: { forms: Dictionary["forms"]; page: Dictionary["contactPage"] };
};

/** Remounts the inner form after a success so "send another" starts clean. */
export function ContactForm(props: Props) {
  const [instance, setInstance] = useState(0);
  return <ContactFormInner key={instance} {...props} onReset={() => setInstance((n) => n + 1)} />;
}

const initial: FormState = { status: "idle" };

function ContactFormInner({ locale, sourcePath, privacyHref, t, onReset }: Props & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(submitContact, initial);
  const { onSubmit } = useEnhancedForm(formAction);
  const ref = useRef<HTMLFormElement>(null);
  useFocusFirstError(state.status === "error" ? state : null, ref);

  if (state.status === "success") {
    return (
      <SuccessPanel title={t.page.successTitle}>
        <p>{t.page.successBody}</p>
        {state.reference ? (
          <p className="text-sm">
            <bdi dir="ltr" className="font-[family-name:var(--font-geist-mono)]">
              {format(t.page.successReference, { reference: state.reference })}
            </bdi>
          </p>
        ) : null}
        <Button variant="secondary" size="sm" onClick={onReset}>
          {t.page.sendAnother}
        </Button>
      </SuccessPanel>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};
  const message = (key: string) => (errors[key] ? t.forms.errors[errors[key]] : undefined);
  const formError = state.status === "error" ? (state.formError ? t.forms.errors[state.formError] : t.forms.errorSummary) : null;

  return (
    <form ref={ref} action={formAction} onSubmit={onSubmit} noValidate className="relative space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <Honeypot label={t.forms.honeypot} />

      {formError ? <ErrorSummary message={formError} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label={t.forms.fullName} required error={message("fullName")}>
          {(p) => <Input {...p} name="fullName" autoComplete="name" maxLength={120} defaultValue={values.fullName} />}
        </Field>
        <Field id="email" label={t.forms.email} required error={message("email")}>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" dir="ltr" maxLength={254} defaultValue={values.email} />}
        </Field>
      </div>
      <Field id="phone" label={`${t.forms.phone} (${t.forms.optional})`} hint={t.forms.phoneHint} error={message("phone")}>
        {(p) => <Input {...p} name="phone" type="tel" autoComplete="tel" dir="ltr" maxLength={32} defaultValue={values.phone} />}
      </Field>
      <div className="space-y-3">
        <Field id="subject" label={t.forms.subject} required error={message("subject")}>
          {(p) => <Input {...p} name="subject" maxLength={200} defaultValue={values.subject} />}
        </Field>
        <QuickPicks label={`${t.forms.subject} — ${t.forms.quickPick}`} picks={Object.values(t.forms.subjects).map((subject) => ({ label: subject, values: { subject } }))} />
      </div>
      <Field id="message" label={t.forms.message} required error={message("message")}>
        {(p) => <Textarea {...p} name="message" rows={6} maxLength={5000} defaultValue={values.message} />}
      </Field>

      <ConsentField
        label={t.forms.consent}
        privacyHref={privacyHref}
        privacyLabel={t.forms.privacyLink}
        error={message("consent")}
      />

      <Button type="submit" size="lg" disabled={pending} aria-disabled={pending}>
        {pending ? t.forms.sending : t.page.submit}
      </Button>
    </form>
  );
}
