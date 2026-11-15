import { z } from "zod";
import { CONTACT_METHODS, common, consent, email, optionalText, requiredPhone, text } from "@/features/inquiries/schema";

/**
 * Print-on-demand request (custom production). Pure module shared by the server action and unit
 * tests. Limits mirror the CHECK constraints of custom_request_details / quotation_requests.
 */

export const DIMENSION_UNITS = ["mm", "cm", "m"] as const;
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
/** Accepted by the private custom-uploads bucket (see migration print_on_demand). */
export const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/heic",
  "application/pdf",
  "application/postscript",
  "application/illustrator",
  "image/vnd.adobe.photoshop",
  "application/x-photoshop",
] as const;
/** For the file picker (`accept`): extensions help where browsers don't know a MIME type. */
export const ACCEPT_ATTRIBUTE = ".jpg,.jpeg,.png,.webp,.tif,.tiff,.heic,.pdf,.ai,.eps,.psd";

const optionalNumber = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    const n = Number(value.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || n > 100000) {
      ctx.addIssue({ code: "custom", message: "invalid_number" });
      return z.NEVER;
    }
    return Math.round(n * 100) / 100;
  });

const uuidOrNull = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    if (!z.uuid().safeParse(value).success) {
      ctx.addIssue({ code: "custom", message: "invalid_option" });
      return z.NEVER;
    }
    return value;
  });

const deadline = z
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

export const customRequestSchema = z.object({
  projectType: text(2, 160),
  description: text(10, 5000),
  quantity: z.coerce
    .number({ error: "invalid_quantity" })
    .int({ error: "invalid_quantity" })
    .min(1, { error: "invalid_quantity" })
    .max(1_000_000, { error: "invalid_quantity" }),
  width: optionalNumber,
  height: optionalNumber,
  depth: optionalNumber,
  dimensionUnit: z.enum(DIMENSION_UNITS).catch("cm"),
  materialOptionId: uuidOrNull,
  materialOther: optionalText(200),
  finishingOptionIds: z.array(z.uuid({ error: "invalid_option" })).max(20).catch([]),
  deadline,
  uploadTicket: z.uuid().optional().catch(undefined),
  fullName: text(2, 120),
  email,
  phone: requiredPhone,
  companyName: optionalText(160),
  preferredContact: z.enum(CONTACT_METHODS).catch("email"),
  consent,
  ...common,
});
export type CustomRequestInput = z.output<typeof customRequestSchema>;

export const trackingSchema = z.object({
  reference: z
    .string({ error: "required" })
    .trim()
    .toUpperCase()
    .min(1, { error: "required" })
    .max(40, { error: "too_long" }),
  email,
});
