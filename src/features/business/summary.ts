/**
 * Shape of business_period_summary() / a report snapshot (Phase 2, ADR-028). Pure module.
 * Money values arrive as numeric strings ("205.10") and are read as integer cents.
 */
import type { Json } from "@/lib/supabase/database.types";
import { dbCents, dbMilli } from "./money.ts";

export type ProductSold = { product_id: string; name: string; unit: string | null; quantityMilli: number; revenueCents: number };

export type Summary = {
  from: string;
  to: string;
  computedAt: string | null;
  revenue: number;
  salesCount: number;
  collected: number;
  collectedByMethod: Record<string, number>;
  receivablePeriod: number;
  receivableTotal: number;
  expensesOperating: number;
  expensesStock: number;
  expensesInvestment: number;
  expensesTotal: number;
  operatingResult: number;
  newCustomers: number;
  ordersCompleted: number;
  ordersCancelled: number;
  ordersOpen: Record<string, number>;
  productsSold: ProductSold[];
  movements: Record<string, number>;
  activitiesCount: number;
  productionCompleted: number;
  incidents: number;
  lowStock: number;
  tasksOpen: number;
  tasksOverdue: number;
};

const obj = (v: Json | undefined): Record<string, Json | undefined> => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const num = (v: Json | undefined): number => (typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0);
const str = (v: Json | undefined): string => (typeof v === "string" ? v : "");
const counts = (v: Json | undefined): Record<string, number> => Object.fromEntries(Object.entries(obj(v)).map(([k, x]) => [k, num(x)]));
const money = (v: Json | undefined): number => dbCents(typeof v === "number" || typeof v === "string" ? v : null);

export function parseSummary(value: Json | null | undefined): Summary {
  const s = obj(value ?? undefined);
  const sold = Array.isArray(s.products_sold) ? s.products_sold : [];
  return {
    from: str(s.from),
    to: str(s.to),
    computedAt: str(s.computed_at) || null,
    revenue: money(s.revenue),
    salesCount: num(s.sales_count),
    collected: money(s.collected),
    collectedByMethod: Object.fromEntries(Object.entries(obj(s.collected_by_method)).map(([k, x]) => [k, money(x)])),
    receivablePeriod: money(s.receivable_period),
    receivableTotal: money(s.receivable_total),
    expensesOperating: money(s.expenses_operating),
    expensesStock: money(s.expenses_stock),
    expensesInvestment: money(s.expenses_investment),
    expensesTotal: money(s.expenses_total),
    operatingResult: money(s.operating_result),
    newCustomers: num(s.new_customers),
    ordersCompleted: num(s.orders_completed),
    ordersCancelled: num(s.orders_cancelled),
    ordersOpen: counts(s.orders_open),
    productsSold: sold.map((p) => {
      const o = obj(p);
      return {
        product_id: str(o.product_id),
        name: str(o.name),
        unit: str(o.unit) || null,
        quantityMilli: dbMilli(str(o.quantity) || null),
        revenueCents: money(o.revenue),
      };
    }),
    movements: counts(s.movements),
    activitiesCount: num(s.activities_count),
    productionCompleted: num(s.production_completed),
    incidents: num(s.incidents),
    lowStock: num(s.low_stock),
    tasksOpen: num(s.tasks_open),
    tasksOverdue: num(s.tasks_overdue),
  };
}

export type TimelineEntry = { id: string; at: string; type: string; title: string; description: string | null; responsible: string | null };

export function parseTimeline(value: Json | null | undefined): TimelineEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => {
    const o = obj(v);
    return { id: str(o.id), at: str(o.at), type: str(o.type), title: str(o.title), description: str(o.description) || null, responsible: str(o.responsible) || null };
  });
}
