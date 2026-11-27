import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, businessToday, dayRange, fromLocalInput, isIsoDate, toLocalInput } from "../../src/features/business/dates.ts";
import { centsToDecimal, dbCents, dbMilli, lineTotalCents, milliToDecimal, parseCents, parseMilli } from "../../src/features/business/money.ts";

describe("parseCents (integer cents, never floats)", () => {
  const ok: Array<[string, number]> = [
    ["0", 0],
    ["12", 1200],
    ["12,5", 1250],
    ["12.50", 1250],
    ["1 234,56", 123456],
    ["1 234,56", 123456],
    ["1.234,56", 123456],
    ["1,234.56", 123456],
    ["0,10", 10],
    ["0.1", 10],
    ["205.10 MAD", 20510],
  ];
  for (const [input, expected] of ok) it(`"${input}" → ${expected}`, () => assert.equal(parseCents(input), expected));
  for (const bad of ["", "abc", "1,234", "12.345", "1e3", "--1"]) {
    it(`rejects "${bad}"`, () => assert.equal(parseCents(bad), null));
  }
  it("rejects more than 2 decimals", () => assert.equal(parseCents("1.005"), null));
  it("0.1 + 0.2 stays exact in cents", () => assert.equal((parseCents("0.1") ?? 0) + (parseCents("0.2") ?? 0), 30));
});

describe("quantities and conversions", () => {
  it("parses thousandths", () => {
    assert.equal(parseMilli("2,5"), 2500);
    assert.equal(parseMilli("0.001"), 1);
    assert.equal(parseMilli("1.0005"), null);
    assert.equal(parseMilli("-1"), null);
  });
  it("round-trips database values", () => {
    assert.equal(dbCents(205.1), 20510);
    assert.equal(dbCents("205.10"), 20510);
    assert.equal(dbMilli(-3), -3000);
    assert.equal(dbMilli("8.000"), 8000);
    assert.equal(centsToDecimal(20510), "205.10");
    assert.equal(centsToDecimal(5), "0.05");
    assert.equal(milliToDecimal(2500), "2.500");
  });
});

describe("lineTotalCents matches Postgres round(qty × price, 2) − discount", () => {
  it("simple line", () => assert.equal(lineTotalCents(2000, 6000), 12000));
  it("custom line with discount", () => assert.equal(lineTotalCents(1000, 10010, 1000), 9010));
  it("rounds half away from zero", () => {
    // 0.333 × 0.15 = 0.04995 → 0.05
    assert.equal(lineTotalCents(333, 15), 5);
    // 1.5 × 0.01 = 0.015 → 0.02
    assert.equal(lineTotalCents(1500, 1), 2);
  });
});

describe("Morocco business days", () => {
  it("validates ISO dates", () => {
    assert.equal(isIsoDate("2026-11-27"), true);
    assert.equal(isIsoDate("2026-02-30"), false);
    assert.equal(isIsoDate("27/11/2026"), false);
  });
  it("day bounds in UTC (Morocco is UTC+1 outside Ramadan)", () => {
    assert.deepEqual(dayRange("2026-11-27"), { start: "2026-11-26T23:00:00.000Z", end: "2026-11-27T23:00:00.000Z" });
  });
  it("local midnight just after UTC midnight still belongs to the Morocco day", () => {
    assert.equal(businessToday(new Date("2026-11-26T23:30:00Z")), "2026-11-27");
  });
  it("datetime-local round trip", () => {
    const iso = fromLocalInput("2026-11-27T09:15");
    assert.equal(iso, "2026-11-27T08:15:00.000Z");
    assert.equal(toLocalInput(iso), "2026-11-27T09:15");
    assert.equal(fromLocalInput("2026-11-27 09:15"), null);
  });
  it("adds days across months", () => assert.equal(addDays("2026-11-30", 1), "2026-12-01"));
});
