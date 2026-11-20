"use client";

import { useSyncExternalStore } from "react";

/**
 * The visitor's draft quotation request (ADR-017), kept in localStorage so it survives
 * browsing between product pages. Not a cart: no prices, no checkout. Names/SKUs here are
 * for display only — the server snapshots product names from the database.
 */
export type QuoteRow = {
  key: string;
  productId?: string;
  /** Display name (catalog item) or the customer's description (custom item). */
  name: string;
  sku?: string | null;
  /** Product minimum order quantity (display + default quantity; enforced by the server). */
  minOrderQuantity?: number | null;
  quantity: string;
  specifications: string;
  custom: boolean;
};

const STORAGE_KEY = "mslab.quote.v1";
const MAX_ROWS = 50;
const EMPTY: QuoteRow[] = [];

let rows: QuoteRow[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function isRow(value: unknown): value is QuoteRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.key === "string" && typeof row.name === "string" && typeof row.quantity === "string";
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    rows = Array.isArray(parsed) ? parsed.filter(isRow).slice(0, MAX_ROWS) : EMPTY;
  } catch {
    rows = EMPTY;
  }
}

function commit(next: QuoteRow[]) {
  rows = next.slice(0, MAX_ROWS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Storage unavailable (private mode, quota): the list still works for this page view.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return rows;
}

export function useQuoteRows(): QuoteRow[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random());
}

export const quoteList = {
  addProduct(product: { productId: string; name: string; sku?: string | null; minOrderQuantity?: number | null }) {
    load();
    const existing = rows.find((r) => r.productId === product.productId);
    if (existing) return;
    commit([...rows, { key: newKey(), productId: product.productId, name: product.name, sku: product.sku ?? null, minOrderQuantity: product.minOrderQuantity ?? null, quantity: product.minOrderQuantity ? String(product.minOrderQuantity) : "", specifications: "", custom: false }]);
  },
  addCustom() {
    load();
    commit([...rows, { key: newKey(), name: "", quantity: "", specifications: "", custom: true }]);
  },
  /** One blank line when the list is empty (idempotent: safe if an effect runs twice). */
  ensureOne() {
    load();
    if (rows.length === 0) quoteList.addCustom();
  },
  update(key: string, patch: Partial<Pick<QuoteRow, "name" | "quantity" | "specifications">>) {
    load();
    commit(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  },
  remove(key: string) {
    load();
    commit(rows.filter((r) => r.key !== key));
  },
  clear() {
    commit(EMPTY);
  },
};
