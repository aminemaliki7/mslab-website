/**
 * Zod schemas of the business forms (ADR-028). Messages are French (translated for display).
 * Amounts are parsed into integer cents and quantities into thousandths — never floats.
 */
import { z } from "zod";
import { fromLocalInput, isIsoDate } from "./dates";
import { ACTIVITY_TYPES } from "./labels";
import { parseCents, parseMilli } from "./money";

const text = (max: number) => z.string().trim().max(max, { error: `${max} caractères maximum.` });
const optional = (max: number) => text(max).optional().transform((v) => (v ? v : null));
const required = (min: number, max: number) => text(max).min(min, { error: "Valeur trop courte ou manquante." });
const uuidOrNull = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.uuid().nullable());

/** Money ≥ 0 in cents. Empty → null when `optional`, otherwise 0 is not implied. */
const money = (opts: { optional?: boolean; positive?: boolean } = {}) =>
  z.string().optional().transform((raw, ctx): number | null => {
    const value = raw ?? "";
    if (!value.trim()) {
      if (opts.optional) return null;
      ctx.addIssue({ code: "custom", message: opts.positive ? "Montant supérieur à zéro requis." : "Montant invalide." });
      return z.NEVER;
    }
    const cents = parseCents(value);
    if (cents === null || cents < 0 || (opts.positive && cents === 0)) {
      ctx.addIssue({ code: "custom", message: opts.positive ? "Montant supérieur à zéro requis." : "Montant invalide." });
      return z.NEVER;
    }
    return cents;
  });

const quantity = (opts: { optional?: boolean; allowZero?: boolean } = {}) =>
  z.string().optional().transform((raw, ctx): number | null => {
    const value = raw ?? "";
    if (!value.trim() && opts.optional) return null;
    const milli = parseMilli(value);
    if (milli === null || (!opts.allowZero && milli === 0)) {
      ctx.addIssue({ code: "custom", message: "Quantité invalide." });
      return z.NEVER;
    }
    return milli;
  });

const checkbox = z.union([z.literal("on"), z.literal("true"), z.literal(""), z.null(), z.undefined()]).transform((v) => v === "on" || v === "true");

const localDateTime = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    const iso = fromLocalInput(value);
    if (!iso) {
      ctx.addIssue({ code: "custom", message: "Format invalide." });
      return z.NEVER;
    }
    return iso;
  });

const isoDate = z.string().refine(isIsoDate, { error: "Format invalide." });
const optionalIsoDate = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || isIsoDate(v), { error: "Format invalide." });

const PAYMENT_METHODS = ["cash", "transfer", "cheque", "card", "other"] as const;

// ─── Products ───────────────────────────────────────────────────────────────
export const productSchema = z.object({
  id: uuidOrNull,
  name: required(2, 160),
  sku: optional(40).refine((v) => v === null || /^[A-Za-z0-9][A-Za-z0-9._/-]{0,39}$/.test(v), { error: "Format invalide." }),
  item_type: z.enum(["product", "material", "service"]),
  category_id: uuidOrNull,
  unit: required(1, 20),
  description: optional(2000),
  purchase_cost: money({ optional: true }),
  selling_price: money({ optional: true }),
  track_stock: checkbox,
  initial_quantity: quantity({ optional: true, allowZero: true }),
  min_stock: quantity({ optional: true, allowZero: true }),
  allow_negative: checkbox,
  catalog_product_id: uuidOrNull,
});

export const movementSchema = z
  .object({
    product_id: z.uuid(),
    movement_type: z.enum(["entry", "exit", "damage", "loss", "adjustment"]),
    quantity: quantity({ allowZero: true }),
    unit_cost: money({ optional: true }),
    reason: optional(500),
    occurred_at: localDateTime,
    allow_negative: checkbox,
    client_key: z.uuid(),
  })
  .superRefine((v, ctx) => {
    if (v.movement_type !== "adjustment" && v.quantity === 0) ctx.addIssue({ code: "custom", path: ["quantity"], message: "Quantité invalide." });
    if (v.movement_type !== "entry" && (v.reason ?? "").length < 2) ctx.addIssue({ code: "custom", path: ["reason"], message: "Motif obligatoire pour ce mouvement." });
  });

// ─── Customers ──────────────────────────────────────────────────────────────
export const customerSchema = z.object({
  id: uuidOrNull,
  customer_type: z.enum(["individual", "company"]),
  name: required(2, 160),
  contact_name: optional(120),
  phone: optional(40),
  email: optional(254).refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { error: "Adresse e-mail invalide." }),
  address: optional(500),
  city: optional(80),
  notes: optional(4000),
  from_request: uuidOrNull.optional(),
});

export const customerNoteSchema = z.object({
  customer_id: z.uuid(),
  kind: z.enum(["note", "call", "meeting", "follow_up"]),
  body: required(1, 4000),
});

// ─── Sales ──────────────────────────────────────────────────────────────────
/** The sale form posts its lines as JSON (built by the client component). */
export const saleLineSchema = z.object({
  line_kind: z.enum(["product", "service", "custom"]),
  product_id: z.uuid().nullable(),
  description: z.string().trim().max(300),
  quantity: z.string(),
  unit_price: z.string(),
  discount: z.string(),
});

export const saleSchema = z.object({
  client_key: z.uuid(),
  customer_id: uuidOrNull,
  quotation_request_id: uuidOrNull,
  sold_at: localDateTime,
  order_status: z.enum(["new", "confirmed", "in_production", "ready", "delivered"]),
  due_date: optionalIsoDate,
  discount: money({ optional: true }),
  notes: optional(4000),
  paid_now: money({ optional: true }),
  method: z.enum(PAYMENT_METHODS),
  payment_reference: optional(120),
  allow_negative: checkbox,
  lines: z.string().transform((value, ctx) => {
    try {
      const parsed = z.array(saleLineSchema).min(1).max(100).safeParse(JSON.parse(value));
      if (parsed.success) return parsed.data;
    } catch {
      // fall through
    }
    ctx.addIssue({ code: "custom", message: "Ajoutez au moins une ligne." });
    return z.NEVER;
  }),
});

export const paymentSchema = z.object({
  sale_id: z.uuid(),
  amount: money({ positive: true }),
  method: z.enum(PAYMENT_METHODS),
  paid_at: localDateTime,
  reference: optional(120),
  client_key: z.uuid(),
});

export const reasonSchema = z.object({
  id: z.uuid(),
  reason: text(500).min(3, { error: "Motif obligatoire (3 caractères minimum)." }),
});

export const saleStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "confirmed", "in_production", "ready", "delivered"]),
  note: optional(1000),
});

export const saleNotesSchema = z.object({ id: z.uuid(), notes: optional(4000), due_date: optionalIsoDate });

// ─── Expenses ───────────────────────────────────────────────────────────────
export const expenseLineSchema = z.object({ product_id: z.uuid(), quantity: z.string(), unit_cost: z.string() });

export const expenseSchema = z.object({
  client_key: z.uuid(),
  label: required(2, 160),
  amount: money({ positive: true }),
  treatment: z.enum(["operating", "stock_purchase", "investment"]),
  category_id: uuidOrNull,
  supplier_id: uuidOrNull,
  payment_method: z.enum(PAYMENT_METHODS),
  expense_date: isoDate,
  reference: optional(120),
  description: optional(2000),
  update_cost: checkbox,
  lines: z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value) return [];
      try {
        const parsed = z.array(expenseLineSchema).max(50).safeParse(JSON.parse(value));
        if (parsed.success) return parsed.data;
      } catch {
        // fall through
      }
      ctx.addIssue({ code: "custom", message: "Requête invalide." });
      return z.NEVER;
    }),
});

export const expenseUpdateSchema = z.object({
  id: z.uuid(),
  label: required(2, 160),
  category_id: uuidOrNull,
  supplier_id: uuidOrNull,
  payment_method: z.enum(PAYMENT_METHODS),
  reference: optional(120),
  description: optional(2000),
});

// ─── Journal ────────────────────────────────────────────────────────────────

export const activitySchema = z.object({
  id: uuidOrNull,
  activity_type: z.enum(ACTIVITY_TYPES),
  title: required(2, 160),
  description: optional(4000),
  occurred_at: localDateTime,
  responsible_id: uuidOrNull,
  customer_id: uuidOrNull,
  sale_id: uuidOrNull,
});

export const commentSchema = z.object({ activity_id: z.uuid(), body: required(1, 2000) });

// ─── Settings & team ────────────────────────────────────────────────────────
export const categorySchema = z.object({ kind: z.enum(["product", "expense"]), name: required(1, 80) });

export const supplierSchema = z.object({
  id: uuidOrNull,
  name: required(2, 160),
  phone: optional(40),
  email: optional(254).refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { error: "Adresse e-mail invalide." }),
  address: optional(500),
  notes: optional(4000),
});

export const attachStaffSchema = z.object({
  email: text(254).refine((v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { error: "Adresse e-mail invalide." }),
  full_name: required(2, 120),
  kind: z.enum(["employee", "associate"]),
});

export const roleAssignmentSchema = z.object({ staff_id: z.uuid(), role_id: z.uuid() });

/** FormData → plain object of strings (files excluded), for safeParse. */
export function formFields(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

// ─── Phase 2: closing, reports, tasks ───────────────────────────────────────
const notesFields = {
  observations: optional(4000),
  problems: optional(4000),
  decisions: optional(4000),
  priorities: optional(4000),
};

export const closeDaySchema = z.object({ day: isoDate, ...notesFields });

export const correctReportSchema = z.object({
  id: z.uuid(),
  reason: text(500).min(3, { error: "Motif obligatoire (3 caractères minimum)." }),
  refresh: checkbox,
  ...notesFields,
});

export const reportCommentSchema = z.object({ report_id: z.uuid(), body: required(1, 2000) });

export const taskSchema = z.object({
  id: uuidOrNull,
  title: required(2, 160),
  description: optional(4000),
  assigned_to: uuidOrNull,
  priority: z.enum(["low", "normal", "high", "urgent"]),
  due_date: optionalIsoDate,
  customer_id: uuidOrNull,
  sale_id: uuidOrNull,
  report_id: uuidOrNull,
});

export const taskStatusSchema = z.object({ id: z.uuid(), status: z.enum(["todo", "in_progress", "completed", "blocked"]) });
export const taskCommentSchema = z.object({ task_id: z.uuid(), body: required(1, 2000) });
