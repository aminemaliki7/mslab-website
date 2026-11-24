"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ConsentField, ErrorSummary, Honeypot } from "@/components/forms/form-parts";
import { NextSteps, RequestConfirmation, type RequestFlow, type SummaryRow } from "@/components/forms/request-confirmation";
import { ReferenceNotice } from "@/components/forms/reference-notice";
import { useEnhancedForm, useFocusFirstError } from "@/components/forms/use-enhanced-form";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ArrowIcon, CloseIcon } from "@/components/ui/icons";
import { submitQuote, type FormState } from "@/features/inquiries/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { quoteList, useQuoteRows, type QuoteRow } from "./quote-list-store";

type Prefill = { productId: string; name: string; sku: string | null; minOrderQuantity: number | null };

/** Volume quick picks (bulk production); never below a product's minimum order quantity. */
const QUANTITY_PICKS = [50, 100, 250, 500, 1000, 5000];

type Props = {
  locale: Locale;
  sourcePath: string;
  privacyHref: string;
  catalogHref: string;
  prefill: Prefill | null;
  flow: RequestFlow;
  t: { forms: Dictionary["forms"]; page: Dictionary["quotePage"]; sku: string };
};

const initial: FormState = { status: "idle" };
const subscribeNothing = () => () => {};

/** "+ Add details" disclosure used for the optional fields (kept closed until needed). */
const SUMMARY =
  "text-accent hover:text-accent-hover inline-flex min-h-11 cursor-pointer list-none items-center text-sm font-medium [&::-webkit-details-marker]:hidden";

export function QuoteForm(props: Props) {
  const [instance, setInstance] = useState(0);
  return <QuoteFormInner key={instance} {...props} onReset={() => setInstance((n) => n + 1)} />;
}

function QuoteFormInner({ locale, sourcePath, privacyHref, catalogHref, prefill, flow, t, onReset }: Props & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(submitQuote, initial);
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const storeRows = useQuoteRows();
  // What was sent, for the confirmation summary (the list itself is cleared after success).
  const [sent, setSent] = useState<SummaryRow[]>([]);
  function summarize(data: FormData): SummaryRow[] {
    const text = (key: string) => String(data.get(key) ?? "").trim();
    const lines: string[] = [];
    for (let i = 0; i < 50; i++) {
      const productId = text(`items.${i}.productId`);
      const label = text(`items.${i}.label`);
      const quantity = text(`items.${i}.quantity`);
      if (!productId && !label && !quantity) break;
      const name = label || storeRows.find((r) => r.productId === productId)?.name || (prefill?.productId === productId ? prefill.name : "");
      if (name) lines.push(quantity ? `${name} × ${quantity}` : name);
    }
    const contact = [text("fullName"), text("email")].filter(Boolean).join(" · ");
    return [
      ...(lines.length ? [{ label: flow.confirm.items, value: lines.join("\n") }] : []),
      ...(contact ? [{ label: flow.confirm.contactName, value: contact }] : []),
    ];
  }

  const { onSubmit } = useEnhancedForm(formAction, (data) => setSent(summarize(data)));
  const ref = useRef<HTMLFormElement>(null);
  useFocusFirstError(state.status === "error" ? state : null, ref);

  // ?product=<id> from a product page: make sure it is in the list.
  useEffect(() => {
    if (prefill) quoteList.addProduct(prefill);
  }, [prefill]);

  // A stored request has been sent: start the next one from an empty list.
  useEffect(() => {
    if (state.status === "success") quoteList.clear();
  }, [state.status]);

  // Never an empty list: one blank line is ready to type into (no "add" click needed).
  useEffect(() => {
    if (hydrated && !prefill && storeRows.length === 0 && state.status !== "success") quoteList.ensureOne();
  }, [hydrated, prefill, storeRows.length, state.status]);

  if (state.status === "success") {
    return (
      <RequestConfirmation
        title={t.page.successTitle}
        body={t.page.successBody}
        reference={state.reference ? <ReferenceNotice reference={state.reference} label={t.page.successReference} t={t.forms} /> : null}
        summary={sent}
        flow={flow}
        resetLabel={t.page.newRequest}
        onReset={onReset}
      />
    );
  }

  const prefillRow: QuoteRow | null = prefill
    ? { key: "prefill", productId: prefill.productId, name: prefill.name, sku: prefill.sku, minOrderQuantity: prefill.minOrderQuantity, quantity: prefill.minOrderQuantity ? String(prefill.minOrderQuantity) : "", specifications: "", custom: false }
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
    <form ref={ref} action={formAction} onSubmit={onSubmit} noValidate className="relative space-y-8">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <Honeypot label={t.forms.honeypot} />

      {formError ? <ErrorSummary message={formError} /> : null}

      <fieldset>
        <StepLegend step={1} title={t.page.stepNeed} />

        {rows.length > 0 ? (
          <ol className="mt-5 space-y-3">
            {rows.map((row, index) => (
              <li key={row.key} className="border-line bg-surface relative rounded-[var(--radius-card)] border p-4 sm:p-5">
                {/* A single blank line needs no header; catalogue products and extra lines do. */}
                {!row.custom || rows.length > 1 ? (
                  <div className="mb-3 flex items-start justify-between gap-4">
                    {row.custom ? (
                      <span />
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
                ) : null}

                {row.productId ? <input type="hidden" name={`items.${index}.productId`} value={row.productId} /> : null}

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                  {row.custom ? (
                    <Field
                      id={`item-${row.key}-label`}
                      label={t.page.customLabel}
                      required
                      // Nothing filled in at all: flag the first line so focus lands on it.
                      error={rowError(row, "label") ?? (index === 0 && errors.items ? message("items") : undefined)}
                    >
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
                  <Field
                    id={`item-${row.key}-qty`}
                    label={t.page.quantity}
                    required
                    hint={row.minOrderQuantity ? format(t.page.moqHint, { min: row.minOrderQuantity }) : undefined}
                    error={rowError(row, "quantity")}
                  >
                    {(p) => (
                      // Pick a usual volume from the list or type any quantity.
                      <Combobox
                        {...p}
                        name={`items.${index}.quantity`}
                        inputMode="numeric"
                        maxLength={7}
                        dir="ltr"
                        value={row.quantity}
                        onValueChange={(quantity) => quoteList.update(row.key, { quantity })}
                        suggestions={QUANTITY_PICKS.filter((n) => n >= (row.minOrderQuantity ?? 1)).map((n) => ({ value: String(n) }))}
                      />
                    )}
                  </Field>
                </div>
                <details className="group mt-2" open={Boolean(row.specifications) || Boolean(rowError(row, "specifications"))}>
                  <summary className={SUMMARY}>
                    <Toggle />
                    {t.page.addDetails}
                  </summary>
                  <Field id={`item-${row.key}-specs`} label={t.page.specifications} error={rowError(row, "specifications")} className="mt-1">
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
                </details>
              </li>
            ))}
          </ol>
        ) : hydrated ? null : (
          // No JavaScript: one plain line so the form still works.
          <div className="border-line bg-surface mt-5 grid gap-4 rounded-[var(--radius-card)] border p-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <Field id="nojs-label" label={t.page.customLabel} required>
              {(p) => <Input {...p} name="items.0.label" maxLength={200} placeholder={t.page.customPlaceholder} />}
            </Field>
            <Field id="nojs-qty" label={t.page.quantity} required>
              {(p) => <Input {...p} name="items.0.quantity" type="number" min={1} dir="ltr" />}
            </Field>
            <Field id="nojs-specs" label={t.page.specifications} className="sm:col-span-2">
              {(p) => <Textarea {...p} name="items.0.specifications" rows={2} maxLength={2000} />}
            </Field>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-5">
          {hydrated ? (
            <button type="button" onClick={() => quoteList.addCustom()} className="text-accent hover:text-accent-hover inline-flex min-h-11 items-center text-sm font-semibold">
              + {t.page.addAnother}
            </button>
          ) : null}
          <Link href={catalogHref} className="text-fg-muted hover:text-accent inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline">
            {t.page.browseCatalog}
          </Link>
        </div>
      </fieldset>

      <hr className="border-line" />

      <fieldset>
        <StepLegend step={2} title={t.page.stepContact} />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field id="fullName" label={t.forms.fullName} required error={message("fullName")}>
            {(p) => <Input {...p} name="fullName" autoComplete="name" maxLength={120} defaultValue={values.fullName} />}
          </Field>
          <Field id="phone" label={t.forms.phone} required hint={t.forms.phoneHint} error={message("phone")}>
            {(p) => <Input {...p} name="phone" type="tel" autoComplete="tel" dir="ltr" maxLength={32} defaultValue={values.phone} />}
          </Field>
          <Field id="email" label={t.forms.email} required error={message("email")}>
            {(p) => <Input {...p} name="email" type="email" autoComplete="email" dir="ltr" maxLength={254} defaultValue={values.email} />}
          </Field>
          <Field id="companyName" label={`${t.forms.company} (${t.forms.optional})`} error={message("companyName")}>
            {(p) => <Input {...p} name="companyName" autoComplete="organization" maxLength={160} defaultValue={values.companyName} />}
          </Field>
        </div>
        <details className="group mt-2" open={Boolean(values.message) || Boolean(message("message"))}>
          <summary className={SUMMARY}>
            <Toggle />
            {t.page.addMessage} ({t.forms.optional})
          </summary>
          <Field id="message" label={t.forms.additionalRequirements} error={message("message")} className="mt-1">
            {(p) => <Textarea {...p} name="message" rows={4} maxLength={5000} defaultValue={values.message} />}
          </Field>
        </details>
        <div className="mt-3">
          <ConsentField label={t.forms.consent} privacyHref={privacyHref} privacyLabel={t.forms.privacyLink} error={message("consent")} />
        </div>
      </fieldset>

      <NextSteps flow={flow} />

      {/* Tinted footer: the one action of the page. */}
      <div className="bg-accent-soft -mx-5 -mb-5 rounded-b-[var(--radius-card)] px-5 py-5 sm:-mx-8 sm:-mb-8 sm:px-8 sm:py-6">
        <Button type="submit" size="lg" disabled={pending} aria-disabled={pending} className="w-full sm:w-auto">
          {pending ? t.forms.sending : t.page.submit}
          {pending ? null : <ArrowIcon width={18} height={18} className="rtl:-scale-x-100" />}
        </Button>
        <p className="text-fg-muted mt-3 text-sm">{t.page.submitNote}</p>
      </div>
    </form>
  );
}

/** Numbered step title: the form reads as two short steps. */
function StepLegend({ step, title }: { step: number; title: string }) {
  return (
    <legend className="text-fg flex items-center gap-3 text-lg font-semibold sm:text-xl">
      <span aria-hidden="true" className="bg-primary text-on-primary grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold">
        {step}
      </span>
      {title}
    </legend>
  );
}

/** "+" when the disclosure is closed, "−" when open. */
function Toggle() {
  return (
    <>
      <span aria-hidden="true" className="me-1 group-open:hidden">
        +
      </span>
      <span aria-hidden="true" className="me-1 hidden group-open:inline">
        −
      </span>
    </>
  );
}
