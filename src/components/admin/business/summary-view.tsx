import Link from "next/link";
import type { ReactNode } from "react";
import { format } from "@/i18n/format";
import type { AdminLang } from "@/features/admin/dictionary";
import type { BusinessDict } from "@/features/business/dictionary";
import { MOVEMENT_TYPES, PAYMENT_METHODS } from "@/features/business/labels";
import { formatMoney, formatQty } from "@/features/business/money";
import type { Summary } from "@/features/business/summary";
import { cn } from "@/lib/utils";

/**
 * The four money figures, kept visually distinct on purpose: revenue (recorded), collected
 * (cash in), operating result (revenue − operating expenses) and receivables (still owed).
 */
export function FinancialKpis({ s, b, lang }: { s: Summary; b: BusinessDict; lang: AdminLang }) {
  const o = b.overview;
  const m = (cents: number) => formatMoney(cents, lang, { cents: true });
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi label={o.revenue} value={m(s.revenue)} hint={o.revenueHint} foot={`${s.salesCount} · ${o.orders}`} />
      <Kpi label={o.collected} value={m(s.collected)} hint={o.collectedHint} foot={methods(s, b, lang)} />
      <Kpi
        label={o.result}
        value={m(s.operatingResult)}
        hint={o.resultHint}
        tone={s.operatingResult < 0 ? "danger" : undefined}
        foot={`${o.expenses} : ${m(s.expensesOperating)} · ${format(o.cashOut, { amount: m(s.expensesTotal) })}`}
      />
      <Kpi
        label={o.receivables}
        value={m(s.receivableTotal)}
        hint={o.receivablesHint}
        tone={s.receivableTotal > 0 ? "warning" : undefined}
        foot={format(o.receivablesPeriod, { amount: m(s.receivablePeriod) })}
      />
    </ul>
  );
}

function methods(s: Summary, b: BusinessDict, lang: AdminLang): string | undefined {
  const parts = PAYMENT_METHODS.filter((k) => s.collectedByMethod[k]).map((k) => `${b.paymentMethod[k]} ${formatMoney(s.collectedByMethod[k], lang, { cents: true })}`);
  return parts.length ? parts.join(" · ") : undefined;
}

function Kpi({ label, value, hint, foot, tone }: { label: string; value: string; hint: string; foot?: string; tone?: "warning" | "danger" }) {
  return (
    <li className={cn("rounded-[var(--radius-card)] border p-4", tone === "danger" ? "border-danger bg-danger-soft" : tone === "warning" ? "border-warning bg-warning-soft" : "border-line bg-bg")}>
      <p className="text-fg text-sm font-semibold">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums" dir="ltr">{value}</p>
      <p className="text-fg-muted mt-1 text-xs leading-snug">{hint}</p>
      {foot ? <p className="text-fg-muted border-line mt-2 border-t pt-2 text-xs">{foot}</p> : null}
    </li>
  );
}

/** Small counters (orders, production, incidents, customers…). */
export function Counters({ items }: { items: Array<{ label: string; value: number; href?: string; tone?: "warning" | "danger" }> }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((i) => {
        const body: ReactNode = (
          <>
            <span className="block text-2xl font-semibold tabular-nums" dir="ltr">{i.value}</span>
            <span className="text-fg-muted block text-xs leading-snug">{i.label}</span>
          </>
        );
        const cls = cn("block h-full rounded-[var(--radius-card)] border p-3", i.tone === "danger" && i.value > 0 ? "border-danger bg-danger-soft" : i.tone === "warning" && i.value > 0 ? "border-warning bg-warning-soft" : "border-line bg-bg");
        return <li key={i.label}>{i.href ? <Link href={i.href} className={cn(cls, "hover:border-fg")}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
      })}
    </ul>
  );
}

/** Products sold + stock movements of the period (closing screen and report). */
export function OperationalDetails({ s, b, lang }: { s: Summary; b: BusinessDict; lang: AdminLang }) {
  const c = b.closing;
  const moves = MOVEMENT_TYPES.filter((t) => s.movements[t]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-2 text-sm font-semibold">{c.productsSold}</h3>
        {s.productsSold.length === 0 ? (
          <p className="text-fg-muted text-sm">{c.noProductsSold}</p>
        ) : (
          <ul className="divide-line divide-y text-sm">
            {s.productsSold.map((p) => (
              <li key={p.product_id} className="flex justify-between gap-3 py-1.5">
                <span dir="auto">{p.name}</span>
                <span className="text-fg-muted tabular-nums" dir="ltr">
                  {formatQty(p.quantityMilli, lang, { milli: true })} {p.unit} · {formatMoney(p.revenueCents, lang, { cents: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">{c.movements}</h3>
        {moves.length === 0 ? (
          <p className="text-fg-muted text-sm">—</p>
        ) : (
          <ul className="flex flex-wrap gap-2 text-sm">
            {moves.map((t) => (
              <li key={t} className="bg-surface rounded-full px-3 py-1">
                {b.movementType[t]} : <strong className="tabular-nums">{s.movements[t]}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
