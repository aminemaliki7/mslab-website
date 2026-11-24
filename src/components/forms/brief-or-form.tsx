"use client";

import { useActionState, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { FileUploader } from "@/components/print-on-demand/file-uploader";
import { useQuoteRows } from "@/components/quote/quote-list-store";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ArrowIcon } from "@/components/ui/icons";
import { submitBriefRequest, type BriefRequestState } from "@/features/inquiries/brief-actions";
import type { BriefKind } from "@/features/inquiries/brief";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { ConsentField, ErrorSummary, Honeypot } from "./form-parts";
import { NextSteps, RequestConfirmation, type RequestFlow, type SummaryRow } from "./request-confirmation";
import { ReferenceNotice } from "./reference-notice";
import { useEnhancedForm, useFocusFirstError } from "./use-enhanced-form";

type Mode = "file" | "form";

export type BriefProps = {
  kind: BriefKind;
  locale: Locale;
  sourcePath: string;
  privacyHref: string;
  storageEndpoint: string;
  publishableKey: string;
  flow: RequestFlow;
  t: { forms: Dictionary["forms"]; pod: Dictionary["printOnDemand"]; brief: Dictionary["cx"]["brief"] };
};

const subscribeNothing = () => () => {};

/**
 * First step of every quote request: send a file that already describes the need (requirements,
 * product list, brief) with contact details, or fill in the detailed form (`children`).
 * Both stay mounted, so switching never loses what was typed. Without JavaScript the detailed
 * form is shown (a file upload needs JavaScript).
 */
export function BriefOrForm({ defaultMode = "file", children, ...props }: BriefProps & { defaultMode?: Mode; children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [chosen, setChosen] = useState<Mode | null>(null);
  // Catalogue: products already collected in the quote list open the list, not the file option.
  const listed = useQuoteRows().some((row) => row.productId || row.name.trim());
  const mode: Mode = chosen ?? (props.kind === "catalog" && listed ? "form" : defaultMode);
  const b = props.t.brief;
  const name = useId();
  const current: Mode = hydrated ? mode : "form";

  const option = (value: Mode, title: string, hint: string) => (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border p-4 transition-colors",
        current === value ? "border-accent bg-accent-soft ring-accent ring-1" : "border-line hover:border-line-strong",
      )}
    >
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => setChosen(value)} className="accent-accent mt-1 size-4 shrink-0" />
      <span>
        <span className="text-fg block font-semibold">{title}</span>
        <span className="text-fg-muted mt-0.5 block text-sm leading-snug">{hint}</span>
      </span>
    </label>
  );

  return (
    <div>
      {hydrated ? (
        <fieldset className="mb-8">
          <legend className="text-fg mb-3 text-lg font-semibold sm:text-xl">{b.title}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {option("file", b.optionFile, b.optionFileHint)}
            {option("form", b.optionForm, b.optionFormHint)}
          </div>
        </fieldset>
      ) : null}
      <div hidden={current !== "file"}>{hydrated ? <BriefRequestForm {...props} /> : null}</div>
      <div hidden={current !== "form"}>{children}</div>
    </div>
  );
}

const initial: BriefRequestState = { status: "idle" };

function BriefRequestForm(props: BriefProps) {
  const [instance, setInstance] = useState(0);
  return <BriefRequestFormInner key={instance} {...props} onReset={() => setInstance((n) => n + 1)} />;
}

function BriefRequestFormInner({ kind, locale, sourcePath, privacyHref, storageEndpoint, publishableKey, flow, t, onReset }: BriefProps & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(submitBriefRequest, initial);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState<SummaryRow[]>([]);
  const { onSubmit } = useEnhancedForm(formAction, (data) => {
    const text = (key: string) => String(data.get(key) ?? "").trim();
    const contact = [text("fullName"), text("email")].filter(Boolean).join(" · ");
    setSent(
      [
        { label: flow.confirm.files, value: String(data.getAll("uploadedFiles").length) },
        { label: flow.confirm.contactName, value: contact },
      ].filter((row) => row.value && row.value !== "0"),
    );
  });
  const ref = useRef<HTMLFormElement>(null);
  useFocusFirstError(state.status === "error" ? state : null, ref);
  const b = t.brief;
  const id = (field: string) => `brief-${kind}-${field}`;

  if (state.status === "success") {
    return (
      <RequestConfirmation
        title={b.successTitle}
        body={b.successBody}
        reference={state.reference ? <ReferenceNotice reference={state.reference} label={b.successReference} t={t.forms} /> : null}
        summary={sent}
        flow={flow}
        resetLabel={b.newRequest}
        onReset={onReset}
      />
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};
  const message = (key: string) => (errors[key] ? t.forms.errors[errors[key]] : undefined);
  const formError =
    state.status === "error" ? (state.formError ? t.forms.errors[state.formError] : t.forms.errorSummary) : null;
  const legend = "text-fg mb-4 text-lg font-semibold";

  return (
    <form ref={ref} action={formAction} onSubmit={onSubmit} noValidate className="relative space-y-8">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <input type="hidden" name="briefKind" value={kind} />
      <Honeypot id={id("website")} label={t.forms.honeypot} />

      {formError ? <ErrorSummary message={formError} /> : null}

      <fieldset>
        <legend className={legend}>{b.uploadTitle}</legend>
        <FileUploader
          storageEndpoint={storageEndpoint}
          publishableKey={publishableKey}
          t={t.pod}
          onBusyChange={setUploading}
          variant="brief"
          labels={{ hint: b.uploadHint, button: b.uploadButton }}
        />
        <Field id={id("message")} label={b.message} error={message("message")} className="mt-5">
          {(p) => <Textarea {...p} name="message" rows={3} maxLength={5000} placeholder={b.messagePlaceholder} defaultValue={values.message} />}
        </Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className={legend}>{b.contactTitle}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={id("fullName")} label={t.forms.fullName} required error={message("fullName")}>
            {(p) => <Input {...p} name="fullName" autoComplete="name" maxLength={120} defaultValue={values.fullName} />}
          </Field>
          <Field id={id("companyName")} label={`${t.forms.company} (${t.forms.optional})`} error={message("companyName")}>
            {(p) => <Input {...p} name="companyName" autoComplete="organization" maxLength={160} defaultValue={values.companyName} />}
          </Field>
          <Field id={id("email")} label={t.forms.email} required error={message("email")}>
            {(p) => <Input {...p} name="email" type="email" autoComplete="email" dir="ltr" maxLength={254} defaultValue={values.email} />}
          </Field>
          <Field id={id("phone")} label={t.forms.phone} required hint={t.forms.phoneHint} error={message("phone")}>
            {(p) => <Input {...p} name="phone" type="tel" autoComplete="tel" dir="ltr" maxLength={32} defaultValue={values.phone} />}
          </Field>
        </div>
        <Field id={id("preferredContact")} label={t.forms.preferredContact} className="sm:max-w-xs">
          {(p) => (
            <Dropdown {...p} name="preferredContact" defaultValue={values.preferredContact ?? "email"}>
              <option value="email">{t.forms.contactMethods.email}</option>
              <option value="phone">{t.forms.contactMethods.phone}</option>
              <option value="whatsapp">{t.forms.contactMethods.whatsapp}</option>
            </Dropdown>
          )}
        </Field>
        <ConsentField id={id("consent")} label={t.forms.consent} privacyHref={privacyHref} privacyLabel={t.forms.privacyLink} error={message("consent")} />
      </fieldset>

      <NextSteps flow={flow} />

      <Button type="submit" size="lg" disabled={pending || uploading} aria-disabled={pending || uploading} className="w-full sm:w-auto">
        {pending ? t.forms.sending : b.submit}
        {pending ? null : <ArrowIcon width={18} height={18} aria-hidden="true" className="rtl:-scale-x-100" />}
      </Button>
    </form>
  );
}
