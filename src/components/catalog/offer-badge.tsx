import type { OfferType } from "@/config/catalog-offers";
import { cn } from "@/lib/utils";

/**
 * How a catalogue product is ordered, as a small label: "available" (standard article, ink on
 * white) or "customizable" (accent). Text, not colour alone, carries the meaning.
 */
export function OfferBadge({
  type,
  labels,
  className,
}: {
  type: OfferType | "custom";
  labels: { standard: string; customizable: string; custom?: string };
  className?: string;
}) {
  const label = type === "standard" ? labels.standard : type === "customizable" ? labels.customizable : labels.custom;
  if (!label) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold leading-none",
        type === "standard" && "border-line text-fg border bg-white",
        type === "customizable" && "bg-accent text-on-primary",
        type === "custom" && "bg-ink-900 text-white",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", type === "standard" ? "bg-fg" : "bg-white")} />
      {label}
    </span>
  );
}
