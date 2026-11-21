import { StationeryIllustration } from "@/components/illustrations/scenes";
import { ArrowLink } from "@/components/ui/arrow-link";

type Props = {
  message: string;
  hint?: string;
  /** Primary action (quotation request). */
  action: { href: string; label: string };
  /** Optional secondary link, e.g. back to the full catalog from an empty category. */
  secondary?: { href: string; label: string };
};

/**
 * Catalog empty state (docs/CATALOG_AUDIT_AND_PLAN.md step 4): shown when a listing has no
 * published product, or a search matches nothing. Built only from existing pieces — the
 * animated stationery drawing (motion is off under prefers-reduced-motion) and the card frame
 * of the previous dashed box. No product names, prices or counts.
 */
export function CatalogEmptyState({ message, hint, action, secondary }: Props) {
  return (
    <div className="border-line mt-5 grid items-center gap-6 rounded-[var(--radius-card)] border border-dashed p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] sm:p-8">
      <div>
        <p className="text-fg max-w-prose font-medium">{message}</p>
        {hint ? <p className="text-fg-muted mt-2 max-w-prose text-sm">{hint}</p> : null}
        <div className="mt-4 flex flex-wrap gap-x-6">
          <ArrowLink href={action.href}>{action.label}</ArrowLink>
          {secondary ? <ArrowLink href={secondary.href}>{secondary.label}</ArrowLink> : null}
        </div>
      </div>
      <StationeryIllustration className="mx-auto w-full max-w-[14rem]" />
    </div>
  );
}
