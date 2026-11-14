import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/layout";
import type { Tone } from "@/features/admin/labels";
import { cn } from "@/lib/utils";

export function AdminPageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8">
      {back ? (
        <Link href={back.href} className="text-fg-muted hover:text-fg mb-3 inline-block text-sm">
          ← {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 dir="auto" className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="text-fg-muted mt-1 text-sm">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("border-line bg-bg rounded-[var(--radius-card)] border", className)}>
      {title ? (
        <div className="border-line flex items-center justify-between gap-3 border-b px-5 py-3.5">
          <h2 className="text-base font-semibold">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: { label: string; tone: Tone } }) {
  return <Badge tone={status.tone}>{status.label}</Badge>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="border-line text-fg-muted rounded-[var(--radius-card)] border border-dashed p-8 text-center text-sm">{children}</p>;
}

/** Simple responsive table: horizontal scroll on small screens. */
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="border-line bg-bg overflow-x-auto rounded-[var(--radius-card)] border">
      <table className="w-full min-w-[40rem] text-start text-sm">
        <thead className="bg-surface text-fg-muted text-xs">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-line divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  // dir="auto": customer text may be Arabic inside the French (LTR) back office.
  return (
    <td dir="auto" className={cn("px-4 py-3 align-top text-start", className)}>
      {children}
    </td>
  );
}

/** GET filter bar (status + search) — shareable URLs, works without JS. */
export function FilterBar({
  action,
  q,
  status,
  statuses,
  placeholder = "Rechercher…",
}: {
  action: string;
  q?: string;
  status?: string;
  statuses: Record<string, { label: string }>;
  placeholder?: string;
}) {
  return (
    <form action={action} method="get" className="mb-5 flex flex-wrap gap-2">
      <label htmlFor="filter-q" className="sr-only">
        Recherche
      </label>
      <input
        id="filter-q"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="border-line-strong bg-bg h-10 min-w-56 flex-1 rounded-[var(--radius-control)] border px-3 text-sm"
      />
      <label htmlFor="filter-status" className="sr-only">
        Statut
      </label>
      <select
        id="filter-status"
        name="status"
        defaultValue={status ?? ""}
        className="border-line-strong bg-bg h-10 rounded-[var(--radius-control)] border px-3 text-sm"
      >
        <option value="">Tous les statuts</option>
        {Object.entries(statuses).map(([value, s]) => (
          <option key={value} value={value}>
            {s.label}
          </option>
        ))}
      </select>
      <button type="submit" className="bg-primary text-on-primary h-10 rounded-[var(--radius-control)] px-4 text-sm font-medium">
        Filtrer
      </button>
    </form>
  );
}

export function Dl({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-fg-muted">{item.label}</dt>
          <dd dir="auto" className="text-fg min-w-0 break-words text-start">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
