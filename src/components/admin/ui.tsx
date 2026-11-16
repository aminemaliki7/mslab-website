import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/layout";
import type { StatusLabel } from "@/features/admin/labels";
import { cn } from "@/lib/utils";

/**
 * Page title + one plain sentence saying what the page is for, optional back link and actions.
 * Every admin page starts with this so a new team member always knows where they are.
 */
export function AdminPageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8">
      {back ? (
        <Link href={back.href} className="text-fg-muted hover:text-fg mb-2 inline-flex min-h-11 items-center gap-1.5 text-sm">
          <ArrowIcon width={16} height={16} className="-scale-x-100 rtl:scale-x-100" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 dir="auto" className="text-fg text-2xl font-semibold tracking-tight text-start sm:text-[1.75rem]">
            {title}
          </h1>
          {description ? <p className="text-fg-muted mt-2 max-w-2xl leading-relaxed">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Panel({ title, description, children, className, actions }: { title?: string; description?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("border-line bg-bg rounded-[var(--radius-card)] border", className)}>
      {title ? (
        <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? <p className="text-fg-muted mt-0.5 text-sm">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Folded section for fields most people never need (page address, display order…). */
export function Advanced({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <details className="border-line bg-bg group rounded-[var(--radius-card)] border">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-semibold">{label}</span>
          <span className="text-fg-muted block text-sm">{hint}</span>
        </span>
        <span aria-hidden="true" className="text-fg-muted text-xl leading-none transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-line space-y-6 border-t p-5">{children}</div>
    </details>
  );
}

export function StatusBadge({ status }: { status: StatusLabel }) {
  return <Badge tone={status.tone}>{status.label}</Badge>;
}

export function Notice({ tone = "success", children }: { tone?: "success" | "warning" | "danger"; children: ReactNode }) {
  const tones = { success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger" };
  return (
    <p role={tone === "danger" ? "alert" : "status"} className={cn("mb-6 rounded-[var(--radius-control)] px-4 py-3 text-sm font-medium", tones[tone])}>
      {children}
    </p>
  );
}

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="border-line text-fg-muted rounded-[var(--radius-card)] border border-dashed p-8 text-center">
      <p>{children}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/**
 * List table. From md up: a normal table. On phones each row becomes a card and every cell
 * shows its column name (pass `label` to <Td>) — no sideways scrolling.
 */
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="md:border-line md:bg-bg md:overflow-x-auto md:rounded-[var(--radius-card)] md:border">
      <table className="w-full text-start text-sm max-md:block md:min-w-[40rem]">
        <thead className="bg-surface text-fg-muted text-xs max-md:hidden">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="md:divide-line max-md:block max-md:space-y-3 md:divide-y [&>tr]:max-md:border-line [&>tr]:max-md:bg-bg [&>tr]:max-md:block [&>tr]:max-md:rounded-[var(--radius-card)] [&>tr]:max-md:border [&>tr]:max-md:p-4">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  // dir="auto": customer text may be in another script than the interface.
  return (
    <td dir="auto" className={cn("px-4 py-3 align-top text-start max-md:flex max-md:items-start max-md:gap-3 max-md:px-0 max-md:py-1.5", className)}>
      {label ? <span className="text-fg-muted w-28 shrink-0 text-xs md:hidden">{label}</span> : null}
      <div className="min-w-0 max-md:flex-1">{children}</div>
    </td>
  );
}

/** GET filter bar (status + search) — shareable URLs, works without JS. */
export function FilterBar({
  action,
  q,
  status,
  statuses,
  labels,
}: {
  action: string;
  q?: string;
  status?: string;
  statuses: Record<string, { label: string }>;
  labels: { search: string; placeholder: string; status: string; allStatuses: string; submit: string };
}) {
  const control = "border-line-strong bg-bg h-11 rounded-[var(--radius-control)] border px-3 text-base";
  return (
    <form action={action} method="get" className="mb-6 grid gap-2 sm:flex sm:flex-wrap">
      <label htmlFor="filter-q" className="sr-only">
        {labels.search}
      </label>
      <input id="filter-q" name="q" type="search" defaultValue={q} placeholder={labels.placeholder} className={cn(control, "min-w-0 sm:min-w-64 sm:flex-1")} />
      <label htmlFor="filter-status" className="sr-only">
        {labels.status}
      </label>
      <select id="filter-status" name="status" defaultValue={status ?? ""} className={control}>
        <option value="">{labels.allStatuses}</option>
        {Object.entries(statuses).map(([value, s]) => (
          <option key={value} value={value}>
            {s.label}
          </option>
        ))}
      </select>
      <button type="submit" className="bg-primary text-on-primary h-11 rounded-[var(--radius-control)] px-5 text-sm font-medium">
        {labels.submit}
      </button>
    </form>
  );
}

export function Dl({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[11rem_minmax(0,1fr)]">
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-fg-muted">{item.label}</dt>
          <dd dir="auto" className="text-fg min-w-0 break-words text-start max-sm:mb-2">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Large link tile used on the dashboard (quick actions, to-do counts). */
export function Tile({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("border-line bg-bg hover:border-fg active:bg-surface block rounded-[var(--radius-card)] border p-5 transition-colors", className)}>
      {children}
    </Link>
  );
}
