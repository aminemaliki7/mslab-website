import { z } from "zod";
import { DOCX, XLSX } from "@/features/print-on-demand/file-sniff";
import { CONTACT_METHODS, common, consent, email, optionalText, requiredPhone, text } from "./schema";

/**
 * Request sent as a requirements file ("cahier des charges") instead of the detailed form, for
 * the three request kinds (migration 20261124120000_request_brief_files.sql). Pure module:
 * shared by the server action, the uploader and unit tests.
 */
export const BRIEF_KINDS = ["catalog", "custom", "digital"] as const;
export type BriefKind = (typeof BRIEF_KINDS)[number];

export const MAX_BRIEF_FILES = 3;
/** Requirements documents, identified from their bytes (file-sniff.ts). */
export const BRIEF_FILE_TYPES = ["application/pdf", DOCX, XLSX, "image/jpeg", "image/png"] as const;
export const BRIEF_ACCEPT = ".pdf,.docx,.xlsx,.jpg,.jpeg,.png";
/** Storage name marker the database uses to recognise a requirements file. */
export const BRIEF_FILE_PREFIX = "mslab-brief-";

export const briefSchema = z.object({
  kind: z.enum(BRIEF_KINDS),
  uploadTicket: z.uuid({ error: "brief_missing" }),
  files: z.array(z.string().max(400)).min(1, { error: "brief_missing" }).max(MAX_BRIEF_FILES),
  message: optionalText(5000),
  fullName: text(2, 120),
  email,
  phone: requiredPhone,
  companyName: optionalText(160),
  preferredContact: z.enum(CONTACT_METHODS).catch("email"),
  consent,
  ...common,
});
export type BriefInput = z.infer<typeof briefSchema>;
