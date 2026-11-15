"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useSyncExternalStore } from "react";
import { ConsentField, ErrorSummary, Honeypot, SuccessPanel } from "@/components/forms/form-parts";
import { useEnhancedForm, useFocusFirstError } from "@/components/forms/use-enhanced-form";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { submitCustomRequest, type CustomRequestState } from "@/features/print-on-demand/actions";
import type { ProductionOption } from "@/features/print-on-demand/queries";
import { DIMENSION_UNITS } from "@/features/print-on-demand/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { FileUploader } from "./file-uploader";

type Props = {
  locale: Locale;
  sourcePath: string;
  privacyHref: string;
  trackingHref: string;
  storageEndpoint: string;
  publishableKey: string;
  materials: ProductionOption[];
  finishings: ProductionOption[];
  t: { forms: Dictionary["forms"]; pod: Dictionary["printOnDemand"] };
};

const initial: CustomRequestState = { status: "idle" };
const subscribeNothing = () => () => {};
const OTHER = "other";

export function CustomRequestForm(props: Props) {
  const [instance, setInstance] = useState(0);
  return <CustomRequestFormInner key={instance} {...props} onReset={() => setInstance((n) => n + 1)} />;
}

function CustomRequestFormInner({
  locale,
  sourcePath,
  privacyHref,
  trackingHref,
  storageEndpoint,
  publishableKey,
  materials,
  finishings,
  t,
  onReset,
}: Props & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(submitCustomRequest, initial);
  const { onSubmit } = useEnhancedForm(formAction);
  const ref = useRef<HTMLFormElement>(null);
  useFocusFirstError(state.status === "error" ? state : null, ref);
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [uploading, setUploading] = useState(false);

  const values = state.status === "error" ? state.values : {};
  const [material, setMaterial] = useState(values.materialOptionId || (values.materialOther ? OTHER : ""));

  if (state.status === "success") {
    return (
      <SuccessPanel title={t.pod.successTitle}>
        <p>{t.pod.successBody}</p>
        {state.reference ? (
          <>
            <p className="text-sm">
              <bdi dir="ltr" className="font-[family-name:var(--font-geist-mono)] font-semibold">
                {format(t.pod.successReference, { reference: state.reference })}
              </bdi>
            </p>
            <p className="text-sm">
              {t.pod.successTrack}{" "}
              <Link href={trackingHref} className="text-accent underline underline-offset-2">
                {t.pod.trackCta}
              </Link>
            </p>
          </>
        ) : null}
        <Button variant="secondary" size="sm" onClick={onReset}>
          {t.pod.newRequest}
        </Button>
      </SuccessPanel>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  const message = (key: string) => (errors[key] ? t.forms.errors[errors[key]] : undefined);
  const formError =
    state.status === "error" ? (state.formError ? t.forms.errors[state.formError] : t.forms.errorSummary) : null;
  const checkedFinishings = new Set((values.finishingOptionIds ?? "").split(",").filter(Boolean));
  const legend = "text-fg mb-5 text-xl font-semibold";

  return (
    <form ref={ref} action={formAction} onSubmit={onSubmit} noValidate className="relative space-y-10">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <Honeypot label={t.forms.honeypot} />

      {formError ? <ErrorSummary message={formError} /> : null}

      <fieldset className="space-y-5">
        <legend className={legend}>{t.pod.projectSection}</legend>
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <Field id="projectType" label={t.pod.projectType} required error={message("projectType")}>
            {(p) => <Input {...p} name="projectType" maxLength={160} placeholder={t.pod.projectTypePlaceholder} defaultValue={values.projectType} />}
          </Field>
          <Field id="quantity" label={t.pod.quantity} required error={message("quantity")}>
            {(p) => (
              <Input {...p} name="quantity" type="number" inputMode="numeric" min={1} max={1000000} step={1} dir="ltr" defaultValue={values.quantity ?? "1"} />
            )}
          </Field>
        </div>
        <Field id="description" label={t.pod.description} required error={message("description")}>
          {(p) => <Textarea {...p} name="description" rows={5} maxLength={5000} placeholder={t.pod.descriptionPlaceholder} defaultValue={values.description} />}
        </Field>

        <fieldset>
          <legend className="text-fg mb-2 text-sm font-medium">
            {t.pod.dimensions} <span className="text-fg-muted font-normal">({t.forms.optional})</span>
          </legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["width", "height", "depth"] as const).map((name) => (
              <Field key={name} id={name} label={t.pod[name]} error={message(name)}>
                {(p) => <Input {...p} name={name} type="text" inputMode="decimal" dir="ltr" maxLength={10} defaultValue={values[name]} />}
              </Field>
            ))}
            <Field id="dimensionUnit" label={t.pod.unit}>
              {(p) => (
                <Select {...p} name="dimensionUnit" defaultValue={values.dimensionUnit ?? "cm"}>
                  {DIMENSION_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          {materials.length > 0 ? (
            <Field id="materialOptionId" label={`${t.pod.material} (${t.forms.optional})`} error={message("materialOptionId")}>
              {(p) => (
                <Select {...p} name={material === OTHER ? undefined : "materialOptionId"} value={material} onChange={(e) => setMaterial(e.target.value)}>
                  <option value="">{t.pod.materialAdvice}</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                  <option value={OTHER}>{t.pod.materialOther}</option>
                </Select>
              )}
            </Field>
          ) : null}
          {materials.length === 0 || material === OTHER ? (
            <Field
              id="materialOther"
              label={materials.length === 0 ? `${t.pod.material} (${t.forms.optional})` : t.pod.materialOther}
              error={message("materialOther")}
            >
              {(p) => <Input {...p} name="materialOther" maxLength={200} placeholder={t.pod.materialOtherPlaceholder} defaultValue={values.materialOther} />}
            </Field>
          ) : null}
          <Field id="deadline" label={`${t.pod.deadline} (${t.forms.optional})`} error={message("deadline")}>
            {(p) => <Input {...p} name="deadline" type="date" dir="ltr" defaultValue={values.deadline} />}
          </Field>
        </div>

        {finishings.length > 0 ? (
          <fieldset>
            <legend className="text-fg text-sm font-medium">
              {t.pod.finishings} <span className="text-fg-muted font-normal">({t.forms.optional})</span>
            </legend>
            <p className="text-fg-muted mt-1 text-sm">{t.pod.finishingsHint}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {finishings.map((f) => (
                <li key={f.id} className="flex items-center gap-3">
                  <Checkbox id={`finishing-${f.id}`} name="finishingOptionIds" value={f.id} defaultChecked={checkedFinishings.has(f.id)} />
                  <label htmlFor={`finishing-${f.id}`} className="text-fg text-sm">
                    {f.name}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className={legend}>
          {t.pod.filesSection} <span className="text-fg-muted text-base font-normal">({t.forms.optional})</span>
        </legend>
        {hydrated ? (
          <FileUploader storageEndpoint={storageEndpoint} publishableKey={publishableKey} t={t.pod} onBusyChange={setUploading} />
        ) : (
          <p className="border-line text-fg-muted rounded-[var(--radius-card)] border border-dashed p-5 text-sm">{t.pod.filesNoJs}</p>
        )}
      </fieldset>

      <fieldset className="space-y-5">
        <legend className={legend}>{t.pod.contactSection}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="fullName" label={t.forms.fullName} required error={message("fullName")}>
            {(p) => <Input {...p} name="fullName" autoComplete="name" maxLength={120} defaultValue={values.fullName} />}
          </Field>
          <Field id="companyName" label={`${t.forms.company} (${t.forms.optional})`} error={message("companyName")}>
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
        <ConsentField label={t.forms.consent} privacyHref={privacyHref} privacyLabel={t.forms.privacyLink} error={message("consent")} />
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending || uploading} aria-disabled={pending || uploading}>
          {pending ? t.forms.sending : t.pod.submit}
        </Button>
        {uploading ? <p className="text-fg-muted text-sm">{t.pod.filesPending}</p> : null}
      </div>
    </form>
  );
}
