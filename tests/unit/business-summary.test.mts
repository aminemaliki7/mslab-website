import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolvePeriod } from "../../src/features/business/period.ts";
import { parseSummary, parseTimeline } from "../../src/features/business/summary.ts";

describe("resolvePeriod (Morocco days)", () => {
  const today = "2026-11-28";
  it("defaults to today", () => assert.deepEqual(resolvePeriod({}, today), { key: "today", from: today, to: today }));
  it("yesterday", () => assert.deepEqual(resolvePeriod({ period: "yesterday" }, today), { key: "yesterday", from: "2026-11-27", to: "2026-11-27" }));
  it("7 and 30 days include today", () => {
    assert.deepEqual(resolvePeriod({ period: "7d" }, today), { key: "7d", from: "2026-11-22", to: today });
    assert.deepEqual(resolvePeriod({ period: "30d" }, today), { key: "30d", from: "2026-10-30", to: today });
  });
  it("custom range validated", () => {
    assert.deepEqual(resolvePeriod({ period: "custom", from: "2026-11-01", to: "2026-11-15" }, today), { key: "custom", from: "2026-11-01", to: "2026-11-15" });
    assert.equal(resolvePeriod({ period: "custom", from: "2026-11-15", to: "2026-11-01" }, today).key, "today");
    assert.equal(resolvePeriod({ period: "custom", from: "2026-11-01", to: "2026-12-31" }, today).key, "today");
    assert.equal(resolvePeriod({ period: "custom", from: "2024-01-01", to: "2026-11-01" }, today).key, "today");
  });
});

describe("parseSummary", () => {
  // Shape returned by business_period_summary (values from the Phase 2 database test).
  const raw = {
    from: "2026-11-28", to: "2026-11-28", computed_at: "2026-11-28T18:00:00Z",
    revenue: "135.00", sales_count: 1, collected: "100.00", collected_by_method: { cash: "100.00" },
    receivable_period: "35.00", receivable_total: "35.00", expenses_operating: "40.50", expenses_stock: "60.00",
    expenses_investment: "0", expenses_total: "100.50", operating_result: "94.50", new_customers: 0,
    orders_completed: 1, orders_cancelled: 0, orders_open: null,
    products_sold: [{ product_id: "p1", name: "Rame A4", unit: "unité", quantity: "3.000", revenue: "135.00" }],
    movements: { initial: 1, sale: 1, purchase: 1 }, activities_count: 2, production_completed: 1, incidents: 1,
    low_stock: 0, tasks_open: 1, tasks_overdue: 1,
  };
  const s = parseSummary(raw);
  it("reads money as integer cents", () => {
    assert.equal(s.revenue, 13500);
    assert.equal(s.collected, 10000);
    assert.equal(s.expensesOperating, 4050);
    assert.equal(s.operatingResult, 9450);
    assert.equal(s.revenue - s.expensesOperating, s.operatingResult);
    assert.equal(s.collectedByMethod.cash, 10000);
  });
  it("reads counters, products and nulls", () => {
    assert.deepEqual(s.ordersOpen, {});
    assert.equal(s.productsSold[0].quantityMilli, 3000);
    assert.equal(s.productsSold[0].revenueCents, 13500);
    assert.equal(s.movements.sale, 1);
    assert.equal(s.tasksOverdue, 1);
  });
  it("empty input gives zeros, never invented values", () => {
    const empty = parseSummary(null);
    assert.equal(empty.revenue, 0);
    assert.equal(empty.productsSold.length, 0);
  });
  it("parses timeline snapshots", () => {
    const t = parseTimeline([{ id: "a", at: "2026-11-28T09:00:00Z", type: "incident", title: "Imprimante", description: null, responsible: "Test" }]);
    assert.equal(t[0].title, "Imprimante");
    assert.equal(t[0].description, null);
    assert.deepEqual(parseTimeline(null), []);
  });
});
