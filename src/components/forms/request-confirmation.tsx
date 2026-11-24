import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { SuccessPanel } from "./form-parts";

/**
 * Texts and links shared by the three request forms (catalogue, custom production, digital):
 * the "what happens next" steps shown before sending and the confirmation after it.
 * Built on the server by `requestFlow()` (request-flow.ts).
 */
export type RequestFlow = {
  next: Dictionary["cx"]["nextSteps"];
  confirm: Dictionary["cx"]["confirm"];
  contactHref: string;
  trackingHref: string;
  /** WhatsApp link, only when MSLAB has set a number in site settings. */
  whatsappHref: string | null;
};

export type SummaryRow = { label: string; value: string };

/** "After you send your request": five short steps, shown right above the submit button. */
export function NextSteps({ flow }: { flow: RequestFlow }) {
  return (
    <section aria-label={flow.next.title} className="border-line rounded-[var(--radius-card)] border px-4 py-4 sm:px-5">
      <h3 className="text-fg text-sm font-semibold">{flow.next.title}</h3>
      <ol className="mt-3 grid gap-2 sm:grid-cols-5 sm:gap-3">
        {flow.next.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2 sm:flex-col sm:gap-1.5">
            <span aria-hidden="true" className="bg-accent-soft text-accent grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold">
              {index + 1}
            </span>
            <span className="text-fg-muted text-sm leading-snug">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * After a successful submission: confirmation, reference, a summary of what was sent, the next
 * step, ways to reach MSLAB, then "new request". The summary comes from the submitted form data
 * (never from the server response), so it only repeats what the visitor typed.
 */
export function RequestConfirmation({
  title,
  body,
  reference,
  summary,
  flow,
  resetLabel,
  onReset,
}: {
  title: string;
  body: string;
  reference: ReactNode;
  summary: SummaryRow[];
  flow: RequestFlow;
  resetLabel: string;
  onReset: () => void;
}) {
  const c = flow.confirm;
  const link = "text-accent font-medium underline underline-offset-2";
  return (
    <SuccessPanel title={title}>
      <p>{body}</p>
      {reference}
      {summary.length > 0 ? (
        <div className="border-success/20 bg-bg rounded-[var(--radius-control)] border px-4 py-3">
          <h3 className="text-fg text-sm font-semibold">{c.summaryTitle}</h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            {summary.map((row) => (
              <div key={row.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
                <dt className="text-fg-muted">{row.label}</dt>
                <dd className="text-fg font-medium break-words whitespace-pre-line">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      <div>
        <h3 className="text-fg text-sm font-semibold">{c.nextTitle}</h3>
        <p className="mt-1 text-sm">{c.nextBody}</p>
      </div>
      <p className="text-sm">
        <Link href={flow.trackingHref} className={link}>
          {c.track}
        </Link>
        <span aria-hidden="true" className="text-fg-subtle mx-2">
          ·
        </span>
        {c.questions}{" "}
        <Link href={flow.contactHref} className={link}>
          {c.contact}
        </Link>
        {flow.whatsappHref ? (
          <>
            {" · "}
            <a href={flow.whatsappHref} target="_blank" rel="noopener noreferrer" className={link}>
              WhatsApp
            </a>
          </>
        ) : null}
      </p>
      <Button variant="secondary" size="sm" onClick={onReset}>
        {resetLabel}
      </Button>
    </SuccessPanel>
  );
}
