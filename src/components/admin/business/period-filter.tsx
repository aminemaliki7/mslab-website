import Link from "next/link";
import type { BusinessDict } from "@/features/business/dictionary";
import type { Period } from "@/features/business/period";

export { resolvePeriod } from "@/features/business/period";

/** GET links + custom range form: shareable URLs, works without JavaScript. */
export function PeriodFilter({ action, period, b }: { action: string; period: Period; b: BusinessDict }) {
  const o = b.overview;
  const control = "border-line-strong bg-bg h-11 rounded-[var(--radius-control)] border px-3";
  return (
    <div className="mb-6 space-y-3">
      <nav aria-label={o.periods.custom} className="flex flex-wrap gap-2">
        {(["today", "yesterday", "7d", "30d"] as const).map((k) => (
          <Link
            key={k}
            href={k === "today" ? action : `${action}?period=${k}`}
            aria-current={period.key === k ? "page" : undefined}
            className="border-line hover:border-accent aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium"
          >
            {o.periods[k]}
          </Link>
        ))}
      </nav>
      <form method="get" action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="period" value="custom" />
        <label className="grid gap-1 text-sm">
          {b.common.from}
          <input type="date" name="from" defaultValue={period.from} className={control} />
        </label>
        <label className="grid gap-1 text-sm">
          {b.common.to}
          <input type="date" name="to" defaultValue={period.to} className={control} />
        </label>
        <button type="submit" className={`h-11 rounded-[var(--radius-control)] px-5 text-sm font-medium ${period.key === "custom" ? "bg-primary text-on-primary" : "border-line-strong border"}`}>
          {o.apply}
        </button>
      </form>
    </div>
  );
}
