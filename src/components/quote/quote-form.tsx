"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ConsentField, ErrorSummary, Honeypot, SuccessPanel } from "@/components/forms/form-parts";
import { useEnhancedForm, useFocusFirstError } from "@/components/forms/use-enhanced-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { CloseIcon } from "@/components/ui/icons";
import { submitQuote, type FormState } from "@/features/inquiries/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { quoteList, useQuoteRows, type QuoteRow } from "./quote-list-store";

type Prefill = { productId: string; name: string; sku: string | null };

type Props = {
  locale: Locale;
  sourcePath: string;
  privacyHref: string;
  catalogHref: string;
  prefill: Prefill | null;
  t: { forms: Dictionary["forms"]; page: Dictionary["quotePage"]; sku: string };
};

const initial: FormState = { status: "idle" };
const subscribeNothing = () => () => {};

export function QuoteForm(props: Props) {
  const [instance, setInstance] = useState(0);
  return <QuoteFormInner key={instance} {...props} onReset={() => setInstance((n) => n + 1)} />;
}

function QuoteFormInner({ locale, sourcePath, privacyHref, catalogHref, prefill, t, onReset }: Props & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(submitQuote, initial);
  const { onSubmit } = useEnhancedForm(formAction);
  const ref = useRef<HTMLFormElement>(null);
  useFocusFirstError(state.status === "error" ? state : null, ref);

  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const storeRows = useQuoteRows();

  // ?product=<id> from a product page: make sure it is in the list.
  useEffect(() => {
    if (prefill) quoteList.addProduct(prefill);
  }, [prefill]);

  // A stored request has been sent: start the next one from an empty list.
  useEffect(() => {
    if (state.status === "success") quoteList.clear();
  }, [state.status]);

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
          {t.page.newRequest}
        </Button>
      </SuccessPanel>
    );
  }

  const prefillRow: QuoteRow | null = prefill
    ? { key: "prefill", productId: prefill.productId, name: prefill.name, sku: prefill.sku, quantity: "1", specifications: "", custom: false }
    : null;
  const rows: QuoteRow[] = hydrated ? storeRows : prefillRow ? [prefillRow] : [];

  // Errors are indexed over the rows actually submitted (empty custom rows are dropped server-side).
  const submitted = rows.filter((r) => !r.custom || r.name.trim());
  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};
  const message = (key: string) => (errors[key] ? t.forms.errors[errors[key]] : undefined);
  const rowError = (row: QuoteRow, field: string) => {
    const index = submitted.indexOf(row);
    return index >= 0 ? message(`items.${index}.${field}`) : undefined;
  };
  const formError =
    state.status === "error"
      ? state.formError
        ? t.forms.errors[state.formError]
        : (message("items") ?? t.forms.errorSummary)
      : null;

  return (
    <form ref={ref} action={formAction} onSubmit={onSubmit} noValidate className="relative space-y-10">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <Honeypot label={t.forms.honeypot} />

      {formError ? <ErrorSummary message={formError} /> : null}

      <fieldset>
        <legend className="text-fg text-xl font-semibold">{t.page.itemsTitle}</legend>
        <p className="text-fg-muted mt-2 text-sm">{t.page.itemsHint}</p>

        {rows.length > 0 ? (
          <ol className="mt-6 space-y-4">
            {rows.map((row, index) => (
              <li key={row.key} className="border-line bg-bg relative rounded-[var(--radius-card)] border p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  {row.custom ? (
                    <p className="text-accent text-xs font-semibold">{t.page.customItem}</p>
                  ) : (
                    <div>
                      <p className="text-fg font-semibold">{row.name}</p>
                      {row.sku ? (
                        <p className="text-fg-muted text-xs">
                          {t.sku}{" "}
                          <bdi dir="ltr" className="font-[family-name:var(--font-geist-mono)]">
                            {row.sku}
                          </bdi>
                        </p>
                      ) : null}
                    </div>
                  )}
                  {hydrated ? (
                    <button
                      type="button"
                      onClick={() => quoteList.remove(row.key)}
                      className="text-fg-muted hover:text-danger -m-1 inline-flex items-center gap-1 rounded p-1 text-sm"
                    >
                      <CloseIcon width={16} height={16} />
                      <span>{t.page.remove}</span>
                    </button>
                  ) : null}
                </div>

                {row.productId ? <input type="hidden" name={`items.${index}.productId`} value={row.productId} /> : null}

                <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                  {row.custom ? (
                    <Field id={`item-${row.key}-label`} label={t.page.customLabel} required error={rowError(row, "label")}>
                      {(p) => (
                        <Input
                          {...p}
                          name={`items.${index}.label`}
                          value={row.name}
                          maxLength={200}
                          placeholder={t.page.customPlaceholder}
                          onChange={(e) => quoteList.update(row.key, { name: e.target.value })}
                        />
                      )}
                    </Field>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                  <Field id={`item-${row.key}-qty`} label={t.page.quantity} required error={rowError(row, "quantity")}>
                    {(p) => (
                      <Input
                        {...p}
                        name={`items.${index}.quantity`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={1000000}
                        step={1}
                        dir="ltr"
                        value={row.quantity}
                        onChange={(e) => quoteList.update(row.key, { quantity: e.target.value })}
                      />
                    )}
                  </Field>
                </div>
                <Field id={`item-${row.key}-specs`} label={t.page.specifications} error={rowError(row, "specifications")} className="mt-4">
                  {(p) => (
                    <Textarea
                      {...p}
                      name={`items.${index}.specifications`}
                      rows={2}
                      maxLength={2000}
                      placeholder={t.page.specificationsPlaceholder}
                      value={row.specifications}
                      onChange={(e) => quoteList.update(row.key, { specifications: e.target.value })}
                    />
                  )}
                </Field>
              </li>
            ))}
          </ol>
        ) : hydrated ? (
          <p className="border-line text-fg-muted mt-6 rounded-[var(--radius-card)] border border-dashed p-5 text-sm">
            {t.page.emptyList}
          </p>
        ) : (
          // No JavaScript: one plain custom row so the form still works.
          <div className="border-line mt-6 grid gap-4 rounded-[var(--radius-card)] border p-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <Field id="nojs-label" label={t.page.customLabel} required>
              {(p) => <Input {...p} name="items.0.label" maxLength={200} placeholder={t.page.customPlaceholder} />}
            </Field>
            <Field id="nojs-qty" label={t.page.quantity} required>
              {(p) => <Input {...p} name="items.0.quantity" type="number" min={1} defaultValue="1" dir="ltr" />}
            </Field>
            <Field id="nojs-specs" label={t.page.specifications} className="sm:col-span-2">
              {(p) => <Textarea {...p} name="items.0.specifications" rows={2} maxLength={2000} />}
            </Field>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {hydrated ? (
            <Button variant="secondary" onClick={() => quoteList.addCustom()}>
              + {t.page.addCustom}
            </Button>
          ) : null}
          <Link href={catalogHref} className="text-accent hover:text-accent-hover text-sm font-medium underline-offset-4 hover:underline">
            {t.page.browseCatalog}
          </Link>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-fg mb-5 text-xl font-semibold">{t.page.customerTitle}</legend>
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
        <Field id="message" label={`${t.forms.additionalRequirements} (${t.forms.optional})`} error={message("message")}>
          {(p) => <Textarea {...p} name="message" rows={5} maxLength={5000} defaultValue={values.message} />}
        </Field>
        <ConsentField label={t.forms.consent} privacyHref={privacyHref} privacyLabel={t.forms.privacyLink} error={message("consent")} />
      </fieldset>

      <Button type="submit" size="lg" disabled={pending} aria-disabled={pending}>
        {pending ? t.forms.sending : t.page.submit}
      </Button>
    </form>
  );
}
