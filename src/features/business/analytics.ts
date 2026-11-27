/**
 * Shape of business_analytics() (Phase 3, ADR-028). Pure module; money read as integer cents,
 * quantities as thousandths.
 */
import type { Json } from "@/lib/supabase/database.types";
import { dbCents, dbMilli } from "./money.ts";

export type Granularity = "day" | "week" | "month";

export type Analytics = {
  from: string;
  to: string;
  granularity: Granularity;
  computedAt: string | null;
  series: Array<{ bucket: string; revenue: number; sales: number; collected: number; operating: number; cashOut: number }>;
  expensesByCategory: Array<{ category: string | null; treatment: string; count: number; amount: number }>;
  salesByProduct: Array<{ productId: string; name: string; unit: string | null; quantityMilli: number; revenue: number; sales: number; cost: number | null; costComplete: boolean }>;
  customLines: { count: number; revenue: number };
  inventory: Array<{ category: string | null; products: number; value: number; missingCost: number; low: number }>;
  customers: { active: number; new: number; walkInRevenue: number; top: Array<{ id: string; name: string; sales: number; revenue: number; balance: number }> };
  ageing: Record<"0_30" | "31_60" | "61_90" | "90_plus", { count: number; amount: number }>;
  orders: { total: number; cancelled: number; delivered: number; open: number };
};

type O = Record<string, Json | undefined>;
const obj = (v: Json | undefined): O => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const arr = (v: Json | undefined): O[] => (Array.isArray(v) ? v.map(obj) : []);
const num = (v: Json | undefined): number => (typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0);
const str = (v: Json | undefined): string => (typeof v === "string" ? v : "");
const money = (v: Json | undefined): number => dbCents(typeof v === "number" || typeof v === "string" ? v : null);

export function parseAnalytics(value: Json | null | undefined): Analytics {
  const a = obj(value ?? undefined);
  const g = str(a.granularity);
  const ageing = obj(a.receivables_ageing);
  const bucket = (k: string) => ({ count: num(obj(ageing[k]).count), amount: money(obj(ageing[k]).amount) });
  const customers = obj(a.customers);
  const orders = obj(a.orders);
  return {
    from: str(a.from),
    to: str(a.to),
    granularity: g === "week" || g === "month" ? g : "day",
    computedAt: str(a.computed_at) || null,
    series: arr(a.series).map((s) => ({
      bucket: str(s.bucket),
      revenue: money(s.revenue),
      sales: num(s.sales),
      collected: money(s.collected),
      operating: money(s.operating),
      cashOut: money(s.cash_out),
    })),
    expensesByCategory: arr(a.expenses_by_category).map((e) => ({ category: str(e.category) || null, treatment: str(e.treatment), count: num(e.count), amount: money(e.amount) })),
    salesByProduct: arr(a.sales_by_product).map((p) => ({
      productId: str(p.product_id),
      name: str(p.name),
      unit: str(p.unit) || null,
      quantityMilli: dbMilli(str(p.quantity) || null),
      revenue: money(p.revenue),
      sales: num(p.sales),
      cost: p.cost === null || p.cost === undefined ? null : money(p.cost),
      costComplete: p.cost_complete === true,
    })),
    customLines: { count: num(obj(a.custom_lines).count), revenue: money(obj(a.custom_lines).revenue) },
    inventory: arr(a.inventory).map((i) => ({ category: str(i.category) || null, products: num(i.products), value: money(i.value), missingCost: num(i.missing_cost), low: num(i.low) })),
    customers: {
      active: num(customers.active),
      new: num(customers.new),
      walkInRevenue: money(customers.walk_in_revenue),
      top: arr(customers.top).map((c) => ({ id: str(c.id), name: str(c.name), sales: num(c.sales), revenue: money(c.revenue), balance: money(c.balance) })),
    },
    ageing: { "0_30": bucket("0_30"), "31_60": bucket("31_60"), "61_90": bucket("61_90"), "90_plus": bucket("90_plus") },
    orders: { total: num(orders.total), cancelled: num(orders.cancelled), delivered: num(orders.delivered), open: num(orders.open) },
  };
}

/** Delivered share of the period's non-cancelled orders, in whole percent (null when none). */
export function completionRate(o: Analytics["orders"]): number | null {
  const base = o.total - o.cancelled;
  return base > 0 ? Math.round((o.delivered * 100) / base) : null;
}

/** Sensible default bucket size for a range: days up to a month, weeks up to ~4 months, else months. */
export function defaultGranularity(from: string, to: string): Granularity {
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 + 1;
  return days <= 31 ? "day" : days <= 120 ? "week" : "month";
}
