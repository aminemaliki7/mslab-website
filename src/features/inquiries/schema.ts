import { z } from "zod";

/**
 * Validation for public contact and quotation forms. Pure module (only `zod`), shared by the
 * server actions and unit tests. Errors are CODES; the UI maps them to localized messages.
 * Limits mirror the database CHECK constraints (defense in depth).
 */

export const ERROR_CODES = [
  "required",
  "too_short",
  "too_long",
  "invalid_email",
  "invalid_phone",
  "consent_required",
  "invalid_quantity",
  "no_items",
  "too_many_items",
  "invalid_item",
  "invalid_number",
  "invalid_date",
  "invalid_option",
  "below_moq",
  "invalid_url",
  "brief_missing",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

const LOCALES = ["fr", "ar", "en"] as const;
export const CONTACT_METHODS = ["email", "phone", "whatsapp"] as const;
export const MAX_ITEMS = 50;

/**
 * Normalize a phone number to E.164. Accepts Moroccan national formats (06…, 07…, 05…),
 * 212… / 00212… / +212…, and any international number written with +/00.
 * Returns null when the number cannot be interpreted.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/[^\d\s+().-]/.test(trimmed)) return null;
  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.indexOf("+") > 0) return null;
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (/^0[5-7]\d{8}$/.test(digits)) digits = `+212${digits.slice(1)}`;
  else if (/^212[5-7]\d{8}$/.test(digits)) digits = `+${digits}`;
  if (digits.startsWith("+212") && !/^\+212[5-7]\d{8}$/.test(digits)) return null;
  return /^\+[1-9]\d{6,14}$/.test(digits) ? digits : null;
}

export const text = (min: number, max: number) =>
  z
    .string({ error: "required" })
    .trim()
    .min(1, { error: "required" })
    .min(min, { error: "too_short" })
    .max(max, { error: "too_long" });

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: "too_long" })
    .optional()
    .transform((value) => (value ? value : null));

export const email = z
  .string({ error: "required" })
  .trim()
  .toLowerCase()
  .min(1, { error: "required" })
  .max(254, { error: "too_long" })
  .pipe(z.email({ error: "invalid_email" }));

export const requiredPhone = z
  .string({ error: "required" })
  .trim()
  .min(1, { error: "required" })
  .transform((value, ctx) => {
    const phone = normalizePhone(value);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "invalid_phone" });
      return z.NEVER;
    }
    return phone;
  });

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    const phone = normalizePhone(value);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "invalid_phone" });
      return z.NEVER;
    }
    return phone;
  });

/** Optional date, today or later (max two years ahead). Used by the custom production and digital request forms. */
export const deadline = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const max = new Date(today);
    max.setUTCFullYear(max.getUTCFullYear() + 2);
    if (!date || Number.isNaN(date.getTime()) || date < today || date > max) {
      ctx.addIssue({ code: "custom", message: "invalid_date" });
      return z.NEVER;
    }
    return value;
  });

export const consent = z
  .union([z.literal("on"), z.literal("true"), z.literal(true)], { error: "consent_required" })
  .transform(() => true as const);

export const common = {
  locale: z.enum(LOCALES).catch("fr"),
  sourcePath: z
    .string()
    .max(300)
    .regex(/^\/[^\s]*$/)
    .optional()
    .catch(undefined)
    .transform((v) => v ?? null),
};

export const contactSchema = z.object({
  fullName: text(2, 120),
  email,
  phone: optionalPhone,
  subject: text(2, 200),
  message: text(10, 5000),
  consent,
  ...common,
});
export type ContactInput = z.output<typeof contactSchema>;

const uuid = z.uuid({ error: "invalid_item" });

export const quoteItemSchema = z
  .object({
    productId: uuid.optional(),
    label: z.string().trim().max(200, { error: "too_long" }).optional(),
    quantity: z.coerce
      .number({ error: "invalid_quantity" })
      .int({ error: "invalid_quantity" })
      .min(1, { error: "invalid_quantity" })
      .max(1_000_000, { error: "invalid_quantity" }),
    specifications: optionalText(2000),
  })
  .superRefine((item, ctx) => {
    if (!item.productId && !item.label) ctx.addIssue({ code: "custom", message: "required", path: ["label"] });
  });

export const quoteSchema = z.object({
  fullName: text(2, 120),
  email,
  phone: requiredPhone,
  companyName: optionalText(160),
  message: optionalText(5000),
  preferredContact: z.enum(CONTACT_METHODS).catch("email"),
  consent,
  items: z
    .array(quoteItemSchema)
    .min(1, { error: "no_items" })
    .max(MAX_ITEMS, { error: "too_many_items" }),
  ...common,
});
export type QuoteInput = z.output<typeof quoteSchema>;

/**
 * Read quote rows from FormData fields named `items.<index>.<field>` (works without JS).
 * Rows with neither a product nor a label (e.g. an untouched empty custom row) are dropped.
 */
export function readQuoteItems(formData: FormData): Record<string, string>[] {
  const rows = new Map<number, Record<string, string>>();
  for (const [key, value] of formData.entries()) {
    const match = /^items\.(\d{1,2})\.(productId|label|quantity|specifications)$/.exec(key);
    if (!match || typeof value !== "string") continue;
    const index = Number(match[1]);
    if (index >= MAX_ITEMS) continue; // bounded: never more rows than the database accepts
    const row = rows.get(index) ?? {};
    row[match[2]!] = value;
    rows.set(index, row);
  }
  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => (row.productId ?? "").trim() || (row.label ?? "").trim())
    .map((row) => {
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) if (v.trim() !== "") clean[k] = v;
      return clean;
    });
}

export type FieldErrors = Record<string, ErrorCode>;

/** Flatten Zod issues to { "email": "invalid_email", "items.0.quantity": "invalid_quantity" }. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    const code = (ERROR_CODES as readonly string[]).includes(issue.message) ? (issue.message as ErrorCode) : "required";
    if (!(key in result)) result[key] = code;
  }
  return result;
}
