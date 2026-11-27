import type { NextRequest } from "next/server";
import { requireAdmin } from "@/features/admin/auth";
import { parseAnalytics, defaultGranularity } from "@/features/business/analytics";
import { addDays, businessToday, isIsoDate, dayRange, BUSINESS_TZ } from "@/features/business/dates";
import { getBusinessT } from "@/features/business/lang";
import { centsToDecimal, dbCents, dbMilli, milliToDecimal } from "@/features/business/money";
import { getPermissions } from "@/features/business/permissions";
import { analytics, staffNames } from "@/features/business/queries";
import { parseSummary } from "@/features/business/summary";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * CSV exports of the business module (ADR-028). Same rules as the screens: signed-in staff with
 * MFA and `business.read`, rows filtered by RLS. Semicolon separator + decimal comma + UTF-8 BOM so
 * the file opens correctly in a French Excel; dates in Morocco local time. Never cached.
 */
const KINDS = ["sales", "payments", "expenses", "movements", "products", "customers", "reports", "series"] as const;
type Kind = (typeof KINDS)[number];
const PAGE = 1000;
const MAX_ROWS = 20000;

type Cell = string | number | null | undefined;

function csv(rows: Cell[][]): string {
  const cell = (v: Cell) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}

const money = (v: number | string | null | undefined) => (v === null || v === undefined ? "" : centsToDecimal(dbCents(v)).replace(".", ","));
const cents = (c: number) => centsToDecimal(c).replace(".", ",");
const qty = (v: number | string | null | undefined) => (v === null || v === undefined ? "" : milliToDecimal(dbMilli(v)).replace(/\.?0+$/, "").replace(".", ","));
const stamp = (iso: string | null | undefined) => {
  if (!iso) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
};

/** Pages through PostgREST's row limit. */
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE) {
    const { data, error } = await page(offset, offset + PAGE - 1);
    if (error) throw new Error("export query failed");
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export async function GET(request: NextRequest, ctx: RouteContext<"/admin/business/export/[kind]">) {
  await requireAdmin();
  if (!(await getPermissions()).has("business.read")) return new Response("Forbidden", { status: 403 });
  const { kind: rawKind } = await ctx.params;
  if (!(KINDS as readonly string[]).includes(rawKind)) return new Response("Not found", { status: 404 });
  const kind = rawKind as Kind;

  const params = request.nextUrl.searchParams;
  const today = businessToday();
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const from = isIsoDate(fromParam) && fromParam >= addDays(today, -400) ? fromParam : addDays(today, -29);
  const to = isIsoDate(toParam) && toParam >= from && toParam <= today ? toParam : today;
  const range = dayRange(from, to);

  const { b } = await getBusinessT();
  const db = await createSessionClient();
  const names = await staffNames();
  let rows: Cell[][];

  try {
    switch (kind) {
      case "sales": {
        const data = await all((a, z) =>
          db.from("business_sales").select("number, sold_at, order_status, payment_status, total, amount_paid, balance, business_customers(name)").gte("sold_at", range.start).lt("sold_at", range.end).order("sold_at").range(a, z),
        );
        rows = [
          [b.sales.colNumber, b.sales.colDate, b.sales.colCustomer, b.sales.colStatus, b.sales.colPayment, b.sales.colTotal, b.sales.colPaid, b.sales.colBalance],
          ...data.map((r) => [r.number, stamp(r.sold_at), r.business_customers?.name ?? b.common.walkIn, b.orderStatus[r.order_status], b.paymentStatus[r.payment_status], money(r.total), money(r.amount_paid), money(r.balance)]),
        ];
        break;
      }
      case "payments": {
        const data = await all((a, z) =>
          db.from("business_payments").select("paid_at, amount, method, reference, is_void, void_reason, business_sales(number)").gte("paid_at", range.start).lt("paid_at", range.end).order("paid_at").range(a, z),
        );
        rows = [
          [b.sales.paidAt, b.sales.colNumber, b.sales.method, b.common.amount, b.sales.paymentReference, b.sales.voided],
          ...data.map((r) => [stamp(r.paid_at), r.business_sales?.number, b.paymentMethod[r.method], money(r.amount), r.reference, r.is_void ? `${b.sales.voided} : ${r.void_reason ?? ""}` : ""]),
        ];
        break;
      }
      case "expenses": {
        const data = await all((a, z) =>
          db.from("business_expenses").select("expense_date, label, treatment, amount, payment_method, reference, is_void, business_categories(name), business_suppliers(name)").gte("expense_date", from).lte("expense_date", to).order("expense_date").range(a, z),
        );
        rows = [
          [b.expenses.colDate, b.expenses.colLabel, b.expenses.colTreatment, b.common.category, b.common.supplier, b.sales.method, b.expenses.colAmount, b.expenses.reference, b.sales.voided],
          ...data.map((r) => [r.expense_date, r.label, b.treatment[r.treatment], r.business_categories?.name, r.business_suppliers?.name, b.paymentMethod[r.payment_method], money(r.amount), r.reference, r.is_void ? b.sales.voided : ""]),
        ];
        break;
      }
      case "movements": {
        const data = await all((a, z) =>
          db.from("inventory_movements").select("occurred_at, movement_type, quantity, quantity_after, reason, created_by, business_products(name, unit)").gte("occurred_at", range.start).lt("occurred_at", range.end).order("occurred_at").range(a, z),
        );
        rows = [
          [b.stock.colWhen, b.stock.colProduct, b.stock.colType, b.stock.colQty, b.stock.colAfter, b.products.unit, b.stock.colReason, b.common.by],
          ...data.map((r) => [stamp(r.occurred_at), r.business_products?.name, b.movementType[r.movement_type], qty(r.quantity), qty(r.quantity_after), r.business_products?.unit, r.reason, names.get(r.created_by ?? "")]),
        ];
        break;
      }
      case "products": {
        const data = await all((a, z) =>
          db.from("business_products").select("name, sku, item_type, unit, track_stock, quantity_on_hand, min_stock, purchase_cost, selling_price, is_archived, business_categories(name)").order("name").range(a, z),
        );
        rows = [
          [b.products.name, b.products.sku, b.products.itemType, b.common.category, b.products.unit, b.products.currentStock, b.products.minStock, b.products.purchaseCost, b.products.sellingPrice, b.products.colValue, b.common.archived],
          ...data.map((r) => [
            r.name,
            r.sku,
            b.itemType[r.item_type],
            r.business_categories?.name,
            r.unit,
            r.track_stock ? qty(r.quantity_on_hand) : "",
            qty(r.min_stock),
            money(r.purchase_cost),
            money(r.selling_price),
            r.track_stock && r.purchase_cost !== null ? cents(Math.round((dbMilli(r.quantity_on_hand) * dbCents(r.purchase_cost)) / 1000)) : "",
            r.is_archived ? b.common.archived : "",
          ]),
        ];
        break;
      }
      case "customers": {
        const [customers, balances] = await Promise.all([
          all((a, z) => db.from("business_customers").select("id, name, customer_type, phone, email, city, created_at, is_archived").order("name").range(a, z)),
          all((a, z) => db.from("business_customer_balances").select("*").range(a, z)),
        ]);
        const byId = new Map(balances.map((x) => [x.customer_id, x]));
        rows = [
          [b.customers.name, b.customers.type, b.common.phone, b.common.email, b.common.city, b.customers.colSales, b.customers.totalSales, b.customers.totalPaid, b.customers.balance, b.customers.since, b.common.archived],
          ...customers.map((r) => {
            const x = byId.get(r.id);
            return [r.name, b.customerType[r.customer_type], r.phone, r.email, r.city, x?.sales_count ?? 0, money(x?.total_sales ?? 0), money(x?.total_paid ?? 0), money(x?.balance ?? 0), stamp(r.created_at), r.is_archived ? b.common.archived : ""];
          }),
        ];
        break;
      }
      case "reports": {
        const data = await all((a, z) =>
          db.from("business_daily_reports").select("report_date, status, version, summary, closed_by, closed_at").gte("report_date", from).lte("report_date", to).order("report_date").range(a, z),
        );
        rows = [
          [b.reports.colDate, b.reports.colStatus, "Version", b.overview.revenue, b.overview.collected, b.overview.expenses, b.overview.result, b.reports.colManager, b.common.date],
          ...data.map((r) => {
            const s = parseSummary(r.summary);
            return [r.report_date, b.reports.status[r.status], r.version, cents(s.revenue), cents(s.collected), cents(s.expensesOperating), cents(s.operatingResult), names.get(r.closed_by ?? ""), stamp(r.closed_at)];
          }),
        ];
        break;
      }
      case "series": {
        const g = params.get("g");
        const granularity = g === "day" || g === "week" || g === "month" ? g : defaultGranularity(from, to);
        const { data, error } = await analytics(from, to, granularity);
        if (error) throw new Error("analytics failed");
        const a = parseAnalytics(data);
        rows = [
          [b.analytics.colPeriod, b.analytics.colRevenue, b.analytics.colSales, b.analytics.colCollected, b.analytics.colOperating, b.analytics.colCashOut],
          ...a.series.map((s) => [s.bucket, cents(s.revenue), s.sales, cents(s.collected), cents(s.operating), cents(s.cashOut)]),
        ];
        break;
      }
    }
  } catch (error) {
    console.error("[business] export", kind, error instanceof Error ? error.message : "unknown");
    return new Response("Export failed", { status: 500 });
  }

  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mslab-${kind}-${from}_${to}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
