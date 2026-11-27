import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { completionRate, defaultGranularity, parseAnalytics } from "../../src/features/business/analytics.ts";

// Shape returned by business_analytics (values from the Phase 3 database test).
const raw = {
  from: "2026-11-22", to: "2026-11-28", granularity: "day", computed_at: "2026-11-28T18:00:00Z",
  series: [{ bucket: "2026-11-28", revenue: "185.00", sales: 1, collected: "100.00", operating: "40.50", cash_out: "40.50" }],
  expenses_by_category: [{ category: null, treatment: "operating", count: 1, amount: "40.50" }],
  sales_by_product: [{ product_id: "p1", name: "Rame A4", unit: "unité", quantity: "3.000", revenue: "135.00", sales: 1, cost: "90.00", cost_complete: true }],
  custom_lines: { count: 1, revenue: "50.00" },
  inventory: [{ category: null, products: 1, value: "210.00", missing_cost: 0, low: 1 }],
  customers: { active: 1, new: 1, walk_in_revenue: "0", top: [{ id: "c1", name: "Client Test", sales: 1, revenue: "185.00", balance: "85.00" }] },
  receivables_ageing: { "0_30": { count: 1, amount: "85.00" } },
  orders: { open: 1, total: 1, cancelled: 0, delivered: 0 },
};

describe("parseAnalytics", () => {
  const a = parseAnalytics(raw);
  it("money as integer cents", () => {
    assert.equal(a.series[0].revenue, 18500);
    assert.equal(a.series[0].operating, 4050);
    assert.equal(a.salesByProduct[0].revenue - (a.salesByProduct[0].cost ?? 0), 4500);
    assert.equal(a.customLines.revenue, 5000);
    assert.equal(a.inventory[0].value, 21000);
    assert.equal(a.customers.top[0].balance, 8500);
  });
  it("ageing buckets default to zero", () => {
    assert.deepEqual(a.ageing["0_30"], { count: 1, amount: 8500 });
    assert.deepEqual(a.ageing["90_plus"], { count: 0, amount: 0 });
  });
  it("missing cost stays null (never invented)", () => {
    const b = parseAnalytics({ ...raw, sales_by_product: [{ ...raw.sales_by_product[0], cost: null, cost_complete: false }] });
    assert.equal(b.salesByProduct[0].cost, null);
    assert.equal(b.salesByProduct[0].costComplete, false);
  });
  it("empty input", () => {
    const e = parseAnalytics(null);
    assert.equal(e.series.length, 0);
    assert.equal(e.granularity, "day");
  });
});

describe("completionRate and granularity", () => {
  it("rate over non-cancelled orders", () => {
    assert.equal(completionRate({ total: 10, cancelled: 2, delivered: 6, open: 2 }), 75);
    assert.equal(completionRate({ total: 1, cancelled: 1, delivered: 0, open: 0 }), null);
    assert.equal(completionRate({ total: 0, cancelled: 0, delivered: 0, open: 0 }), null);
  });
  it("default bucket size", () => {
    assert.equal(defaultGranularity("2026-11-01", "2026-11-30"), "day");
    assert.equal(defaultGranularity("2026-09-01", "2026-11-30"), "week");
    assert.equal(defaultGranularity("2026-01-01", "2026-11-30"), "month");
  });
});
