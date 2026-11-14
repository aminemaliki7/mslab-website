import Link from "next/link";
import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/** Off-screen trap field: humans never see or focus it, naive bots fill it. */
export function Honeypot({ label }: { label: string }) {
  return (
    <div aria-hidden="true" className="absolute -start-[10000px] top-auto size-px overflow-hidden">
      <label htmlFor="website">{label}</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

export function ConsentField({
  label,
  privacyHref,
  privacyLabel,
  error,
}: {
  label: string;
  privacyHref: string;
  privacyLabel: string;
  error?: string;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <Checkbox
          id="consent"
          name="consent"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "consent-error" : undefined}
        />
        <label htmlFor="consent" className="text-fg text-sm leading-relaxed">
          {label}{" "}
          <Link href={privacyHref} className="text-accent underline underline-offset-2">
            {privacyLabel}
          </Link>
        </label>
      </div>
      {error ? (
        <p id="consent-error" className="text-danger mt-1.5 ms-7 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ErrorSummary({ message, className }: { message: string; className?: string }) {
  return (
    <div
      role="alert"
      tabIndex={-1}
      data-error-summary
      className={cn("bg-danger-soft text-danger rounded-[var(--radius-control)] px-4 py-3 text-sm font-medium", className)}
    >
      {message}
    </div>
  );
}

export function SuccessPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status" className="border-success/30 bg-success-soft rounded-[var(--radius-card)] border p-6">
      <h2 className="text-success text-lg font-semibold">{title}</h2>
      <div className="text-fg mt-2 space-y-3">{children}</div>
    </div>
  );
}
