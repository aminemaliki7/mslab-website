import { z } from "zod";
// Relative import with extension: this pure module is also loaded by the Node unit tests.
import { CONTACT_METHODS, common, consent, deadline, email, optionalText, requiredPhone, text } from "../inquiries/schema.ts";

/**
 * Digital Solutions quote request (web project). Pure module shared by the server action, the
 * form and unit tests. Keys and limits mirror digital_request_details (migration
 * 20261121120000_digital_requests.sql); labels live in the dictionaries.
 */

/** Anchor of the request form on the Digital Solutions page (buttons elsewhere jump to it). */
export const DIGITAL_FORM_ID = "demande";

export const DIGITAL_PROJECT_TYPES = ["corporate", "ecommerce", "webapp", "platform", "uiux", "maintenance"] as const;
export type DigitalProjectType = (typeof DIGITAL_PROJECT_TYPES)[number];

export const DIGITAL_FEATURES = ["multilingual", "payment", "accounts", "booking", "content", "backoffice", "integrations", "seo"] as const;
export type DigitalFeature = (typeof DIGITAL_FEATURES)[number];

/** Optional existing website: http(s) URL, a bare domain gets "https://". */
const website = z
  .string()
  .trim()
  .max(300, { error: "too_long" })
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(candidate);
      if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) throw new Error("host");
      return url.toString().slice(0, 300);
    } catch {
      ctx.addIssue({ code: "custom", message: "invalid_url" });
      return z.NEVER;
    }
  });

export const digitalRequestSchema = z.object({
  projectTypes: z
    .array(z.enum(DIGITAL_PROJECT_TYPES, { error: "invalid_option" }))
    .min(1, { error: "required" })
    .max(DIGITAL_PROJECT_TYPES.length)
    .transform((list) => [...new Set(list)]),
  description: text(10, 5000),
  features: z
    .array(z.enum(DIGITAL_FEATURES, { error: "invalid_option" }))
    .max(DIGITAL_FEATURES.length)
    .transform((list) => [...new Set(list)]),
  existingWebsite: website,
  budget: optionalText(120),
  deadline,
  fullName: text(2, 120),
  email,
  phone: requiredPhone,
  companyName: optionalText(160),
  preferredContact: z.enum(CONTACT_METHODS).catch("email"),
  consent,
  ...common,
});
export type DigitalRequestInput = z.output<typeof digitalRequestSchema>;
